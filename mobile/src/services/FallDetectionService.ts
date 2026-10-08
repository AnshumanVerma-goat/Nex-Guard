import { AlertService } from './AlertService';
import { NotificationService } from './NotificationService';
import { LocationService } from './LocationService';
import { AlertWithEvent } from '../repositories/AlertRepository';
import { SensorScenario, SimulationSensorSource, SimulatedSensorReading } from './abstractions/HardwareAbstractions';

export const FALL_CONFIRMATION_TIMEOUT_MS = 20000; // 20 seconds default

export type FallStateMachineState =
  | 'NORMAL'
  | 'POSSIBLE_FALL'
  | 'USER_CONFIRMATION'
  | 'CANCELLED'
  | 'CONFIRMED_FALL'
  | 'GPS_LOCATION'
  | 'LOCAL_ALERT'
  | 'CAREGIVER_NOTIFICATION'
  | 'ACKNOWLEDGED'
  | 'RESOLVED';

let activeTimer: ReturnType<typeof setInterval> | null = null;
let activeCountdown = 0;
let currentState: FallStateMachineState = 'NORMAL';
let currentSessionId: string | null = null;
let currentDeviceId = 'nex-guard-001';
let currentConfidence = 0.94;
let lastReadings: SimulatedSensorReading[] = [];
let stateChangeCallback: ((state: FallStateMachineState, countdown: number) => void) | null = null;

export const FallDetectionService = {
  getSensorSource() {
    return new SimulationSensorSource();
  },

  getCurrentState(): FallStateMachineState {
    return currentState;
  },

  getCountdown(): number {
    return activeCountdown;
  },

  getLastReadings(): SimulatedSensorReading[] {
    return lastReadings;
  },

  /**
   * Process a sensor scenario through the unified pipeline:
   * SensorSource -> Sensor Window -> Preprocessing -> Fall Detection Engine Threshold
   */
  async triggerScenario(
    scenario: SensorScenario,
    deviceId = 'nex-guard-001',
    onUpdate?: (state: FallStateMachineState, countdown: number) => void
  ): Promise<{ isFall: boolean; peakG: number; sessionId: string; label: string }> {
    const source = this.getSensorSource();
    const readings = source.getScenarioData(scenario);
    lastReadings = readings;

    // Preprocessing & Feature Extraction: Calculate Peak Vector Acceleration
    let peakG = 0;
    for (const r of readings) {
      const mag = Math.sqrt(r.accelX ** 2 + r.accelY ** 2 + r.accelZ ** 2);
      if (mag > peakG) peakG = mag;
    }
    const formattedPeakG = Number(peakG.toFixed(2));

    // Fall Engine Gate Threshold (2.5g)
    const isImpactFall = formattedPeakG >= 2.5;

    if (!isImpactFall) {
      this.updateState('NORMAL', 0);
      return {
        isFall: false,
        peakG: formattedPeakG,
        sessionId: `norm_${Date.now()}`,
        label: `Normal activity (${scenario}): Peak accel ${formattedPeakG}g < 2.5g threshold`,
      };
    }

    // Trigger full confirmation pipeline for impact fall
    const confidence = Math.min(0.99, Math.max(0.75, 0.70 + (formattedPeakG - 2.5) * 0.15));
    const sessionId = await this.triggerSimulatedFall(deviceId, confidence, onUpdate);

    return {
      isFall: true,
      peakG: formattedPeakG,
      sessionId,
      label: `Impact Fall (${scenario}): Peak accel ${formattedPeakG}g >= 2.5g threshold`,
    };
  },

  /**
   * Start a local fall simulation workflow.
   */
  async triggerSimulatedFall(
    deviceId = 'nex-guard-001',
    confidence = 0.94,
    onUpdate?: (state: FallStateMachineState, countdown: number) => void
  ): Promise<string> {
    if (currentState === 'USER_CONFIRMATION' || currentState === 'POSSIBLE_FALL') {
      console.warn('[FALL ENGINE] Fall event already in progress.');
      return currentSessionId || 'active';
    }

    this.clearTimer();

    currentDeviceId = deviceId;
    currentConfidence = confidence;
    currentSessionId = `sim_${Date.now()}`;
    stateChangeCallback = onUpdate || null;

    this.updateState('POSSIBLE_FALL', 20);

    await NotificationService.sendEmergencyNotification(
      'Nex Guard — LOCAL SIMULATION',
      'Possible fall detected. Confirmation window active (20s).'
    );

    this.updateState('USER_CONFIRMATION', 20);
    activeCountdown = Math.floor(FALL_CONFIRMATION_TIMEOUT_MS / 1000);

    activeTimer = setInterval(() => {
      activeCountdown -= 1;
      if (activeCountdown <= 0) {
        this.clearTimer();
        void this.confirmFall();
      } else {
        this.updateState('USER_CONFIRMATION', activeCountdown);
      }
    }, 1000);

    return currentSessionId;
  },

  /**
   * Cancel fall during confirmation window ("I'M OK").
   */
  async cancelFall(): Promise<void> {
    this.clearTimer();
    this.updateState('CANCELLED', 0);
    await NotificationService.cancelAllNotifications();
    await NotificationService.sendEmergencyNotification(
      'Nex Guard — LOCAL SIMULATION',
      'Fall alert cancelled. User confirmed safe.'
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    this.updateState('NORMAL', 0);
  },

  /**
   * Confirm fall (manually or via timeout).
   */
  async confirmFall(): Promise<AlertWithEvent | null> {
    this.clearTimer();

    this.updateState('CONFIRMED_FALL', 0);
    this.updateState('GPS_LOCATION', 0);

    // Attempt GPS Location
    const loc = await LocationService.getCurrentLocation(currentDeviceId);

    this.updateState('LOCAL_ALERT', 0);

    // Create local alert record in SQLite
    const alert = await AlertService.createFallAlert({
      deviceId: currentDeviceId,
      confidence: currentConfidence,
      latitude: loc.latitude,
      longitude: loc.longitude,
      eventType: 'FALL_DETECTED',
    });

    this.updateState('CAREGIVER_NOTIFICATION', 0);

    await NotificationService.sendEmergencyNotification(
      'Nex Guard — LOCAL SIMULATION',
      `🚨 EMERGENCY: FALL CONFIRMED for ${currentDeviceId}. Local alert recorded.`
    );

    return alert;
  },

  clearTimer() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
  },

  updateState(state: FallStateMachineState, countdown: number) {
    currentState = state;
    activeCountdown = countdown;
    stateChangeCallback?.(state, countdown);
  },
};
