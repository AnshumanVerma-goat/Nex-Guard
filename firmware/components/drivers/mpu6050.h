#ifndef MPU6050_DRIVER_H
#define MPU6050_DRIVER_H

#include <stdbool.h>

typedef struct {
    float accel_x;
    float accel_y;
    float accel_z;
    float gyro_x;
    float gyro_y;
    float gyro_z;
} mpu6050_data_t;

bool mpu6050_init(void);
bool mpu6050_read(mpu6050_data_t *out_data, bool simulation_mode, bool simulate_fall);

#endif // MPU6050_DRIVER_H
