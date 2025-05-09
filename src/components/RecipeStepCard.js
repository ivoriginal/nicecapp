import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants';

const RecipeStepCard = ({ stepNumber, instruction, isLast = false }) => {
  return (
    <View style={[styles.container, isLast && styles.lastContainer]}>
      <View style={styles.stepNumberContainer}>
        <Text style={styles.stepNumber}>{stepNumber}</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.instruction}>{instruction}</Text>
        {!isLast && (
          <View style={styles.connector}>
            <MaterialCommunityIcons
              name="dots-vertical"
              size={24}
              color={COLORS.lightGray}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: SIZES.base,
    paddingHorizontal: SIZES.padding,
  },
  lastContainer: {
    marginBottom: 0,
  },
  stepNumberContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.base,
  },
  stepNumber: {
    ...FONTS.h4,
    color: COLORS.white,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: SIZES.base,
  },
  instruction: {
    ...FONTS.body3,
    color: COLORS.darkGray,
  },
  connector: {
    position: 'absolute',
    left: -17,
    bottom: -12,
    alignItems: 'center',
  },
});

export default RecipeStepCard; 