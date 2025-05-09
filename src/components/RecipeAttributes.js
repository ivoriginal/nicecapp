import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants';

const AttributeItem = ({ icon, label, value }) => (
  <View style={styles.attributeItem}>
    <MaterialIcons name={icon} size={18} color={COLORS.primary} />
    <View style={styles.attributeContent}>
      <Text style={styles.attributeLabel}>{label}</Text>
      <Text style={styles.attributeValue}>{value}</Text>
    </View>
  </View>
);

const RecipeAttributes = ({ recipe }) => {
  const attributes = [
    { 
      icon: 'grain', 
      label: 'Coffee', 
      value: `${recipe.coffeeAmount}g` 
    },
    { 
      icon: 'opacity', 
      label: 'Water', 
      value: `${recipe.waterAmount}ml` 
    },
    { 
      icon: 'access-time', 
      label: 'Brew Time', 
      value: recipe.brewTime 
    },
    { 
      icon: 'device-thermostat', 
      label: 'Temperature', 
      value: `${recipe.waterTemperature}°C` 
    },
    { 
      icon: 'blur-circular', 
      label: 'Grind Size', 
      value: recipe.grindSize 
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recipe Attributes</Text>
      <View style={styles.attributesContainer}>
        {attributes.map((attr, index) => (
          <AttributeItem 
            key={index}
            icon={attr.icon}
            label={attr.label}
            value={attr.value}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.black,
    marginBottom: SIZES.base,
  },
  attributesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attributeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: COLORS.lightGray2,
    borderRadius: SIZES.radius,
    padding: SIZES.base,
    marginBottom: SIZES.base,
  },
  attributeContent: {
    marginLeft: SIZES.base,
  },
  attributeLabel: {
    ...FONTS.body4,
    color: COLORS.darkGray,
  },
  attributeValue: {
    ...FONTS.h4,
    color: COLORS.black,
  },
});

export default RecipeAttributes; 