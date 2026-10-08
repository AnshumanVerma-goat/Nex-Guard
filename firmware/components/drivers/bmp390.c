#include "bmp390.h"

bool bmp390_init(void) {
    return true;
}

bool bmp390_read(bmp390_data_t *out_data, bool simulation_mode, bool simulate_fall) {
    if (!out_data) return false;

    if (simulation_mode) {
        out_data->pressure_hpa = 1013.25f;
        out_data->altitude_m = simulate_fall ? 150.0f : 150.5f;
        out_data->altitude_delta = simulate_fall ? -0.5f : 0.0f;
        return true;
    }

    return true;
}
