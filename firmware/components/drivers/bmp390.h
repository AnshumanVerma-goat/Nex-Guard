#ifndef BMP390_DRIVER_H
#define BMP390_DRIVER_H

#include <stdbool.h>

typedef struct {
    float pressure_hpa;
    float altitude_m;
    float altitude_delta;
} bmp390_data_t;

bool bmp390_init(void);
bool bmp390_read(bmp390_data_t *out_data, bool simulation_mode, bool simulate_fall);

#endif // BMP390_DRIVER_H
