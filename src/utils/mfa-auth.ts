import * as OTPAuth from 'otpauth';
import crypto from 'crypto';

export interface EncryptedPayload {
  iv: string;
  tag: string;
  data: string;
}

export interface RecoveryCodeItem {
  hash: string;
  used: boolean;
  usedAt?: string;
  createdAt: string;
}

export interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null;
}

const ISSUER = 'Gabriella Christiani';
const DIGITS = 6;
const PERIOD = 30; // 30-second interval as per RFC 6238
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Generate a cryptographically secure random base32 TOTP secret (160 bits / 20 bytes)
 */
export function generateTotpSecret(): string {
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Instantiate an RFC 6238 compliant TOTP object compatible with Microsoft Authenticator
 */
export function createTotpInstance(secretBase32: string, accountName: string = 'gabriellachristiani77@gmail.com') {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountName,
    algorithm: 'SHA1',
    digits: DIGITS,
    period: PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

/**
 * Generate the standard otpauth:// URI for Microsoft Authenticator QR code
 */
export function generateTotpUri(secretBase32: string, accountName: string = 'gabriellachristiani77@gmail.com'): string {
  const totp = createTotpInstance(secretBase32, accountName);
  return totp.toString();
}

/**
 * Verify a 6-digit TOTP code against the secret with a clock drift window of 1 (±30s)
 */
export function verifyTotpCode(secretBase32: string, token: string, accountName: string = 'gabriellachristiani77@gmail.com'): boolean {
  if (!token || typeof token !== 'string') return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const totp = createTotpInstance(secretBase32, accountName);
  // window: 1 checks current step, previous step (-30s), and next step (+30s)
  const delta = totp.validate({ token: cleanToken, window: 1 });
  return delta !== null;
}

/**
 * Generate cryptographically secure emergency recovery codes
 * Format: 8 codes, each formatted as XXXX-XXXX (8 uppercase alphanumeric characters)
 */
export function generateRecoveryCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
    // Format: 4-4-2 or XXXX-XXXX
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(formatted);
  }
  return codes;
}

/**
 * Hash a recovery code using SHA-256
 */
export function hashRecoveryCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Validate and consume a single-use recovery code
 */
export function verifyAndConsumeRecoveryCode(
  inputCode: string,
  storedItems: RecoveryCodeItem[]
): { valid: boolean; matchingIndex: number } {
  if (!inputCode) return { valid: false, matchingIndex: -1 };
  const inputHash = hashRecoveryCode(inputCode);

  for (let i = 0; i < storedItems.length; i++) {
    if (!storedItems[i].used && storedItems[i].hash === inputHash) {
      return { valid: true, matchingIndex: i };
    }
  }

  return { valid: false, matchingIndex: -1 };
}

/**
 * Encrypt TOTP secret at rest with AES-256-GCM
 */
export function encryptData(plaintext: string, masterKey32Bytes: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey32Bytes, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    tag,
    data: encrypted,
  };
}

/**
 * Decrypt TOTP secret with AES-256-GCM
 */
export function decryptData(payload: EncryptedPayload, masterKey32Bytes: Buffer): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    masterKey32Bytes,
    Buffer.from(payload.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  let decrypted = decipher.update(payload.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Check if MFA verification is locked out due to excessive failed attempts
 */
export function evaluateLockout(
  state: LockoutState,
  now: number = Date.now()
): { isLocked: boolean; remainingLockoutMs: number } {
  if (state.lockedUntil && now < state.lockedUntil) {
    return {
      isLocked: true,
      remainingLockoutMs: state.lockedUntil - now,
    };
  }

  return {
    isLocked: false,
    remainingLockoutMs: 0,
  };
}

/**
 * Record a failed attempt and determine if lockout is triggered
 */
export function recordFailedAttempt(
  state: LockoutState,
  now: number = Date.now()
): LockoutState {
  const updatedAttempts = state.failedAttempts + 1;
  let lockedUntil = state.lockedUntil;

  if (updatedAttempts >= MAX_FAILED_ATTEMPTS) {
    lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  return {
    failedAttempts: updatedAttempts,
    lockedUntil,
  };
}

/**
 * Reset lockout state after successful verification
 */
export function resetLockoutState(): LockoutState {
  return {
    failedAttempts: 0,
    lockedUntil: null,
  };
}
