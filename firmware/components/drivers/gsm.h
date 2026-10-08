#ifndef GSM_DRIVER_H
#define GSM_DRIVER_H

#include <stdbool.h>

bool gsm_init(void);
bool gsm_send_emergency_sms(const char *phone, const char *message, bool simulation_mode);

#endif // GSM_DRIVER_H
