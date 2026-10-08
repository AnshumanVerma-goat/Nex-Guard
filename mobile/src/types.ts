export type EventPayload = {
  id: string;
  device_id: string;
  event_type: 'FALL_DETECTED' | 'POTENTIAL_FALL' | 'CANCELLED';
  occurred_at: string;
  confidence: number;
  latitude: number | null;
  longitude: number | null;
  location_accuracy?: number | null;
  battery_level: number | null;
  alert_id?: string;
  confirmation_status?: string;
  communication_path?: string;
};

export type AlertItem = {
  id: string;
  fall_event_id: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_by_id: string | null;
  acknowledged_at: string | null;
  resolved_by_id: string | null;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  fall_event: EventPayload | null;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: string;
};

export type ElderlyProfile = {
  id: string;
  full_name: string;
  age?: number | null;
  medical_notes?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  DeviceSetup: undefined;
  Dashboard: undefined;
  Emergency: undefined;
  History: undefined;
  DeviceHealth: undefined;
  Profile: undefined;
};
