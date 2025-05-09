import React, { useState, useEffect } from 'react';
import { Image, View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Local asset mapping with all possible variations
const localAssets = {
  // Users
  'assets/users/ivo-vilches.jpg': require('../../../assets/users/ivo-vilches.jpg'),
  'ivo-vilches.jpg': require('../../../assets/users/ivo-vilches.jpg'),
  'assets/users/carlos-hernandez.jpg': require('../../../assets/users/carlos-hernandez.jpg'),
  'carlos-hernandez.jpg': require('../../../assets/users/carlos-hernandez.jpg'),
  'assets/users/elias-veris.jpg': require('../../../assets/users/elias-veris.jpg'),
  'elias-veris.jpg': require('../../../assets/users/elias-veris.jpg'),
  
  // Vértigo
  'assets/businesses/vertigo-logo.jpg': require('../../../assets/businesses/vertigo-logo.jpg'),
  'vertigo-logo.jpg': require('../../../assets/businesses/vertigo-logo.jpg'),
  'assets/businesses/vertigo-cover.jpg': require('../../../assets/businesses/vertigo-cover.jpg'),
  'vertigo-cover.jpg': require('../../../assets/businesses/vertigo-cover.jpg'),
  
  // CaféLab
  'assets/businesses/cafelab-logo.png': require('../../../assets/businesses/cafelab-logo.png'),
  'cafelab-logo.png': require('../../../assets/businesses/cafelab-logo.png'),
  'cafelab-logo': require('../../../assets/businesses/cafelab-logo.png'),
  'assets/businesses/cafelab-murcia-cover.png': require('../../../assets/businesses/cafelab-murcia-cover.png'),
  'cafelab-murcia-cover.png': require('../../../assets/businesses/cafelab-murcia-cover.png'),
  'cafelab-murcia-cover': require('../../../assets/businesses/cafelab-murcia-cover.png'),
  'assets/businesses/cafelab-cartagena-cover.png': require('../../../assets/businesses/cafelab-cartagena-cover.png'),
  'cafelab-cartagena-cover.png': require('../../../assets/businesses/cafelab-cartagena-cover.png'),
  'cafelab-cartagena-cover': require('../../../assets/businesses/cafelab-cartagena-cover.png'),
  
  // Toma Café
  'assets/businesses/toma-logo.jpg': require('../../../assets/businesses/toma-logo.jpg'),
  'toma-logo.jpg': require('../../../assets/businesses/toma-logo.jpg'),
  'toma-logo': require('../../../assets/businesses/toma-logo.jpg'),
  'toma-cafe-logo.jpg': require('../../../assets/businesses/toma-logo.jpg'),
  'toma-cafe-logo.png': require('../../../assets/businesses/toma-logo.jpg'),
  'assets/businesses/toma-1-cover.jpg': require('../../../assets/businesses/toma-1-cover.jpg'),
  'toma-1-cover.jpg': require('../../../assets/businesses/toma-1-cover.jpg'),
  'toma-cafe-1-cover.jpg': require('../../../assets/businesses/toma-1-cover.jpg'),
  'toma-cafe-1-cover.png': require('../../../assets/businesses/toma-1-cover.jpg'),
  'assets/businesses/toma-2-cover.jpg': require('../../../assets/businesses/toma-2-cover.jpg'),
  'toma-2-cover.jpg': require('../../../assets/businesses/toma-2-cover.jpg'),
  'toma-cafe-2-cover.jpg': require('../../../assets/businesses/toma-2-cover.jpg'),
  'toma-cafe-2-cover.png': require('../../../assets/businesses/toma-2-cover.jpg'),
  'assets/businesses/toma-3-cover.jpg': require('../../../assets/businesses/toma-3-cover.jpg'),
  'toma-3-cover.jpg': require('../../../assets/businesses/toma-3-cover.jpg'),
  'toma-cafe-3-cover.jpg': require('../../../assets/businesses/toma-3-cover.jpg'),
  'toma-cafe-3-cover.png': require('../../../assets/businesses/toma-3-cover.jpg'),
  
  // Kima Coffee
  'assets/businesses/kima-logo.jpg': require('../../../assets/businesses/kima-logo.jpg'),
  'kima-logo.jpg': require('../../../assets/businesses/kima-logo.jpg'),
  
  // The Fix
  'assets/businesses/thefix-logo.jpg': require('../../../assets/businesses/thefix-logo.jpg'),
  'thefix-logo.jpg': require('../../../assets/businesses/thefix-logo.jpg'),
  'assets/businesses/thefix-cover.jpg': require('../../../assets/businesses/thefix-cover.jpg'),
  'thefix-cover.jpg': require('../../../assets/businesses/thefix-cover.jpg'),
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
    // console.log('[AppImage] Error loading image:', typeof source === 'string' ? source : 'non-string-source');
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
  
  // Handle specific CaféLab and Toma keywords in string sources
  const resolveSpecialSources = (src) => {
    // Check if it's a string first
    if (typeof src !== 'string') return src;
    
    // Clean up the path by removing any leading slashes or "./"
    const cleanPath = src.replace(/^\.?\/?/, '');
    
    // Check for CaféLab images
    if (cleanPath.includes('cafelab') || src.includes('CaféLab')) {
      if (cleanPath.includes('murcia') || src.includes('Murcia')) {
        // console.log('[AppImage] Using CaféLab Murcia image');
        return require('../../../assets/businesses/cafelab-murcia-cover.png');
      } else if (cleanPath.includes('cartagena') || src.includes('Cartagena')) {
        // console.log('[AppImage] Using CaféLab Cartagena image');
        return require('../../../assets/businesses/cafelab-cartagena-cover.png');
      } else {
        // console.log('[AppImage] Using CaféLab logo');
        return require('../../../assets/businesses/cafelab-logo.png');
      }
    }
    
    // Check for Toma Café images
    if (cleanPath.includes('toma') || src.includes('Toma')) {
      // Check for specific location
      if (cleanPath.includes('toma-1') || cleanPath.includes('toma-cafe-1') || src.includes('Toma Café 1')) {
        // console.log('[AppImage] Using Toma Café 1 image');
        return require('../../../assets/businesses/toma-1-cover.jpg');
      } else if (cleanPath.includes('toma-2') || cleanPath.includes('toma-cafe-2') || src.includes('Toma Café 2')) {
        // console.log('[AppImage] Using Toma Café 2 image');
        return require('../../../assets/businesses/toma-2-cover.jpg');
      } else if (cleanPath.includes('toma-3') || cleanPath.includes('toma-cafe-3') || src.includes('Toma Café 3')) {
        // console.log('[AppImage] Using Toma Café 3 image');
        return require('../../../assets/businesses/toma-3-cover.jpg');
      } else {
        // console.log('[AppImage] Using Toma Café logo');
        return require('../../../assets/businesses/toma-logo.jpg');
      }
    }
    
    return src;
  };
  
  // Add debugging for the current source
  // console.log('[AppImage] Loading image source:', typeof source === 'string' ? source : (typeof source === 'number' ? 'require() asset' : JSON.stringify(source)));
  
  // Process the source based on its type
  if (typeof source === 'number') {
    // Handle local assets (require)
    imageSource = source;
  } else if (typeof source === 'string') {
    // First check for special sources like CaféLab or Toma
    const specialSource = resolveSpecialSources(source);
    
    if (specialSource !== source) {
      // If we got a different source back, it's already processed
      imageSource = specialSource;
    } else {
      // Otherwise, try our mapping
      // Extract the filename without path
      const fileName = source.split('/').pop();
      
      // First try exact match
      if (localAssets[source]) {
        // console.log('[AppImage] Found exact match for local asset:', source);
        imageSource = localAssets[source];
      }
      // Then try just the filename
      else if (fileName && localAssets[fileName]) {
        // console.log('[AppImage] Found match for local asset by filename:', fileName);
        imageSource = localAssets[fileName];
      }
      // Then check for URL
      else if (source.startsWith('http')) {
        // console.log('[AppImage] Using URL:', source);
        imageSource = { uri: source };
      }
      // Check for Instagram URLs and substitute
      else if (source && (
        source.includes('instagram.') || 
        source.includes('fbcdn.net'))) {
        // console.log('[AppImage] Instagram URL detected');
        
        // For Toma Café Instagram, use our local asset
        if (source.includes('1442763115778809')) {
          imageSource = localAssets['toma-logo.jpg'];
        } else {
          imageSource = { uri: source };
        }
      }
      // Last resort - just use as URI
      else {
        // console.log('[AppImage] Using string as URI:', source);
        imageSource = { uri: source };
      }
    }
  } else if (typeof source === 'object' && source.uri) {
    // If source is already shaped like { uri: 'path' }
    // console.log('[AppImage] Using URI object:', source.uri);
    
    // Check if the URI needs special handling
    const specialUri = resolveSpecialSources(source.uri);
    if (typeof specialUri === 'number' || typeof specialUri === 'object') {
      // If we got back a non-string, use it directly
      imageSource = specialUri;
    } else {
      // Otherwise use the original object
      imageSource = source;
    }
  } else {
    // Fallback for unknown source types
    // console.log('[AppImage] Unknown source type:', source);
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
    alignSelf: 'center',
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