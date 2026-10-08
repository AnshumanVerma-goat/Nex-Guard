import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api } from './src/api';
import { initDatabase } from './src/database/database';
import { AppNavigator, navigationRef } from './src/navigation';
import { AuthService } from './src/services/AuthService';
import { useAlertStore, useAuthStore, useDeviceStore } from './src/store';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const setAuth = useAuthStore((state) => state.setAuth);
  const receiveAlert = useAlertStore((state) => state.receiveAlert);
  const setHistory = useAlertStore((state) => state.setHistory);
  const setConnected = useDeviceStore((state) => state.setConnected);
  const setBatteryLevel = useDeviceStore((state) => state.setBatteryLevel);

  useEffect(() => {
    let mounted = true;

    async function startup() {
      try {
        // Initialize SQLite schema
        await initDatabase();

        // Restore local SecureStore session
        const session = await AuthService.restoreSession();
        if (session && mounted) {
          setAuth(session.userId, session.email, session.caregiverName);
        }
      } catch (err) {
        console.warn('[STARTUP WARNING] Local initialization error:', err);
      } finally {
        if (mounted) setInitializing(false);
      }
    }

    void startup();

    // Optional Remote / Local Fallback Socket Connection
    let connection: WebSocket | null = null;
    try {
      connection = new WebSocket(api.socketUrl);
      connection.onopen = () => { if (mounted) setConnected(true); };
      connection.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data);
          if (payload.event_type === 'FALL_DETECTED') {
            receiveAlert(payload);
            setBatteryLevel(payload.battery_level);
            if (navigationRef.isReady()) navigationRef.navigate('Emergency');
          }
        } catch {}
      };
      connection.onerror = () => { if (mounted) setConnected(false); };
      connection.onclose = () => { if (mounted) setConnected(false); };
    } catch {
      if (mounted) setConnected(false);
    }

    void api.events().then((events) => {
      if (mounted) {
        setHistory(events);
        if (events[0]?.battery_level !== undefined) setBatteryLevel(events[0].battery_level);
      }
    }).catch(() => undefined);

    return () => {
      mounted = false;
      if (connection) {
        try { connection.close(); } catch {}
      }
    };
  }, [setAuth, receiveAlert, setConnected, setHistory, setBatteryLevel]);

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#171717" />
        <Text style={styles.splashText}>NEX GUARD / INITIALIZING</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#f4f1eb',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  splashText: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#6e6a62',
    fontWeight: '700',
  },
});

