import React from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  vehicle: {
    speed: number;
    ignitionState: string;
  };
};

const VehicleMarker = ({ vehicle }: Props) => {
  const color = getMarkerColor(vehicle);
  return <View style={[styles.marker, { backgroundColor: color }]} />;
};

function getMarkerColor(vehicle: { speed: number; ignitionState: string }) {
  if (vehicle.ignitionState !== 'ON') return '#8e9aaf';
  if (vehicle.speed === 0) return '#43a047';
  if (vehicle.speed < 60) return '#ffbe0b';
  return '#ed5b5b';
}

const styles = StyleSheet.create({
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    transform: [{ translateX: -8 }, { translateY: -8 }],
  },
});

export default React.memo(VehicleMarker);
