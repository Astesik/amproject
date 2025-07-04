import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Card, Title, Text, ActivityIndicator, useTheme } from 'react-native-paper';

const DashboardScreen = () => {
  const theme = useTheme();
  const [countries, setCountries] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await fetch('http://192.168.50.105:8080/api/positions/countries');
        const data = await res.json();
        setCountries(data);
      } catch (e) {
        console.error('Błąd ładowania danych:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
  const numColumns = 2;
  const cardWidth = (Dimensions.get('window').width - 48) / numColumns;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Title style={[styles.title, { color: theme.colors.primary }]}>Pojazdy w krajach</Title>
      {loading ? (
        <ActivityIndicator animating size="large" style={{ marginTop: 40 }} />
      ) : sortedCountries.length === 0 ? (
        <Text style={{ color: theme.colors.onBackground, textAlign: 'center' }}>
          Brak danych.
        </Text>
      ) : (
        <View style={styles.grid}>
          {sortedCountries.map(([country, count]) => (
            <View
              key={country}
              style={[
                styles.countryCard,
                {
                  width: cardWidth,
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.outline,
                  shadowColor: theme.colors.shadow,
                },
              ]}
            >
              <Image
                source={{ uri: `https://flagcdn.com/w80/${country.toLowerCase()}.png` }}
                style={[
                  styles.flag,
                  { borderColor: theme.colors.outline, backgroundColor: theme.colors.background },
                ]}
                resizeMode="contain"
              />
              <Text style={[styles.countryText, { color: theme.colors.onSurface }]}>
                {country}
              </Text>
              <Text style={[styles.countText, { color: theme.colors.primary }]}>
                {count}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  countryCard: {
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
  },
  flag: {
    width: 48,
    height: 32,
    marginBottom: 8,
  },
  countryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default DashboardScreen;
