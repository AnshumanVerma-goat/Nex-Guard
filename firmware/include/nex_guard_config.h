#ifndef NEX_GUARD_CONFIG_H
#define NEX_GUARD_CONFIG_H

#include <stdint.h>
#include <stdbool.h>

// Build Mode Configuration: MODE_SIMULATION (1) or MODE_HARDWARE (0)
#ifndef MODE_SIMULATION
#define MODE_SIMULATION 1
#endif

// Wi-Fi and Backend Network Credentials
#define WIFI_SSID "NexGuard_Network"
#define WIFI_PASS "nexguard123"
#define BACKEND_HOST "localhost"
#define BACKEND_PORT 8000
#define BACKEND_EVENT_URL "http://localhost:8000/api/v1/events/fall"
#define BACKEND_HEARTBEAT_URL "http://localhost:8000/api/v1/devices/nex-guard-001/heartbeat"

// Device Identity
#define DEVICE_ID "nex-guard-001"
#define FIRMWARE_VERSION "1.0.0"

// Hardware Pinout Definitions (ESP32-S3)
#define PIN_I2C_SDA 8
#define PIN_I2C_SCL 9
#define PIN_GPS_TX 18
#define PIN_GPS_RX 17
#define PIN_VIBRATION_MOTOR 5
#define PIN_BUZZER 6
#define PIN_CANCEL_BUTTON 4
#define PIN_BATTERY_ADC 1

// Timing and Thresholds
#define CONFIRMATION_TIMEOUT_SEC 15
#define MOTION_GATE_ACCEL_THRESHOLD 2.5f  // g
#define SENSOR_SAMPLE_INTERVAL_MS 20      // 50 Hz

#endif // NEX_GUARD_CONFIG_H
