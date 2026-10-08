import { getDatabase } from '../database/database';

export type FallEventEntity = {
  id: string;
  device_id: string;
  event_type: string;
  occurred_at: string;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  detection_model: string;
  confirmation_status: string;
  communication_path: string;
  created_at: string;
};

export const FallEventRepository = {
  async createFallEvent(event: FallEventEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO fall_events (id, device_id, event_type, occurred_at, confidence, latitude, longitude, location_accuracy, detection_model, confirmation_status, communication_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        event.id,
        event.device_id,
        event.event_type,
        event.occurred_at,
        event.confidence,
        event.latitude,
        event.longitude,
        event.location_accuracy,
        event.detection_model,
        event.confirmation_status,
        event.communication_path,
        event.created_at,
      ]
    );
  },

  async getAllEvents(): Promise<FallEventEntity[]> {
    const db = await getDatabase();
    return await db.getAllAsync<FallEventEntity>(`SELECT * FROM fall_events ORDER BY occurred_at DESC LIMIT 100;`);
  },

  async findById(id: string): Promise<FallEventEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<FallEventEntity>(`SELECT * FROM fall_events WHERE id = ?;`, [id]);
    return result || null;
  },
};
