import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export const COLORS = {
  // primary colors
  primary: '#f4511e',
  secondary: '#ff7043',
  
  // neutral colors
  black: '#000000',
  white: '#FFFFFF',
  
  // UI colors
  background: '#FFFFFF',
  card: '#F5F5F5',
  text: '#333333',
  
  // grayscale
  gray: '#898989',
  lightGray: '#E0E0E0',
  lightGray2: '#F6F6F6',
  darkGray: '#4D4D4D',
  
  // status colors
  success: '#4CAF50',
  error: '#FF5252',
  info: '#2196F3',
  warning: '#FFC107',
};

export const SIZES = {
  // global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 16,
  
  // font sizes
  largeTitle: 32,
  h1: 30,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,
  
  // app dimensions
  width,
  height,
};

export const FONTS = {
  largeTitle: { fontFamily: 'System', fontSize: SIZES.largeTitle, lineHeight: 40 },
  h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
  h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
  h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 26, fontWeight: 'bold' },
  h4: { fontFamily: 'System', fontSize: SIZES.h4, lineHeight: 22, fontWeight: 'bold' },
  h5: { fontFamily: 'System', fontSize: SIZES.h5, lineHeight: 20, fontWeight: 'bold' },
  body1: { fontFamily: 'System', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: 'System', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: 'System', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: 'System', fontSize: SIZES.body4, lineHeight: 20 },
  body5: { fontFamily: 'System', fontSize: SIZES.body5, lineHeight: 18 },
}; 