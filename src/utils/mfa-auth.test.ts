import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  generateTotpSecret,
  createTotpInstance,
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
  RecoveryCodeItem,
  LockoutState,
} from './mfa-auth.ts';

test('TOTP secret generation produces valid Base32 string', () => {
  const secret = generateTotpSecret();
  assert.equal(typeof secret, 'string');
  assert.ok(secret.length >= 26);
  assert.match(secret, /^[A-Z2-7]+$/);
});

test('generateTotpUri outputs valid RFC 6238 URI formatted for Microsoft Authenticator', () => {
  const secret = generateTotpSecret();
  const uri = generateTotpUri(secret, 'gabriellachristiani77@gmail.com');
  assert.ok(uri.startsWith('otpauth://totp/'));
  assert.ok(uri.includes('issuer=Gabriella%20Christiani') || uri.includes('issuer=Gabriella+Christiani'));
  assert.ok(uri.includes('digits=6'));
  assert.ok(uri.includes('period=30'));
  assert.ok(uri.includes(`secret=${secret}`));
});

test('verifyTotpCode successfully validates freshly generated TOTP tokens', () => {
  const secret = generateTotpSecret();
  const totp = createTotpInstance(secret, 'gabriellachristiani77@gmail.com');
  const token = totp.generate();

  assert.equal(typeof token, 'string');
  assert.equal(token.length, 6);

  // Validate the token
  const isValid = verifyTotpCode(secret, token, 'gabriellachristiani77@gmail.com');
  assert.equal(isValid, true);
});

test('verifyTotpCode rejects invalid, malformed, or blank tokens', () => {
  const secret = generateTotpSecret();
  assert.equal(verifyTotpCode(secret, '000000'), false);
  assert.equal(verifyTotpCode(secret, '12345'), false);
  assert.equal(verifyTotpCode(secret, 'abcdef'), false);
  assert.equal(verifyTotpCode(secret, ''), false);
});

test('AES-256-GCM encryption and decryption roundtrip preserves secret', () => {
  const masterKey = crypto.randomBytes(32);
  const secret = generateTotpSecret();

  const encrypted = encryptData(secret, masterKey);
  assert.ok(encrypted.iv);
  assert.ok(encrypted.tag);
  assert.ok(encrypted.data);

  const decrypted = decryptData(encrypted, masterKey);
  assert.equal(decrypted, secret);
});

test('Recovery codes are generated, hashed, and single-use verifiable', () => {
  const codes = generateRecoveryCodes(8);
  assert.equal(codes.length, 8);

  const stored: RecoveryCodeItem[] = codes.map((c) => ({
    hash: hashRecoveryCode(c),
    used: false,
    createdAt: new Date().toISOString(),
  }));

  // Test valid code consumption
  const testCode = codes[0];
  const { valid, matchingIndex } = verifyAndConsumeRecoveryCode(testCode, stored);
  assert.equal(valid, true);
  assert.equal(matchingIndex, 0);

  // Mark as used
  stored[matchingIndex].used = true;

  // Try using the same code again -> must fail
  const retry = verifyAndConsumeRecoveryCode(testCode, stored);
  assert.equal(retry.valid, false);

  // Invalid code must fail
  const fake = verifyAndConsumeRecoveryCode('INVALID-CODE', stored);
  assert.equal(fake.valid, false);
});

test('Lockout logic locks account after 5 failed attempts and resets properly', () => {
  let state: LockoutState = { failedAttempts: 0, lockedUntil: null };
  const now = 1700000000000;

  // 4 failed attempts should not lock
  for (let i = 0; i < 4; i++) {
    state = recordFailedAttempt(state, now);
    const evalState = evaluateLockout(state, now);
    assert.equal(evalState.isLocked, false);
  }

  // 5th failed attempt triggers 15-minute lockout
  state = recordFailedAttempt(state, now);
  const lockedEval = evaluateLockout(state, now);
  assert.equal(lockedEval.isLocked, true);
  assert.equal(lockedEval.remainingLockoutMs, 15 * 60 * 1000);

  // Reset clears state
  state = resetLockoutState();
  const resetEval = evaluateLockout(state, now);
  assert.equal(resetEval.isLocked, false);
  assert.equal(state.failedAttempts, 0);
});
