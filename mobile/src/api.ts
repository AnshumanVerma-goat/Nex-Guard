import { AlertItem, ElderlyProfile, EventPayload, UserProfile } from './types';

export const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const socketUrl = process.env.EXPO_PUBLIC_WS_URL ?? `${apiUrl.replace(/^http/, 'ws')}/api/v1/ws`;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) message = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
    } catch {}
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => request<{ status: string; service: string }>('/health'),

  // Auth
  register: (data: { email: string; password: string; full_name: string; phone_number?: string }) =>
    request<{ access_token: string; user_id: string; email: string; full_name: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'caregiver' }),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user_id: string; email: string; full_name: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Elderly Profile
  createElderlyProfile: (data: { full_name: string; age?: number; medical_notes?: string; emergency_contact_phone?: string }) =>
    request<ElderlyProfile>('/api/v1/elderly', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getElderlyProfiles: () => request<ElderlyProfile[]>('/api/v1/elderly'),

  // Devices
  registerDevice: (deviceId: string, firmwareVersion = '1.0.0') =>
    request<{ id: string; device_id: string; status: string }>('/api/v1/devices/register', {
      method: 'POST',
      body: JSON.stringify({ device_id: deviceId, firmware_version: firmwareVersion }),
    }),

  heartbeat: (deviceId: string, batteryLevel: number) =>
    request<{ status: string; device_id: string }>(`/api/v1/devices/${deviceId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ battery_level: batteryLevel, status: 'online' }),
    }),

  // Events & Alerts
  events: () => request<EventPayload[]>('/api/v1/events'),

  sendFallEvent: (payload: { device_id: string; confidence: number; latitude?: number; longitude?: number; battery_level?: number }) =>
    request<EventPayload>('/api/v1/events/fall', {
      method: 'POST',
      body: JSON.stringify({ ...payload, event_type: 'FALL_DETECTED' }),
    }),

  getAlerts: () => request<AlertItem[]>('/api/v1/alerts'),

  acknowledgeAlert: (alertId: string, notes = 'Caregiver acknowledged in app') =>
    request<AlertItem>(`/api/v1/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  resolveAlert: (alertId: string, notes = 'Issue resolved by caregiver') =>
    request<AlertItem>(`/api/v1/alerts/${alertId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),

  socketUrl,
};
