/**
 * Nex Guard Hardware & Infrastructure Abstraction Layer
 * Isolates software application logic from hardware peripherals and transport layers.
 */

// 1. SENSOR SOURCE ABSTRACTION
export type SensorScenario =
  | 'NORMAL_WALKING'
  | 'SITTING'
  | 'STANDING'
  | 'LYING_DOWN'
  | 'WALK_SIT'
  | 'WALK_FALL'
  | 'SUDDEN_IMPACT_FALL'
  | 'FALSE_ALARM_CANCEL'
  | 'FALL_NO_RESPONSE_TIMEOUT'
  | 'FALL_USER_CONFIRM';

export type SimulatedSensorReading = {
  timestamp: string;
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
  pressure: number;
  isSimulated: true;
  label: string;
};

export interface SensorSource {
  name: string;
  type: 'SIMULATION' | 'PHONE' | 'ESP32_HARDWARE';
  isAvailable(): Promise<boolean>;
  getScenarioData?(scenario: SensorScenario): SimulatedSensorReading[];
}

export class SimulationSensorSource implements SensorSource {
  name = 'Local Simulation Engine';
  type = 'SIMULATION' as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  getScenarioData(scenario: SensorScenario): SimulatedSensorReading[] {
    const now = new Date().toISOString();
    switch (scenario) {
      case 'NORMAL_WALKING':
        return Array.from({ length: 10 }, (_, i) => ({
          timestamp: now,
          accelX: 0.1 + Math.sin(i) * 0.2,
          accelY: 0.98 + Math.cos(i) * 0.15,
          accelZ: 0.05,
          gyroX: 0.02,
          gyroY: 0.01,
          gyroZ: 0.01,
          pressure: 1013.25,
          isSimulated: true,
          label: 'NORMAL WALKING (SIMULATED)',
        }));
      case 'SUDDEN_IMPACT_FALL':
      case 'WALK_FALL':
        return [
          { timestamp: now, accelX: 0.1, accelY: 0.98, accelZ: 0.0, gyroX: 0.0, gyroY: 0.0, gyroZ: 0.0, pressure: 1013.25, isSimulated: true, label: 'WALKING' },
          { timestamp: now, accelX: 0.4, accelY: 0.5, accelZ: 0.2, gyroX: 0.5, gyroY: 0.8, gyroZ: 0.3, pressure: 1013.20, isSimulated: true, label: 'FREEFALL' },
          { timestamp: now, accelX: 3.8, accelY: 2.9, accelZ: 1.5, gyroX: 2.1, gyroY: 3.4, gyroZ: 1.9, pressure: 1013.15, isSimulated: true, label: 'IMPACT (3.8g)' },
          { timestamp: now, accelX: 0.02, accelY: 0.05, accelZ: 0.98, gyroX: 0.0, gyroY: 0.0, gyroZ: 0.0, pressure: 1013.15, isSimulated: true, label: 'REST (NO MOTION)' },
        ];
      default:
        return [
          { timestamp: now, accelX: 0.0, accelY: 1.0, accelZ: 0.0, gyroX: 0.0, gyroY: 0.0, gyroZ: 0.0, pressure: 1013.25, isSimulated: true, label: 'STATIC ACTIVITY' },
        ];
    }
  }
}

export class PhoneSensorSource implements SensorSource {
  name = 'Phone Accelerometer (Local)';
  type = 'PHONE' as const;

  async isAvailable(): Promise<boolean> {
    return false; // Standalone phone sensor fallback
  }
}

export class ESP32SensorSource implements SensorSource {
  name = 'ESP32-S3 Wearable Hardware';
  type = 'ESP32_HARDWARE' as const;

  async isAvailable(): Promise<boolean> {
    return false; // Hardware integration reserved for Phase 7
  }
}

// 2. LOCATION SOURCE ABSTRACTION
export interface LocationSource {
  name: string;
  type: 'PHONE_GPS' | 'ESP32_GPS';
  getLocation(): Promise<{ latitude: number | null; longitude: number | null; accuracy: number | null; sourceName: string }>;
}

export class PhoneLocationSource implements LocationSource {
  name = 'Phone GPS (Expo Location)';
  type = 'PHONE_GPS' as const;

  async getLocation() {
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      sourceName: 'PHONE_GPS',
    };
  }
}

export class ESP32GPSSource implements LocationSource {
  name = 'ESP32 NEO-6M GNSS';
  type = 'ESP32_GPS' as const;

  async getLocation() {
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      sourceName: 'ESP32_NEO6M_HARDWARE_UNCONNECTED',
    };
  }
}

// 3. ALERT TRANSPORT ABSTRACTION
export interface AlertTransport {
  name: string;
  sendAlert(title: string, message: string): Promise<boolean>;
}

export class LocalNotificationTransport implements AlertTransport {
  name = 'Local Android Notifications';
  async sendAlert(_title: string, _message: string): Promise<boolean> {
    return true;
  }
}

export class RemotePushTransport implements AlertTransport {
  name = 'Remote FastAPI / Push Sync';
  async sendAlert(): Promise<boolean> {
    return false; // Optional backend transport
  }
}

export class GSMTransport implements AlertTransport {
  name = 'SIM800L GSM SMS';
  async sendAlert(): Promise<boolean> {
    return false; // Hardware GSM transport
  }
}

// 4. ACTUATOR ABSTRACTION
export interface Actuator {
  name: string;
  triggerBuzzer(durationMs: number): Promise<void>;
  triggerVibration(durationMs: number): Promise<void>;
}

export class SimulationActuator implements Actuator {
  name = 'Local Simulation Actuator';
  async triggerBuzzer(durationMs: number): Promise<void> {
    console.log(`[SIMULATION ACTUATOR] Buzzer beeped for ${durationMs}ms`);
  }
  async triggerVibration(durationMs: number): Promise<void> {
    console.log(`[SIMULATION ACTUATOR] Vibration pulse for ${durationMs}ms`);
  }
}

export class ESP32Actuator implements Actuator {
  name = 'ESP32 Hardware Actuator (GPIO5/GPIO6)';
  async triggerBuzzer(): Promise<void> {}
  async triggerVibration(): Promise<void> {}
}
