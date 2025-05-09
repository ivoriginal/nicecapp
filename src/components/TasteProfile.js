import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const TasteAttribute = ({ label, value, maxValue = 5 }) => {
  // Create an array of the total number of dots (filled + unfilled)
  const dots = Array(maxValue).fill(0);
  
  return (
    <View style={styles.attributeContainer}>
      <Text style={styles.attributeLabel}>{label}</Text>
      <View style={styles.dotsContainer}>
        {dots.map((_, index) => (
          <View 
            key={index}
            style={[
              styles.dot,
              index < value ? styles.filledDot : styles.emptyDot
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const TasteProfile = ({ coffee, style }) => {
  // Default taste profile if none provided
  const tasteProfile = coffee?.tasteProfile || {
    acidity: 3,
    sweetness: 3,
    body: 3,
    bitterness: 2,
    fruitiness: 3,
    chocolate: 2
  };
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>Taste Profile</Text>
      
      <View style={styles.profileContainer}>
        <View style={styles.leftColumn}>
          <TasteAttribute 
            label="Acidity" 
            value={tasteProfile.acidity} 
          />
          <TasteAttribute 
            label="Sweetness" 
            value={tasteProfile.sweetness} 
          />
          <TasteAttribute 
            label="Body" 
            value={tasteProfile.body} 
          />
        </View>
        
        <View style={styles.rightColumn}>
          <TasteAttribute 
            label="Bitterness" 
            value={tasteProfile.bitterness} 
          />
          <TasteAttribute 
            label="Fruitiness" 
            value={tasteProfile.fruitiness} 
          />
          <TasteAttribute 
            label="Chocolate" 
            value={tasteProfile.chocolate} 
          />
        </View>
      </View>
      
      {coffee?.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Flavor Notes:</Text>
          <Text style={styles.notesText}>{coffee.notes}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
  },
  title: {
    ...FONTS.h2,
    color: COLORS.black,
    marginBottom: SIZES.padding,
  },
  profileContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  leftColumn: {
    width: '48%',
  },
  rightColumn: {
    width: '48%',
  },
  attributeContainer: {
    marginBottom: SIZES.padding,
  },
  attributeLabel: {
    ...FONTS.body3,
    color: COLORS.darkGray,
    marginBottom: SIZES.base / 2,
  },
  dotsContainer: {
    flexDirection: 'row',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  filledDot: {
    backgroundColor: COLORS.primary,
  },
  emptyDot: {
    backgroundColor: COLORS.lightGray,
  },
  notesContainer: {
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  notesLabel: {
    ...FONTS.h4,
    color: COLORS.darkGray,
    marginBottom: SIZES.base / 2,
  },
  notesText: {
    ...FONTS.body3,
    color: COLORS.black,
  },
});

export default TasteProfile; 