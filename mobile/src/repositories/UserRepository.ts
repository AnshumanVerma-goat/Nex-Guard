import { getDatabase } from '../database/database';

export type UserEntity = {
  id: string;
  email: string;
  hashed_password: string;
  full_name: string;
  role: string;
  created_at: string;
};

export type CaregiverEntity = {
  id: string;
  user_id: string;
  phone_number: string | null;
  is_primary: number;
  created_at: string;
};

export const UserRepository = {
  async createUser(user: UserEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO users (id, email, hashed_password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?);`,
      [user.id, user.email, user.hashed_password, user.full_name, user.role, user.created_at]
    );
  },

  async findByEmail(email: string): Promise<UserEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<UserEntity>(`SELECT * FROM users WHERE email = ?;`, [email]);
    return result || null;
  },

  async findById(id: string): Promise<UserEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<UserEntity>(`SELECT * FROM users WHERE id = ?;`, [id]);
    return result || null;
  },

  async createCaregiver(caregiver: CaregiverEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO caregivers (id, user_id, phone_number, is_primary, created_at) VALUES (?, ?, ?, ?, ?);`,
      [caregiver.id, caregiver.user_id, caregiver.phone_number, caregiver.is_primary, caregiver.created_at]
    );
  },
};
