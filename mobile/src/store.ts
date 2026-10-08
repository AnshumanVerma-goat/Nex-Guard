import { create } from 'zustand';
import { api, setAuthToken } from './api';
import { AlertItem, EventPayload } from './types';

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  caregiverName: string;
  elderlyName: string;
  profileComplete: boolean;
  setAuth: (token: string, caregiverName: string) => void;
  signIn: (name: string) => void;
  completeProfile: (name: string, relationship?: string) => void;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  caregiverName: '',
  elderlyName: '',
  profileComplete: false,
  setAuth: (token, caregiverName) => {
    setAuthToken(token);
    set({ isAuthenticated: true, token, caregiverName });
  },
  signIn: (name) => set({ isAuthenticated: true, caregiverName: name }),
  completeProfile: (name) => set({ elderlyName: name, profileComplete: true }),
  signOut: () => {
    setAuthToken(null);
    set({ isAuthenticated: false, token: null, caregiverName: '', profileComplete: false });
  },
}));

type DeviceState = {
  deviceId: string;
  configured: boolean;
  connected: boolean;
  batteryLevel: number | null;
  configure: (deviceId: string) => void;
  setConnected: (connected: boolean) => void;
  setBatteryLevel: (batteryLevel: number | null) => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  deviceId: 'nex-guard-001',
  configured: false,
  connected: false,
  batteryLevel: 81,
  configure: (deviceId) => set({ deviceId, configured: true }),
  setConnected: (connected) => set({ connected }),
  setBatteryLevel: (batteryLevel) => set({ batteryLevel }),
}));

type AlertState = {
  currentAlert: EventPayload | null;
  activeAlertId: string | null;
  alertStatus: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | null;
  history: EventPayload[];
  alertsList: AlertItem[];
  receiveAlert: (event: EventPayload) => void;
  setHistory: (events: EventPayload[]) => void;
  setAlertsList: (alerts: AlertItem[]) => void;
  updateAlertStatus: (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => void;
  clearCurrent: () => void;
};

export const useAlertStore = create<AlertState>((set) => ({
  currentAlert: null,
  activeAlertId: null,
  alertStatus: null,
  history: [],
  alertsList: [],
  receiveAlert: (event) =>
    set((state) => ({
      currentAlert: event,
      activeAlertId: event.alert_id || null,
      alertStatus: 'ACTIVE',
      history: [event, ...state.history.filter((item) => item.id !== event.id)],
    })),
  setHistory: (events) =>
    set((state) => ({
      history: [...events, ...state.history].filter(
        (item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index
      ),
    })),
  setAlertsList: (alerts) => set({ alertsList: alerts }),
  updateAlertStatus: (alertId, status) =>
    set((state) => ({
      alertStatus: status,
      alertsList: state.alertsList.map((a) => (a.id === alertId ? { ...a, status } : a)),
      currentAlert: status === 'RESOLVED' ? null : state.currentAlert,
    })),
  clearCurrent: () => set({ currentAlert: null, alertStatus: null }),
}));
