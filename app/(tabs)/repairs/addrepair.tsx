import React, { useState, useEffect } from 'react';
import { View, ScrollView, TextInput, Alert, Pressable, Platform } from 'react-native';
import { Appbar, Button, Dialog, Portal, useTheme, List, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const API = 'http://192.168.50.105:8080';

const initialForm = {
  vehicleId: '',
  vehicleName: '',
  placeId: '',
  placeName: '',
  description: '',
  plannedDate: '',
  plannedTime: '',
  status: 'Zaplanowana',
};

export default function AddRepair() {
  const theme = useTheme();
  const navigation = useNavigation();

  const [form, setForm] = useState(initialForm);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [placeDialog, setPlaceDialog] = useState(false);
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const fetchData = async () => {
    try {
      const [vehiclesRes, placesRes] = await Promise.all([
        fetch(`${API}/api/vehicles/get`).then((r) => r.json()),
        fetch(`${API}/api/places`).then((r) => r.json()),
      ]);
      setVehicles(vehiclesRes);
      setPlaces(placesRes);
    } catch (e) {
      console.error('Błąd ładowania:', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveRepair = async () => {
    try {
      const res = await fetch(`${API}/api/repairs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm(initialForm);
        Alert.alert('Sukces', 'Naprawa została dodana');
        navigation.goBack();
      } else {
        Alert.alert('Błąd', 'Nie udało się zapisać naprawy');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    (v.licensePlate || '').toLowerCase().includes(vehicleQuery.toLowerCase())
  );
  const filteredPlaces = places.filter(p =>
    (p.name || '').toLowerCase().includes(placeQuery.toLowerCase())
  );

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      setForm({ ...form, plannedDate: `${yyyy}-${mm}-${dd}` });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hh = String(selectedTime.getHours()).padStart(2, '0');
      const min = String(selectedTime.getMinutes()).padStart(2, '0');
      setForm({ ...form, plannedTime: `${hh}:${min}` });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <TextInput
          placeholder="Opis"
          placeholderTextColor={theme.colors.onSurface + '99'}
          value={form.description}
          onChangeText={(text) => setForm({ ...form, description: text })}
          style={{
            borderRadius: 8,
            marginBottom: 12,
            backgroundColor: theme.colors.surface,
            color: theme.colors.onSurface,
            borderColor: theme.colors.outline,
            padding: 10,
          }}
        />

        <Pressable onPress={() => setShowDatePicker(true)}>
          <View
            style={{
              borderRadius: 8,
              marginBottom: 12,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
              borderWidth: 1,
              padding: 10,
            }}>
            <Text style={{ color: form.plannedDate ? theme.colors.onSurface : theme.colors.onSurface + '99' }}>
              {form.plannedDate ? `Data: ${form.plannedDate}` : 'Wybierz datę'}
            </Text>
          </View>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={form.plannedDate ? new Date(form.plannedDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={onDateChange}
          />
        )}


        <Pressable onPress={() => setShowTimePicker(true)}>
          <View
            style={{
              borderRadius: 8,
              marginBottom: 12,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
              borderWidth: 1,
              padding: 10,
            }}>
            <Text style={{ color: form.plannedTime ? theme.colors.onSurface : theme.colors.onSurface + '99' }}>
              {form.plannedTime ? `Godzina: ${form.plannedTime}` : 'Wybierz godzinę'}
            </Text>
          </View>
        </Pressable>
        {showTimePicker && (
          <DateTimePicker
            value={
              form.plannedTime
                ? new Date(`1970-01-01T${form.plannedTime}:00`)
                : new Date()
            }
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
            is24Hour={true}
          />
        )}

        <Button mode="outlined" onPress={() => setVehicleDialog(true)}>
          {form.vehicleId ? `Pojazd: ${form.vehicleName}` : 'Wybierz pojazd'}
        </Button>

        <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => setPlaceDialog(true)}>
          {form.placeId ? `Miejsce: ${form.placeName}` : 'Wybierz miejsce'}
        </Button>

        <Button mode="contained" onPress={saveRepair} style={{ marginTop: 20 }}>
          Zapisz
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={vehicleDialog}
          onDismiss={() => setVehicleDialog(false)}
          style={{
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            elevation: 6,
          }}
        >
          <Dialog.Title
            style={{
              fontWeight: 'bold',
              fontSize: 18,
              color: theme.colors.primary,
              marginBottom: 4,
            }}
          >
            Wybierz pojazd
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View
              style={{
                  marginTop: 10,
                paddingHorizontal: 12,
                paddingBottom: 6,
              }}
            >
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: theme.colors.elevation?.level2 || '#f3f3f3',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  shadowColor: theme.colors.shadow,
                  shadowOpacity: 0.07,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <List.Icon icon="car" color={theme.colors.primary} style={{ marginRight: 2, marginLeft: 4 }} />
                <TextInput
                  placeholder="Szukaj pojazdu"
                  placeholderTextColor={theme.colors.onSurface + '80'}
                  value={vehicleQuery}
                  onChangeText={setVehicleQuery}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    paddingVertical: 8,
                    backgroundColor: 'transparent',
                    color: theme.colors.onSurface,
                    borderWidth: 0,
                  }}
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>
            <ScrollView style={{ maxHeight: 300, paddingHorizontal: 8 }}>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <List.Item
                    key={v.id}
                    titleStyle={{ color: theme.colors.onSurface, fontWeight: '600', fontSize: 15 }}
                    title={`${v.licensePlate}`}
                    style={{
                      backgroundColor: theme.colors.elevation?.level1 || '#f7f7f7',
                      marginVertical: 2,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                    }}
                    onPress={() => {
                      setForm({ ...form, vehicleId: v.id, vehicleName: v.licensePlate });
                      setVehicleDialog(false);
                    }}
                    left={props => <List.Icon {...props} icon="car" color={theme.colors.primary} />}
                  />
                ))
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 12 }}>
                  Brak wyników
                </Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog
          visible={placeDialog}
          onDismiss={() => setPlaceDialog(false)}
          style={{
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            elevation: 6,
          }}
        >
          <Dialog.Title
            style={{
              fontWeight: 'bold',
              fontSize: 18,
              color: theme.colors.primary,
              marginBottom: 4,
            }}
          >
            Wybierz miejsce
          </Dialog.Title>
          <Dialog.ScrollArea>
            <View
              style={{
                  marginTop: 10,
                paddingHorizontal: 12,
                paddingBottom: 6,
              }}
            >
              <View
                style={{
                  borderRadius: 12,
                  backgroundColor: theme.colors.elevation?.level2 || '#f3f3f3',
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  shadowColor: theme.colors.shadow,
                  shadowOpacity: 0.07,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                <List.Icon icon="map-marker" color={theme.colors.primary} style={{ marginRight: 2, marginLeft: 4 }} />
                <TextInput
                  placeholder="Szukaj miejsca"
                  placeholderTextColor={theme.colors.onSurface + '80'}
                  value={placeQuery}
                  onChangeText={setPlaceQuery}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    paddingVertical: 8,
                    backgroundColor: 'transparent',
                    color: theme.colors.onSurface,
                    borderWidth: 0,
                  }}
                  underlineColorAndroid="transparent"
                />
              </View>
            </View>
            <ScrollView style={{ maxHeight: 300, paddingHorizontal: 8 }}>
              {filteredPlaces.length > 0 ? (
                filteredPlaces.map((p) => (
                  <List.Item
                    key={p.id}
                    titleStyle={{ color: theme.colors.onSurface, fontWeight: '600', fontSize: 15 }}
                    title={`${p.name}`}
                    style={{
                      backgroundColor: theme.colors.elevation?.level1 || '#f7f7f7',
                      marginVertical: 2,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                    }}
                    onPress={() => {
                      setForm({ ...form, placeId: p.id, placeName: p.name });
                      setPlaceDialog(false);
                    }}
                    left={props => <List.Icon {...props} icon="map-marker" color={theme.colors.primary} />}
                  />
                ))
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 12 }}>
                  Brak wyników
                </Text>
              )}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
    </View>
  );
}
