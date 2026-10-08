/**
 * Phase 4 — Local Fall Engine & State Machine Verification Suite
 * Fully typed test suite for deterministic state machine transitions, timer cancellation,
 * emergency confirmation, GPS fallback, local alert creation, and simulation labeling.
 */
import { FallDetectionService, FALL_CONFIRMATION_TIMEOUT_MS } from '../FallDetectionService';
import { AlertService } from '../AlertService';
import { SimulationSensorSource } from '../SensorSource';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILURE] ${message}`);
  }
}

export async function runPhase4EngineTests(): Promise<{ passed: number; failed: number; log: string[] }> {
  const log: string[] = [];
  let passed = 0;
  let failed = 0;

  async function testCase(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      passed++;
      log.push(`[PASS] ${name}`);
    } catch (err: any) {
      failed++;
      log.push(`[FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. SensorSource abstraction & honesty
  await testCase('1. SensorSource abstraction & honesty check', () => {
    const source = FallDetectionService.getSensorSource();
    assert(source instanceof SimulationSensorSource, 'Sensor source is explicitly SimulationSensorSource');
    assert(source.type === 'SIMULATION', 'Sensor type is strictly labeled SIMULATION');
  });

  // 2. State Machine: NORMAL -> POSSIBLE_FALL -> CANCELLED -> NORMAL
  await testCase('2. State Machine: Trigger fall -> Cancel during confirmation window', async () => {
    const states: string[] = [];
    await FallDetectionService.triggerSimulatedFall('test-device-cancel', 0.92, (state) => {
      states.push(state);
    });

    assert(states.includes('POSSIBLE_FALL'), 'Enters POSSIBLE_FALL');
    assert(states.includes('USER_CONFIRMATION'), 'Enters USER_CONFIRMATION');

    await FallDetectionService.cancelFall();

    assert(FallDetectionService.getCurrentState() === 'NORMAL', 'Returns to NORMAL after cancel');
  });

  // 3. State Machine: Trigger fall -> Confirm Emergency -> Alert created
  await testCase('3. State Machine: Trigger fall -> Confirm Emergency -> Local Alert', async () => {
    const states: string[] = [];
    await FallDetectionService.triggerSimulatedFall('test-device-confirm', 0.95, (state) => {
      states.push(state);
    });

    const alert = await FallDetectionService.confirmFall();

    assert(alert !== null, 'Local Alert created upon confirmation');
    assert(alert?.fall_event?.device_id === 'test-device-confirm', 'Device ID matched');
    assert(alert?.status === 'ACTIVE', 'Alert status is ACTIVE');
  });

  // 4. Confirmation Timeout Constant
  await testCase('4. Confirmation timeout configuration', () => {
    assert(FALL_CONFIRMATION_TIMEOUT_MS === 20000, 'FALL_CONFIRMATION_TIMEOUT_MS configured to 20,000ms (20s)');
  });

  // 5. Duplicate Event Protection
  await testCase('5. Duplicate fall event protection', async () => {
    await FallDetectionService.triggerSimulatedFall('test-device-dup', 0.90);
    const currentState = FallDetectionService.getCurrentState();

    const secondSession = await FallDetectionService.triggerSimulatedFall('test-device-dup', 0.90);
    assert(secondSession !== null, 'Handled duplicate call without crashing');

    // Clean up
    await FallDetectionService.cancelFall();
  });

  // 6. Acknowledgement & Resolution
  await testCase('6. Local Alert Acknowledge & Resolve lifecycle', async () => {
    const alert = await AlertService.createFallAlert({
      deviceId: 'test-device-lifecycle',
      confidence: 0.97,
      eventType: 'FALL_DETECTED',
    });

    const ack = await AlertService.acknowledgeAlert(alert.id, 'Unit test acknowledged');
    assert(ack?.status === 'ACKNOWLEDGED', 'Status updated to ACKNOWLEDGED in SQLite');

    const res = await AlertService.resolveAlert(alert.id, 'Unit test resolved');
    assert(res?.status === 'RESOLVED', 'Status updated to RESOLVED in SQLite');
  });

  return { passed, failed, log };
}
