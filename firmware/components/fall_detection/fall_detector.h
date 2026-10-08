#ifndef FALL_DETECTOR_H
#define FALL_DETECTOR_H

#include <stdbool.h>
#include <stdint.h>

#define SENSOR_WINDOW_SAMPLES 100
#define SENSOR_WINDOW_CHANNELS 7

typedef struct {
    float data[SENSOR_WINDOW_SAMPLES][SENSOR_WINDOW_CHANNELS];
    int current_sample_count;
} sensor_window_buffer_t;

void fall_detector_init(sensor_window_buffer_t *buf);
void fall_detector_push_sample(
    sensor_window_buffer_t *buf,
    float ax, float ay, float az,
    float gx, float gy, float gz,
    float alt_delta
);
bool fall_detector_check_motion_gate(const sensor_window_buffer_t *buf, float *out_max_g);
float fall_detector_run_inference(const sensor_window_buffer_t *buf);

#endif // FALL_DETECTOR_H
