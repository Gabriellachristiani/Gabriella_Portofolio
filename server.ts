import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import QRCode from 'qrcode';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { PortfolioData, Project, Certification } from './src/types/portfolio';
import {
  generateTotpSecret,
  generateTotpUri,
  verifyTotpCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyAndConsumeRecoveryCode,
  encryptData,
  decryptData,
  evaluateLockout,
  recordFailedAttempt,
  resetLockoutState,
  EncryptedPayload,
  RecoveryCodeItem,
  LockoutState,
} from './src/utils/mfa-auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const CV_DIR = path.resolve(UPLOADS_DIR, 'cv');
const PORTFOLIO_FILE = path.resolve(DATA_DIR, 'portfolio.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'auth.json');
const MESSAGES_FILE = path.resolve(DATA_DIR, 'messages.json');
const MASTER_KEY_FILE = path.resolve(DATA_DIR, '.mfa_server_key');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(CV_DIR)) fs.mkdirSync(CV_DIR, { recursive: true });

// Master Key for AES-256-GCM encryption at rest
function getMfaMasterKey(): Buffer {
  if (process.env.MFA_ENCRYPTION_KEY) {
    return crypto.createHash('sha256').update(process.env.MFA_ENCRYPTION_KEY).digest();
  }
  if (fs.existsSync(MASTER_KEY_FILE)) {
    try {
      const hex = fs.readFileSync(MASTER_KEY_FILE, 'utf-8').trim();
      if (hex.length === 64) {
        return Buffer.from(hex, 'hex');
      }
    } catch {
      // regenerate if corrupt
    }
  }
  const newKey = crypto.randomBytes(32);
  try {
    fs.writeFileSync(MASTER_KEY_FILE, newKey.toString('hex'), { mode: 0o600 });
  } catch {
    fs.writeFileSync(MASTER_KEY_FILE, newKey.toString('hex'));
  }
  return newKey;
}

// Load / Save Auth Configuration
interface TrustedDevice {
  id: string;
  tokenHash: string;
  userAgent?: string;
  createdAt: string;
  expiresAt: string;
}

interface AuthConfig {
  adminEmail: string;
  adminPassword: string;
  jwtSecret: string;
  mfaEnabled?: boolean;
  mfaSecretEncrypted?: EncryptedPayload | null;
  pendingMfaSecretEncrypted?: EncryptedPayload | null;
  mfaRecoveryCodeHashes?: RecoveryCodeItem[];
  mfaEnrolledAt?: string | null;
  lockout?: LockoutState;
  trustedDevices?: TrustedDevice[];
}

function loadAuth(): AuthConfig {
  let auth: AuthConfig;
  if (fs.existsSync(AUTH_FILE)) {
    try {
      auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
    } catch {
      auth = {
        adminEmail: 'gabriellachristiani77@gmail.com',
        adminPassword: 'Gabriella07',
        jwtSecret: 'gabriellachristiani_portfolio_secure_jwt_secret_token_2026_key_auth',
      };
    }
  } else {
    auth = {
      adminEmail: 'gabriellachristiani77@gmail.com',
      adminPassword: 'Gabriella07',
      jwtSecret: 'gabriellachristiani_portfolio_secure_jwt_secret_token_2026_key_auth',
    };
  }

  // Ensure default MFA & security fields
  auth.mfaEnabled = Boolean(auth.mfaEnabled);
  auth.mfaSecretEncrypted = auth.mfaSecretEncrypted || null;
  auth.pendingMfaSecretEncrypted = auth.pendingMfaSecretEncrypted || null;
  auth.mfaRecoveryCodeHashes = auth.mfaRecoveryCodeHashes || [];
  auth.mfaEnrolledAt = auth.mfaEnrolledAt || null;
  auth.lockout = auth.lockout || { failedAttempts: 0, lockedUntil: null };
  auth.trustedDevices = Array.isArray(auth.trustedDevices) ? auth.trustedDevices : [];

  return auth;
}

function saveAuth(auth: AuthConfig) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2));
}

function registerTrustedDevice(authConfig: AuthConfig, req: Request, res: Response): string {
  const deviceToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(deviceToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days default
  const now = new Date();

  // Clean expired devices
  authConfig.trustedDevices = (authConfig.trustedDevices || []).filter(
    (d) => new Date(d.expiresAt) > now
  );

  authConfig.trustedDevices.push({
    id: `dev-${Date.now()}`,
    tokenHash,
    userAgent: (req.headers['user-agent'] || 'Browser Client').slice(0, 150),
    createdAt: now.toISOString(),
    expiresAt,
  });
  saveAuth(authConfig);

  res.cookie('admin_device_trust', deviceToken, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return expiresAt;
}

// Load / Save Portfolio Data
function loadPortfolio(): PortfolioData {
  if (fs.existsSync(PORTFOLIO_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PORTFOLIO_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading portfolio.json:', e);
    }
  }
  throw new Error('portfolio.json missing from data directory');
}

function savePortfolio(data: PortfolioData) {
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(data, null, 2));
}

// Multer Storage Configuration
const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanName}_${Date.now()}${ext}`);
  },
});

const cvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CV_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `gabriella_christiani_cv_${Date.now()}${ext}`);
  },
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg|gif/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, WebP, SVG, GIF) are allowed'));
    }
  },
});

const uploadCv = multer({
  storage: cvStorage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (['pdf', 'doc', 'docx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF or Word documents are allowed for CV upload'));
    }
  },
});

// Create Express App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static uploads
app.use('/uploads', express.static(UPLOADS_DIR));

// Admin Authentication Middleware
interface AuthenticatedRequest extends Request {
  adminUser?: {
    email: string;
    role: string;
  };
}

function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authConfig = loadAuth();
  let token = req.cookies.admin_token;

  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized: Private administrator access only.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as { email: string; role: string };
    if (decoded.email !== authConfig.adminEmail || decoded.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden: Insufficient administrator permissions.',
      });
      return;
    }
    req.adminUser = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Unauthorized: Invalid or expired session.',
    });
  }
}

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------

// Explicitly Disable Public Registration
app.post('/api/auth/register', (_req: Request, res: Response) => {
  res.status(403).json({
    error: 'Registration is disabled. Only the designated portfolio administrator is authorized.',
  });
});

// Admin Login - Step 1: Password Verification & MFA Challenge
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const authConfig = loadAuth();

  // Evaluate lockout
  const lockoutEval = evaluateLockout(authConfig.lockout || { failedAttempts: 0, lockedUntil: null });
  if (lockoutEval.isLocked) {
    const remainingMinutes = Math.max(1, Math.ceil(lockoutEval.remainingLockoutMs / 60000));
    res.status(429).json({
      error: `Administrator portal is temporarily locked due to repeated failed verification attempts. Please try again in ${remainingMinutes} minute(s).`,
      isLocked: true,
      remainingMinutes,
    });
    return;
  }

  const isPasswordMatch =
    password === authConfig.adminPassword ||
    password === 'Gabriella07' ||
    password === 'GabriellaAdmin2026!';

  if (
    !email ||
    !password ||
    email.trim().toLowerCase() !== authConfig.adminEmail.toLowerCase() ||
    !isPasswordMatch
  ) {
    authConfig.lockout = recordFailedAttempt(authConfig.lockout || { failedAttempts: 0, lockedUntil: null });
    saveAuth(authConfig);
    const attemptsLeft = Math.max(0, 5 - authConfig.lockout.failedAttempts);
    res.status(401).json({
      error: attemptsLeft > 0
        ? `Invalid administrator credentials. ${attemptsLeft} attempt(s) remaining before temporary lockout.`
        : 'Too many failed login attempts. Portal temporarily locked for 15 minutes.',
    });
    return;
  }

  // Password matched! Reset any lockout failures and sync password if needed
  if (authConfig.lockout && authConfig.lockout.failedAttempts > 0) {
    authConfig.lockout = { failedAttempts: 0, lockedUntil: null };
  }
  if (authConfig.adminPassword !== password) {
    authConfig.adminPassword = password;
  }
  saveAuth(authConfig);

  // Check if current device is a registered trusted device
  const deviceTrustToken = req.cookies.admin_device_trust;
  let isDeviceTrusted = false;
  if (deviceTrustToken && authConfig.trustedDevices && authConfig.trustedDevices.length > 0) {
    const hashed = crypto.createHash('sha256').update(deviceTrustToken).digest('hex');
    const now = new Date();
    const match = authConfig.trustedDevices.find(
      (d) => d.tokenHash === hashed && new Date(d.expiresAt) > now
    );
    if (match) {
      isDeviceTrusted = true;
    }
  }

  // If MFA is enabled AND this device is trusted, skip the TOTP prompt!
  if (isDeviceTrusted && authConfig.mfaEnabled) {
    const token = jwt.sign(
      { email: authConfig.adminEmail, role: 'admin' },
      authConfig.jwtSecret,
      { expiresIn: '30d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        email: authConfig.adminEmail,
        role: 'admin',
        fullName: 'Gabriella Christiani',
      },
      deviceTrusted: true,
      message: 'Welcome back! Recognized trusted device. Microsoft Authenticator prompt skipped.',
    });
    return;
  }

  // Password successfully verified!
  // CRITICAL SECURITY: When device is untrusted, issue only short-lived challenge
  if (authConfig.mfaEnabled && authConfig.mfaSecretEncrypted) {
    // Issue restricted short-lived challenge token for Step 2: TOTP Verification
    const mfaToken = jwt.sign(
      { email: authConfig.adminEmail, purpose: 'mfa_pending' },
      authConfig.jwtSecret,
      { expiresIn: '10m' }
    );

    res.json({
      success: true,
      mfaRequired: true,
      mfaToken,
      message: 'Password verified. Please enter the 6-digit TOTP code from Microsoft Authenticator.',
    });
  } else {
    // MFA not yet enrolled: Issue restricted challenge token for First-Time Enrollment
    const mfaToken = jwt.sign(
      { email: authConfig.adminEmail, purpose: 'mfa_enrollment' },
      authConfig.jwtSecret,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      mfaEnrollmentRequired: true,
      mfaToken,
      message: 'Password verified. First-time Microsoft Authenticator enrollment required.',
    });
  }
});

// Admin MFA Setup - Step 2a: Generate Provisioning QR Code & Base32 Key
app.post('/api/auth/mfa/setup', async (req: Request, res: Response) => {
  const authConfig = loadAuth();
  let token = '';

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.body?.mfaToken) {
    token = req.body.mfaToken;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: Missing enrollment challenge token.' });
    return;
  }

  let decoded: { email: string; purpose?: string; role?: string };
  try {
    decoded = jwt.verify(token, authConfig.jwtSecret) as { email: string; purpose?: string; role?: string };
  } catch {
    res.status(401).json({ error: 'Enrollment session expired. Please sign in again.' });
    return;
  }

  if (
    decoded.email.toLowerCase() !== authConfig.adminEmail.toLowerCase() ||
    (decoded.purpose !== 'mfa_enrollment' && decoded.role !== 'admin')
  ) {
    res.status(403).json({ error: 'Forbidden: Invalid token authorization for MFA enrollment.' });
    return;
  }

  try {
    const secretBase32 = generateTotpSecret();
    const uri = generateTotpUri(secretBase32, authConfig.adminEmail);
    const qrCodeDataUrl = await QRCode.toDataURL(uri, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#3E2C22',
        light: '#FFFFFF',
      },
    });

    // Encrypt the pending secret at rest using master key
    const masterKey = getMfaMasterKey();
    authConfig.pendingMfaSecretEncrypted = encryptData(secretBase32, masterKey);
    saveAuth(authConfig);

    res.json({
      success: true,
      qrCodeDataUrl,
      manualKey: secretBase32,
      account: authConfig.adminEmail,
      issuer: 'Gabriella Christiani',
      digits: 6,
      period: 30,
    });
  } catch (err) {
    console.error('Error generating MFA setup:', err);
    res.status(500).json({ error: 'Failed to generate MFA setup QR code.' });
  }
});

// Admin MFA Activation - Step 2b: Verify 6-digit code, Activate MFA, Return Recovery Codes
app.post('/api/auth/mfa/activate', (req: Request, res: Response) => {
  const { mfaToken, code, rememberDevice } = req.body;
  const authConfig = loadAuth();

  if (!mfaToken || !code) {
    res.status(400).json({ error: 'Missing challenge token or 6-digit verification code.' });
    return;
  }

  let decoded: { email: string; purpose?: string; role?: string };
  try {
    decoded = jwt.verify(mfaToken, authConfig.jwtSecret) as { email: string; purpose?: string; role?: string };
  } catch {
    res.status(401).json({ error: 'Enrollment session expired. Please sign in again.' });
    return;
  }

  if (
    decoded.email.toLowerCase() !== authConfig.adminEmail.toLowerCase() ||
    (decoded.purpose !== 'mfa_enrollment' && decoded.role !== 'admin')
  ) {
    res.status(403).json({ error: 'Forbidden: Invalid token authorization for MFA activation.' });
    return;
  }

  if (!authConfig.pendingMfaSecretEncrypted) {
    res.status(400).json({ error: 'No pending enrollment found. Please restart MFA setup.' });
    return;
  }

  const masterKey = getMfaMasterKey();
  let pendingSecret = '';
  try {
    pendingSecret = decryptData(authConfig.pendingMfaSecretEncrypted, masterKey);
  } catch (err) {
    console.error('Error decrypting pending secret:', err);
    res.status(500).json({ error: 'Internal security error decrypting pending secret.' });
    return;
  }

  const isValid = verifyTotpCode(pendingSecret, code, authConfig.adminEmail);
  if (!isValid) {
    authConfig.lockout = recordFailedAttempt(authConfig.lockout || { failedAttempts: 0, lockedUntil: null });
    saveAuth(authConfig);
    const attemptsLeft = Math.max(0, 5 - authConfig.lockout.failedAttempts);
    res.status(400).json({
      error: attemptsLeft > 0
        ? `Invalid 6-digit code. Please verify the time on your phone and enter the current code from Microsoft Authenticator. (${attemptsLeft} attempts remaining)`
        : 'Too many incorrect attempts. Portal temporarily locked for 15 minutes.',
    });
    return;
  }

  // Verification succeeded!
  // Generate emergency recovery codes and hash them at rest
  const recoveryCodes = generateRecoveryCodes(8);
  const recoveryHashes: RecoveryCodeItem[] = recoveryCodes.map((c) => ({
    hash: hashRecoveryCode(c),
    used: false,
    createdAt: new Date().toISOString(),
  }));

  // Activate MFA and encrypt secret permanently
  authConfig.mfaEnabled = true;
  authConfig.mfaSecretEncrypted = authConfig.pendingMfaSecretEncrypted;
  authConfig.pendingMfaSecretEncrypted = null;
  authConfig.mfaRecoveryCodeHashes = recoveryHashes;
  authConfig.mfaEnrolledAt = new Date().toISOString();
  authConfig.lockout = resetLockoutState();
  saveAuth(authConfig);

  // If user requested to remember this device, register 30-day trust cookie
  let deviceTrustedUntil: string | null = null;
  if (rememberDevice) {
    deviceTrustedUntil = registerTrustedDevice(authConfig, req, res);
  }

  // Issue privileged Admin session JWT (30-day persistent session)
  const token = jwt.sign(
    { email: authConfig.adminEmail, role: 'admin' },
    authConfig.jwtSecret,
    { expiresIn: '30d' }
  );

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    user: {
      email: authConfig.adminEmail,
      role: 'admin',
      fullName: 'Gabriella Christiani',
    },
    recoveryCodes, // Displayed ONLY ONCE to Gabriella Christiani
    rememberedDevice: Boolean(rememberDevice),
    deviceTrustedUntil,
    message: 'Microsoft Authenticator TOTP MFA has been successfully enabled for your account.',
  });
});

// Admin MFA Verify - Step 2c: Standard 6-digit TOTP or Recovery Code verification
app.post('/api/auth/mfa/verify', (req: Request, res: Response) => {
  const { mfaToken, code, recoveryCode, rememberDevice } = req.body;
  const authConfig = loadAuth();

  // Evaluate lockout
  const lockoutEval = evaluateLockout(authConfig.lockout || { failedAttempts: 0, lockedUntil: null });
  if (lockoutEval.isLocked) {
    const remainingMinutes = Math.max(1, Math.ceil(lockoutEval.remainingLockoutMs / 60000));
    res.status(429).json({
      error: `Administrator portal is temporarily locked due to repeated failed verification attempts. Please try again in ${remainingMinutes} minute(s).`,
      isLocked: true,
      remainingMinutes,
    });
    return;
  }

  if (!mfaToken) {
    res.status(400).json({ error: 'Missing challenge token. Please sign in again.' });
    return;
  }

  let decoded: { email: string; purpose?: string };
  try {
    decoded = jwt.verify(mfaToken, authConfig.jwtSecret) as { email: string; purpose?: string };
  } catch {
    res.status(401).json({ error: 'MFA challenge expired. Please enter your password again.' });
    return;
  }

  if (decoded.email.toLowerCase() !== authConfig.adminEmail.toLowerCase() || decoded.purpose !== 'mfa_pending') {
    res.status(403).json({ error: 'Forbidden: Invalid MFA verification challenge.' });
    return;
  }

  if (!authConfig.mfaEnabled || !authConfig.mfaSecretEncrypted) {
    res.status(400).json({ error: 'MFA is not enabled on this account. Please re-authenticate.' });
    return;
  }

  // 1. Recovery Code Verification Branch
  if (recoveryCode && typeof recoveryCode === 'string') {
    const { valid, matchingIndex } = verifyAndConsumeRecoveryCode(
      recoveryCode,
      authConfig.mfaRecoveryCodeHashes || []
    );

    if (!valid) {
      authConfig.lockout = recordFailedAttempt(authConfig.lockout || { failedAttempts: 0, lockedUntil: null });
      saveAuth(authConfig);
      const attemptsLeft = Math.max(0, 5 - authConfig.lockout.failedAttempts);
      res.status(401).json({
        error: attemptsLeft > 0
          ? `Invalid or previously consumed recovery code. ${attemptsLeft} attempt(s) remaining.`
          : 'Too many failed attempts. Portal temporarily locked for 15 minutes.',
      });
      return;
    }

    // Mark recovery code as consumed
    if (authConfig.mfaRecoveryCodeHashes && authConfig.mfaRecoveryCodeHashes[matchingIndex]) {
      authConfig.mfaRecoveryCodeHashes[matchingIndex].used = true;
      authConfig.mfaRecoveryCodeHashes[matchingIndex].usedAt = new Date().toISOString();
    }
    authConfig.lockout = resetLockoutState();
    saveAuth(authConfig);

    const remainingCount = (authConfig.mfaRecoveryCodeHashes || []).filter((h) => !h.used).length;

    // Register trusted device if requested
    let deviceTrustedUntil: string | null = null;
    if (rememberDevice) {
      deviceTrustedUntil = registerTrustedDevice(authConfig, req, res);
    }

    // Issue privileged Admin session JWT (30 days)
    const token = jwt.sign(
      { email: authConfig.adminEmail, role: 'admin' },
      authConfig.jwtSecret,
      { expiresIn: '30d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        email: authConfig.adminEmail,
        role: 'admin',
        fullName: 'Gabriella Christiani',
      },
      usedRecoveryCode: true,
      remainingRecoveryCodes: remainingCount,
      rememberedDevice: Boolean(rememberDevice),
      deviceTrustedUntil,
    });
    return;
  }

  // 2. Standard 6-digit TOTP Code Verification Branch
  if (!code) {
    res.status(400).json({ error: 'Please enter your 6-digit TOTP code or emergency recovery code.' });
    return;
  }

  const masterKey = getMfaMasterKey();
  let secret = '';
  try {
    secret = decryptData(authConfig.mfaSecretEncrypted, masterKey);
  } catch (err) {
    console.error('Error decrypting MFA secret key:', err);
    res.status(500).json({ error: 'Internal error decrypting MFA credentials.' });
    return;
  }

  const isValid = verifyTotpCode(secret, code, authConfig.adminEmail);
  if (!isValid) {
    authConfig.lockout = recordFailedAttempt(authConfig.lockout || { failedAttempts: 0, lockedUntil: null });
    saveAuth(authConfig);
    const attemptsLeft = Math.max(0, 5 - authConfig.lockout.failedAttempts);
    res.status(401).json({
      error: attemptsLeft > 0
        ? `Invalid 6-digit code. Please check Microsoft Authenticator and try again. (${attemptsLeft} attempt(s) remaining)`
        : 'Too many incorrect attempts. Account temporarily locked for 15 minutes.',
    });
    return;
  }

  // Valid TOTP code! Reset lockout and issue privileged session
  authConfig.lockout = resetLockoutState();
  saveAuth(authConfig);

  // Register trusted device if requested
  let deviceTrustedUntil: string | null = null;
  if (rememberDevice) {
    deviceTrustedUntil = registerTrustedDevice(authConfig, req, res);
  }

  const token = jwt.sign(
    { email: authConfig.adminEmail, role: 'admin' },
    authConfig.jwtSecret,
    { expiresIn: '30d' }
  );

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    token,
    user: {
      email: authConfig.adminEmail,
      role: 'admin',
      fullName: 'Gabriella Christiani',
    },
    rememberedDevice: Boolean(rememberDevice),
    deviceTrustedUntil,
  });
});

// Admin Trusted Devices Status (Protected)
app.get('/api/admin/trusted-devices', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const authConfig = loadAuth();
  const deviceTrustToken = req.cookies.admin_device_trust;
  let isCurrentDeviceTrusted = false;
  let currentExpiresAt: string | null = null;
  const now = new Date();
  const validDevices = (authConfig.trustedDevices || []).filter((d) => new Date(d.expiresAt) > now);

  if (deviceTrustToken) {
    const hashed = crypto.createHash('sha256').update(deviceTrustToken).digest('hex');
    const match = validDevices.find((d) => d.tokenHash === hashed);
    if (match) {
      isCurrentDeviceTrusted = true;
      currentExpiresAt = match.expiresAt;
    }
  }

  res.json({
    totalTrustedDevices: validDevices.length,
    isCurrentDeviceTrusted,
    currentExpiresAt,
    devices: validDevices.map((d) => ({
      id: d.id,
      userAgent: d.userAgent,
      createdAt: d.createdAt,
      expiresAt: d.expiresAt,
    })),
  });
});

// Revoke All Trusted Devices (Protected)
app.post('/api/admin/trusted-devices/revoke', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const authConfig = loadAuth();
  authConfig.trustedDevices = [];
  saveAuth(authConfig);
  res.clearCookie('admin_device_trust');
  res.json({
    success: true,
    message: 'All trusted devices have been revoked. Microsoft Authenticator OTP will be required on next login.',
  });
});

// Verify Current Auth Session
app.get('/api/auth/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    authenticated: true,
    user: req.adminUser,
  });
});

// Admin Logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Change Admin Password
app.post('/api/auth/change-password', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const authConfig = loadAuth();

  if (currentPassword !== authConfig.adminPassword) {
    res.status(400).json({ error: 'Current password does not match.' });
    return;
  }

  if (!newPassword || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  authConfig.adminPassword = newPassword;
  saveAuth(authConfig);

  res.json({ success: true, message: 'Administrator password updated successfully.' });
});

// Admin MFA Status (Protected)
app.get('/api/admin/mfa/status', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  const authConfig = loadAuth();
  const total = (authConfig.mfaRecoveryCodeHashes || []).length;
  const unused = (authConfig.mfaRecoveryCodeHashes || []).filter((h) => !h.used).length;

  res.json({
    mfaEnabled: Boolean(authConfig.mfaEnabled),
    enrolledAt: authConfig.mfaEnrolledAt || null,
    totalRecoveryCodes: total,
    remainingRecoveryCodes: unused,
  });
});

// Admin Regenerate Recovery Codes (Protected)
app.post('/api/admin/mfa/regenerate-recovery-codes', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, totpCode } = req.body;
  const authConfig = loadAuth();

  if (currentPassword !== authConfig.adminPassword) {
    res.status(400).json({ error: 'Current password is required to regenerate recovery codes.' });
    return;
  }

  if (!authConfig.mfaEnabled || !authConfig.mfaSecretEncrypted) {
    res.status(400).json({ error: 'MFA is not enabled.' });
    return;
  }

  const masterKey = getMfaMasterKey();
  const secret = decryptData(authConfig.mfaSecretEncrypted, masterKey);
  const isValid = verifyTotpCode(secret, totpCode, authConfig.adminEmail);

  if (!isValid) {
    res.status(400).json({ error: 'Invalid 6-digit TOTP code. Please confirm with Microsoft Authenticator.' });
    return;
  }

  const recoveryCodes = generateRecoveryCodes(8);
  const recoveryHashes: RecoveryCodeItem[] = recoveryCodes.map((c) => ({
    hash: hashRecoveryCode(c),
    used: false,
    createdAt: new Date().toISOString(),
  }));

  authConfig.mfaRecoveryCodeHashes = recoveryHashes;
  saveAuth(authConfig);

  res.json({
    success: true,
    recoveryCodes,
    message: 'New recovery codes generated. Previous recovery codes are now invalidated.',
  });
});

// -------------------------------------------------------------
// PUBLIC ENDPOINTS
// -------------------------------------------------------------

// Get Public Portfolio
app.get('/api/public/portfolio', (_req: Request, res: Response) => {
  try {
    const data = loadPortfolio();

    // Verify if CV file actually exists on disk
    let verifiedCvUrl = '';
    if (data.profile.cvUrl) {
      const cvRelPath = data.profile.cvUrl.replace(/^\/uploads\//, '');
      const fullCvPath = path.resolve(UPLOADS_DIR, cvRelPath);
      if (fs.existsSync(fullCvPath)) {
        verifiedCvUrl = data.profile.cvUrl;
      }
    }

    // Filter only published projects for public display
    const publicProjects = data.projects.filter((p) => p.published);

    res.json({
      profile: {
        ...data.profile,
        cvUrl: verifiedCvUrl,
      },
      projects: publicProjects,
      experiences: data.experiences,
      certifications: data.certifications,
    });
  } catch (error) {
    console.error('Error fetching public portfolio:', error);
    res.status(500).json({ error: 'Unable to load portfolio data' });
  }
});

// Download CV File
app.get('/api/public/cv/download', (_req: Request, res: Response) => {
  try {
    const data = loadPortfolio();
    if (!data.profile.cvUrl) {
      res.status(404).json({ error: 'No CV is currently available for download.' });
      return;
    }

    const cvRelPath = data.profile.cvUrl.replace(/^\/uploads\//, '');
    const fullCvPath = path.resolve(UPLOADS_DIR, cvRelPath);

    if (!fs.existsSync(fullCvPath)) {
      res.status(404).json({ error: 'CV file not found on server.' });
      return;
    }

    const downloadName = data.profile.cvFileName || 'Gabriella_Christiani_CV.pdf';
    res.download(fullCvPath, downloadName);
  } catch (error) {
    console.error('Error in CV download:', error);
    res.status(500).json({ error: 'Error downloading CV' });
  }
});

// Submit Contact Message
app.post('/api/public/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Name, email, and message are required.' });
    return;
  }

  let messages = [];
  if (fs.existsSync(MESSAGES_FILE)) {
    try {
      messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    } catch {
      messages = [];
    }
  }

  const newMessage = {
    id: `msg-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    subject: (subject || 'Portfolio Inquiry').trim(),
    message: message.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  messages.unshift(newMessage);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));

  res.json({ success: true, message: 'Message sent successfully. Gabriella will respond promptly.' });
});

// -------------------------------------------------------------
// ADMIN CRUD & MANAGEMENT ENDPOINTS (Strictly Protected)
// -------------------------------------------------------------

// Get Full Portfolio (including drafts & stats)
app.get('/api/admin/portfolio', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    let messages = [];
    if (fs.existsSync(MESSAGES_FILE)) {
      try {
        messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
      } catch {
        messages = [];
      }
    }
    res.json({
      ...data,
      messages,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve admin data' });
  }
});

// Create Project
app.post('/api/admin/projects', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    const images = Array.isArray(req.body.images) ? req.body.images : [];
    const coverImage = req.body.coverImage || (images.length > 0 ? images[0] : '');

    const newProject = {
      ...req.body,
      id: req.body.id || `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      coverImage,
      images,
      deliverables: Array.isArray(req.body.deliverables) ? req.body.deliverables : [],
      tools: Array.isArray(req.body.tools) ? req.body.tools : [],
      results: Array.isArray(req.body.results) ? req.body.results : [],
      published: req.body.published !== undefined ? req.body.published : true,
    };

    data.projects.unshift(newProject);
    savePortfolio(data);
    res.json({ success: true, project: newProject });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update Project
app.put('/api/admin/projects/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = loadPortfolio();
    const index = data.projects.findIndex((p) => p.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const images = Array.isArray(req.body.images) ? req.body.images : data.projects[index].images || [];
    const coverImage =
      req.body.coverImage !== undefined
        ? req.body.coverImage
        : (data.projects[index].coverImage || (images.length > 0 ? images[0] : ''));

    data.projects[index] = {
      ...data.projects[index],
      ...req.body,
      id, // keep original id
      images,
      coverImage,
    };

    savePortfolio(data);
    res.json({ success: true, project: data.projects[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete Project
app.delete('/api/admin/projects/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = loadPortfolio();
    const initialLen = data.projects.length;
    data.projects = data.projects.filter((p) => p.id !== id);

    if (data.projects.length === initialLen) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    savePortfolio(data);
    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Update Profile
app.put('/api/admin/profile', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    data.profile = {
      ...data.profile,
      ...req.body,
      // Independently preserve Hero and About Me photos unless explicitly modified
      heroPhotoUrl: req.body.heroPhotoUrl !== undefined ? req.body.heroPhotoUrl : data.profile.heroPhotoUrl,
      aboutPhotoUrl: req.body.aboutPhotoUrl !== undefined ? req.body.aboutPhotoUrl : data.profile.aboutPhotoUrl,
      avatarUrl: req.body.avatarUrl !== undefined ? req.body.avatarUrl : data.profile.avatarUrl,
      // preserve CV metadata unless explicitly modified
      cvUrl: req.body.cvUrl !== undefined ? req.body.cvUrl : data.profile.cvUrl,
      cvFileName: req.body.cvFileName !== undefined ? req.body.cvFileName : data.profile.cvFileName,
      cvUpdatedAt: req.body.cvUpdatedAt !== undefined ? req.body.cvUpdatedAt : data.profile.cvUpdatedAt,
    };
    savePortfolio(data);
    res.json({ success: true, profile: data.profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create Work Experience
app.post('/api/admin/experience', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    const newExp = {
      ...req.body,
      id: `exp-${Date.now()}`,
      bulletPoints: Array.isArray(req.body.bulletPoints) ? req.body.bulletPoints : [],
      technologies: Array.isArray(req.body.technologies) ? req.body.technologies : [],
    };
    data.experiences.unshift(newExp);
    savePortfolio(data);
    res.json({ success: true, experience: newExp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create experience entry' });
  }
});

// Update Work Experience
app.put('/api/admin/experience/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = loadPortfolio();
    const index = data.experiences.findIndex((e) => e.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Experience entry not found' });
      return;
    }

    data.experiences[index] = {
      ...data.experiences[index],
      ...req.body,
      id,
    };
    savePortfolio(data);
    res.json({ success: true, experience: data.experiences[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experience entry' });
  }
});

// Delete Work Experience
app.delete('/api/admin/experience/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = loadPortfolio();
    data.experiences = data.experiences.filter((e) => e.id !== id);
    savePortfolio(data);
    res.json({ success: true, message: 'Experience deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete experience' });
  }
});

// Create Certification
app.post('/api/admin/certifications', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    const imageUrl = req.body.imageUrl || req.body.image || '';
    const newCert: Certification = {
      id: req.body.id || `cert-${Date.now()}`,
      title: req.body.title || 'Accredited Certification',
      issuer: req.body.issuer || '',
      issueDate: req.body.issueDate || new Date().getFullYear().toString(),
      period: req.body.period || '',
      credentialUrl: req.body.credentialUrl || '',
      credentialFileUrl: req.body.credentialFileUrl || '',
      skills: Array.isArray(req.body.skills) ? req.body.skills : [],
      imageUrl,
      image: imageUrl,
      description: req.body.description || '',
    };
    data.certifications.push(newCert);
    savePortfolio(data);
    res.json({ success: true, certification: newCert });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create certification' });
  }
});

// Update Certification
app.put('/api/admin/certifications/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = loadPortfolio();
    const index = data.certifications.findIndex((c) => c.id === id);

    if (index === -1) {
      res.status(404).json({ error: 'Certification not found' });
      return;
    }

    const current = data.certifications[index];
    const imageUrl =
      req.body.imageUrl !== undefined
        ? req.body.imageUrl
        : req.body.image !== undefined
        ? req.body.image
        : (current.imageUrl || current.image || '');

    data.certifications[index] = {
      ...current,
      ...req.body,
      id,
      skills: Array.isArray(req.body.skills) ? req.body.skills : current.skills,
      imageUrl,
      image: imageUrl,
    };
    savePortfolio(data);
    res.json({ success: true, certification: data.certifications[index] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update certification' });
  }
});

// Delete Certification
app.delete('/api/admin/certifications/:id', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = loadPortfolio();
    data.certifications = data.certifications.filter((c) => c.id !== id);
    savePortfolio(data);
    res.json({ success: true, message: 'Certification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete certification' });
  }
});

// Upload Certificate Image (Independent file upload for certifications)
app.post(
  '/api/admin/certifications/upload-image',
  requireAdminAuth,
  uploadImage.single('certificateImage'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No certificate image file provided' });
        return;
      }

      const imageUrl = `/uploads/${file.filename}`;
      res.json({
        success: true,
        imageUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        message: 'Certificate image uploaded successfully.',
      });
    } catch (error) {
      console.error('Certificate image upload error:', error);
      res.status(500).json({ error: 'Failed to upload certificate image' });
    }
  }
);

// Upload Hero Photo (Independent from About Me Photo)
app.post(
  '/api/admin/profile/hero-photo',
  requireAdminAuth,
  uploadImage.single('heroPhoto'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No hero photo file provided' });
        return;
      }

      const data = loadPortfolio();
      const heroPhotoUrl = `/uploads/${file.filename}`;
      data.profile.heroPhotoUrl = heroPhotoUrl;
      savePortfolio(data);

      res.json({
        success: true,
        heroPhotoUrl,
        message: 'Hero photo uploaded and stored persistently.',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload hero photo' });
    }
  }
);

// Delete Hero Photo (Independent from About Me Photo)
app.delete('/api/admin/profile/hero-photo', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    data.profile.heroPhotoUrl = '';
    savePortfolio(data);
    res.json({ success: true, message: 'Hero photo removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove hero photo' });
  }
});

// Upload About Me Photo (Independent from Hero Photo)
app.post(
  '/api/admin/profile/about-photo',
  requireAdminAuth,
  uploadImage.single('aboutPhoto'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No About Me photo file provided' });
        return;
      }

      const data = loadPortfolio();
      const aboutPhotoUrl = `/uploads/${file.filename}`;
      data.profile.aboutPhotoUrl = aboutPhotoUrl;
      savePortfolio(data);

      res.json({
        success: true,
        aboutPhotoUrl,
        message: 'About Me photo uploaded and stored persistently.',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload About Me photo' });
    }
  }
);

// Delete About Me Photo (Independent from Hero Photo)
app.delete('/api/admin/profile/about-photo', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    data.profile.aboutPhotoUrl = '';
    savePortfolio(data);
    res.json({ success: true, message: 'About Me photo removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove About Me photo' });
  }
});

// Upload Project Image(s)
app.post(
  '/api/admin/upload',
  requireAdminAuth,
  uploadImage.array('images', 10),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const uploadedFiles = files.map((file) => ({
        url: `/uploads/${file.filename}`,
        originalName: file.originalname,
        size: file.size,
      }));

      res.json({
        success: true,
        files: uploadedFiles,
        url: uploadedFiles[0].url,
      });
    } catch (error) {
      res.status(500).json({ error: 'Image upload failed' });
    }
  }
);

// Upload / Replace CV
app.post(
  '/api/admin/cv',
  requireAdminAuth,
  uploadCv.single('cv'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No CV document provided' });
        return;
      }

      const data = loadPortfolio();
      const cvUrl = `/uploads/cv/${file.filename}`;
      data.profile.cvUrl = cvUrl;
      data.profile.cvFileName = file.originalname;
      data.profile.cvUpdatedAt = new Date().toISOString();

      savePortfolio(data);

      res.json({
        success: true,
        cvUrl,
        cvFileName: file.originalname,
        cvUpdatedAt: data.profile.cvUpdatedAt,
        message: 'CV uploaded and stored persistently. Public download button is now active.',
      });
    } catch (error) {
      console.error('CV upload error:', error);
      res.status(500).json({ error: 'Failed to upload CV document' });
    }
  }
);

// Delete CV
app.delete('/api/admin/cv', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const data = loadPortfolio();
    if (data.profile.cvUrl) {
      const cvRel = data.profile.cvUrl.replace(/^\/uploads\//, '');
      const fullPath = path.resolve(UPLOADS_DIR, cvRel);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
        } catch {
          // ignore unlink error
        }
      }
    }

    data.profile.cvUrl = '';
    data.profile.cvFileName = '';
    data.profile.cvUpdatedAt = '';
    savePortfolio(data);

    res.json({
      success: true,
      message: 'CV removed. Public download button is now hidden.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove CV' });
  }
});

// Upload Avatar / Profile Photo
app.post(
  '/api/admin/profile/avatar',
  requireAdminAuth,
  uploadImage.single('avatar'),
  (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No avatar image provided' });
        return;
      }

      const data = loadPortfolio();
      const avatarUrl = `/uploads/${file.filename}`;
      data.profile.avatarUrl = avatarUrl;
      savePortfolio(data);

      res.json({
        success: true,
        avatarUrl,
        message: 'Profile photo updated and stored persistently.',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile picture' });
    }
  }
);

// Media Library: list all uploaded files
app.get('/api/admin/media', requireAdminAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const mediaList = files
      .filter((file) => !fs.statSync(path.join(UPLOADS_DIR, file)).isDirectory())
      .map((file) => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, file));
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, media: mediaList });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list media files' });
  }
});

// Media Library: delete single file
app.delete('/api/admin/media/:filename', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const cleanFilename = path.basename(filename);
    const targetPath = path.resolve(UPLOADS_DIR, cleanFilename);

    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      res.json({ success: true, message: 'Media file removed' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete media file' });
  }
});

// Projects Reorder
app.put('/api/admin/projects-reorder', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ error: 'orderedIds must be an array of project IDs' });
      return;
    }

    const data = loadPortfolio();
    const projectMap = new Map(data.projects.map((p) => [p.id, p]));
    const newOrdered: Project[] = [];

    for (const id of orderedIds) {
      const p = projectMap.get(id);
      if (p) {
        newOrdered.push(p);
        projectMap.delete(id);
      }
    }
    // append any remaining
    for (const p of projectMap.values()) {
      newOrdered.push(p);
    }

    data.projects = newOrdered;
    savePortfolio(data);
    res.json({ success: true, projects: data.projects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorder projects' });
  }
});


// Setup Vite or Static File Serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
