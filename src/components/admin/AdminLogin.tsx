import React, { useState, useEffect } from 'react';
import {
  Lock,
  ArrowLeft,
  ShieldAlert,
  Eye,
  EyeOff,
  Smartphone,
  QrCode,
  KeyRound,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: { email: string; role: string }) => void;
  onBackToPublic: () => void;
}

type AuthStep = 'credentials' | 'enrollment' | 'recovery_display' | 'verify';

interface MfaSetupData {
  qrCodeDataUrl: string;
  manualKey: string;
  account: string;
  issuer: string;
  digits: number;
  period: number;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToPublic }) => {
  const [step, setStep] = useState<AuthStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [codesSavedConfirmed, setCodesSavedConfirmed] = useState(false);

  // MFA Challenge State
  const [mfaToken, setMfaToken] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [mfaSetup, setMfaSetup] = useState<MfaSetupData | null>(null);
  const [showManualKey, setShowManualKey] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [finalSession, setFinalSession] = useState<{ token: string; user: { email: string; role: string } } | null>(null);

  // Recovery Code input mode on verify step
  const [useRecoveryCodeMode, setUseRecoveryCodeMode] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);

  // -------------------------------------------------------------
  // STEP 1: Email & Password Verification
  // -------------------------------------------------------------
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setMfaToken(data.mfaToken);

      if (data.mfaEnrollmentRequired) {
        // Needs first-time Microsoft Authenticator enrollment
        setStep('enrollment');
        await fetchMfaSetup(data.mfaToken);
      } else if (data.mfaRequired) {
        // Already enrolled -> go directly to Step 2 6-digit TOTP verification
        setStep('verify');
      } else if (data.token) {
        // Fallback if MFA wasn't enforced
        localStorage.setItem('admin_token', data.token);
        onLoginSuccess(data.token, data.user);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid administrator credentials. Access restricted.'
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2a: Fetch MFA Setup (QR Code & Secret)
  // -------------------------------------------------------------
  const fetchMfaSetup = async (tokenToUse: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({ mfaToken: tokenToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize MFA setup');
      }

      setMfaSetup(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error preparing MFA enrollment');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2b: Activate MFA with 6-digit Code
  // -------------------------------------------------------------
  const handleActivateMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanCode = totpCode.trim().replace(/\s+/g, '');

    if (!cleanCode || cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code from Microsoft Authenticator.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/mfa/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfaToken,
          code: cleanCode,
          rememberDevice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify TOTP code');
      }

      // Store final authenticated admin session
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        setFinalSession({ token: data.token, user: data.user });
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setStep('recovery_display');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 2c: Standard 6-digit TOTP / Recovery Code Login Verification
  // -------------------------------------------------------------
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: Record<string, any> = { mfaToken, rememberDevice };
      if (useRecoveryCodeMode) {
        const cleanRec = recoveryCodeInput.trim().toUpperCase();
        if (!cleanRec) {
          throw new Error('Please enter an emergency recovery code.');
        }
        payload.recoveryCode = cleanRec;
      } else {
        const cleanCode = totpCode.trim().replace(/\s+/g, '');
        if (!cleanCode || cleanCode.length !== 6) {
          throw new Error('Please enter the 6-digit code from Microsoft Authenticator.');
        }
        payload.code = cleanCode;
      }

      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.token) {
        localStorage.setItem('admin_token', data.token);
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Helper: Copy Manual Key
  // -------------------------------------------------------------
  const handleCopyKey = () => {
    if (!mfaSetup?.manualKey) return;
    navigator.clipboard.writeText(mfaSetup.manualKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // -------------------------------------------------------------
  // Helper: Copy & Download Recovery Codes
  // -------------------------------------------------------------
  const handleCopyRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadRecoveryCodes = () => {
    const content = `GABRIELLA CHRISTIANI - PORTFOLIO ADMIN RECOVERY CODES
Generated: ${new Date().toLocaleString()}
Account: ${email}
MFA Method: Microsoft Authenticator (RFC 6238 TOTP)

IMPORTANT:
Each recovery code below can only be used ONCE to sign in if you lose access to Microsoft Authenticator.
Keep this file in an encrypted folder or private offline vault.

RECOVERY CODES:
${recoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gabriella_christiani_mfa_recovery_codes_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFinishEnrollment = () => {
    if (!finalSession) return;
    onLoginSuccess(finalSession.token, finalSession.user);
  };

  return (
    <div className="min-h-screen bg-[#F8F5EF] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#3E2C22]">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <button
          onClick={onBackToPublic}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#806047] hover:text-[#3E2C22] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Public Website</span>
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-center justify-center text-[#694B36]">
            {step === 'credentials' && <Lock className="w-6 h-6" />}
            {step === 'enrollment' && <Smartphone className="w-6 h-6" />}
            {step === 'recovery_display' && <ShieldCheck className="w-6 h-6 text-[#2D5A3A]" />}
            {step === 'verify' && <KeyRound className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-[#806047]">
              Security & Identity Protection
            </span>
            <div className="text-xs font-semibold text-[#694B36] flex items-center gap-1.5">
              <span>Microsoft Authenticator TOTP</span>
              <span className="text-[#A58A73]">·</span>
              <span className="text-[#806047]">RFC 6238 Standard</span>
            </div>
          </div>
        </div>

        <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[#3E2C22]">
          {step === 'credentials' && 'Private Administrator Portal'}
          {step === 'enrollment' && 'Enroll Microsoft Authenticator'}
          {step === 'recovery_display' && 'Save Emergency Recovery Codes'}
          {step === 'verify' && 'Two-Factor Verification'}
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-[#806047]">
          {step === 'credentials' && 'Restricted management console for Gabriella Christiani.'}
          {step === 'enrollment' && 'Scan this QR code with Microsoft Authenticator on your phone to complete setup.'}
          {step === 'recovery_display' && 'Store these one-time codes safely. They are shown only once.'}
          {step === 'verify' && 'Enter the 6-digit time-based code from Microsoft Authenticator to confirm your identity.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-[#FFFCF7] py-8 px-6 sm:px-10 border border-[#DCC9B3] rounded-[32px] shadow-sm space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-[#FDF2F0] border border-[#F2C4BE] text-[#8C2E24] text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW 1: Email & Password                                */}
          {/* ------------------------------------------------------- */}
          {step === 'credentials' && (
            <>
              <div className="p-4 rounded-2xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-start gap-2.5 text-xs text-[#694B36]">
                <ShieldAlert className="w-4 h-4 text-[#806047] shrink-0 mt-0.5" />
                <span>
                  Public registration is disabled. Multi-Factor Authentication (MFA) via Microsoft Authenticator is enforced on this account.
                </span>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5"
                  >
                    Administrator Email
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter administrator password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] text-sm focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#806047] hover:text-[#3E2C22] p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 text-xs text-[#3E2C22] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3E2C22] accent-[#3E2C22] border-[#DCC9B3] focus:ring-[#694B36]"
                  />
                  <span className="font-medium text-[#694B36]">Remember this device for 30 days (Skip Authenticator next time)</span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Continue to MFA</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW 2: First-Time MFA Enrollment                       */}
          {/* ------------------------------------------------------- */}
          {step === 'enrollment' && (
            <div className="space-y-6">
              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-[#F1E8DC]/80 border border-[#DCC9B3] space-y-2 text-xs text-[#694B36]">
                <div className="font-bold text-[#3E2C22] flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#806047]" />
                  <span>How to pair Microsoft Authenticator:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[#694B36] leading-relaxed">
                  <li>Open the <strong>Microsoft Authenticator</strong> app on your mobile phone.</li>
                  <li>Tap the <strong>+</strong> button (Add account) and choose <strong>Other (Google, Facebook, etc.)</strong>.</li>
                  <li>Point your phone camera at the QR code below to scan.</li>
                  <li>Enter the generated 6-digit code to activate two-factor authentication.</li>
                </ol>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3] shadow-inner">
                {mfaSetup?.qrCodeDataUrl ? (
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-[#DCC9B3]">
                    <img
                      src={mfaSetup.qrCodeDataUrl}
                      alt="Microsoft Authenticator TOTP Provisioning QR Code"
                      className="w-48 h-48 sm:w-56 sm:h-56 block object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-[#806047]">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                )}

                <div className="mt-3 text-[11px] text-[#806047] text-center font-medium">
                  Issuer: <strong>Gabriella Christiani</strong> (30s interval, 6 digits)
                </div>
              </div>

              {/* Manual Entry Fallback */}
              <div className="border-t border-[#DCC9B3]/60 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualKey(!showManualKey)}
                  className="text-xs text-[#806047] hover:text-[#3E2C22] font-semibold inline-flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{showManualKey ? 'Hide manual entry key' : 'Cannot scan QR code? Enter key manually'}</span>
                </button>

                {showManualKey && mfaSetup?.manualKey && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#F1E8DC] border border-[#DCC9B3] space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#806047]">
                      Secret Key (Base32)
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-[#FFFCF7] px-3 py-2 rounded-lg border border-[#DCC9B3]">
                      <code className="text-xs font-mono font-bold text-[#3E2C22] break-all select-all">
                        {mfaSetup.manualKey}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#806047] hover:text-[#3E2C22] px-2 py-1 rounded bg-[#F1E8DC] shrink-0"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-[#806047]">
                      Account Name: <strong className="text-[#3E2C22]">{mfaSetup.account}</strong> | Time-based (TOTP)
                    </p>
                  </div>
                )}
              </div>

              {/* 6-Digit TOTP Activation Input */}
              <form onSubmit={handleActivateMfa} className="space-y-4 pt-2">
                <div>
                  <label
                    htmlFor="totp-activation-code"
                    className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5"
                  >
                    Enter 6-Digit Code from Microsoft Authenticator
                  </label>
                  <input
                    id="totp-activation-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    required
                    placeholder="e.g. 849201"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36]"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-[#3E2C22] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3E2C22] accent-[#3E2C22] border-[#DCC9B3] focus:ring-[#694B36]"
                  />
                  <span className="font-medium text-[#694B36]">Remember this device (Skip Authenticator next time for 30 days)</span>
                </label>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setError('');
                      setTotpCode('');
                    }}
                    className="w-1/3 py-3.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider border border-[#DCC9B3] text-[#806047] hover:bg-[#F1E8DC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totpCode.trim().length !== 6}
                    className="w-2/3 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-50 transition-all shadow-sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Activating MFA...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify & Enable MFA</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW 3: Emergency Recovery Codes (Shown ONLY ONCE)     */}
          {/* ------------------------------------------------------- */}
          {step === 'recovery_display' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F0F7F2] border border-[#C5DEC9] text-xs text-[#2D5A3A] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-[#1B4326]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Microsoft Authenticator Successfully Configured!</span>
                </div>
                <p className="leading-relaxed">
                  Your administrator account is now protected with RFC 6238 TOTP Multi-Factor Authentication.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#3E2C22]">
                      Emergency Recovery Codes
                    </h3>
                    <p className="text-[11px] text-[#806047]">
                      Each code can only be used once if you lose access to your phone.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyRecoveryCodes}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#DCC9B3] bg-[#F8F5EF] hover:bg-[#F1E8DC] text-[11px] font-semibold text-[#694B36] transition-colors"
                    >
                      {copiedCodes ? <Check className="w-3 h-3 text-green-700" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCodes ? 'Copied' : 'Copy All'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadRecoveryCodes}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#3E2C22] bg-[#3E2C22] hover:bg-[#694B36] text-[11px] font-semibold text-[#F8F5EF] transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download .txt</span>
                    </button>
                  </div>
                </div>

                {/* Recovery Codes Grid */}
                <div className="grid grid-cols-2 gap-2 p-4 rounded-2xl bg-[#F8F5EF] border border-[#DCC9B3]">
                  {recoveryCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFFCF7] border border-[#DCC9B3]/80 font-mono text-xs font-bold text-[#3E2C22]"
                    >
                      <span className="text-[10px] text-[#A58A73] w-4">{idx + 1}.</span>
                      <span className="tracking-wider">{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <div className="p-3.5 rounded-xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-start gap-3">
                <input
                  id="confirm-saved-codes"
                  type="checkbox"
                  checked={codesSavedConfirmed}
                  onChange={(e) => setCodesSavedConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-[#A58A73] text-[#3E2C22] focus:ring-[#694B36] w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="confirm-saved-codes"
                  className="text-xs font-medium text-[#3E2C22] cursor-pointer leading-relaxed"
                >
                  I have copied or downloaded these recovery codes and stored them in a secure location.
                  I understand they will <strong>never be shown again</strong>.
                </label>
              </div>

              <button
                type="button"
                disabled={!codesSavedConfirmed}
                onClick={handleFinishEnrollment}
                className="w-full inline-flex items-center justify-center gap-2 py-4 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-40 transition-all shadow-sm"
              >
                <span>Complete Setup & Open Dashboard</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}

          {/* ------------------------------------------------------- */}
          {/* VIEW 4: Subsequent Logins (TOTP or Recovery Code)       */}
          {/* ------------------------------------------------------- */}
          {step === 'verify' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#F1E8DC] border border-[#DCC9B3] flex items-start gap-2.5 text-xs text-[#694B36]">
                <Smartphone className="w-4 h-4 text-[#806047] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#3E2C22] block mb-0.5">Two-Step Verification Enforced</span>
                  <span>
                    Open <strong>Microsoft Authenticator</strong> on your phone and enter the 6-digit passcode for <strong>Gabriella Christiani</strong>.
                  </span>
                </div>
              </div>

              <form onSubmit={handleVerifyMfa} className="space-y-5">
                {!useRecoveryCodeMode ? (
                  <div>
                    <label
                      htmlFor="totp-login-code"
                      className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5"
                    >
                      6-Digit Security Code
                    </label>
                    <input
                      id="totp-login-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      required
                      placeholder="000 000"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-center tracking-[0.6em] text-2xl font-mono font-bold py-3.5 px-4 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36]"
                    />
                    <div className="mt-2 text-right">
                      <span className="text-[11px] text-[#806047]">
                        Codes refresh every 30 seconds
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="recovery-login-code"
                      className="block text-xs font-bold uppercase tracking-wider text-[#694B36] mb-1.5"
                    >
                      Emergency Recovery Code
                    </label>
                    <input
                      id="recovery-login-code"
                      type="text"
                      autoFocus
                      required
                      placeholder="XXXX-XXXX"
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value)}
                      className="w-full text-center uppercase tracking-widest text-lg font-mono font-bold py-3.5 px-4 rounded-xl border border-[#DCC9B3] bg-[#F8F5EF] text-[#3E2C22] focus:outline-none focus:ring-2 focus:ring-[#694B36]/20 focus:border-[#694B36]"
                    />
                    <p className="mt-1.5 text-[11px] text-[#806047]">
                      Enter one of the 8-character recovery codes generated during your MFA enrollment.
                    </p>
                  </div>
                )}

                <label className="flex items-center gap-2.5 text-xs text-[#3E2C22] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3E2C22] accent-[#3E2C22] border-[#DCC9B3] focus:ring-[#694B36]"
                  />
                  <span className="font-medium text-[#694B36]">Remember this device for 30 days (Skip Authenticator next time)</span>
                </label>

                <button
                  type="submit"
                  disabled={loading || (!useRecoveryCodeMode && totpCode.trim().length !== 6)}
                  className="w-full inline-flex items-center justify-center gap-2 py-4 px-4 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3E2C22] text-[#F8F5EF] hover:bg-[#694B36] disabled:opacity-50 transition-all shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Authentication...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{useRecoveryCodeMode ? 'Verify Recovery Code' : 'Verify & Sign In'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Mode Toggle & Back */}
              <div className="pt-3 border-t border-[#DCC9B3]/60 flex flex-col items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseRecoveryCodeMode(!useRecoveryCodeMode);
                    setError('');
                  }}
                  className="text-[#806047] hover:text-[#3E2C22] font-semibold underline underline-offset-4"
                >
                  {useRecoveryCodeMode
                    ? 'Use 6-digit code from Microsoft Authenticator instead'
                    : 'Lost your phone? Use an emergency recovery code'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setError('');
                    setPassword('');
                    setTotpCode('');
                    setRecoveryCodeInput('');
                  }}
                  className="text-[11px] text-[#A58A73] hover:text-[#3E2C22] mt-1"
                >
                  Sign in with different credentials
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[#DCC9B3]/60 text-center">
            <span className="text-[11px] text-[#A58A73]">
              Protected with RFC 6238 TOTP, AES-256-GCM encryption at rest, and backend authorization.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
