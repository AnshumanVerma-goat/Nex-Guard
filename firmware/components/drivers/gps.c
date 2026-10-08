#include "gps.h"

bool gps_init(void) {
    // UART1 RX=GPIO18, TX=GPIO17 initialization @ 9600 baud
    return true;
}

bool gps_read(gps_data_t *out_data, bool simulation_mode) {
    if (!out_data) return false;

    if (simulation_mode) {
        out_data->latitude = 22.7196f;
        out_data->longitude = 75.8577f;
        out_data->accuracy_m = 2.5f;
        out_data->has_fix = true;
        return true;
    }

    return true;
}
