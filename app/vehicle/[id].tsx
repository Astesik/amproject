import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Appbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VehicleDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [vehicle, setVehicle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://192.168.50.105:8080/api/vehicles/get/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicle(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Błąd podczas pobierania danych pojazdu:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 32 }} />;
  }

  if (!vehicle) {
    return (
      <Text style={{ color: theme.colors.onBackground, textAlign: 'center', marginTop: 32 }}>
        Nie znaleziono pojazdu.
      </Text>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.elevation.level2 }}>
        <Appbar.BackAction color={theme.colors.onSurface} onPress={() => router.replace('/vehicles')} />
        <Appbar.Content title="Szczegóły pojazdu" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ color: theme.colors.primary, fontSize: 20, fontWeight: 'bold' }}>
          {vehicle.device?.deviceName}
        </Text>
        <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
          ID: {vehicle.device?.serialNumber}
        </Text>

        <Text style={styles(theme).label}>VIN</Text>
        <Text style={styles(theme).value}>{vehicle.vin}</Text>

        <Text style={styles(theme).label}>Marka</Text>
        <Text style={styles(theme).value}>{vehicle.make}</Text>

        <Text style={styles(theme).label}>Rok produkcji</Text>
        <Text style={styles(theme).value}>{vehicle.productionYear}</Text>

        <Text style={styles(theme).label}>Euro norma</Text>
        <Text style={styles(theme).value}>{vehicle.euroClass}</Text>

        <Text style={styles(theme).label}>Przegląd</Text>
        <Text style={styles(theme).value}>{vehicle.technicalInspection}</Text>

        <Text style={styles(theme).label}>Tachograf</Text>
        <Text style={styles(theme).value}>{vehicle.tachographInspection}</Text>

        <Text style={styles(theme).label}>Właściciel</Text>
        <Text style={styles(theme).value}>{vehicle.ownership}</Text>

        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              color: theme.colors.onBackground,
              fontSize: 16,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            Sekcje dodatkowe
          </Text>

          <TouchableOpacity
            style={styles(theme).button}
            onPress={() => router.push(`/vehicle/${id}/documents`)}
          >
            <Text style={styles(theme).buttonText}>📄 Dokumenty</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles(theme).button}
            onPress={() => router.push(`/vehicle/${id}/repairs`)}
          >
            <Text style={styles(theme).buttonText}>🔧 Historia napraw</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Funkcja styles zależna od theme!
const styles = (theme: any) => ({
  label: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    marginTop: 12,
  },
  value: {
    color: theme.colors.onSurface,
    fontSize: 15,
  },
  button: {
    padding: 12,
    backgroundColor: theme.colors.elevation.level2,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
