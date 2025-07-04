import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { ActivityIndicator, Button, Appbar, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DocumentType = 'REGISTRATION' | 'PHOTO' | 'EMISSION_CERTIFICATE';

export default function DocumentsScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`http://192.168.50.105:8080/api/documents/vehicle/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się pobrać listy dokumentów.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [id, token]);

  const downloadDocument = async (doc: any) => {
    if (!token) {
      Alert.alert('Błąd', 'Brak autoryzacji, zaloguj się ponownie.');
      return;
    }

    let ext = '';
    if (doc.contentType?.includes('pdf')) ext = 'pdf';
    else if (doc.contentType?.includes('jpeg')) ext = 'jpg';
    else if (doc.contentType?.includes('png')) ext = 'png';
    else ext = 'dat';

    let fileName = doc.originalFilename || `dokument_${doc.id}.${ext}`;
    if (!fileName.endsWith(`.${ext}`)) fileName += `.${ext}`;

    const fileUri = FileSystem.cacheDirectory + fileName;

    try {

      const downloadRes = await FileSystem.downloadAsync(
        `http://192.168.50.105:8080/api/documents/download/${doc.id}`,
        fileUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Brak uprawnień', 'Aplikacja nie ma dostępu do plików/zdjęć.');
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
      // Jeśli album nie istnieje, utworzy się nowy
      await MediaLibrary.createAlbumAsync('PobraneDokumenty', asset, false);
      Alert.alert('Sukces', `Dokument został pobrany do urządzenia jako ${fileName}.`);
    } catch (e: any) {
      if (Platform.OS === 'android' && doc.contentType?.includes('pdf')) {
        Alert.alert('Expo Go/Ograniczenie systemu',
          'Nie można pobrać PDF w Expo Go. Zbuduj apkę przez EAS Build, wtedy wszystko zadziała.');
      } else {
        Alert.alert('Błąd pobierania', 'Nie udało się pobrać pliku.');
      }
      console.log('Download error:', e);
    }
  };

  const renderDocumentsByType = (type: DocumentType, label: string) => {
    const filtered = documents.filter((doc) => doc.type === type);
    if (filtered.length === 0) return null;

    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{label}</Text>
        {filtered.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            onPress={() => downloadDocument(doc)}
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles.title, { color: theme.colors.onSurface }]}>{doc.originalFilename}</Text>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>{doc.contentType}</Text>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>
              {(doc.size / 1024).toFixed(1)} KB
            </Text>
            <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>Kliknij aby pobrać</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.elevation.level2 }}>
        <Appbar.BackAction color={theme.colors.onSurface} onPress={() => router.push(`/vehicle/${id}`)} />
        <Appbar.Content title="Dokumenty pojazdu" titleStyle={{ color: theme.colors.onSurface }} />
      </Appbar.Header>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
        style={{ flex: 1 }}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
          <>
            {renderDocumentsByType('REGISTRATION', 'Dowód rejestracyjny')}
            {renderDocumentsByType('PHOTO', 'Zdjęcia pojazdu')}
            {renderDocumentsByType('EMISSION_CERTIFICATE', 'Certyfikat emisji spalin')}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  card: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
  },
});
