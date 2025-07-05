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
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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

    const fileName = `${doc.originalFilename || `dokument_${doc.id}`}.${ext}`;
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
      await MediaLibrary.createAlbumAsync('PobraneDokumenty', asset, false);
      Alert.alert('Sukces', 'Dokument został pobrany do urządzenia.');
    } catch (e) {
      Alert.alert('Błąd pobierania', 'Nie udało się pobrać pliku.');
      console.log('Download error:', e);
    }
  };

  async function handleUpload() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      const type = await askDocumentType();
      if (!type) return;

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
      formData.append('type', type);

      await sendForm(formData);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCameraUpload() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Brak uprawnień', 'Aby korzystać z aparatu, przyznaj uprawnienia.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

    if (!result.canceled && result.assets.length > 0) {
      const image = result.assets[0];
      const type = await askDocumentType();
      if (!type) return;

      const formData = new FormData();
      formData.append('file', {
        uri: image.uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('type', type);

      await sendForm(formData);
    }
  }

  async function sendForm(formData: FormData) {
    if (!token) {
      Alert.alert('Błąd', 'Brak autoryzacji.');
      return;
    }
    const res = await fetch(`http://192.168.50.105:8080/api/documents/upload/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      Alert.alert('Sukces', 'Dokument został dodany.');
      fetchDocuments();
    } else {
      Alert.alert('Błąd', 'Nie udało się przesłać dokumentu.');
    }
  }

  async function askDocumentType(): Promise<DocumentType | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Typ dokumentu',
        'Wybierz typ przesyłanego dokumentu:',
        [
          { text: 'Rejestracyjny', onPress: () => resolve('REGISTRATION') },
          { text: 'Zdjęcie', onPress: () => resolve('PHOTO') },
          { text: 'Emisja spalin', onPress: () => resolve('EMISSION_CERTIFICATE') },
          { text: 'Anuluj', style: 'cancel', onPress: () => resolve(null) },
        ],
        { cancelable: true }
      );
    });
  }

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

        <Button
          mode="contained"
          onPress={() =>
            Alert.alert('Dodaj dokument', 'Wybierz źródło pliku', [
              { text: 'Z aparatu', onPress: handleCameraUpload },
              { text: 'Z plików', onPress: handleUpload },
              { text: 'Anuluj', style: 'cancel' },
            ])
          }
          style={{
            marginTop: 16,
            backgroundColor: theme.colors.primary,
          }}
          textColor={theme.colors.onPrimary}
        >
          Dodaj dokument
        </Button>
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
