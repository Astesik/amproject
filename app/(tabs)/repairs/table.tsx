import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  ActivityIndicator,
  useTheme,
  Card,
  Text,
  IconButton,
  Divider,
  Chip,
  Dialog,
  Portal,
  TextInput,
  Button,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';

const API = 'http://192.168.50.105:8080';

export default function TableScreen() {
  const theme = useTheme();
  const [groupedRepairs, setGroupedRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // MODAL: szczegóły
  const [detailsModal, setDetailsModal] = useState<{ visible: boolean; repair: any | null }>({ visible: false, repair: null });
  // MODAL: edycja
  const [editModal, setEditModal] = useState<{ visible: boolean; repair: any | null }>({ visible: false, repair: null });
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API}/api/repairs/grouped-by-week`);
          const data = await res.json();
          setGroupedRepairs(data);
        } catch (e) {
          console.error('Błąd ładowania:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [])
  );

  // Usuwanie naprawy
  const handleDelete = async (repairId: number) => {
    Alert.alert(
      "Potwierdź usunięcie",
      "Czy na pewno chcesz usunąć tę naprawę?",
      [
        { text: "Anuluj", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${API}/api/repairs/${repairId}`, { method: "DELETE" });
              setGroupedRepairs((prev) =>
                prev.map((week) => ({
                  ...week,
                  repairs: week.repairs.filter((r: any) => r.id !== repairId)
                }))
              );
            } catch (e) {
              Alert.alert("Błąd", "Nie udało się usunąć naprawy");
            }
          }
        }
      ]
    );
  };

  // Otwórz modal szczegółów
  const openDetails = (repair: any) => setDetailsModal({ visible: true, repair });
  const closeDetails = () => setDetailsModal({ visible: false, repair: null });

  // Otwórz modal edycji
  const openEdit = (repair: any) => {
    setEditForm({
      description: repair.description || '',
      status: repair.status || 'Zaplanowane',
    });
    setEditModal({ visible: true, repair });
  };
  const closeEdit = () => setEditModal({ visible: false, repair: null });

  // Zapisz edycję
  const handleEditSave = async () => {
    if (!editModal.repair) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/repairs/${editModal.repair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editModal.repair, ...editForm }),
      });
      if (res.ok) {
        const updated = await res.json();
        setGroupedRepairs((prev) =>
          prev.map((week) => ({
            ...week,
            repairs: week.repairs.map((r: any) =>
              r.id === updated.id ? updated : r
            ),
          }))
        );
        closeEdit();
      } else {
        Alert.alert('Błąd', 'Nie udało się zapisać zmian');
      }
    } catch (e) {
      Alert.alert('Błąd', 'Błąd sieci');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {groupedRepairs
            .filter((week: any) => week.repairs && week.repairs.length > 0)
            .map((week: any) => (
              <View key={week.weekStart} style={{ marginBottom: 24 }}>
                <Text style={[styles.weekTitle, { color: theme.colors.primary }]}>
                  {week.weekStart} – {week.weekEnd}
                </Text>
                <Divider style={{ marginVertical: 4 }} />
                {week.repairs.map((r: any) => (
                  <Card
                    key={r.id}
                    style={[styles.repairCard, { backgroundColor: theme.colors.surface }]}
                    onPress={() => openDetails(r)}
                    mode="elevated"
                  >
                    <Card.Title
                      title={
                        <Text style={[styles.repairTitle, { color: theme.colors.primary }]}>
                          {r.licensePlate || r.licensePlates || "–"}
                        </Text>
                      }
                      subtitle={
                        <Text style={{ color: theme.colors.onSurface }}>
                          {r.placeName || 'Brak miejsca'} | {r.plannedDate} {r.plannedTime?.slice(0,5)}
                        </Text>
                      }
                      right={() => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <IconButton
                            icon="pencil"
                            size={22}
                            onPress={() => openEdit(r)}
                            style={{ margin: 0 }}
                            accessibilityLabel="Edytuj"
                          />
                          <IconButton
                            icon="delete"
                            size={22}
                            onPress={() => handleDelete(r.id)}
                            style={{ margin: 0 }}
                            accessibilityLabel="Usuń"
                          />
                        </View>
                      )}
                    />
                    <Card.Content>
                      <Text style={{ color: theme.colors.onSurface }}>
                        {r.description}
                      </Text>
                      <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center', gap: 6 }}>
                        <Chip
                          icon="information"
                          style={{ backgroundColor: theme.colors.elevation?.level1 || '#EEE', marginRight: 6 }}
                          textStyle={{
                            color:
                              r.status === "Zaplanowane"
                                ? theme.colors.secondary
                                : r.status === "Zakończone"
                                ? theme.colors.primary
                                : theme.colors.onSurface,
                          }}
                        >
                          {r.status}
                        </Chip>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ))}
          {groupedRepairs.filter((w: any) => w.repairs && w.repairs.length > 0).length === 0 && (
            <Text style={{ color: theme.colors.onSurface, marginTop: 40, textAlign: 'center' }}>
              Brak napraw do wyświetlenia.
            </Text>
          )}
        </ScrollView>
      )}

      {/* MODALE */}
      <Portal>
        {/* Szczegóły */}
        <Dialog visible={detailsModal.visible} onDismiss={closeDetails}>
          <Dialog.Title>Szczegóły naprawy</Dialog.Title>
          <Dialog.Content>
            {detailsModal.repair && (
              <>
                <Text>ID: {detailsModal.repair.id}</Text>
                <Text>Pojazd: {detailsModal.repair.licensePlates}</Text>
                <Text>Miejsce: {detailsModal.repair.placeName}</Text>
                <Text>Data: {detailsModal.repair.plannedDate} {detailsModal.repair.plannedTime?.slice(0,5)}</Text>
                <Text>Status: {detailsModal.repair.status}</Text>
                <Text>Opis: {detailsModal.repair.description}</Text>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDetails}>Zamknij</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edycja */}
        <Dialog visible={editModal.visible} onDismiss={closeEdit}>
          <Dialog.Title>Edycja naprawy</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Opis"
              value={editForm.description}
              onChangeText={(text) => setEditForm((f: any) => ({ ...f, description: text }))}
              style={{ marginBottom: 12 }}
            />
            <Text>Status:</Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {['Zaplanowane', 'Zakończone', 'Pilne'].map((status) => (
                <Chip
                  key={status}
                  style={{ marginRight: 8 }}
                  selected={editForm.status === status}
                  onPress={() => setEditForm((f: any) => ({ ...f, status }))}
                >
                  {status}
                </Chip>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeEdit}>Anuluj</Button>
            <Button onPress={handleEditSave} loading={saving} disabled={saving}>
              Zapisz
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  weekTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  repairCard: {
    marginBottom: 14,
    borderRadius: 12,
    elevation: 2,
  },
  repairTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
