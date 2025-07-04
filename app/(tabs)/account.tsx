// app/(tabs)/account.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card, Text, Button, Avatar, List, Switch, Divider, useTheme,
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useThemeMode } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasHardwareAsync, isEnrolledAsync } from '../../lib/biometric';
import { useNavigation } from '@react-navigation/native';

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const navigation = useNavigation();

  const [bioEnabled, setBioEnabled] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem('biometric-enabled').then((v) => setBioEnabled(v === '1'));
  }, []);

  async function handleBioSwitch(value: boolean) {
    if (value) {
      if (await hasHardwareAsync() && await isEnrolledAsync()) {
        await AsyncStorage.setItem('biometric-enabled', '1');
        setBioEnabled(true);
      } else {
        alert('Nie wykryto biometrii lub nie masz skonfigurowanych odcisków/FaceID.');
      }
    } else {
      await AsyncStorage.setItem('biometric-enabled', '0');
      setBioEnabled(false);
    }
  }

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: '(auth)/login' }] });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ height: 28 }} />
      <View style={styles.avatarContainer}>
        <Avatar.Text
          label={user?.username ? user.username[0].toUpperCase() : '?'}
          size={92}
          style={[
            styles.avatar,
            { backgroundColor: theme.colors.primary, borderColor: theme.colors.background },
          ]}
          color="white"
        />
        <Text style={[styles.username, { color: theme.colors.onBackground }]}>
          {user?.username || 'Użytkownik'}
        </Text>
        <Text style={[styles.email, { color: theme.colors.onSurfaceVariant }]}>
          {user?.email}
        </Text>
      </View>

      <Card style={[styles.settingsCard, { backgroundColor: theme.colors.elevation.level2 }]}>
        <Card.Title title="Ustawienia konta" />
        <Divider />
        <List.Item
          title="Tryb ciemny"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => <Switch value={mode === 'dark'} onValueChange={toggleTheme} />}
          description={mode === 'dark' ? 'Ciemny' : 'Jasny'}
        />
        <Divider />
        <List.Item
          title="Logowanie biometryczne"
          left={(props) => <List.Icon {...props} icon="fingerprint" />}
          right={() => <Switch value={bioEnabled} onValueChange={handleBioSwitch} />}
          description={bioEnabled ? 'Włączone' : 'Wyłączone'}
        />
        <Divider />
        <List.Item
          title="Zmień hasło"
          left={(props) => <List.Icon {...props} icon="lock-reset" />}
          onPress={() => {}}
          description="(Wkrótce dostępne)"
          disabled
        />
      </Card>

      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor={theme.colors.error}
        textColor={theme.colors.onError}
        icon="logout"
        uppercase={false}
      >
        Wyloguj
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 0 },
  avatarContainer: { alignItems: 'center', marginBottom: 16, width: '100%' },
  avatar: { marginBottom: 6, borderWidth: 4, elevation: 5 },
  username: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  email: { marginBottom: 8 },
  settingsCard: { width: '92%', marginBottom: 18, elevation: 2 },
  logoutButton: { marginTop: 10, borderRadius: 8, paddingVertical: 6, elevation: 3, width: '92%' },
});
