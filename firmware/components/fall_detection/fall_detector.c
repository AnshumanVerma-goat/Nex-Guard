#include "fall_detector.h"
#include "../../include/fall_detection_model.h"
#include "../../include/nex_guard_config.h"
#include <math.h>
#include <string.h>

void fall_detector_init(sensor_window_buffer_t *buf) {
    if (!buf) return;
    memset(buf->data, 0, sizeof(buf->data));
    buf->current_sample_count = 0;
}

void fall_detector_push_sample(
    sensor_window_buffer_t *buf,
    float ax, float ay, float az,
    float gx, float gy, float gz,
    float alt_delta
) {
    if (!buf) return;

    if (buf->current_sample_count < SENSOR_WINDOW_SAMPLES) {
        buf->data[buf->current_sample_count][0] = ax;
        buf->data[buf->current_sample_count][1] = ay;
        buf->data[buf->current_sample_count][2] = az;
        buf->data[buf->current_sample_count][3] = gx;
        buf->data[buf->current_sample_count][4] = gy;
        buf->data[buf->current_sample_count][5] = gz;
        buf->data[buf->current_sample_count][6] = alt_delta;
        buf->current_sample_count++;
    } else {
        // Shift window left by 1 (sliding window)
        memmove(&buf->data[0], &buf->data[1], sizeof(float) * (SENSOR_WINDOW_SAMPLES - 1) * SENSOR_WINDOW_CHANNELS);
        buf->data[SENSOR_WINDOW_SAMPLES - 1][0] = ax;
        buf->data[SENSOR_WINDOW_SAMPLES - 1][1] = ay;
        buf->data[SENSOR_WINDOW_SAMPLES - 1][2] = az;
        buf->data[SENSOR_WINDOW_SAMPLES - 1][3] = gx;
        buf->data[SENSOR_WINDOW_SAMPLES - 1][4] = gy;
        buf->data[SENSOR_WINDOW_SAMPLES - 1][5] = gz;
        buf->data[SENSOR_WINDOW_SAMPLES - 1][6] = alt_delta;
    }
}

bool fall_detector_check_motion_gate(const sensor_window_buffer_t *buf, float *out_max_g) {
    if (!buf || buf->current_sample_count < SENSOR_WINDOW_SAMPLES) {
        if (out_max_g) *out_max_g = 0.0f;
        return false;
    }

    float max_g = 0.0f;
    for (int i = 0; i < SENSOR_WINDOW_SAMPLES; i++) {
        float ax = buf->data[i][0];
        float ay = buf->data[i][1];
        float az = buf->data[i][2];
        float g_mag = sqrtf(ax * ax + ay * ay + az * az);
        if (g_mag > max_g) max_g = g_mag;
    }

    if (out_max_g) *out_max_g = max_g;
    return (max_g >= MOTION_GATE_ACCEL_THRESHOLD);
}

float fall_detector_run_inference(const sensor_window_buffer_t *buf) {
    if (!buf || buf->current_sample_count < SENSOR_WINDOW_SAMPLES) {
        return 0.0f;
    }
    return run_1d_cnn_inference(buf->data);
}
