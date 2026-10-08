import { ElderlyProfileEntity, ProfileRepository } from '../repositories/ProfileRepository';

export const ProfileService = {
  async createProfile(data: {
    userId?: string | null;
    full_name: string;
    age?: number;
    medical_notes?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }): Promise<ElderlyProfileEntity> {
    const userId = data.userId || null;
    if (userId) {
      const existing = await ProfileRepository.findByUserId(userId);
      if (existing) {
        const updated: ElderlyProfileEntity = {
          ...existing,
          full_name: data.full_name,
          age: data.age !== undefined ? data.age : existing.age,
          medical_notes: data.medical_notes !== undefined ? data.medical_notes : existing.medical_notes,
          emergency_contact_name: data.emergency_contact_name !== undefined ? data.emergency_contact_name : existing.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone !== undefined ? data.emergency_contact_phone : existing.emergency_contact_phone,
        };
        await ProfileRepository.updateProfile(updated);
        return updated;
      }
    }

    const profile: ElderlyProfileEntity = {
      id: `prof_${Date.now()}`,
      user_id: userId,
      full_name: data.full_name,
      age: data.age || null,
      medical_notes: data.medical_notes || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      created_at: new Date().toISOString(),
    };

    await ProfileRepository.createProfile(profile);
    return profile;
  },

  async getProfileForUser(userId: string): Promise<ElderlyProfileEntity | null> {
    return await ProfileRepository.findByUserId(userId);
  },

  async getProfiles(): Promise<ElderlyProfileEntity[]> {
    return await ProfileRepository.getAllProfiles();
  },
};

