import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  Image,
  Pressable,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import {
  Appbar,
  useTheme,
  Drawer,
  Portal,
  ActivityIndicator,
  Text,
  Modal,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getGroups, getVehicles } from '@/services/vehicleService';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

const DRAWER_WIDTH = 320;

export default function MapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  // Lokalizacja użytkownika
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);

  // Grupy, pojazdy i stan mapy
  const [groups, setGroups] = useState<{ label: string; value: string }[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groupDrawerVisible, setGroupDrawerVisible] = useState(false);
  const [vehicleDrawerVisible, setVehicleDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const vehiclesRef = useRef<any[]>([]);
  const groupDrawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const vehicleDrawerAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current; // tu też -DRAWER_WIDTH

  // Widoczny region mapy (viewport)
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 52,
    longitude: 19,
    latitudeDelta: 4,
    longitudeDelta: 4,
  });

  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status === 'granted') {
        const freshLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        setLocation(freshLoc);

        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 2000,
            distanceInterval: 1,
          },
          (loc) => setLocation(loc)
        );
        locationWatcher.current = watcher;
      }
    })();

    return () => {
      if (locationWatcher.current) {
        locationWatcher.current.remove();
      }
    };
  }, []);


  const isMarkerVisible = useCallback(
    (marker: any) => {
      if (!marker.latitude || !marker.longitude) return false;
      const lat = parseFloat(marker.latitude);
      const lon = parseFloat(marker.longitude);
      const { latitude, longitude, latitudeDelta, longitudeDelta } = mapRegion;
      return (
        lat <= latitude + latitudeDelta / 2 &&
        lat >= latitude - latitudeDelta / 2 &&
        lon <= longitude + longitudeDelta / 2 &&
        lon >= longitude - longitudeDelta / 2
      );
    },
    [mapRegion]
  );

  // Drawer otwarty/wyłączony
  const toggleDrawer = (drawer: 'group' | 'vehicle', open: boolean) => {
    if (drawer === 'group') {
      if (open) {
        setVehicleDrawerVisible(false);
        Animated.timing(groupDrawerAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start(() => setGroupDrawerVisible(true));
      } else {
        Animated.timing(groupDrawerAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: false,
        }).start(() => setGroupDrawerVisible(false));
      }
    } else if (drawer === 'vehicle') {
      setGroupDrawerVisible(false);
      Animated.timing(vehicleDrawerAnim, {
        toValue: open ? 0 : -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setVehicleDrawerVisible(open));
    }
  };

  // Otwarcie bottomsheet ze szczegółami pojazdu
  const openVehicleDetails = async (vehicle: any) => {
    try {
      const [detailsRes, positionRes] = await Promise.all([
        fetch(`http://192.168.50.105:8080/api/vehicles/details/by-device/${vehicle.deviceId}`),
        fetch(`http://192.168.50.105:8080/api/positions/get/${vehicle.deviceId}`)
      ]);
      const detailsData = await detailsRes.json();
      const positionData = await positionRes.json();
      const combined = {
        ...detailsData,
        ...positionData,
        device: {
          deviceName: positionData.deviceName,
          serialNumber: positionData.deviceId
        }
      };
      setVehicleDetails(combined);
      setDetailsVisible(true);
    } catch (e) {
      console.error('Błąd pobierania danych pojazdu', e);
    }
  };

  // Pobieranie grup/pojazdów
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadData = async () => {
        setLoading(true);
        const [grp, veh] = await Promise.all([getGroups(), getVehicles(selectedGroup)]);
        if (!isActive) return;
        setGroups(grp);
        vehiclesRef.current = veh;
        setLoading(false);
      };
      loadData();
      const interval = setInterval(loadData, 30000);
      return () => {
        isActive = false;
        vehiclesRef.current = [];
        clearInterval(interval);
      };
    }, [selectedGroup])
  );

  // Obrazek markera pojazdu
  const getVehicleImage = (v: any) => {
    if (v.ignitionState !== 'ON') return require('@/assets/truck_off.png');
    if (v.speed === 0) return require('@/assets/truck_slow.png');
    if (v.speed < 60) return require('@/assets/truck_slow.png');
    if (v.speed < 80) return require('@/assets/truck_medium.png');
    return require('@/assets/truck_fast.png');
  };

  // --- style ---
  const drawerStyles = {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    zIndex: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    paddingTop: insets.top + 16,
    paddingHorizontal: 8,
    elevation: 6,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={mapRegion}
        onRegionChangeComplete={(region) => setMapRegion(region)}
        followsUserLocation={false}
      >
        {/* Twoje markery pojazdów */}
        {!loading &&
          vehiclesRef.current
            .filter(isMarkerVisible)
            .map((v) => (
              <Marker
                key={v.deviceId || v.id}
                coordinate={{
                  latitude: parseFloat(v.latitude),
                  longitude: parseFloat(v.longitude),
                }}
                rotation={v.heading || 0}
                flat
                anchor={{ x: 0.5, y: 0.5 }}
                onPress={() => openVehicleDetails(v)}
              >
                <View style={{ alignItems: 'center' }}>
                  <Image
                    source={getVehicleImage(v)}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                  <Text style={{ fontSize: 10, marginTop: 2, color: theme.colors.onSurface }}>
                    {v.deviceName || v.licensePlate}
                  </Text>
                </View>
              </Marker>
            ))
        }
        {/* Własny marker lokalizacji użytkownika */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Twoja lokalizacja"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: 'dodgerblue', borderWidth: 3, borderColor: '#fff'
            }} />
          </Marker>
        )}
      </MapView>

      {loading && (
        <ActivityIndicator
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginLeft: -12,
            marginTop: -12,
          }}
          size="large"
        />
      )}

      {/* Przycisk centrowania na użytkowniku */}
      <TouchableOpacity
        style={[styles(theme).smallButton, { position: 'absolute', bottom: 124, right: 16, zIndex: 11 }]}
        onPress={() => {
          if (location && mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }
        }}
      >
        <MaterialIcons name="my-location" size={24} color={theme.colors.onPrimary} />
      </TouchableOpacity>

      {/* Przyciski drawerów */}
      <View style={styles(theme).bottomButtonsContainer}>
        <TouchableOpacity onPress={() => toggleDrawer('group', true)} style={styles(theme).smallButton}>
          <Appbar.Action icon="account-group" color={theme.colors.onPrimary} size={18} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleDrawer('vehicle', true)} style={styles(theme).smallButton}>
          <Appbar.Action icon="car-multiple" color={theme.colors.onPrimary} size={18} />
        </TouchableOpacity>
      </View>

      <Portal>
        {/* Group Drawer (z lewej) */}
        {groupDrawerVisible && (
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => toggleDrawer('group', false)}
          />
        )}
        <Animated.View style={[drawerStyles, { left: groupDrawerAnim }]}>
          <Drawer.Section title="Wybierz grupę">
            <FlatList
              data={groups}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Drawer.Item
                  label={String(item.label)}
                  active={item.value === selectedGroup}
                  onPress={() => {
                    setSelectedGroup(item.value);
                    toggleDrawer('group', false);
                  }}
                />
              )}
            />
          </Drawer.Section>
        </Animated.View>

        {/* Vehicle Drawer */}
        {vehicleDrawerVisible && (
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => toggleDrawer('vehicle', false)}
          />
        )}
        <Animated.View style={[drawerStyles, { left: vehicleDrawerAnim }]}>
          <Text style={{ margin: 16, fontWeight: 'bold', color: theme.colors.onSurface }}>Lista pojazdów</Text>
          <FlatList
            data={vehiclesRef.current}
            keyExtractor={(item) => item.deviceId || item.id}
            renderItem={({ item }) => (
              <Drawer.Item
                label={String(item.deviceName || item.licensePlate || 'Nieznany')}
                onPress={() => {
                  mapRef.current?.animateToRegion({
                    latitude: parseFloat(item.latitude),
                    longitude: parseFloat(item.longitude),
                    latitudeDelta: 1,
                    longitudeDelta: 1,
                  });
                  toggleDrawer('vehicle', false);
                }}
              />
            )}
          />
        </Animated.View>
      </Portal>

      {/* Bottom sheet z detalami pojazdu */}
      <Portal>
        <Modal
          visible={detailsVisible}
          onDismiss={() => setDetailsVisible(false)}
          contentContainerStyle={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colors.surface,
            padding: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '60%',
          }}
        >
          {vehicleDetails && (
            <View style={{ padding: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                {vehicleDetails.countryCode ? (
                  <Image
                    source={{ uri: `https://flagcdn.com/24x18/${vehicleDetails.countryCode.toLowerCase()}.png` }}
                    style={{ width: 24, height: 18, marginRight: 12 }}
                  />
                ) : (
                  <Text style={{ marginRight: 12 }}>-</Text>
                )}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 2, color: theme.colors.primary }}>
                    {vehicleDetails.device?.deviceName || 'Pojazd'}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.colors.onSurface }}>
                    ID: <Text style={{ fontFamily: 'monospace', color: theme.colors.onPrimary }}>{vehicleDetails.device?.serialNumber || '-'}</Text>
                  </Text>
                </View>
              </View>

              <Text style={styles(theme).label}>Kierowca</Text>
              <Text style={styles(theme).value}>
                {vehicleDetails.driver0FirstName} {vehicleDetails.driver0LastName}
              </Text>
              <Text style={styles(theme).label}>Pozycja GPS</Text>
              <Pressable
                onPress={() => {
                  const lat = vehicleDetails.latitude?.toFixed(6);
                  const lon = vehicleDetails.longitude?.toFixed(6);
                  Clipboard.setStringAsync(`${lat}, ${lon}`);
                }}
              >
                <Text style={[styles(theme).value, { color: theme.colors.primary }]}>
                  {vehicleDetails.latitude?.toFixed(6)}, {vehicleDetails.longitude?.toFixed(6)}
                </Text>
              </Pressable>
              <Text style={styles(theme).label}>Stan zapłonu</Text>
              <Text style={[
                styles(theme).value,
                { color: vehicleDetails.ignitionState === 'ON' ? theme.colors.primary : theme.colors.error }
              ]}>
                {vehicleDetails.ignitionState}
              </Text>

              <Text style={styles(theme).label}>Prędkość</Text>
              <Text style={styles(theme).value}>{vehicleDetails.speed || 0} km/h</Text>

              <Text style={styles(theme).label}>Paliwo</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{
                  flex: 1,
                  height: 8,
                  backgroundColor: theme.colors.outlineVariant,
                  borderRadius: 4,
                  marginRight: 8
                }}>
                  <View
                    style={{
                      width: `${vehicleDetails.fuelLevelPerc || 0}%`,
                      height: '100%',
                      backgroundColor:
                        vehicleDetails.fuelLevelPerc < 20
                          ? theme.colors.error
                          : vehicleDetails.fuelLevelPerc < 40
                            ? theme.colors.secondary
                            : theme.colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: theme.colors.onSurface }}>
                  {Math.round(vehicleDetails.fuelLevelPerc) || 0}%
                </Text>
              </View>

              <Text style={styles(theme).label}>Przegląd</Text>
              <Text style={styles(theme).value}>
                {vehicleDetails.technicalInspection} ({vehicleDetails.daysToReview} dni)
              </Text>

              <Text style={styles(theme).label}>Tachograf</Text>
              <Text style={styles(theme).value}>
                {vehicleDetails.tachographInspection} ({vehicleDetails.daysToTachograph} dni)
              </Text>

              <Text style={styles(theme).label}>Ostatnia aktualizacja</Text>
              <Text style={styles(theme).value}>
                {vehicleDetails.receivedAt
                  ? new Date(
                    new Date(vehicleDetails.receivedAt).getTime() + 2 * 60 * 60 * 1000
                  ).toLocaleString('pl-PL')
                  : '-'}
              </Text>
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

// Funkcja stylów
const styles = (theme: any) => StyleSheet.create({
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    gap: 8,
    zIndex: 10,
  },
  smallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
});
