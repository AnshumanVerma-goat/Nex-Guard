import * as Location from 'expo-location';
import { LocationRepository } from '../repositories/LocationRepository';

export const LocationService = {
  async getCurrentLocation(deviceId = 'nex-guard-001'): Promise<{ latitude: number | null; longitude: number | null; accuracy: number | null }> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('[LOCATION SERVICE] Location permission denied by user.');
        return { latitude: null, longitude: null, accuracy: null };
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const now = new Date().toISOString();

      await LocationRepository.recordLocation({
        id: `loc_${Date.now()}`,
        device_id: deviceId,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy || null,
        timestamp: now,
        created_at: now,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy || null,
      };
    } catch (error) {
      console.warn('[LOCATION SERVICE ERROR] Location acquisition failed:', error);
      return { latitude: null, longitude: null, accuracy: null };
    }
  },
};
