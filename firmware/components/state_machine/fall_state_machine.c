#include "fall_state_machine.h"
#include "../../include/nex_guard_config.h"
#include <stdio.h>

void state_machine_init(fall_state_context_t *ctx) {
    if (!ctx) return;
    ctx->current_state = STATE_NORMAL;
    ctx->fall_confidence = 0.0f;
    ctx->latitude = 22.7196f;   // Default test coordinates
    ctx->longitude = 75.8577f;
    ctx->battery_level = 85;
    ctx->state_entry_timestamp = 0;
    ctx->confirmation_timer_start = 0;
    ctx->user_cancelled = false;
    ctx->event_acknowledged = false;
    ctx->event_resolved = false;
}

const char* state_to_string(fall_state_t state) {
    switch (state) {
        case STATE_NORMAL: return "NORMAL";
        case STATE_POSSIBLE_FALL: return "POSSIBLE_FALL";
        case STATE_USER_CONFIRMATION: return "USER_CONFIRMATION";
        case STATE_CANCELLED: return "CANCELLED";
        case STATE_CONFIRMED_FALL: return "CONFIRMED_FALL";
        case STATE_LOCATING: return "LOCATING";
        case STATE_ALERTING: return "ALERTING";
        case STATE_ACKNOWLEDGED: return "ACKNOWLEDGED";
        case STATE_RESOLVED: return "RESOLVED";
        default: return "ERROR";
    }
}

void state_machine_process(fall_state_context_t *ctx, float motion_g, float cnn_score, bool button_pressed, uint32_t now_ms) {
    if (!ctx) return;

    switch (ctx->current_state) {
        case STATE_NORMAL:
            if (motion_g >= MOTION_GATE_ACCEL_THRESHOLD) {
                ctx->current_state = STATE_POSSIBLE_FALL;
                ctx->state_entry_timestamp = now_ms;
                printf("[FIRMWARE STATE] NORMAL -> POSSIBLE_FALL (motion_g = %.2f)\n", motion_g);
            }
            break;

        case STATE_POSSIBLE_FALL:
            if (cnn_score >= 0.70f) {
                ctx->current_state = STATE_USER_CONFIRMATION;
                ctx->fall_confidence = cnn_score;
                ctx->confirmation_timer_start = now_ms;
                ctx->user_cancelled = false;
                printf("[FIRMWARE STATE] POSSIBLE_FALL -> USER_CONFIRMATION (cnn_score = %.2f)\n", cnn_score);
            } else if ((now_ms - ctx->state_entry_timestamp) > 2000) {
                ctx->current_state = STATE_NORMAL;
                printf("[FIRMWARE STATE] POSSIBLE_FALL -> NORMAL (Low confidence, false alarm)\n");
            }
            break;

        case STATE_USER_CONFIRMATION:
            if (button_pressed) {
                ctx->current_state = STATE_CANCELLED;
                ctx->user_cancelled = true;
                ctx->state_entry_timestamp = now_ms;
                printf("[FIRMWARE STATE] USER_CONFIRMATION -> CANCELLED (Button pressed)\n");
            } else if ((now_ms - ctx->confirmation_timer_start) >= (CONFIRMATION_TIMEOUT_SEC * 1000)) {
                ctx->current_state = STATE_CONFIRMED_FALL;
                printf("[FIRMWARE STATE] USER_CONFIRMATION -> CONFIRMED_FALL (Timeout expired)\n");
            }
            break;

        case STATE_CANCELLED:
            if ((now_ms - ctx->state_entry_timestamp) > 3000) {
                ctx->current_state = STATE_NORMAL;
                printf("[FIRMWARE STATE] CANCELLED -> NORMAL (Resetting after cancellation)\n");
            }
            break;

        case STATE_CONFIRMED_FALL:
            ctx->current_state = STATE_LOCATING;
            printf("[FIRMWARE STATE] CONFIRMED_FALL -> LOCATING\n");
            break;

        case STATE_LOCATING:
            // GNSS coordinates locked
            ctx->current_state = STATE_ALERTING;
            printf("[FIRMWARE STATE] LOCATING -> ALERTING (GNSS fix lat=%.4f, lon=%.4f)\n", ctx->latitude, ctx->longitude);
            break;

        case STATE_ALERTING:
            // Alert published to backend
            if (ctx->event_acknowledged) {
                ctx->current_state = STATE_ACKNOWLEDGED;
                printf("[FIRMWARE STATE] ALERTING -> ACKNOWLEDGED\n");
            }
            break;

        case STATE_ACKNOWLEDGED:
            if (ctx->event_resolved) {
                ctx->current_state = STATE_RESOLVED;
                printf("[FIRMWARE STATE] ACKNOWLEDGED -> RESOLVED\n");
            }
            break;

        case STATE_RESOLVED:
            ctx->current_state = STATE_NORMAL;
            ctx->event_acknowledged = false;
            ctx->event_resolved = false;
            printf("[FIRMWARE STATE] RESOLVED -> NORMAL\n");
            break;

        default:
            ctx->current_state = STATE_NORMAL;
            break;
    }
}
