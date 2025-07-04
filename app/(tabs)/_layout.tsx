import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeMode } from '../../context/ThemeContext';

import DashboardScreen from './dashboard';
import MapScreen from './map';
import VehiclesScreen from './vehicles';
import RepairsScreen from './repairs'; // <-- TO JEST index.tsx w repairs/
import AccountScreen from './account';

const Tab = createBottomTabNavigator();

export default function TabLayout() {
  const { theme } = useThemeMode();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const iconMap = {
          Główna: 'home',
          Mapa: 'map',
          Pojazdy: 'directions-car',
          Naprawy: 'home-repair-service',
          Konto: 'person',
        };
        return {
          headerShown: true,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: theme.colors.elevation.level2,
            borderTopColor: theme.colors.outlineVariant,
          },
          headerStyle: {
            backgroundColor: theme.colors.elevation.level2,
          },
          headerTintColor: theme.colors.onBackground,
          tabBarIcon: ({ color, size }) => {
            const icon = iconMap[route.name] || 'help';
            return <MaterialIcons name={icon} size={size} color={color} />;
          },
        };
      }}
    >
      <Tab.Screen name="Główna" component={DashboardScreen} />
      <Tab.Screen name="Mapa" component={MapScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Pojazdy" component={VehiclesScreen} />
      <Tab.Screen name="Naprawy" component={RepairsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Konto" component={AccountScreen} />
    </Tab.Navigator>
  );
}
