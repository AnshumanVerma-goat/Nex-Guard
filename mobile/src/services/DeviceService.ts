import { DeviceEntity, DeviceRepository } from '../repositories/DeviceRepository';

export const DeviceService = {
  async registerDevice(deviceId: string, firmwareVersion = '1.0.0'): Promise<DeviceEntity> {
    const existing = await DeviceRepository.findByDeviceId(deviceId);
    const now = new Date().toISOString();

    if (existing) {
      await DeviceRepository.updateHeartbeat(deviceId, existing.battery_level, 'online', now);
      return { ...existing, last_seen_at: now };
    }

    const device: DeviceEntity = {
      id: `dev_${Date.now()}`,
      device_id: deviceId,
      device_secret: null,
      owner_id: null,
      elderly_profile_id: null,
      firmware_version: firmwareVersion,
      battery_level: 100,
      status: 'online',
      last_seen_at: now,
      created_at: now,
    };

    await DeviceRepository.registerDevice(device);
    return device;
  },

  async getDevice(deviceId: string): Promise<DeviceEntity | null> {
    return await DeviceRepository.findByDeviceId(deviceId);
  },

  async updateDeviceStatus(deviceId: string, status: string, batteryLevel: number | null = null): Promise<void> {
    const now = new Date().toISOString();
    await DeviceRepository.updateHeartbeat(deviceId, batteryLevel, status, now);
  },

  async heartbeat(deviceId: string, batteryLevel: number): Promise<void> {
    const now = new Date().toISOString();
    await DeviceRepository.updateHeartbeat(deviceId, batteryLevel, 'online', now);
  },
};

