import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const CoffeeStat = ({ 
  value, 
  label, 
  containerStyle,
  valueStyle,
  labelStyle 
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.value, valueStyle]}>
        {value}
      </Text>
      <Text style={[styles.label, labelStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.base,
  },
  value: {
    ...FONTS.h2,
    color: COLORS.primary,
    marginBottom: 2,
  },
  label: {
    ...FONTS.body4,
    color: COLORS.gray,
    textAlign: 'center',
  },
});

export default CoffeeStat; 