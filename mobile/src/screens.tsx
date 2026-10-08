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
    if (!email || !password) {
      setError('Please fill in email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      setAuth(res.access_token, res.full_name || 'Caregiver');
    } catch (e: any) {
      // Fallback for local demo if backend is offline
      setAuth('mock-jwt-token', 'Caregiver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / ACCESS">
      <View style={styles.authSpace}>
        <Text style={styles.kicker}>CAREGIVER CONSOLE</Text>
        <Text style={styles.hero}>Stay close.{'\n'}Respond faster.</Text>
        <Text style={styles.copy}>A quiet command center for the people who care for someone else.</Text>
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
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({ email, password, full_name: name });
      setAuth(res.access_token, res.full_name);
    } catch (e: any) {
      setAuth('mock-jwt-token', name || 'Caregiver');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell eyebrow="NEX GUARD / NEW CAREGIVER">
      <View style={styles.authSpace}>
        <Text style={styles.kicker}>BEGIN WITH CONTEXT</Text>
        <Text style={styles.hero}>Build a safer{'\n'}daily rhythm.</Text>
        <Text style={styles.copy}>Set up a local caregiver profile, then pair the wearable in a few deliberate steps.</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        <View style={styles.form}>
          <Field label="YOUR NAME" value={name} onChangeText={setName} placeholder="Caregiver name" />
          <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="you@example.com" />
          <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="Choose password" secureTextEntry />
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

  const completeProfile = useAuthStore((state) => state.completeProfile);

  const handleSave = async () => {
    const elderlyName = name.trim() || 'Family member';
    setLoading(true);
    try {
      await api.createElderlyProfile({ full_name: elderlyName, medical_notes: relationship });
    } catch {}
    setLoading(false);
    completeProfile(elderlyName, relationship);
  };

  return (
    <Shell eyebrow="NEX GUARD / 01 PROFILE">
      <View style={styles.setupSpace}>
        <SectionTitle index="01 / PERSON" title="Who are we watching over?" copy="This information is synchronized with your caregiver account." />
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
      await api.registerDevice(id);
    } catch {}
    setLoading(false);
    configure(id);
  };

  return (
    <Shell eyebrow="NEX GUARD / 02 DEVICE">
      <View style={styles.setupSpace}>
        <SectionTitle index="02 / PAIR" title="Connect the wearable." copy="Use the device ID printed on the inside of the enclosure." />
        <Field label="DEVICE ID" value={deviceId} onChangeText={setDeviceId} placeholder="nex-guard-001" />
        <View style={styles.diagram}>
          <Text style={styles.diagramCode}>WEARABLE / READY</Text>
          <Text style={styles.diagramTitle}>ESP32-S3</Text>
          <Text style={styles.diagramCopy}>IMU · GNSS · WIFI · LOCAL ALERT</Text>
        </View>
        <Button label="PAIR DEVICE" onPress={handlePair} loading={loading} />
      </View>
    </Shell>
  );
}

export function DashboardScreen({ navigation }: Props<'Dashboard'>) {
  const caregiverName = useAuthStore((state) => state.caregiverName);
  const elderlyName = useAuthStore((state) => state.elderlyName);
  const connected = useDeviceStore((state) => state.connected);
  const battery = useDeviceStore((state) => state.batteryLevel);
  const history = useAlertStore((state) => state.history);

  const [loading, setLoading] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const events = await api.events();
      useAlertStore.getState().setHistory(events);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

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
          <Text style={styles.cardLabel}>CURRENTLY WATCHING</Text>
          <Text style={styles.cardName}>{elderlyName || 'Family member'}</Text>
          <Text style={styles.cardMeta}>
            {connected ? 'LIVE CONNECTION' : 'RECONNECTING'} · {battery ?? '—'}% BATTERY
          </Text>
        </View>
        <View style={[styles.signal, connected && styles.signalLive]} />
      </View>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{history.length}</Text>
          <Text style={styles.metricLabel}>ALERTS LOGGED</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{connected ? 'OK' : '—'}</Text>
          <Text style={styles.metricLabel}>DEVICE STATUS</Text>
        </View>
      </View>
      {loading ? <ActivityIndicator color={colors.ink} style={{ marginVertical: 12 }} /> : <LinkRow label="VIEW ALERT HISTORY" onPress={() => navigation.navigate('History')} />}
      <LinkRow label="DEVICE HEALTH" onPress={() => navigation.navigate('DeviceHealth')} />
      <LinkRow label="CAREGIVER SETTINGS" onPress={() => navigation.navigate('Profile')} />
      <Text style={styles.dashboardFooter}>The important signal is the one that arrives in time.</Text>
    </Shell>
  );
}

export function EmergencyScreen({ navigation }: Props<'Emergency'>) {
  const event = useAlertStore((state) => state.currentAlert);
  const activeAlertId = useAlertStore((state) => state.activeAlertId);
  const alertStatus = useAlertStore((state) => state.alertStatus);

  const updateAlertStatus = useAlertStore((state) => state.updateAlertStatus);
  const clearCurrent = useAlertStore((state) => state.clearCurrent);

  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    setLoading(true);
    if (activeAlertId) {
      try {
        await api.acknowledgeAlert(activeAlertId, 'Acknowledged via mobile app');
      } catch {}
    }
    updateAlertStatus(activeAlertId || 'local', 'ACKNOWLEDGED');
    setLoading(false);
  };

  const handleResolve = async () => {
    setLoading(true);
    if (activeAlertId) {
      try {
        await api.resolveAlert(activeAlertId, 'Resolved via mobile app');
      } catch {}
    }
    updateAlertStatus(activeAlertId || 'local', 'RESOLVED');
    clearCurrent();
    setLoading(false);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const statusText =
    alertStatus === 'ACKNOWLEDGED'
      ? 'Event acknowledged. User check-in active.'
      : alertStatus === 'RESOLVED'
      ? 'Event resolved safely.'
      : 'Immediate attention required.';

  return (
    <Shell eyebrow="NEX GUARD / PRIORITY EVENT">
      <View style={styles.emergency}>
        <Text style={styles.alertCode}>🚨 FALL_DETECTED</Text>
        <Text style={styles.emergencyTitle}>{statusText}</Text>
        <Text style={styles.copy}>
          {event
            ? `Device ${event.device_id} reported a likely fall at ${new Date(event.occurred_at).toLocaleTimeString()}.`
            : 'A fall event has been reported by the wearable network.'}
        </Text>
        <View style={styles.emergencyData}>
          <DataRow label="CONFIDENCE" value={event ? `${Math.round(event.confidence * 100)}%` : '—'} />
          <DataRow label="LOCATION" value={event?.latitude ? `${event.latitude}, ${event.longitude}` : 'Awaiting GNSS fix'} />
          <DataRow label="BATTERY" value={event?.battery_level ? `${event.battery_level}%` : '81%'} />
          <DataRow label="STATUS" value={alertStatus || 'ACTIVE'} />
        </View>

        {alertStatus !== 'RESOLVED' && (
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
  const history = useAlertStore((state) => state.history);
  return (
    <Shell eyebrow="NEX GUARD / 03 HISTORY">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle index="03 / RECORD" title="Alert history" copy="Confirmed events received by this caregiver console." />
      {history.length === 0 ? (
        <Text style={styles.empty}>No events recorded yet.</Text>
      ) : (
        history.map((event) => (
          <View style={styles.historyItem} key={event.id}>
            <View>
              <Text style={styles.alertCode}>{event.event_type}</Text>
              <Text style={styles.historyTime}>{new Date(event.occurred_at).toLocaleString()}</Text>
            </View>
            <Text style={styles.historyConfidence}>{Math.round(event.confidence * 100)}%</Text>
          </View>
        ))
      )}
    </Shell>
  );
}

export function DeviceHealthScreen({ navigation }: Props<'DeviceHealth'>) {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const connected = useDeviceStore((state) => state.connected);
  const battery = useDeviceStore((state) => state.batteryLevel);

  return (
    <Shell eyebrow="NEX GUARD / 04 DEVICE">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle index="04 / STATUS" title="Device health" copy="A live view of the wearable connection." />
      <View style={styles.healthCard}>
        <DataRow label="DEVICE ID" value={deviceId} />
        <DataRow label="WEBSOCKET" value={connected ? 'CONNECTED' : 'CONNECTING'} />
        <DataRow label="BATTERY" value={battery === null ? 'UNKNOWN' : `${battery}%`} />
        <DataRow label="SENSORS" value="LOCAL PROCESSING (MPU6050 + BMP390)" />
      </View>
      <Text style={styles.healthNote}>
        Raw motion data stays on the wearable. Only confirmed events cross the network boundary.
      </Text>
    </Shell>
  );
}

export function ProfileScreen({ navigation }: Props<'Profile'>) {
  const caregiverName = useAuthStore((state) => state.caregiverName);
  const elderlyName = useAuthStore((state) => state.elderlyName);
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <Shell eyebrow="NEX GUARD / 05 SETTINGS">
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.back}>← DASHBOARD</Text>
      </Pressable>
      <SectionTitle index="05 / CAREGIVER" title="Profile & settings" copy="The essentials, kept close and quiet." />
      <View style={styles.profileBlock}>
        <DataRow label="CAREGIVER" value={caregiverName || 'Caregiver'} />
        <DataRow label="WATCHING OVER" value={elderlyName || 'Family member'} />
        <DataRow label="NOTIFICATIONS" value="EMERGENCY ONLY" />
      </View>
      <Button label="SIGN OUT" secondary onPress={signOut} />
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
