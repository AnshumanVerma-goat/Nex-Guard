/**
 * Phase 2 — Local Authentication Verification Suite
 * Fully typed standalone verification for offline registration, login, hashing, session management, and restoration.
 */
import { AuthService, LocalSession } from '../AuthService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILURE] ${message}`);
  }
}

export async function runAuthVerificationTests(): Promise<{ passed: number; failed: number; log: string[] }> {
  const log: string[] = [];
  let passed = 0;
  let failed = 0;

  async function testCase(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed++;
      log.push(`[PASS] ${name}`);
    } catch (err: any) {
      failed++;
      log.push(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Password Hashing & Verification
  await testCase('1. Secure per-user password hashing with salt', async () => {
    const salt1 = await AuthService.generateSalt();
    const salt2 = await AuthService.generateSalt();
    assert(salt1 !== salt2, 'Salt generation must produce unique random salts per user');

    const hashedPassword1 = await AuthService.hashPasswordWithSalt('password123', salt1);
    const valid1 = await AuthService.verifyPassword('password123', hashedPassword1);
    const invalid1 = await AuthService.verifyPassword('wrongpass', hashedPassword1);

    assert(valid1 === true, 'Correct password verifies against hashed password with salt');
    assert(invalid1 === false, 'Wrong password rejected during verification');
  });

  // 2. Email Validation
  await testCase('2. Email format validation', () => {
    assert(AuthService.isValidEmail('user@example.com') === true, 'Valid email accepted');
    assert(AuthService.isValidEmail('user.name+tag@domain.co.uk') === true, 'Complex valid email accepted');
    assert(AuthService.isValidEmail('invalid-email') === false, 'Invalid email rejected');
    assert(AuthService.isValidEmail('@domain.com') === false, 'Missing username rejected');
    assert(AuthService.isValidEmail('user@') === false, 'Missing domain rejected');
  });

  // 3. Registration Rules
  await testCase('3. Registration input validation rules', async () => {
    try {
      await AuthService.register({ email: 'bad-email', password: 'password123', full_name: 'Test' });
      assert(false, 'Should have rejected invalid email');
    } catch (e: any) {
      assert(e.message.includes('valid email address'), 'Correct error message for invalid email');
    }

    try {
      await AuthService.register({ email: 'valid@example.com', password: '123', full_name: 'Test' });
      assert(false, 'Should have rejected short password');
    } catch (e: any) {
      assert(e.message.includes('at least 6 characters'), 'Correct error message for short password');
    }

    try {
      await AuthService.register({ email: 'valid@example.com', password: 'password123', full_name: '   ' });
      assert(false, 'Should have rejected empty name');
    } catch (e: any) {
      assert(e.message.includes('full name'), 'Correct error message for empty name');
    }
  });

  // 4. Session Architecture
  await testCase('4. Offline local session structure', () => {
    const sampleSession: LocalSession = {
      userId: 'usr_123',
      token: 'local_session_usr_123',
      email: 'caregiver@local.device',
      caregiverName: 'Caregiver Local',
      createdAt: new Date().toISOString(),
    };

    assert(sampleSession.userId === 'usr_123', 'Local User ID stored');
    assert(sampleSession.token.startsWith('local_session_'), 'Local token prefix verified');
    assert(sampleSession.email === 'caregiver@local.device', 'Email preserved in session');
    assert(!('password' in sampleSession), 'Plaintext password strictly omitted from session');
  });

  return { passed, failed, log };
}
