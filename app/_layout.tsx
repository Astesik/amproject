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
    // Jeśli nie ma tokenu, kieruj na login, nawet jak user wpisze ręcznie adres tabsów!
    if (!loading) {
      if (!token || !isTokenValid(token)) {
        if (segments[0] !== '(auth)') {
          router.replace('/(auth)/login');
        }
      } else {
        // Token ważny → jak user jest na loginie, to przenieś do tabsów
        if (segments[0] === '(auth)') {
          router.replace('/(tabs)/dashboard');
        }
      }
    }
  }, [token, loading, segments]);

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} />;

  // Jeżeli nie ma tokenu, renderuj tylko login!
  if (!token || !isTokenValid(token)) {
    if (segments[0] === '(auth)') {
      return <Slot />;
    }
    // Jeśli user na innej ścieżce (ręcznie), to i tak przenieśliśmy go na login wyżej!
    return null;
  }

  // Token jest — bramka biometryczna przed całym Slotem
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
