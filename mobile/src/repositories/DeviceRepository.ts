import { getDatabase } from '../database/database';

export type DeviceEntity = {
  id: string;
  device_id: string;
  device_secret: string | null;
  owner_id: string | null;
  elderly_profile_id: string | null;
  firmware_version: string | null;
  battery_level: number | null;
  status: string;
  last_seen_at: string | null;
  created_at: string;
};

export type DeviceTelemetryEntity = {
  id: string;
  device_id: string;
  battery_level: number | null;
  wifi_signal: number | null;
  status_code: string | null;
  raw_payload: string | null;
  created_at: string;
};

export const DeviceRepository = {
  async registerDevice(device: DeviceEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO devices (id, device_id, device_secret, owner_id, elderly_profile_id, firmware_version, battery_level, status, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        device.id,
        device.device_id,
        device.device_secret,
        device.owner_id,
        device.elderly_profile_id,
        device.firmware_version,
        device.battery_level,
        device.status,
        device.last_seen_at,
        device.created_at,
      ]
    );
  },

  async findByDeviceId(deviceId: string): Promise<DeviceEntity | null> {
    const db = await getDatabase();
    const result = await db.getFirstAsync<DeviceEntity>(`SELECT * FROM devices WHERE device_id = ?;`, [deviceId]);
    return result || null;
  },

  async updateHeartbeat(deviceId: string, batteryLevel: number | null, status: string, lastSeenAt: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE devices SET battery_level = ?, status = ?, last_seen_at = ? WHERE device_id = ?;`,
      [batteryLevel, status, lastSeenAt, deviceId]
    );
  },

  async recordTelemetry(telemetry: DeviceTelemetryEntity): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO device_telemetry (id, device_id, battery_level, wifi_signal, status_code, raw_payload, created_at) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        telemetry.id,
        telemetry.device_id,
        telemetry.battery_level,
        telemetry.wifi_signal,
        telemetry.status_code,
        telemetry.raw_payload,
        telemetry.created_at,
      ]
    );
  },
};
