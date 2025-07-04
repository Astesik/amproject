import React from 'react';
import { Slot, useSegments, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { BiometricGate } from '../components/BiometricGate'

function AppContent() {
  const { token, loading, isTokenValid } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!token || !isTokenValid(token)) {
        if (segments[0] !== '(auth)') {
          router.replace('/(auth)/login');
        }
      } else {
        if (segments[0] === '(auth)') {
          router.replace('/(tabs)/dashboard');
        }
      }
    }
  }, [token, loading, segments]);

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  if (!token || !isTokenValid(token)) {
    if (segments[0] === '(auth)') {
      return <Slot />;
    }
    return null;
  }

  return (
    <BiometricGate>
      <Slot />
    </BiometricGate>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
