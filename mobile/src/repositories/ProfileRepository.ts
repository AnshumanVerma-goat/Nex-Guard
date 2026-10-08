import { getDatabase } from '../database/database';

export type ElderlyProfileEntity = {
  id: string;
  user_id: string | null;
  full_name: string;
  age: number | null;
  medical_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
};

export const ProfileRepository = {
  async createProfile(profile: ElderlyProfileEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO elderly_profiles (id, user_id, full_name, age, medical_notes, emergency_contact_name, emergency_contact_phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        profile.id,
        profile.user_id,
        profile.full_name,
        profile.age,
        profile.medical_notes,
        profile.emergency_contact_name,
        profile.emergency_contact_phone,
        profile.created_at,
      ]
    );
  },

  async getAllProfiles(): Promise<ElderlyProfileEntity[]> {
    const db = await getDatabase();
    return await db.getAllAsync<ElderlyProfileEntity>(`SELECT * FROM elderly_profiles ORDER BY created_at DESC;`);
  },

  async findById(id: string): Promise<ElderlyProfileEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ElderlyProfileEntity>(`SELECT * FROM elderly_profiles WHERE id = ?;`, [id]);
    return result || null;
  },

  async findByUserId(userId: string): Promise<ElderlyProfileEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<ElderlyProfileEntity>(`SELECT * FROM elderly_profiles WHERE user_id = ? ORDER BY created_at DESC;`, [userId]);
    return result || null;
  },

  async updateProfile(profile: ElderlyProfileEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE elderly_profiles SET full_name = ?, age = ?, medical_notes = ?, emergency_contact_name = ?, emergency_contact_phone = ? WHERE id = ?;`,
      [
        profile.full_name,
        profile.age,
        profile.medical_notes,
        profile.emergency_contact_name,
        profile.emergency_contact_phone,
        profile.id,
      ]
    );
  },
};

