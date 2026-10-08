import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { api } from './src/api';
import { AppNavigator, navigationRef } from './src/navigation';
import { useAlertStore, useDeviceStore } from './src/store';

export default function App() {
  const receiveAlert = useAlertStore((state) => state.receiveAlert);
  const setHistory = useAlertStore((state) => state.setHistory);
  const setConnected = useDeviceStore((state) => state.setConnected);
  const setBatteryLevel = useDeviceStore((state) => state.setBatteryLevel);

  useEffect(() => {
    let mounted = true;
    const connection = new WebSocket(api.socketUrl);
    connection.onopen = () => { if (mounted) setConnected(true); };
    connection.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (payload.event_type === 'FALL_DETECTED') {
          receiveAlert(payload);
          setBatteryLevel(payload.battery_level);
          if (navigationRef.isReady()) navigationRef.navigate('Emergency');
        }
      } catch {
      }
    };
    connection.onerror = () => { if (mounted) setConnected(false); };
    connection.onclose = () => { if (mounted) setConnected(false); };
    void api.events().then((events) => {
      if (mounted) {
        setHistory(events);
        if (events[0]?.battery_level !== undefined) setBatteryLevel(events[0].battery_level);
      }
    }).catch(() => undefined);
    return () => { mounted = false; connection.close(); };
  }, [receiveAlert, setConnected, setHistory, setBatteryLevel]);

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator />
    </>
  );
}
