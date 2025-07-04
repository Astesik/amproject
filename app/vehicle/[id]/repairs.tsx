import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Appbar,
  ActivityIndicator,
  Text,
  Card,
  Chip,
  Divider,
  useTheme,
} from 'react-native-paper';

export default function RepairsHistoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://192.168.50.105:8080/api/repairs/vehicle/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setRepairs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Błąd podczas pobierania napraw:', err);
        setLoading(false);
      });
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.elevation.level2 }}>
        <Appbar.BackAction color={theme.colors.onSurface} onPress={() => router.back()} />
        <Appbar.Content title="Historia napraw" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : repairs.length === 0 ? (
        <Text style={{ color: theme.colors.onBackground, textAlign: 'center', marginTop: 32 }}>
          Brak napraw dla tego pojazdu.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {repairs.map((repair) => (
            <Card key={repair.id} style={{ marginBottom: 14, backgroundColor: theme.colors.surface }}>
              <Card.Title
                title={`ID: ${repair.id} | ${repair.licensePlates || ''}`}
                subtitle={`${repair.plannedDate || ''} ${repair.plannedTime || ''} • ${repair.placeName || ''}`}
                titleStyle={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}
                subtitleStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}
              />
              <Card.Content>
                <Text style={{ color: theme.colors.onSurface }}>{repair.description}</Text>
                <Divider style={{ marginVertical: 10 }} />
                <Chip
                  icon="information"
                  style={{
                    backgroundColor: theme.colors.elevation.level1,
                    alignSelf: 'flex-start',
                  }}
                  textStyle={{
                    color:
                      repair.status === 'Zakończone'
                        ? theme.colors.primary
                        : theme.colors.secondary,
                  }}
                >
                  {repair.status}
                </Chip>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
