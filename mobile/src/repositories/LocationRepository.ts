import { getDatabase } from '../database/database';

export type LocationEntity = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  created_at: string;
};

export const LocationRepository = {
  async recordLocation(loc: LocationEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO locations (id, device_id, latitude, longitude, accuracy, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [loc.id, loc.device_id, loc.latitude, loc.longitude, loc.accuracy, loc.timestamp, loc.created_at]
    );
  },

  async getLastKnownLocation(deviceId: string): Promise<LocationEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<LocationEntity>(
      `SELECT * FROM locations WHERE device_id = ? ORDER BY timestamp DESC LIMIT 1;`,
      [deviceId]
    );
    return result || null;
  },
};
