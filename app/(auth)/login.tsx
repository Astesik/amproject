// app/(auth)/login.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  ActivityIndicator,
  Avatar,
  Text,
  useTheme
} from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

const BG_IMG = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80';

export default function LoginScreen() {
  const [username, setUsername] = useState('JSikora');
  const [password, setPassword] = useState('JSikora');
  const { login, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      await login(username, password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      alert('Błąd logowania: ' + err.message);
    }
  };

  const overlayColor = theme.dark
    ? 'rgba(20,20,20,0.80)'
    : 'rgba(15, 30, 50, 0.36)';

  return (
    <ImageBackground
      source={{ uri: BG_IMG }}
      style={styles.bg}
      blurRadius={theme.dark ? 3 : 2}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { backgroundColor: overlayColor }]} />
      <View style={styles.container}>
        <Card style={[
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level3,
            shadowColor: theme.colors.shadow,
            borderColor: theme.colors.outlineVariant,
          }
        ]}>
          <Card.Content>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Avatar.Icon
                icon="account-circle"
                size={60}
                style={{ backgroundColor: theme.colors.primary, marginBottom: 4 }}
                color={theme.colors.onPrimary}
              />
              <Title style={[styles.title, { color: theme.colors.primary }]}>Zaloguj się</Title>
            </View>
            <TextInput
              label="Użytkownik"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              left={<TextInput.Icon icon="account" color={theme.colors.onSurfaceVariant} />}
              underlineColor={theme.colors.outline}
              activeUnderlineColor={theme.colors.primary}
              selectionColor={theme.colors.primary}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              theme={{
                colors: {
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                  primary: theme.colors.primary,
                  background: theme.colors.surface,
                  underlineColor: theme.colors.primary,
                }
              }}
            />
            <TextInput
              label="Hasło"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              left={<TextInput.Icon icon="lock" color={theme.colors.onSurfaceVariant} />}
              underlineColor={theme.colors.outline}
              activeUnderlineColor={theme.colors.primary}
              selectionColor={theme.colors.primary}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              theme={{
                colors: {
                  text: theme.colors.onSurface,
                  placeholder: theme.colors.onSurfaceVariant,
                  primary: theme.colors.primary,
                  background: theme.colors.surface,
                  underlineColor: theme.colors.primary,
                }
              }}
            />
            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              style={[
                styles.loginButton,
                { backgroundColor: theme.colors.primary }
              ]}
              textColor={theme.colors.onPrimary}
              contentStyle={{ paddingVertical: 6 }}
            >
              Zaloguj
            </Button>
            <Text style={[styles.tip, { color: theme.colors.onSurfaceVariant }]}>
              Nie masz konta? Skontaktuj się z administratorem.
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    elevation: 6,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  input: {
    marginBottom: 10,
    borderRadius: 6,
  },
  loginButton: {
    marginTop: 12,
    borderRadius: 8,
    elevation: 2,
  },
  tip: {
    marginTop: 14,
    fontSize: 12,
    textAlign: 'center',
  },
});
