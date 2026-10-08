export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'caregiver',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS caregivers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  phone_number TEXT,
  is_primary INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS elderly_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  full_name TEXT NOT NULL,
  age INTEGER,
  medical_notes TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  device_secret TEXT,
  owner_id TEXT,
  elderly_profile_id TEXT,
  firmware_version TEXT DEFAULT '1.0.0',
  battery_level INTEGER DEFAULT 100,
  status TEXT DEFAULT 'online',
  last_seen_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (elderly_profile_id) REFERENCES elderly_profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS device_telemetry (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  battery_level INTEGER,
  wifi_signal INTEGER,
  status_code TEXT DEFAULT 'OK',
  raw_payload TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fall_events (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  event_type TEXT DEFAULT 'FALL_DETECTED',
  occurred_at TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  latitude REAL,
  longitude REAL,
  location_accuracy REAL,
  detection_model TEXT DEFAULT '1d_cnn',
  confirmation_status TEXT DEFAULT 'confirmed',
  communication_path TEXT DEFAULT 'local',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  fall_event_id TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  acknowledged_by_id TEXT,
  acknowledged_at TEXT,
  resolved_by_id TEXT,
  resolved_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (fall_event_id) REFERENCES fall_events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  device_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  timestamp TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id TEXT PRIMARY KEY,
  elderly_profile_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  relationship TEXT,
  is_primary INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (elderly_profile_id) REFERENCES elderly_profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fall_events_device ON fall_events(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
`;
