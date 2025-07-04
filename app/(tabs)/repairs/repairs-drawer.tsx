import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TableScreen from './table';
import CalendarScreen from './calendar';
import AddRepairScreen from './addrepair';
import { useThemeMode } from '../../../context/ThemeContext';

const Drawer = createDrawerNavigator();

export default function RepairsDrawer() {
  const { theme } = useThemeMode();

  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.elevation?.level2 || theme.colors.background,
        },
        headerTintColor: theme.colors.onBackground,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.onSurfaceVariant || theme.colors.onSurface,
        drawerStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Drawer.Screen name="Lista napraw" component={TableScreen} />
      <Drawer.Screen name="Kalendarz napraw" component={CalendarScreen} />
      <Drawer.Screen name="Dodaj naprawę" component={AddRepairScreen} />
    </Drawer.Navigator>
  );
}
