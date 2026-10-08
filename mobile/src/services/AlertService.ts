import { AlertRepository, AlertWithEvent } from '../repositories/AlertRepository';
import { FallEventEntity, FallEventRepository } from '../repositories/FallEventRepository';
import { LocationService } from './LocationService';

export const AlertService = {
  async createFallAlert(data: {
    deviceId: string;
    confidence: number;
    latitude?: number | null;
    longitude?: number | null;
    batteryLevel?: number | null;
    eventType?: 'FALL_DETECTED' | 'POTENTIAL_FALL' | 'CANCELLED';
  }): Promise<AlertWithEvent> {
    const now = new Date().toISOString();
    const eventId = `evt_${Date.now()}`;
    const alertId = `alt_${Date.now()}`;

    // Get location if not provided
    let lat = data.latitude ?? null;
    let lon = data.longitude ?? null;
    if (lat === null || lon === null) {
      const loc = await LocationService.getCurrentLocation(data.deviceId);
      lat = loc.latitude;
      lon = loc.longitude;
    }

    const fallEvent: FallEventEntity = {
      id: eventId,
      device_id: data.deviceId,
      event_type: data.eventType || 'FALL_DETECTED',
      occurred_at: now,
      confidence: data.confidence,
      latitude: lat,
      longitude: lon,
      location_accuracy: 2.5,
      detection_model: '1d_cnn',
      confirmation_status: 'confirmed',
      communication_path: 'local',
      created_at: now,
    };

    await FallEventRepository.createFallEvent(fallEvent);

    const alert = {
      id: alertId,
      fall_event_id: eventId,
      status: 'ACTIVE' as const,
      acknowledged_by_id: null,
      acknowledged_at: null,
      resolved_by_id: null,
      resolved_at: null,
      notes: null,
      created_at: now,
    };

    await AlertRepository.createAlert(alert);

    return {
      ...alert,
      fall_event: fallEvent,
    };
  },

  async acknowledgeAlert(alertId: string, notes = 'Acknowledged in local mobile console'): Promise<AlertWithEvent | null> {
    const now = new Date().toISOString();
    await AlertRepository.updateStatus(alertId, 'ACKNOWLEDGED', null, now, notes);
    return await AlertRepository.findById(alertId);
  },

  async resolveAlert(alertId: string, notes = 'Resolved in local mobile console'): Promise<AlertWithEvent | null> {
    const now = new Date().toISOString();
    await AlertRepository.updateStatus(alertId, 'RESOLVED', null, now, notes);
    return await AlertRepository.findById(alertId);
  },

  async getAlertHistory(): Promise<AlertWithEvent[]> {
    return await AlertRepository.getAllAlerts();
  },
};
