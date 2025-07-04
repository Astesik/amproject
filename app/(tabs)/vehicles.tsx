import React, { useEffect, useState } from 'react';
import { View, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon, Text, useTheme } from 'react-native-paper';

export default function VehiclesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://192.168.50.105:8080/api/vehicles/get')
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setFilteredVehicles(data);
      });
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredVehicles(
      vehicles.filter((v) => v.licensePlate?.toLowerCase().includes(q))
    );
  }, [search, vehicles]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/vehicle/${item.id}`)}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 12,
        marginVertical: 6,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        elevation: 2,
        borderWidth: 1,
        borderColor: theme.colors.outlineVariant,
      }}
    >
      <View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.primary }}>
          {item.device?.deviceName || 'Pojazd'}
        </Text>
        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
          ID: <Text style={{ fontFamily: 'monospace', color: theme.colors.onSurface }}>{item.device?.serialNumber || '-'}</Text>
        </Text>
      </View>
      <Icon source="chevron-right" size={28} color={theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: 12 }}>
      <TextInput
        placeholder="Szukaj po numerze rejestracyjnym..."
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: theme.colors.elevation.level2,
          color: theme.colors.onSurface,
          padding: 12,
          margin: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
        }}
      />
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        onEndReachedThreshold={0.3}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
      />
    </View>
  );
}
