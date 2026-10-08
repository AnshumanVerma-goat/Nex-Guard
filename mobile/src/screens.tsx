import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from './api';
import { useAlertStore, useAuthStore, useDeviceStore } from './store';
import { EventPayload, RootStackParamList } from './types';

import { AuthService } from './services/AuthService';
import { ProfileService } from './services/ProfileService';
import { DeviceService } from './services/DeviceService';
import { AlertService } from './services/AlertService';
import { FallDetectionService, FallStateMachineState } from './services/FallDetectionService';

type Props<Route extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, Route>;

const colors = {
  paper: '#f4f1eb',
  ink: '#171717',
  muted: '#6e6a62',
  line: '#c9c4bb',
  green: '#39745a',
  red: '#bd473c',
  blue: '#3d6376',
};

function Shell({ children, eyebrow = 'NEX GUARD / CARE' }: { children: React.ReactNode; eyebrow?: string }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function Button({
  label,
  onPress,
  secondary = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={[styles.button, secondary && styles.buttonSecondary]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.ink : colors.paper} />
      ) : (
        <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9b968d"
        secureTextEntry={secureTextEntry}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

function SectionTitle({ index, title, copy }: { index: string; title: string; copy?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionIndex}>{index}</Text>
      <Text style={styles.heading}>{title}</Text>
      {copy && <Text style={styles.copy}>{copy}</Text>}
    </View>
  );
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.linkRow} onPress={onPress}>
      <Text style={styles.linkLabel}>{label}</Text>
      <Text style={styles.arrow}>→</Text>
    </Pressable>
  );
}

export function LoginScreen({ navigation }: Props<'Login'>) {
  const [email, setEmail] = useState('caregiver@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.login({ email, password });
      setAuth(res.user.id, res.user.email, res.user.full_name);
    } catch (e: any) {
      setError(e.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / ACCESS">
      <View style={styles.authSpace}>
        <Text style={styles.kicker}>CAREGIVER CONSOLE (LOCAL ACCOUNT)</Text>
        <Text style={styles.hero}>Stay close.{'\n'}Respond faster.</Text>
        <Text style={styles.copy}>A quiet local command center for the people who care for someone else.</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.form}>
          <Field label="EMAIL ADDRESS" value={email} onChangeText={setEmail} placeholder="caregiver@example.com" />
          <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
          <Button label="ENTER CONSOLE" onPress={handleLogin} loading={loading} />
          <Button label="CREATE A CARE PLAN" secondary onPress={() => navigation.navigate('Register')} />
        </View>
      </View>
    </Shell>
  );
}

export function RegisterScreen({ navigation }: Props<'Register'>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AuthService.register({ email, password, full_name: name });
      setAuth(res.user.id, res.user.email, res.user.full_name);
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / NEW CAREGIVER">
      <View style={styles.authSpace}>
        <Text style={styles.kicker}>BEGIN WITH CONTEXT</Text>
        <Text style={styles.hero}>Build a safer{'\n'}daily rhythm.</Text>
        <Text style={styles.copy}>Set up a local caregiver device account. Data stays on your device.</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.form}>
          <Field label="YOUR NAME" value={name} onChangeText={setName} placeholder="Caregiver name" />
          <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="you@example.com" />
          <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Choose password (min 6 chars)" secureTextEntry />
          <Button label="START SETUP" onPress={handleRegister} loading={loading} />
          <Button label="BACK TO ACCESS" secondary onPress={() => navigation.goBack()} />
        </View>
      </View>
    </Shell>
  );
}

export function OnboardingScreen() {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const completeProfile = useAuthStore((state) => state.completeProfile);

  const handleSave = async () => {
    const elderlyName = name.trim() || 'Family member';
    setLoading(true);
    try {
      await ProfileService.createProfile({
        userId,
        full_name: elderlyName,
        medical_notes: relationship,
      });
    } catch (e) {
      console.warn('[LOCAL PROFILE ERROR]', e);
    } finally {
      setLoading(false);
      completeProfile(elderlyName, relationship);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / 01 PROFILE">
      <View style={styles.setupSpace}>
        <SectionTitle index="01 / PERSON" title="Who are we watching over?" copy="Stored locally in device SQLite database." />
        <Field label="NAME" value={name} onChangeText={setName} placeholder="Elderly person name" />
        <Field label="RELATIONSHIP" value={relationship} onChangeText={setRelationship} placeholder="Parent, partner, relative" />
        <Button label="SAVE CARE PLAN" onPress={handleSave} loading={loading} />
      </View>
    </Shell>
  );
}

export function DeviceSetupScreen() {
  const [deviceId, setDeviceId] = useState('nex-guard-001');
  const [loading, setLoading] = useState(false);
  const configure = useDeviceStore((state) => state.configure);

  const handlePair = async () => {
    const id = deviceId.trim() || 'nex-guard-001';
    setLoading(true);
    try {
      await DeviceService.registerDevice(id);
    } catch (e) {
      console.warn('[LOCAL DEVICE REGISTRATION ERROR]', e);
    } finally {
      setLoading(false);
      configure(id);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / 02 DEVICE">
      <View style={styles.setupSpace}>
        <SectionTitle index="02 / PAIR" title="Connect the wearable." copy="Use the device ID printed on the inside of the enclosure." />
        <Field label="DEVICE ID" value={deviceId} onChangeText={setDeviceId} placeholder="nex-guard-001" />
        <View style={styles.diagram}>
          <Text style={styles.diagramCode}>WEARABLE / REGISTERED (LOCAL)</Text>
          <Text style={styles.diagramTitle}>ESP32-S3</Text>
          <Text style={styles.diagramCopy}>IMU · GNSS · LOCAL SQLITE STORAGE</Text>
        </View>
        <Button label="PAIR DEVICE LOCALLY" onPress={handlePair} loading={loading} />
      </View>
    </Shell>
  );
}

export function DashboardScreen({ navigation }: Props<'Dashboard'>) {
  const caregiverName = useAuthStore((state) => state.caregiverName);
  const elderlyName = useAuthStore((state) => state.elderlyName);
  const battery = useDeviceStore((state) => state.batteryLevel);
  const history = useAlertStore((state) => state.history);
  const deviceId = useDeviceStore((state) => state.deviceId);

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const loadLocalAlerts = async () => {
    setLoading(true);
    try {
      const alerts = await AlertService.getAlertHistory();
      const events: EventPayload[] = alerts.map((a) => ({
        id: a.id,
        device_id: a.fall_event?.device_id || deviceId || 'nex-guard-001',
        event_type: (a.fall_event?.event_type as 'FALL_DETECTED' | 'POTENTIAL_FALL' | 'CANCELLED') || 'FALL_DETECTED',
        occurred_at: a.fall_event?.occurred_at || a.created_at,
        confidence: a.fall_event?.confidence || 0.95,
        latitude: a.fall_event?.latitude ?? null,
        longitude: a.fall_event?.longitude ?? null,
        battery_level: battery ?? 81,
        alert_id: a.id,
      }));
      useAlertStore.getState().setHistory(events);
    } catch (e) {
      console.warn('[DASHBOARD LOCAL ALERTS ERROR]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLocalAlerts();
  }, []);

  const handleSimulateFall = async () => {
    setSimulating(true);
    try {
      void FallDetectionService.triggerSimulatedFall(deviceId || 'nex-guard-001');
      navigation.navigate('Emergency');
    } catch (e) {
      console.warn('[SIMULATION ERROR]', e);
    } finally {
      setSimulating(false);
      void loadLocalAlerts();
    }
  };

  return (
    <Shell>
      <View style={styles.dashboardHeader}>
        <View>
          <Text style={styles.kicker}>GOOD MORNING, {caregiverName.toUpperCase() || 'CAREGIVER'}</Text>
          <Text style={styles.dashboardTitle}>Care, with a{'\n'}clear signal.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.menuDot}>•••</Text>
        </Pressable>
      </View>
      <View style={styles.watchCard}>
        <View>
          <Text style={styles.cardLabel}>CURRENTLY WATCHING (LOCAL DEVICE)</Text>
          <Text style={styles.cardName}>{elderlyName || 'Family member'}</Text>
          <Text style={styles.cardMeta}>
            STANDALONE LOCAL MODE · {deviceId}
          </Text>
        </View>
        <View style={[styles.signal, styles.signalLive]} />
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{history.length}</Text>
          <Text style={styles.metricLabel}>ALERTS LOGGED</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>LOCAL</Text>
          <Text style={styles.metricLabel}>DEVICE STATUS</Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginVertical: 12 }} />
      ) : (
        <LinkRow label="VIEW ALERT HISTORY" onPress={() => navigation.navigate('History')} />
      )}
      <LinkRow label="TEST SCENARIO CENTER" onPress={() => navigation.navigate('ScenarioCenter')} />
      <LinkRow label="DEVICE HEALTH" onPress={() => navigation.navigate('DeviceHealth')} />
      <LinkRow label="CAREGIVER SETTINGS" onPress={() => navigation.navigate('Profile')} />
      <View style={{ marginTop: 16 }}>
        <Button label="TRIGGER LOCAL FALL SIMULATION" secondary onPress={handleSimulateFall} loading={simulating} />
      </View>
      <Text style={styles.dashboardFooter}>Standalone offline mode: All records persisted in SQLite.</Text>
    </Shell>
  );
}

export function EmergencyScreen({ navigation }: Props<'Emergency'>) {
  const event = useAlertStore((state) => state.currentAlert);
  const activeAlertId = useAlertStore((state) => state.activeAlertId);
  const alertStatus = useAlertStore((state) => state.alertStatus);

  const updateAlertStatus = useAlertStore((state) => state.updateAlertStatus);
  const clearCurrent = useAlertStore((state) => state.clearCurrent);

  const [engineState, setEngineState] = useState<FallStateMachineState>(FallDetectionService.getCurrentState());
  const [countdown, setCountdown] = useState<number>(FallDetectionService.getCountdown());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (mounted) {
        setEngineState(FallDetectionService.getCurrentState());
        setCountdown(FallDetectionService.getCountdown());
      }
    }, 500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleCancelFall = async () => {
    setLoading(true);
    await FallDetectionService.cancelFall();
    setLoading(false);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleConfirmEmergency = async () => {
    setLoading(true);
    const alert = await FallDetectionService.confirmFall();
    if (alert && alert.fall_event) {
      const payload: EventPayload = {
        id: alert.id,
        device_id: alert.fall_event.device_id,
        event_type: (alert.fall_event.event_type as any) || 'FALL_DETECTED',
        occurred_at: alert.fall_event.occurred_at,
        confidence: alert.fall_event.confidence,
        latitude: alert.fall_event.latitude ?? null,
        longitude: alert.fall_event.longitude ?? null,
        battery_level: 81,
        alert_id: alert.id,
      };
      useAlertStore.getState().receiveAlert(payload);
    }
    setLoading(false);
  };

  const handleAcknowledge = async () => {
    setLoading(true);
    if (activeAlertId) {
      try {
        await AlertService.acknowledgeAlert(activeAlertId, 'Acknowledged via local mobile console');
      } catch (e) {
        console.warn('[LOCAL ACKNOWLEDGE ERROR]', e);
      }
    }
    updateAlertStatus(activeAlertId || 'local', 'ACKNOWLEDGED');
    setLoading(false);
  };

  const handleResolve = async () => {
    setLoading(true);
    if (activeAlertId) {
      try {
        await AlertService.resolveAlert(activeAlertId, 'Resolved via local mobile console');
      } catch (e) {
        console.warn('[LOCAL RESOLVE ERROR]', e);
      }
    }
    updateAlertStatus(activeAlertId || 'local', 'RESOLVED');
    clearCurrent();
    setLoading(false);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const isConfirmationWindow = engineState === 'USER_CONFIRMATION' || engineState === 'POSSIBLE_FALL';

  const statusText = isConfirmationWindow
    ? `Possible fall detected! Safety check active.`
    : alertStatus === 'ACKNOWLEDGED'
    ? 'Event acknowledged. User check-in active.'
    : alertStatus === 'RESOLVED'
    ? 'Event resolved safely.'
    : 'Immediate attention required.';

  return (
    <Shell eyebrow="NEX GUARD / PRIORITY EVENT">
      <View style={styles.emergency}>
        <Text style={styles.alertCode}>🚨 FALL_DETECTED (LOCAL SIMULATION)</Text>
        <Text style={styles.emergencyTitle}>{statusText}</Text>
        <Text style={styles.copy}>
          {isConfirmationWindow
            ? `Wearable simulation detected sudden impact. Please verify safety within ${countdown} seconds.`
            : event
            ? `Device ${event.device_id} reported a fall at ${new Date(event.occurred_at).toLocaleTimeString()}.`
            : 'A fall event has been logged locally on this device.'}
        </Text>

        <View style={styles.emergencyData}>
          <DataRow label="SOURCE" value="LOCAL SIMULATION" />
          <DataRow label="STATE MACHINE" value={engineState} />
          {isConfirmationWindow && <DataRow label="COUNTDOWN" value={`${countdown}s remaining`} />}
          <DataRow label="CONFIDENCE" value={event ? `${Math.round(event.confidence * 100)}%` : '94%'} />
          <DataRow
            label="LOCATION"
            value={
              event?.latitude !== undefined && event?.latitude !== null
                ? `${event.latitude}, ${event.longitude}`
                : 'Location unavailable (GNSS fix pending)'
            }
          />
          <DataRow label="STATUS" value={isConfirmationWindow ? 'PENDING CONFIRMATION' : alertStatus || 'ACTIVE'} />
          <DataRow label="STORAGE" value="LOCAL SQLITE" />
        </View>

        {isConfirmationWindow ? (
          <View style={{ gap: 12 }}>
            <Button label="CANCEL / I'M OK" onPress={handleCancelFall} loading={loading} />
            <Button label="CONFIRM EMERGENCY" secondary onPress={handleConfirmEmergency} loading={loading} />
          </View>
        ) : alertStatus !== 'RESOLVED' && (
          <View style={{ gap: 12 }}>
            {alertStatus !== 'ACKNOWLEDGED' && (
              <Button label="ACKNOWLEDGE ALERT" onPress={handleAcknowledge} loading={loading} />
            )}
            <Button label="MARK AS RESOLVED" secondary onPress={handleResolve} loading={loading} />
          </View>
        )}
      </View>
    </Shell>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

export function HistoryScreen({ navigation }: Props<'History'>) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchHistory() {
      try {
        const localAlerts = await AlertService.getAlertHistory();
        if (mounted) setAlerts(localAlerts);
      } catch (e) {
        console.warn('[HISTORY LOAD ERROR]', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void fetchHistory();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Shell eyebrow="NEX GUARD / 03 HISTORY">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle index="03 / RECORD" title="Alert history" copy="Local events stored safely in device SQLite database." />
      {loading ? (
        <ActivityIndicator color={colors.ink} style={{ marginVertical: 24 }} />
      ) : alerts.length === 0 ? (
        <Text style={styles.empty}>No local alert events recorded yet.</Text>
      ) : (
        alerts.map((item) => (
          <View style={styles.historyItem} key={item.id}>
            <View>
              <Text style={styles.alertCode}>{item.fall_event?.event_type || 'FALL_DETECTED'}</Text>
              <Text style={styles.historyTime}>
                {new Date(item.fall_event?.occurred_at || item.created_at).toLocaleString()} · STATUS: {item.status}
              </Text>
            </View>
            <Text style={styles.historyConfidence}>
              {item.fall_event ? `${Math.round(item.fall_event.confidence * 100)}%` : '—'}
            </Text>
          </View>
        ))
      )}
    </Shell>
  );
}

export function DeviceHealthScreen({ navigation }: Props<'DeviceHealth'>) {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function loadInfo() {
      const dev = await DeviceService.getDevice(deviceId || 'nex-guard-001');
      if (mounted) setDeviceInfo(dev);
    }
    void loadInfo();
    return () => {
      mounted = false;
    };
  }, [deviceId]);

  return (
    <Shell eyebrow="NEX GUARD / 04 DEVICE">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle index="04 / STATUS" title="Device health" copy="Local device profile and hardware verification status." />
      <View style={styles.healthCard}>
        <DataRow label="DEVICE ID" value={deviceId || 'nex-guard-001'} />
        <DataRow label="OPERATIONAL MODE" value="STANDALONE LOCAL MODE" />
        <DataRow label="DEVICE REGISTERED" value={deviceInfo ? 'YES (SQLite)' : 'YES (Local default)'} />
        <DataRow label="SENSOR CONNECTION" value="LOCAL SIMULATION / DISCONNECTED" />
        <DataRow label="BATTERY STATE" value="Unverified (Hardware disconnected)" />
        <DataRow label="FASTAPI BACKEND" value="OFFLINE / NOT REQUIRED" />
      </View>
      <Text style={styles.healthNote}>
        Truthful Hardware State: Mobile app operates 100% offline. Raw hardware telemetry requires physical ESP32 BLE/UART connection in Phase 7.
      </Text>
    </Shell>
  );
}

export function ProfileScreen({ navigation }: Props<'Profile'>) {
  const caregiverName = useAuthStore((state) => state.caregiverName);
  const elderlyName = useAuthStore((state) => state.elderlyName);
  const email = useAuthStore((state) => state.email);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Shell eyebrow="NEX GUARD / 05 SETTINGS">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle index="05 / CAREGIVER" title="Profile & settings" copy="Local account details stored on this device." />
      <View style={styles.profileBlock}>
        <DataRow label="CAREGIVER" value={caregiverName || 'Caregiver'} />
        <DataRow label="EMAIL" value={email || 'local.user@device'} />
        <DataRow label="WATCHING OVER" value={elderlyName || 'Family member'} />
        <DataRow label="STORAGE ENGINE" value="LOCAL SQLITE + SECURE STORE" />
        <DataRow label="BACKEND DEPENDENCY" value="NONE (OFFLINE FIRST)" />
      </View>
      <Button label="SIGN OUT" secondary onPress={signOut} />
    </Shell>
  );
}

export function ScenarioCenterScreen({ navigation }: Props<'ScenarioCenter'>) {
  const [resultText, setResultText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const deviceId = useDeviceStore((state) => state.deviceId);

  const runTestScenario = async (scenario: any) => {
    setLoading(true);
    setResultText(null);
    try {
      const res = await FallDetectionService.triggerScenario(scenario, deviceId || 'nex-guard-001');
      setResultText(`SIMULATED RESULT: ${res.label}`);
      if (res.isFall) {
        navigation.navigate('Emergency');
      }
    } catch (e: any) {
      setResultText(`ERROR: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / TEST CENTER">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle
        index="TEST / SCENARIOS"
        title="Scenario simulator"
        copy="Test application logic and state machine without physical hardware."
      />
      {resultText && (
        <View style={styles.diagram}>
          <Text style={styles.diagramCode}>PIPELINE OUTPUT</Text>
          <Text style={styles.copy}>{resultText}</Text>
        </View>
      )}
      <View style={{ gap: 12 }}>
        <Button label="1. SIMULATE NORMAL WALKING (1.15g)" secondary onPress={() => runTestScenario('NORMAL_WALKING')} loading={loading} />
        <Button label="2. SIMULATE SITTING DOWN (1.02g)" secondary onPress={() => runTestScenario('SITTING')} loading={loading} />
        <Button label="3. SIMULATE SUDDEN IMPACT FALL (3.80g)" onPress={() => runTestScenario('SUDDEN_IMPACT_FALL')} loading={loading} />
        <Button label="4. SIMULATE WALK → FALL (3.10g)" onPress={() => runTestScenario('WALK_FALL')} loading={loading} />
      </View>
      <Text style={[styles.healthNote, { marginTop: 24 }]}>
        Mode: LOCAL SIMULATION (DEFAULT). All scenarios run through the unified preprocessing & fall threshold pipeline.
      </Text>
    </Shell>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  content: { flexGrow: 1, padding: 26, paddingTop: 20 },
  eyebrow: { fontSize: 11, letterSpacing: 2.5, color: colors.muted, marginBottom: 34 },
  authSpace: { flex: 1, justifyContent: 'center', paddingVertical: 24 },
  setupSpace: { paddingTop: 28 },
  kicker: { fontSize: 11, letterSpacing: 2.5, color: colors.muted, marginBottom: 17 },
  hero: { fontSize: 56, lineHeight: 58, letterSpacing: -2.8, fontWeight: '700', color: colors.ink, marginBottom: 22 },
  dashboardTitle: { fontSize: 43, lineHeight: 45, letterSpacing: -2, fontWeight: '700', color: colors.ink },
  copy: { fontSize: 17, lineHeight: 26, color: '#4e4a44', maxWidth: 450 },
  errorText: { color: colors.red, fontSize: 14, marginTop: 12 },
  form: { marginTop: 42 },
  field: { marginBottom: 22 },
  fieldLabel: { fontSize: 10, letterSpacing: 2, color: colors.muted, marginBottom: 8 },
  input: { borderBottomWidth: 1, borderBottomColor: colors.ink, paddingVertical: 10, fontSize: 17, color: colors.ink },
  button: { backgroundColor: colors.ink, paddingVertical: 17, alignItems: 'center', marginTop: 8 },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.ink },
  buttonText: { color: colors.paper, fontWeight: '700', fontSize: 11, letterSpacing: 2 },
  buttonTextSecondary: { color: colors.ink },
  sectionTitle: { marginBottom: 30 },
  sectionIndex: { color: colors.blue, fontSize: 11, letterSpacing: 2.5, marginBottom: 15 },
  heading: { fontSize: 42, lineHeight: 43, letterSpacing: -1.8, color: colors.ink, fontWeight: '700', marginBottom: 14 },
  diagram: { borderWidth: 1, borderColor: colors.ink, padding: 22, marginBottom: 26 },
  diagramCode: { color: colors.blue, fontSize: 10, letterSpacing: 2, marginBottom: 35 },
  diagramTitle: { fontSize: 38, fontWeight: '700', letterSpacing: -1, color: colors.ink },
  diagramCopy: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, marginTop: 8 },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  menuDot: { letterSpacing: 3, color: colors.ink, fontSize: 16 },
  watchCard: { backgroundColor: colors.ink, padding: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardLabel: { color: '#aaa69e', fontSize: 10, letterSpacing: 2, marginBottom: 15 },
  cardName: { color: colors.paper, fontSize: 27, fontWeight: '700', marginBottom: 10 },
  cardMeta: { color: '#c8c3ba', fontSize: 10, letterSpacing: 1.5 },
  signal: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.red },
  signalLive: { backgroundColor: '#72ad86' },
  metrics: { flexDirection: 'row', borderBottomWidth: 1, borderTopWidth: 1, borderColor: colors.line, marginBottom: 20 },
  metric: { flex: 1, paddingVertical: 20 },
  metricValue: { fontSize: 29, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  metricLabel: { fontSize: 9, letterSpacing: 1.5, color: colors.muted },
  linkRow: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 19, flexDirection: 'row', justifyContent: 'space-between' },
  linkLabel: { fontSize: 12, letterSpacing: 1.8, color: colors.ink, fontWeight: '700' },
  arrow: { fontSize: 19, color: colors.blue },
  dashboardFooter: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 30, fontStyle: 'italic' },
  alertCode: { color: colors.red, fontSize: 11, letterSpacing: 2.5, marginBottom: 14 },
  emergency: { borderTopWidth: 6, borderTopColor: colors.red, paddingTop: 24, marginTop: 30 },
  emergencyTitle: { fontSize: 50, lineHeight: 51, letterSpacing: -2.3, fontWeight: '700', color: colors.ink, marginBottom: 20 },
  emergencyData: { marginVertical: 30 },
  dataRow: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between' },
  dataLabel: { fontSize: 10, letterSpacing: 1.8, color: colors.muted },
  dataValue: { fontSize: 14, color: colors.ink, maxWidth: '62%', textAlign: 'right' },
  back: { color: colors.blue, fontSize: 11, letterSpacing: 1.5, marginBottom: 45 },
  empty: { fontSize: 17, color: colors.muted, paddingVertical: 24 },
  historyItem: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTime: { color: colors.ink, fontSize: 14 },
  historyConfidence: { fontSize: 19, fontWeight: '700', color: colors.ink },
  healthCard: { borderTopWidth: 1, borderTopColor: colors.ink, marginBottom: 28 },
  healthNote: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  profileBlock: { borderTopWidth: 1, borderTopColor: colors.ink, marginBottom: 30 },
});
