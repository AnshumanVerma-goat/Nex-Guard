/**
 * SensorSource Abstraction
 * Explicitly demarks sensor data sources (Local Simulation vs Phone Sensors vs ESP32 Wearable Hardware)
 * to ensure honesty about Edge AI and physical sensor telemetry.
 */
export interface SensorSource {
  name: string;
  type: 'SIMULATION' | 'PHONE' | 'ESP32_HARDWARE';
  isAvailable(): Promise<boolean>;
}

export class SimulationSensorSource implements SensorSource {
  name = 'Local Simulation Engine';
  type = 'SIMULATION' as const;

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

export class PhoneSensorSource implements SensorSource {
  name = 'Phone Accelerometer (Local)';
  type = 'PHONE' as const;

  async isAvailable(): Promise<boolean> {
    return false; // Hardware integration reserved for Phase 7
  }
}

export class ESP32SensorSource implements SensorSource {
  name = 'ESP32-S3 Wearable Hardware';
  type = 'ESP32_HARDWARE' as const;

  async isAvailable(): Promise<boolean> {
    return false; // Wearable BLE/UART hardware integration reserved for Phase 7
  }
}
