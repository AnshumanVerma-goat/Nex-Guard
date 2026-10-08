#ifndef GPS_DRIVER_H
#define GPS_DRIVER_H

#include <stdbool.h>

typedef struct {
    float latitude;
    float longitude;
    float accuracy_m;
    bool has_fix;
} gps_data_t;

bool gps_init(void);
bool gps_read(gps_data_t *out_data, bool simulation_mode);

#endif // GPS_DRIVER_H
