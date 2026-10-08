#ifndef HARDWARE_DIAGNOSTICS_H
#define HARDWARE_DIAGNOSTICS_H

#include <stdbool.h>

typedef enum {
    DIAG_TEST_ALL = 0,
    DIAG_TEST_MPU6050,
    DIAG_TEST_BMP390,
    DIAG_TEST_GPS,
    DIAG_TEST_GSM,
    DIAG_TEST_MOTOR,
    DIAG_TEST_BUZZER,
    DIAG_TEST_BUTTON,
    DIAG_TEST_BATTERY
} hardware_diag_test_t;

bool run_hardware_diagnostic_test(hardware_diag_test_t test_id, bool physical_mode);

#endif // HARDWARE_DIAGNOSTICS_H
