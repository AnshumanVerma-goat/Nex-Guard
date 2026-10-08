import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { UserEntity, UserRepository } from '../repositories/UserRepository';

const SECURE_SESSION_KEY = 'nex_guard_secure_session_v1';

export type LocalSession = {
  userId: string;
  token: string;
  email: string;
  caregiverName: string;
  createdAt: string;
};

export const AuthService = {
  /**
   * Generate a cryptographically random salt per user.
   */
  async generateSalt(): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(16);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Secure local password hashing using SHA-256 with a unique per-user salt via expo-crypto.
   * Format stored in SQLite: `${salt}:${digest}`
   */
  async hashPasswordWithSalt(password: string, salt: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${password}:${salt}`
    );
    return `${salt}:${digest}`;
  },

  /**
   * Verify candidate password against a stored `${salt}:${digest}` string.
   */
  async verifyPassword(password: string, storedHashedPassword: string): Promise<boolean> {
    const parts = storedHashedPassword.split(':');
    if (parts.length !== 2) {
      // Legacy fallback handler
      const legacyHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${password}:nex_guard_local_salt_2026`
      );
      return storedHashedPassword === legacyHash;
    }
    const [salt, expectedHash] = parts;
    const computedDigest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${password}:${salt}`
    );
    return computedDigest === expectedHash;
  },

  /**
   * Validate email format regex.
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Register a new local device user in SQLite and create a SecureStore session.
   */
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
  }): Promise<{ session: LocalSession; user: UserEntity }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.full_name.trim();

    if (!cleanName) {
      throw new Error('Please enter your full name.');
    }
    if (!this.isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const existing = await UserRepository.findByEmail(cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists on this device.');
    }

    const salt = await this.generateSalt();
    const hashedPassword = await this.hashPasswordWithSalt(data.password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const caregiverId = `cg_${Date.now()}`;
    const now = new Date().toISOString();

    const user: UserEntity = {
      id: userId,
      email: cleanEmail,
      hashed_password: hashedPassword,
      full_name: cleanName,
      role: 'caregiver',
      created_at: now,
    };

    await UserRepository.createUser(user);
    await UserRepository.createCaregiver({
      id: caregiverId,
      user_id: userId,
      phone_number: data.phone_number || null,
      is_primary: 1,
      created_at: now,
    });

    const session: LocalSession = {
      userId,
      token: `local_session_${userId}`,
      email: cleanEmail,
      caregiverName: cleanName,
      createdAt: now,
    };

    await SecureStore.setItemAsync(SECURE_SESSION_KEY, JSON.stringify(session));
    return { session, user };
  },

  /**
   * Login using local device credentials verified against SQLite.
   */
  async login(data: {
    email: string;
    password: string;
  }): Promise<{ session: LocalSession; user: UserEntity }> {
    const cleanEmail = data.email.trim().toLowerCase();

    if (!this.isValidEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!data.password) {
      throw new Error('Please enter your password.');
    }

    const user = await UserRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new Error('Incorrect email or password.');
    }

    const isValid = await this.verifyPassword(data.password, user.hashed_password);
    if (!isValid) {
      throw new Error('Incorrect email or password.');
    }

    const session: LocalSession = {
      userId: user.id,
      token: `local_session_${user.id}`,
      email: user.email,
      caregiverName: user.full_name,
      createdAt: new Date().toISOString(),
    };

    await SecureStore.setItemAsync(SECURE_SESSION_KEY, JSON.stringify(session));
    return { session, user };
  },

  /**
   * Restore persistent local session from SecureStore on app launch.
   */
  async restoreSession(): Promise<LocalSession | null> {
    try {
      const rawSession = await SecureStore.getItemAsync(SECURE_SESSION_KEY);
      if (!rawSession) return null;

      const session = JSON.parse(rawSession) as LocalSession;
      if (!session.userId || !session.email) return null;

      // Verify user still exists in SQLite DB
      const user = await UserRepository.findById(session.userId);
      if (!user) {
        await this.logout();
        return null;
      }

      return session;
    } catch {
      return null;
    }
  },

  /**
   * Clear SecureStore session on logout (preserves local database records).
   */
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_SESSION_KEY);
    } catch {}
  },
};
