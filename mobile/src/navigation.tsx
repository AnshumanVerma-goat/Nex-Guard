import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore, useDeviceStore } from './store';
import { RootStackParamList } from './types';
import {
  DashboardScreen,
  DeviceHealthScreen,
  DeviceSetupScreen,
  EmergencyScreen,
  HistoryScreen,
  LoginScreen,
  OnboardingScreen,
  ProfileScreen,
  RegisterScreen,
} from './screens';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profileComplete = useAuthStore((state) => state.profileComplete);
  const configured = useDeviceStore((state) => state.configured);
  const phase = `${isAuthenticated}-${profileComplete}-${configured}`;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator key={phase} screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
          </>
        ) : !profileComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : !configured ? (
          <Stack.Screen name="DeviceSetup" component={DeviceSetupScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="DeviceHealth" component={DeviceHealthScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
