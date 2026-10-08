#ifndef PERIPHERALS_DRIVER_H
#define PERIPHERALS_DRIVER_H

#include <stdbool.h>

void peripherals_init(void);
void set_vibration_motor(bool active);
void set_active_buzzer(bool active);
bool is_cancel_button_pressed(bool simulation_press);
int read_battery_level_adc(void);

#endif // PERIPHERALS_DRIVER_H
