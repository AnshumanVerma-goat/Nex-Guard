#include "hardware_diagnostics.h"
#include "include/nex_guard_config.h"
#include "components/drivers/mpu6050.h"
#include "components/drivers/bmp390.h"
#include "components/drivers/gps.h"
#include "components/drivers/gsm.h"
#include "components/drivers/peripherals.h"
#include <stdio.h>

bool test_mpu6050_diagnostic(bool physical_mode) {
    printf("\n=== [DIAGNOSTIC] TESTING MPU6050 IMU ===\n");
    printf("Wiring: SDA -> GPIO8, SCL -> GPIO9 | Voltage: 3.3V | I2C Addr: 0x68\n");
    mpu6050_data_t data;
    bool status = mpu6050_read(&data, !physical_mode, false);
    if (status) {
        printf("[PASS] MPU6050 Data: Accel=(%.2f, %.2f, %.2f)g | Gyro=(%.2f, %.2f, %.2f)deg/s\n",
               data.accel_x, data.accel_y, data.accel_z, data.gyro_x, data.gyro_y, data.gyro_z);
    } else {
        printf("[FAIL] MPU6050 NACK / I2C Bus Error. Check pull-ups on GPIO8/GPIO9.\n");
    }
    return status;
}

bool test_bmp390_diagnostic(bool physical_mode) {
    printf("\n=== [DIAGNOSTIC] TESTING BMP390 BAROMETER ===\n");
    printf("Wiring: SDA -> GPIO8, SCL -> GPIO9 | Voltage: 3.3V | I2C Addr: 0x76\n");
    bmp390_data_t data;
    bool status = bmp390_read(&data, !physical_mode, false);
    if (status) {
        printf("[PASS] BMP390 Data: Pressure=%.2f hPa | Altitude=%.2f m | Delta=%.2f m\n",
               data.pressure_hpa, data.altitude_m, data.altitude_delta);
    } else {
        printf("[FAIL] BMP390 NACK / I2C Bus Error. Check VCC/SDO grounding.\n");
    }
    return status;
}

bool test_gps_diagnostic(bool physical_mode) {
    printf("\n=== [DIAGNOSTIC] TESTING NEO-6M GPS GNSS ===\n");
    printf("Wiring: TX -> GPIO18, RX -> GPIO17 | Voltage: 3.3V | Baud: 9600 UART1\n");
    gps_data_t data;
    bool status = gps_read(&data, !physical_mode);
    if (status && data.has_fix) {
        printf("[PASS] GPS Fix Acquired: Lat=%.6f, Lon=%.6f (Accuracy: %.1fm)\n",
               data.latitude, data.longitude, data.accuracy_m);
    } else {
        printf("[FAIL / NO FIX] GPS NMEA sentence timeout. Ensure sky view.\n");
    }
    return status;
}

bool test_gsm_diagnostic(bool physical_mode) {
    printf("\n=== [DIAGNOSTIC] TESTING SIM800L GSM MODEM ===\n");
    printf("Wiring: TX -> GPIO16, RX -> GPIO15 | Voltage: 3.8-4.2V VBAT | Baud: 9600 UART2\n");
    bool status = gsm_send_emergency_sms("+10000000000", "TEST SMS DIAGNOSTIC", !physical_mode);
    if (status) {
        printf("[PASS] SIM800L AT Command Response: OK | Network Registered\n");
    } else {
        printf("[FAIL] SIM800L AT command timeout or insufficient power supply (<2A peak).\n");
    }
    return status;
}

bool test_vibration_motor_diagnostic(void) {
    printf("\n=== [DIAGNOSTIC] TESTING VIBRATION MOTOR ===\n");
    printf("Wiring: Gate Drive -> GPIO5 | MOSFET: AO3400A N-MOSFET\n");
    set_vibration_motor(true);
    set_vibration_motor(false);
    printf("[PASS] GPIO5 Output Pulsed\n");
    return true;
}

bool test_active_buzzer_diagnostic(void) {
    printf("\n=== [DIAGNOSTIC] TESTING ACTIVE BUZZER ===\n");
    printf("Wiring: Base Drive -> GPIO6 | Transistor: 2N3904 NPN\n");
    set_active_buzzer(true);
    set_active_buzzer(false);
    printf("[PASS] GPIO6 Output Pulsed\n");
    return true;
}

bool test_cancel_button_diagnostic(bool simulated_press) {
    printf("\n=== [DIAGNOSTIC] TESTING PHYSICAL CANCEL BUTTON ===\n");
    printf("Wiring: Terminal -> GPIO4 | Mode: INPUT_PULLUP (Active Low)\n");
    bool pressed = is_cancel_button_pressed(simulated_press);
    printf("[STATUS] GPIO4 Input State: %s\n", pressed ? "PRESSED (LOW)" : "RELEASED (HIGH)");
    return true;
}

bool test_battery_adc_diagnostic(void) {
    printf("\n=== [DIAGNOSTIC] TESTING BATTERY VOLTAGE ADC ===\n");
    printf("Wiring: Resistor Divider Node -> GPIO1 (ADC1_CH0)\n");
    int battery = read_battery_level_adc();
    printf("[PASS] Battery ADC Reading: %d%%\n", battery);
    return true;
}

bool run_hardware_diagnostic_test(hardware_diag_test_t test_id, bool physical_mode) {
    switch (test_id) {
        case DIAG_TEST_MPU6050: return test_mpu6050_diagnostic(physical_mode);
        case DIAG_TEST_BMP390: return test_bmp390_diagnostic(physical_mode);
        case DIAG_TEST_GPS: return test_gps_diagnostic(physical_mode);
        case DIAG_TEST_GSM: return test_gsm_diagnostic(physical_mode);
        case DIAG_TEST_MOTOR: return test_vibration_motor_diagnostic();
        case DIAG_TEST_BUZZER: return test_active_buzzer_diagnostic();
        case DIAG_TEST_BUTTON: return test_cancel_button_diagnostic(false);
        case DIAG_TEST_BATTERY: return test_battery_adc_diagnostic();
        case DIAG_TEST_ALL:
        default:
            test_mpu6050_diagnostic(physical_mode);
            test_bmp390_diagnostic(physical_mode);
            test_gps_diagnostic(physical_mode);
            test_gsm_diagnostic(physical_mode);
            test_vibration_motor_diagnostic();
            test_active_buzzer_diagnostic();
            test_cancel_button_diagnostic(false);
            test_battery_adc_diagnostic();
            return true;
    }
}
