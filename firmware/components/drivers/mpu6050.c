#include "mpu6050.h"
#include <stdlib.h>

bool mpu6050_init(void) {
    // Hardware I2C initialization (GPIO8 SDA, GPIO9 SCL)
    return true;
}

bool mpu6050_read(mpu6050_data_t *out_data, bool simulation_mode, bool simulate_fall) {
    if (!out_data) return false;

    if (simulation_mode) {
        if (simulate_fall) {
            out_data->accel_x = 3.2f;
            out_data->accel_y = 2.8f;
            out_data->accel_z = 5.1f;
            out_data->gyro_x = 3.5f;
            out_data->gyro_y = 4.1f;
            out_data->gyro_z = 2.2f;
        } else {
            out_data->accel_x = 0.05f;
            out_data->accel_y = 0.02f;
            out_data->accel_z = 1.00f; // 1g gravity
            out_data->gyro_x = 0.01f;
            out_data->gyro_y = 0.01f;
            out_data->gyro_z = 0.01f;
        }
        return true;
    }

    // Hardware register reading logic from I2C address 0x68
    return true;
}
