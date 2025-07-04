import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { ActivityIndicator, useTheme, Card, Text, Button, Chip } from 'react-native-paper';
import * as ExpoCalendar from 'expo-calendar';
import { useFocusEffect } from '@react-navigation/native';

const API = 'http://192.168.50.105:8080';

export default function RepairsCalendarScreen() {
  const theme = useTheme();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [repairsByDay, setRepairsByDay] = useState<{ [date: string]: any[] }>({});

  // Odświeżanie na wejście na ekran
  useFocusEffect(
    React.useCallback(() => {
      const fetchCalendar = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API}/api/repairs/grouped-by-week`);
          const data = await res.json();
          const allRepairs: any[] = data.flatMap((group: any) => group.repairs);

          // Mapa: { [date]: [repairs, ...] }
          const repairsMap: { [date: string]: any[] } = {};
          for (const r of allRepairs) {
            if (r.plannedDate) {
              if (!repairsMap[r.plannedDate]) repairsMap[r.plannedDate] = [];
              repairsMap[r.plannedDate].push(r);
            }
          }

          setRepairsByDay(repairsMap);

          setCalendarEvents(
            allRepairs.map((r) => ({
              date: r.plannedDate,
            }))
          );
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };

      fetchCalendar();
    }, [])
  );

  const marked = calendarEvents.reduce((acc, ev) => {
    acc[ev.date] = { marked: true, dotColor: theme.colors.primary };
    return acc;
  }, {} as any);

  // Dodanie wydarzenia do natywnego kalendarza
  async function addRepairToCalendar(repair: any) {
    try {
      const { status } = await ExpoCalendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Nie przyznano uprawnień do kalendarza');
        return;
      }
      const calendars = await ExpoCalendar.getCalendarsAsync(ExpoCalendar.EntityTypes.EVENT);

      if (!calendars || calendars.length === 0) {
        Alert.alert(
          'Brak kalendarza',
          'Nie znaleziono żadnego kalendarza w Twoim telefonie. Dodaj konto Google lub skonfiguruj Kalendarz w ustawieniach telefonu.'
        );
        return;
      }

      const defaultCalendar = calendars.find((c) => c.allowsModifications) || calendars[0];
      if (!defaultCalendar || !defaultCalendar.id) {
        Alert.alert(
          'Brak kalendarza',
          'Brak kalendarza z uprawnieniami do zapisu. Dodaj konto Google lub skonfiguruj Kalendarz.'
        );
        return;
      }

      const dateStr = repair.plannedDate;
      const timeStr = repair.plannedTime ? repair.plannedTime.slice(0, 5) : "09:00";
      const startDateTime = new Date(`${dateStr}T${timeStr}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1h

      const eventId = await ExpoCalendar.createEventAsync(defaultCalendar.id, {
        title: `Naprawa: ${repair.licensePlates || repair.description}`,
        startDate: startDateTime,
        endDate: endDateTime,
        notes: `${repair.description}\nMiejsce: ${repair.placeName || ''}`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: repair.placeName || '',
      });

      if (eventId) {
        Alert.alert('Sukces', 'Dodano do kalendarza telefonu!');
      } else {
        Alert.alert('Błąd', 'Nie udało się dodać wydarzenia (brak eventId)');
      }
    } catch (e: any) {
      console.error('addRepairToCalendar error:', e, e?.message);
      Alert.alert(
        'Błąd',
        'Nie udało się dodać wydarzenia do kalendarza. Upewnij się, że masz skonfigurowany Kalendarz na swoim telefonie.'
      );
    }
  }

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Calendar
        style={{ marginTop: 16 }}
        markedDates={{
          ...marked,
          ...(selectedDate && {
            [selectedDate]: {
              ...(marked[selectedDate] || {}),
              selected: true,
              selectedColor: theme.colors.primary,
            },
          }),
        }}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          dayTextColor: theme.colors.onBackground,
          monthTextColor: theme.colors.onBackground,
          arrowColor: theme.colors.primary,
          todayTextColor: theme.colors.primary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.onPrimary || '#fff',
        }}
        onDayPress={(day) => setSelectedDate(day.dateString)}
      />

      <ScrollView style={{ flex: 1, marginTop: 10, paddingHorizontal: 10 }}>
        {selectedDate && repairsByDay[selectedDate] ? (
          repairsByDay[selectedDate].map((repair, idx) => (
            <Card key={repair.id || idx} style={{ marginBottom: 12, backgroundColor: theme.colors.surface }}>
              <Card.Title
                title={`Pojazd: ${repair.licensePlates || '-'}`}
                subtitle={`${repair.plannedTime?.slice(0, 5) || ''} | ${repair.placeName || ''}`}
              />
              <Card.Content>
                <Text style={{ color: theme.colors.onSurface }}>{repair.description}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center' }}>
                  <Chip
                    icon="information"
                    style={{ backgroundColor: theme.colors.elevation?.level1 || '#EEE', marginRight: 6 }}
                  >
                    {repair.status}
                  </Chip>
                  <Button
                    mode="text"
                    onPress={() => addRepairToCalendar(repair)}
                    style={{ marginLeft: 8 }}
                  >
                    Dodaj do kalendarza
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : selectedDate ? (
          <Text style={{ marginTop: 24, textAlign: 'center', color: theme.colors.onSurface }}>
            Brak napraw w tym dniu.
          </Text>
        ) : (
          <Text style={{ marginTop: 24, textAlign: 'center', color: theme.colors.onSurface }}>
            Wybierz dzień, aby zobaczyć naprawy.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}
