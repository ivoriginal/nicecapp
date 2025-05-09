import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants';

const InfoItem = ({ icon, label, value }) => (
  <View style={styles.infoItem}>
    <MaterialIcons name={icon} size={18} color={COLORS.primary} />
    <View style={styles.textContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  </View>
);

const CoffeeInfo = ({ coffee, style }) => {
  const infoItems = [
    {
      icon: 'public',
      label: 'Origin',
      value: coffee?.origin || 'Unknown',
    },
    {
      icon: 'location-on',
      label: 'Region',
      value: coffee?.region || 'Unknown',
    },
    {
      icon: 'store',
      label: 'Roaster',
      value: coffee?.roaster || 'Unknown',
    },
    {
      icon: 'grain',
      label: 'Process',
      value: coffee?.process || 'Unknown',
    },
    {
      icon: 'spa',
      label: 'Varietal',
      value: coffee?.varietal || 'Unknown',
    },
    {
      icon: 'altitude',
      label: 'Altitude',
      value: coffee?.altitude ? `${coffee.altitude}m` : 'Unknown',
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Coffee Info</Text>
      <View style={styles.infoContainer}>
        {infoItems.map((item, index) => (
          <View 
            key={index} 
            style={[
              styles.infoItemContainer,
              index % 2 === 0 ? { marginRight: SIZES.padding } : {}
            ]}
          >
            <InfoItem
              icon={item.icon}
              label={item.label}
              value={item.value}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.base,
  },
  sectionTitle: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItemContainer: {
    width: '48%',
    marginBottom: SIZES.padding,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: SIZES.base,
  },
  label: {
    ...FONTS.body4,
    color: COLORS.gray,
  },
  value: {
    ...FONTS.h4,
    color: COLORS.black,
  },
});

export default CoffeeInfo; 