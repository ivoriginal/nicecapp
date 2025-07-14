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

  // Nomad Coffee - using their actual logo from their website
  'nomad-logo.jpg': 'https://nomadcoffee.es/cdn/shop/files/NOMAD_LOGO_NEGRO.png',
  'nomad-coffee-logo.jpg': 'https://nomadcoffee.es/cdn/shop/files/NOMAD_LOGO_NEGRO.png',
  'nomad-coffee-roasters-logo.jpg': 'https://nomadcoffee.es/cdn/shop/files/NOMAD_LOGO_NEGRO.png',
  'assets/businesses/nomad-logo.jpg': 'https://nomadcoffee.es/cdn/shop/files/NOMAD_LOGO_NEGRO.png',

  // Default gear images
  'assets/gear/aeropress.jpg': 'https://m.media-amazon.com/images/I/71pxZkT0rVL.jpg',
  'assets/gear/chemex.jpg': 'https://static.fnac-static.com/multimedia/Images/ES/NR/ac/87/6d/7178156/1541-1.jpg',
  'assets/gear/hario-v60.jpg': 'https://m.media-amazon.com/images/I/61qKb8xxTdL.jpg',
  'assets/gear/fellow-stagg.jpg': 'https://m.media-amazon.com/images/I/71Iw1eak-ZL.jpg',
  'assets/gear/baratza-encore.jpg': 'https://ecafe.es/tienda/2089-large_default/baratza-encore-esp.jpg',
  'assets/gear/comandante-c40.jpg': 'https://images.unsplash.com/photo-1575441347544-11725ca18b26',
  'assets/gear/hario-range-server.jpg': 'https://images.unsplash.com/photo-1544713297-9acff35e418e',
  'assets/gear/9barista.jpg': 'https://9barista.com/cdn/shop/products/9Barista-unboxed2_1296x.jpg?v=1710943847',
  'assets/gear/fellow-opus.jpg': 'https://fellowproducts.com/cdn/shop/products/FellowProducts_OpusConicalBurrGrinder_MatteBlack_01.png',
  'assets/gear/hario-v60-filters.jpg': 'https://www.hario.co.uk/cdn/shop/products/VARIO_1200x1200.jpg?v=1609933351',
  'assets/gear/aeropress-filters.jpg': 'https://aeropress.com/cdn/shop/products/AeroPress_Microfilters_1024x1024.jpg?v=1551222076',
  'assets/gear/default.jpg': 'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=2940&auto=format&fit=crop'
};

const AppImage = ({ 
  source, 
  style, 
  placeholder = 'cafe',
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
    setHasError(true);
    setIsLoadingImage(false);
    if (onError) onError(e);
  };

  const handleLoad = () => {
    setIsLoadingImage(false);
  };

  // If there's an error or no source, show placeholder
  if (hasError || !source) {
    let placeholderIcon;
    switch (placeholder) {
      case 'person':
        placeholderIcon = 'person-outline';
        break;
      case 'business':
        placeholderIcon = 'business-outline';
        break;
      case 'gear':
        placeholderIcon = 'construct-outline';
        break;
      case 'cafe':
      default:
        placeholderIcon = 'cafe-outline';
        break;
    }
    
    return (
      <View style={[styles.placeholder, style]}>
        <Ionicons name={placeholderIcon} size={24} color="#666" />
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
    
    // Check for Vértigo images
    if (cleanPath.includes('vertigo') || src.includes('Vértigo') || src.includes('vertigo')) {
      if (cleanPath.includes('cover') || src.includes('cover')) {
        console.log('[AppImage] Using Vértigo cover image');
        return require('../../../assets/businesses/vertigo-cover.jpg');
      } else {
        console.log('[AppImage] Using Vértigo logo');
        return require('../../../assets/businesses/vertigo-logo.jpg');
      }
    }
    
    // Check for Nomad Coffee images - but only if it's not already a Supabase URL
    if ((cleanPath.includes('nomad') || src.includes('Nomad') || src.includes('NOMAD') || src.includes('nomad_avatar')) && 
        !src.includes('supabase.co')) {
      console.log('[AppImage] Using Nomad Coffee logo for source:', src);
      return { uri: 'https://nomadcoffee.es/cdn/shop/files/NOMAD_LOGO_NEGRO.png' };
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
        // console.log('[AppImage] Found exact match in localAssets for:', source);
        // If it's a URL string in localAssets, convert to uri object
        if (typeof localAssets[source] === 'string' && localAssets[source].startsWith('http')) {
          imageSource = { uri: localAssets[source] };
        } else {
          imageSource = localAssets[source];
        }
      }
      // Then try just the filename
      else if (fileName && localAssets[fileName]) {
        // console.log('[AppImage] Found filename match in localAssets for:', fileName);
        if (typeof localAssets[fileName] === 'string' && localAssets[fileName].startsWith('http')) {
          imageSource = { uri: localAssets[fileName] };
        } else {
          imageSource = localAssets[fileName];
        }
      }
      // Then check for URL
      else if (source.startsWith('http')) {
        imageSource = { uri: source };
      }
      // Check for Instagram URLs and substitute
      else if (source && (
        source.includes('instagram.') || 
        source.includes('fbcdn.net'))) {
        // For Toma Café Instagram, use our local asset
        if (source.includes('1442763115778809')) {
          imageSource = localAssets['toma-logo.jpg'];
        } else {
          // For other Instagram URLs, try to use them but have fallback
          console.log('[AppImage] Loading Instagram URL:', source);
          imageSource = { uri: source };
        }
      }
      // Check for the old generic coffee placeholder URL and show placeholder instead
      else if (source && source.includes('https://images.unsplash.com/photo-1447933601403-0c6688de566e')) {
        // Don't load the generic coffee image, let it fall back to placeholder
        setHasError(true);
        return null;
      }
      // Last resort - use default gear image for gear placeholder
      else if (placeholder === 'gear') {
        imageSource = { uri: 'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=2940&auto=format&fit=crop' };
      }
      // Otherwise use as URI
      else {
        // console.log('[AppImage] No match found, using as URI:', source);
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