# Nex Guard Hardware Connection & Electrical Specification

This document defines the complete hardware pinout, electrical connections, power topology, and safety bring-up procedures for the **Nex Guard ESP32-S3 Elderly Fall Detection Wearable**.

---

## 1. System Block Diagram

```text
                         +-----------------------+
                         |  Protected 3.7 V Li-Po|
                         +-----------+-----------+
                                     |
                         Charger/protection module (TP4056)
                              OUT+ / OUT-
                                     |
                         SW1 + 1A PTC Fuse
                                     |
                         +-----------v-----------+
                         | 3.3 V Buck-Boost      |
                         | Regulator (>=600 mA)  |
                         +-----------+-----------+
                                     |
                         +3V3_LOGIC / +3V3_LOAD
                                     |
        +----------------------------+-----------------------------+
        |                            |                             |
+-------v------+               +-----v------+                +-----v------+
| MPU6050      |-- I2C SDA/SCL | BMP390     |                | ESP32-S3   |
| Accel / Gyro |---------------| Pressure   |--------------->| Controller |
+--------------+               +------------+                | TinyML/WiFi|
                                                              +--+--+--+---+
                                                                 |  |  |
                            UART1: GPS_TX/RX --------------------+  |  +--> SW2 Cancel Button
                                                                 |  +-----> Q2 -> Active Buzzer
                                                                 +-------> Q1 -> Vibration Motor
```

---

## 2. Hardware Wiring Table

| Component | Component Pin | ESP32-S3 GPIO | Operating Voltage | Interface / Signal | Notes |
|---|---|---|---|---|---|
| **ESP32-S3** | 3V3 Pin | — | 3.3 V | Logic Power Rail | Connect to regulated `+3V3_LOGIC` only |
| **ESP32-S3** | GND Pin | — | 0 V | Common Ground | Unified ground plane |
| **MPU6050** | VCC | 3V3 Rail | 3.3 V | Power | 6-axis IMU |
| **MPU6050** | GND | GND | 0 V | Ground | Common ground |
| **MPU6050** | SDA | **GPIO8** | 3.3 V | I2C SDA | 4.7 kΩ pull-up |
| **MPU6050** | SCL | **GPIO9** | 3.3 V | I2C SCL | 4.7 kΩ pull-up |
| **MPU6050** | AD0 | GND | 0 V | I2C Address | Address `0x68` |
| **BMP390** | VCC | 3V3 Rail | 3.3 V | Power | Pressure & altitude sensor |
| **BMP390** | GND | GND | 0 V | Ground | Common ground |
| **BMP390** | SDA | **GPIO8** | 3.3 V | I2C SDA | Shared I2C bus |
| **BMP390** | SCL | **GPIO9** | 3.3 V | I2C SCL | Shared I2C bus |
| **BMP390** | SDO | GND | 0 V | I2C Address | Address `0x76` |
| **GPS (NEO-6M)** | VCC | 3V3 / VIN | 3.3 V | Power | GNSS location receiver |
| **GPS (NEO-6M)** | GND | GND | 0 V | Ground | Common ground |
| **GPS (NEO-6M)** | TX | **GPIO18** | 3.3 V UART | UART1 RX | GPS output -> ESP32 RX |
| **GPS (NEO-6M)** | RX | **GPIO17** | 3.3 V UART | UART1 TX | ESP32 TX -> GPS input |
| **GSM (SIM800L)** | VCC | VBAT (3.8-4.2V) | 3.8 - 4.2 V | Power (Peak 2A) | Powered directly from Li-Po via MOSFET |
| **GSM (SIM800L)** | GND | GND | 0 V | Ground | Common ground |
| **GSM (SIM800L)** | TX | **GPIO16** | 3.3 V UART | UART2 RX | SIM800L output -> ESP32 RX |
| **GSM (SIM800L)** | RX | **GPIO15** | 3.3 V UART | UART2 TX | Level-shifted ESP32 TX -> SIM800L RX |
| **Vibration Motor** | Gate Drive | **GPIO5** | 3.3 V Logic | Digital Output | Active High -> AO3400A N-MOSFET |
| **Active Buzzer** | Base Drive | **GPIO6** | 3.3 V Logic | Digital Output | Active High -> 2N3904 NPN Transistor |
| **Cancel Button** | Terminal 1 | **GPIO4** | 3.3 V Logic | `INPUT_PULLUP` | Active Low (Press = GND) |
| **Cancel Button** | Terminal 2 | GND | 0 V | Ground | Common ground |
| **Battery ADC** | Divider Node | **GPIO1** | 0 - 2.1 V ADC | ADC1_CH0 | 1:1 100 kΩ resistor voltage divider |

---

## 3. Power Management & Electrical Safety

> [!CAUTION]
> **Voltage Regulation & Li-Po Protection Rules**:
> - Never connect raw battery voltage (`3.0 V - 4.2 V`) directly to ESP32-S3 `3V3` logic pins.
> - Always route Li-Po power through a buck-boost regulator supplying steady `3.3 V` logic power.
> - SIM800L peak current bursts (up to 2 A) must be decoupled with a 470 µF low-ESR capacitor placed directly across the SIM800L power terminals.

---

## 4. Hardware Verification & Bring-Up Order

1. **Power Supply**: Measure regulated `+3V3_LOGIC` output with current-limited bench power supply prior to connecting ESP32-S3.
2. **I2C Bus Scan**: Verify MPU6050 responds at `0x68` and BMP390 at `0x76`.
3. **UART Communications**: Verify 9600 baud NMEA sentences from NEO-6M GPS on GPIO18.
4. **Peripherals Check**: Verify vibration motor gate on GPIO5 and active buzzer transistor base on GPIO6 operate cleanly without GPIO overload.
5. **Physical Cancel Button**: Verify debounced low logic level on GPIO4 when pressed.
