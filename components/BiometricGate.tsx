import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateAsync } from '../lib/biometric';
import { useAuth } from '../context/AuthContext';

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const { token, isTokenValid, logout } = useAuth();

  useEffect(() => {
    (async () => {
      // Jeśli token wygasł → wyloguj od razu!
      if (!isTokenValid(token)) {
        logout();
        setAllowed(false);
        setLoading(false);
        return;
      }
      // Czy biometria włączona? (AsyncStorage na device, możesz użyć SecureStore jeśli chcesz)
      const bio = await AsyncStorage.getItem('biometric-enabled');
      if (bio === '1') {
        const res = await authenticateAsync();
        if (res.success) setAllowed(true);
        else setAllowed(false);
      } else {
        setAllowed(true); // biometria wyłączona
      }
      setLoading(false);
    })();
  }, [token]);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );

  if (!allowed) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 }}>
        <Text>Odmowa biometrii lub anulowano.</Text>
        <Button title="Spróbuj ponownie" onPress={() => setAllowed(true)} />
      </View>
    );
  }

  return <>{children}</>;
}
