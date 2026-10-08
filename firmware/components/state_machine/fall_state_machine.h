#ifndef FALL_STATE_MACHINE_H
#define FALL_STATE_MACHINE_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    STATE_NORMAL = 0,
    STATE_POSSIBLE_FALL,
    STATE_USER_CONFIRMATION,
    STATE_CANCELLED,
    STATE_CONFIRMED_FALL,
    STATE_LOCATING,
    STATE_ALERTING,
    STATE_ACKNOWLEDGED,
    STATE_RESOLVED,
    STATE_ERROR
} fall_state_t;

typedef struct {
    fall_state_t current_state;
    float fall_confidence;
    float latitude;
    float longitude;
    int battery_level;
    uint32_t state_entry_timestamp;
    uint32_t confirmation_timer_start;
    bool user_cancelled;
    bool event_acknowledged;
    bool event_resolved;
} fall_state_context_t;

void state_machine_init(fall_state_context_t *ctx);
const char* state_to_string(fall_state_t state);
void state_machine_process(fall_state_context_t *ctx, float motion_g, float cnn_score, bool button_pressed, uint32_t now_ms);

#endif // FALL_STATE_MACHINE_H
