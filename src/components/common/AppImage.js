import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local asset mapping
const localAssets = {
  // Vértigo y Calambre
  'assets/businesses/vertigo-logo.jpg': require('../../../assets/businesses/vertigo-logo.jpg'),
  'assets/businesses/vertigo-cover.jpg': require('../../../assets/businesses/vertigo-cover.jpg'),
  
  // CaféLab
  'assets/businesses/cafelab-logo.png': require('../../../assets/businesses/cafelab-logo.png'),
  'assets/businesses/cafelab-murcia-cover.png': require('../../../assets/businesses/cafelab-murcia-cover.png'),
  'assets/businesses/cafelab-cartagena-cover.png': require('../../../assets/businesses/cafelab-cartagena-cover.png'),

  // User avatars
  'assets/users/carlos-hernandez.jpg': require('../../../assets/users/carlos-hernandez.jpg'),
  'assets/users/ivo-vilches.jpg': require('../../../assets/users/ivo-vilches.jpg')
};

const AppImage = ({ 
  source, 
  style, 
  placeholder = 'coffee',
  resizeMode = 'cover',
  onError,
  ...props 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  // Extract styles for complete handling
  let borderRadius = 0;
  let backgroundColor = '#FFFFFF';
  let borderColor = '#F0F0F0';
  let borderWidth = 0;
  
  if (style && typeof style === 'object') {
    if (Array.isArray(style)) {
      // If style is an array, check each item
      for (const styleItem of style) {
        if (styleItem && typeof styleItem === 'object') {
          if ('borderRadius' in styleItem) borderRadius = styleItem.borderRadius;
          if ('backgroundColor' in styleItem) backgroundColor = styleItem.backgroundColor;
          if ('borderColor' in styleItem) borderColor = styleItem.borderColor;
          if ('borderWidth' in styleItem) borderWidth = styleItem.borderWidth;
        }
      }
    } else {
      if ('borderRadius' in style) borderRadius = style.borderRadius;
      if ('backgroundColor' in style) backgroundColor = style.backgroundColor;
      if ('borderColor' in style) borderColor = style.borderColor;
      if ('borderWidth' in style) borderWidth = style.borderWidth;
    }
  }

  useEffect(() => {
    // Reset error state when source changes
    setHasError(false);
    setIsLoadingImage(true);
  }, [source]);

  const handleError = (e) => {
    console.log('[AppImage] Error loading image:', typeof source === 'string' ? source : 'non-string-source');
    setHasError(true);
    setIsLoadingImage(false);
    if (onError) onError(e);
  };

  const handleLoad = () => {
    setIsLoadingImage(false);
  };

  // If there's an error or no source, show placeholder
  if (hasError || !source) {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name={placeholder} size={24} color="#666" />
      </View>
    );
  }

  // Handle different source types
  let imageSource;
  
  // Handle local assets (require)
  if (typeof source === 'number') {
    imageSource = source;
  } 
  // Handle string paths - could be URLs or local asset paths
  else if (typeof source === 'string') {
    // First check if the exact path exists in our mapping
    if (localAssets[source]) {
      imageSource = localAssets[source];
    }
    // Then check if it's a path that might be a typo or variation
    else if (source.startsWith('assets/') || source.startsWith('./assets/')) {
      const normalizedPath = source.replace('./', '');
      // Try to find a key that ends with the last part of the path
      const fileName = normalizedPath.split('/').pop();
      const matchingKey = Object.keys(localAssets).find(key => key.endsWith(fileName));
      
      if (matchingKey) {
        imageSource = localAssets[matchingKey];
      } else {
        console.log('[AppImage] Local asset not found:', source);
        // Show a more visible error for easier debugging
        return (
          <View style={[styles.placeholder, style]}>
            <Text style={styles.errorText}>Missing: {fileName}</Text>
          </View>
        );
      }
    } else {
      // For URLs and other paths
      imageSource = { uri: source };
    }
  } 
  // If source is already shaped like { uri: 'path' }
  else if (typeof source === 'object' && source.uri) {
    imageSource = source;
  } 
  // Fallback for unknown source types
  else {
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name={placeholder} size={24} color="#666" />
      </View>
    );
  }

  // Create a consistent containerStyle that includes all border properties
  const containerStyle = {
    ...StyleSheet.flatten(style),
    borderRadius,
    backgroundColor,
    borderColor,
    borderWidth,
    overflow: 'hidden'
  };
  
  return (
    <View style={containerStyle}>
      <Image
        source={imageSource}
        style={[
          styles.image
        ]}
        resizeMode={resizeMode}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
      {isLoadingImage && (
        <View style={[styles.loadingOverlay, { borderRadius }]}>
          <Ionicons name="hourglass-outline" size={24} color="#666" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 245, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  }
});

export default AppImage; 