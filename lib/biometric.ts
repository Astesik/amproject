import * as LocalAuthentication from 'expo-local-authentication';

export async function hasHardwareAsync() {
  return await LocalAuthentication.hasHardwareAsync();
}

export async function isEnrolledAsync() {
  return await LocalAuthentication.isEnrolledAsync();
}

export async function authenticateAsync() {
  return await LocalAuthentication.authenticateAsync({
    promptMessage: 'Potwierdź tożsamość',
    fallbackLabel: 'Użyj kodu',
    disableDeviceFallback: false,
  });
}
