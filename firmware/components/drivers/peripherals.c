#include "peripherals.h"
#include <stdio.h>

static bool g_motor_state = false;
static bool g_buzzer_state = false;

void peripherals_init(void) {
    // GPIO4 INPUT_PULLUP, GPIO5 OUTPUT, GPIO6 OUTPUT, GPIO1 ADC1_CH0
}

void set_vibration_motor(bool active) {
    g_motor_state = active;
    printf("[PERIPHERALS] Vibration Motor: %s\n", active ? "ON (HIGH)" : "OFF (LOW)");
}

void set_active_buzzer(bool active) {
    g_buzzer_state = active;
    printf("[PERIPHERALS] Active Buzzer: %s\n", active ? "BEEPING (HIGH)" : "SILENT (LOW)");
}

bool is_cancel_button_pressed(bool simulation_press) {
    return simulation_press;
}

int read_battery_level_adc(void) {
    // 3.7V Li-Po voltage divider computation on GPIO1
    return 84; // 84% battery
}
