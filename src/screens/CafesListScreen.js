import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Animated, 
  PanResponder,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockCafes from '../data/mockCafes.json';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');
const BOTTOM_SHEET_MIN_HEIGHT = height * 0.25;
const BOTTOM_SHEET_MID_HEIGHT = height * 0.5;
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.9;

// Spanish cities for filtering - moved outside component to prevent recreating on each render
const spanishCities = [
  "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", 
  "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", 
  "Valladolid", "Vigo", "Gijón", "Granada"
];

const CafesListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { title = 'Good Cafés' } = route.params || {};
  
  // Set the navigation title dynamically
  useEffect(() => {
    navigation.setOptions({
      title: title,
      headerBackTitle: 'Back'
    });
  }, [navigation, title]);
  
  // Get good cafes by resolving IDs to full cafe data - use useMemo to prevent recalculation on every render
  const cafes = useMemo(() => {
    const goodCafeIds = mockCafes.goodCafes || [];
    return goodCafeIds
      .map(cafeId => mockCafes.cafes.find(cafe => cafe.id === cafeId))
      .filter(Boolean);
  }, []);
  
  // State management
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  const [filteredCafes, setFilteredCafes] = useState(cafes);
  const [selectedCafe, setSelectedCafe] = useState(null);
  
  // Animation values
  const bottomSheetHeight = useRef(new Animated.Value(BOTTOM_SHEET_MIN_HEIGHT)).current;
  const mapOpacity = useRef(new Animated.Value(1)).current;
  
  // Helper to get current sheet height
  const getCurrentSheetHeight = useCallback(() => {
    return bottomSheetHeight.__getValue();
  }, [bottomSheetHeight]);
  
  // Check if a cafe is currently open - use a deterministic approach
  const isCafeOpen = useCallback((cafe) => {
    // Use cafe.id as a stable seed for the random function
    // This ensures the same cafe always gets the same open/closed status
    const seed = cafe.id.charCodeAt(0) + cafe.id.charCodeAt(cafe.id.length - 1);
    return (seed % 10) > 3; // 70% chance a cafe is "open" but deterministic
  }, []);
  
  // Snap sheet to specific position
  const snapSheetTo = useCallback((position) => {
    let snapHeight;
    switch (position) {
      case 'min':
        snapHeight = BOTTOM_SHEET_MIN_HEIGHT;
        break;
      case 'mid':
        snapHeight = BOTTOM_SHEET_MID_HEIGHT;
        break;
      case 'max':
        snapHeight = BOTTOM_SHEET_MAX_HEIGHT;
        break;
      default:
        snapHeight = BOTTOM_SHEET_MIN_HEIGHT;
    }
    
    Animated.spring(bottomSheetHeight, {
      toValue: snapHeight,
      useNativeDriver: false,
      bounciness: 4,
    }).start();
    
    // Update map opacity
    const mapOpacityValue = Math.max(0.3, 1 - (snapHeight - BOTTOM_SHEET_MIN_HEIGHT) / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT));
    Animated.spring(mapOpacity, {
      toValue: mapOpacityValue,
      useNativeDriver: false,
    }).start();
  }, [bottomSheetHeight, mapOpacity]);
  
  // Simulate requesting location permission
  const requestLocationPermission = useCallback(() => {
    // In a real implementation, we would use expo-location's requestForegroundPermissionsAsync
    // For now, we'll use Alert to simulate the system permission dialog
    Alert.alert(
      '"Nicecapp" Would Like to Access Your Location',
      'Your location is used to show nearby cafés and provide directions.',
      [
        {
          text: 'Don\'t Allow',
          style: 'cancel',
          onPress: () => {
            setHasLocationPermission(false);
            // Default to Murcia
            setUserLocation({ 
              latitude: 37.9922, 
              longitude: -1.1307 
            });
          }
        },
        {
          text: 'Allow',
          onPress: () => {
            setHasLocationPermission(true);
            // Simulate getting user location (Murcia coordinates)
            setUserLocation({ 
              latitude: 37.9922, 
              longitude: -1.1307 
            });
          }
        }
      ],
      { cancelable: false }
    );
  }, []);
  
  // Handle locate me button press
  const handleLocateMe = useCallback(() => {
    if (hasLocationPermission) {
      // Already have permission, just center the map
      // In a real app with real maps, we would animate to user location
      console.log('Would center map on user location');
    } else {
      // Request location permission
      requestLocationPermission();
    }
  }, [hasLocationPermission, requestLocationPermission]);
  
  // Handle marker press (simulated)
  const handleCafeSelect = useCallback((cafe) => {
    setSelectedCafe(cafe);
    snapSheetTo('mid');
  }, [snapSheetTo]);
  
  // Handle city selection
  const handleCitySelect = useCallback((city) => {
    setSelectedCity(city);
  }, []);
  
  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...cafes];
    
    // Apply city filter
    if (selectedCity !== 'All Cities') {
      filtered = filtered.filter(cafe => 
        cafe.location?.includes(selectedCity)
      );
    }
    
    // Apply open now filter
    if (isOpenNowEnabled) {
      filtered = filtered.filter(cafe => isCafeOpen(cafe));
    }
    
    setFilteredCafes(filtered);
  }, [selectedCity, isOpenNowEnabled, cafes, isCafeOpen]);
  
  // Apply filters when relevant states change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  // Pan responder for bottom sheet - use useMemo to prevent recreation on every render
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        const newHeight = Math.max(
          BOTTOM_SHEET_MIN_HEIGHT,
          Math.min(BOTTOM_SHEET_MAX_HEIGHT, getCurrentSheetHeight() - dy)
        );
        bottomSheetHeight.setValue(newHeight);
        
        // Fade map as sheet rises
        const mapOpacityValue = Math.max(0.3, 1 - (newHeight - BOTTOM_SHEET_MIN_HEIGHT) / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT));
        mapOpacity.setValue(mapOpacityValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;
        const currentHeight = getCurrentSheetHeight();
        
        // Determine which height to snap to based on velocity and position
        let snapHeight;
        if (Math.abs(vy) > 0.5) {
          // If velocity is significant, use it to determine direction
          snapHeight = vy > 0 
            ? (currentHeight < BOTTOM_SHEET_MID_HEIGHT ? BOTTOM_SHEET_MIN_HEIGHT : BOTTOM_SHEET_MID_HEIGHT)
            : (currentHeight > BOTTOM_SHEET_MID_HEIGHT ? BOTTOM_SHEET_MAX_HEIGHT : BOTTOM_SHEET_MID_HEIGHT);
        } else {
          // Otherwise snap to nearest point
          const distToMin = Math.abs(currentHeight - BOTTOM_SHEET_MIN_HEIGHT);
          const distToMid = Math.abs(currentHeight - BOTTOM_SHEET_MID_HEIGHT);
          const distToMax = Math.abs(currentHeight - BOTTOM_SHEET_MAX_HEIGHT);
          
          if (distToMin <= distToMid && distToMin <= distToMax) {
            snapHeight = BOTTOM_SHEET_MIN_HEIGHT;
          } else if (distToMid <= distToMax) {
            snapHeight = BOTTOM_SHEET_MID_HEIGHT;
          } else {
            snapHeight = BOTTOM_SHEET_MAX_HEIGHT;
          }
        }
        
        // Animate to snap position
        Animated.spring(bottomSheetHeight, {
          toValue: snapHeight,
          useNativeDriver: false,
          bounciness: 4,
        }).start();
        
        // Update map opacity
        const mapOpacityValue = Math.max(0.3, 1 - (snapHeight - BOTTOM_SHEET_MIN_HEIGHT) / (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT));
        Animated.spring(mapOpacity, {
          toValue: mapOpacityValue,
          useNativeDriver: false,
        }).start();
      },
    });
  }, [bottomSheetHeight, mapOpacity, getCurrentSheetHeight]);
  
  // Render individual cafe item - memoize to prevent recreation on every render
  const renderCafeItem = useCallback(({ item: cafe }) => {
    const isOpen = isCafeOpen(cafe);
    const isSelected = selectedCafe?.id === cafe.id;
    
    // Handle special case for The Fix
    let coverImageSource = cafe.coverImage || cafe.imageUrl;
    let logoImageSource = cafe.avatar || cafe.logo;
    
    if (cafe.name === 'The Fix' || cafe.id === 'thefix-madrid' || cafe.businessId === 'business-thefix') {
      coverImageSource = 'assets/businesses/thefix-cover.jpg';
      logoImageSource = 'assets/businesses/thefix-logo.jpg';
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.cafeCard,
          isDarkMode 
            ? { backgroundColor: theme.cardBackground, borderWidth: 0 }
            : { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 },
          isSelected && { borderColor: theme.primaryText, borderWidth: 2 }
        ]}
        onPress={() => handleCafeSelect(cafe)}
      >
        <AppImage 
          source={coverImageSource} 
          style={styles.cafeImage}
          resizeMode="cover"
        />
        <View style={styles.cafeContent}>
          <View style={styles.cafeHeader}>
            <AppImage 
              source={logoImageSource} 
              style={[styles.cafeLogo, { borderColor: theme.border }]}
              resizeMode="cover"
            />
            <View style={styles.cafeTitleContainer}>
              <Text style={[styles.cafeName, { color: theme.primaryText }]}>{cafe.name}</Text>
              <Text style={[styles.cafeLocation, { color: theme.secondaryText }]}>{cafe.location}</Text>
            </View>
            
            <View style={[styles.statusIndicator, isOpen ? styles.openStatus : styles.closedStatus]}>
              <Text style={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
          
          <View style={styles.cafeStats}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.primaryText }]}>
                {cafe.rating ? cafe.rating.toFixed(1) : '4.5'}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.secondaryText }]}>
                ({cafe.reviewCount || '0'} reviews)
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [handleCafeSelect, isCafeOpen, selectedCafe, theme, isDarkMode]);

  // Render map markers (simulated)
  const renderMapMarkers = useCallback(() => {
    return filteredCafes.map(cafe => {
      if (!cafe.coordinates) return null;
      
      const isSelected = selectedCafe?.id === cafe.id;
      
      return (
        <TouchableOpacity
          key={cafe.id}
          style={[
            styles.mapMarker,
            {
              left: `${Math.random() * 70 + 15}%`, // Random horizontal position
              top: `${Math.random() * 70 + 10}%`,  // Random vertical position
            },
            isSelected && styles.selectedMapMarker
          ]}
          onPress={() => handleCafeSelect(cafe)}
        >
          <View style={[styles.markerInner, { backgroundColor: theme.primaryText }]}>
            <Ionicons name="cafe" size={16} color={theme.background} />
          </View>
        </TouchableOpacity>
      );
    });
  }, [filteredCafes, handleCafeSelect, selectedCafe, theme]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? theme.background : '#FFFFFF' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Simulated Map View */}
      <Animated.View style={[styles.mapContainer, { opacity: mapOpacity }]}>
        <View 
          style={[
            styles.mapImage, 
            { 
              backgroundColor: isDarkMode ? '#1a1a1a' : '#e0e0e0',
              borderWidth: 1,
              borderColor: isDarkMode ? '#333333' : '#cccccc'
            }
          ]} 
        >
          {/* Map grid lines to make it look more like a map */}
          <View style={styles.mapGridContainer}>
            {/* Horizontal grid lines */}
            {Array(5).fill(0).map((_, i) => (
              <View 
                key={`h-${i}`} 
                style={[
                  styles.mapGridLineH, 
                  { 
                    backgroundColor: isDarkMode ? '#333333' : '#cccccc',
                    top: `${(i + 1) * 20}%`
                  }
                ]} 
              />
            ))}
            
            {/* Vertical grid lines */}
            {Array(5).fill(0).map((_, i) => (
              <View 
                key={`v-${i}`} 
                style={[
                  styles.mapGridLineV, 
                  { 
                    backgroundColor: isDarkMode ? '#333333' : '#cccccc',
                    left: `${(i + 1) * 20}%`
                  }
                ]} 
              />
            ))}
            
            {/* Main roads */}
            <View style={[styles.mapRoad, { 
              top: '30%', 
              left: '10%', 
              width: '80%', 
              height: 8,
              backgroundColor: isDarkMode ? '#444444' : '#bbbbbb'
            }]} />
            <View style={[styles.mapRoad, { 
              top: '10%', 
              left: '50%', 
              width: 8, 
              height: '80%',
              backgroundColor: isDarkMode ? '#444444' : '#bbbbbb'
            }]} />
            
            {/* Secondary roads */}
            <View style={[styles.mapRoad, { 
              top: '60%', 
              left: '20%', 
              width: '60%', 
              height: 4,
              backgroundColor: isDarkMode ? '#3a3a3a' : '#cccccc'
            }]} />
            <View style={[styles.mapRoad, { 
              top: '20%', 
              left: '25%', 
              width: 4, 
              height: '40%',
              backgroundColor: isDarkMode ? '#3a3a3a' : '#cccccc'
            }]} />
            <View style={[styles.mapRoad, { 
              top: '70%', 
              left: '70%', 
              width: 4, 
              height: '20%',
              backgroundColor: isDarkMode ? '#3a3a3a' : '#cccccc'
            }]} />
            
            {/* Parks/Green areas */}
            <View style={[styles.mapPark, { 
              top: '15%', 
              left: '15%', 
              width: '20%', 
              height: '15%',
              backgroundColor: isDarkMode ? '#2d3b2d' : '#c8e6c9'
            }]} />
            <View style={[styles.mapPark, { 
              top: '65%', 
              left: '75%', 
              width: '15%', 
              height: '15%',
              backgroundColor: isDarkMode ? '#2d3b2d' : '#c8e6c9'
            }]} />
            
            {/* Water */}
            <View style={[styles.mapWater, { 
              top: '40%', 
              left: '70%', 
              width: '25%', 
              height: '20%',
              backgroundColor: isDarkMode ? '#1a3045' : '#bbdefb'
            }]} />
            
            {/* City labels */}
            <View style={[styles.mapCityLabel, { top: '25%', left: '30%' }]}>
              <Text style={[styles.mapCityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Murcia
              </Text>
            </View>
            <View style={[styles.mapCityLabel, { top: '45%', left: '60%' }]}>
              <Text style={[styles.mapCityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Cartagena
              </Text>
            </View>
            <View style={[styles.mapCityLabel, { top: '15%', left: '70%' }]}>
              <Text style={[styles.mapCityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Alicante
              </Text>
            </View>
            <View style={[styles.mapCityLabel, { top: '75%', left: '40%' }]}>
              <Text style={[styles.mapCityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Almería
              </Text>
            </View>
            
            {/* User location */}
            {hasLocationPermission && (
              <View style={[styles.userLocationMarker, { top: '25%', left: '30%' }]}>
                <View style={styles.userLocationDot} />
                <View style={styles.userLocationRing} />
              </View>
            )}
          </View>
        </View>
        {renderMapMarkers()}
      </Animated.View>
      
      {/* Locate Me FAB */}
      <TouchableOpacity 
        style={[
          styles.locateMeButton,
          { 
            backgroundColor: theme.background,
            borderColor: theme.border,
            bottom: insets.bottom + 200 // 16px above bottom sheet when collapsed
          }
        ]}
        onPress={handleLocateMe}
      >
        <Ionicons 
          name="locate" 
          size={24} 
          color={hasLocationPermission ? theme.primaryText : theme.secondaryText} 
        />
      </TouchableOpacity>
      
      {/* Custom Bottom Sheet */}
      <Animated.View 
        style={[
          styles.bottomSheet, 
          { 
            height: bottomSheetHeight,
            backgroundColor: theme.background,
            paddingBottom: insets.bottom
          }
        ]}
      >
        {/* Handle bar for dragging */}
        <View 
          {...panResponder.panHandlers}
          style={styles.handleBarContainer}
        >
          <View style={[styles.handleBar, { backgroundColor: theme.secondaryText }]} />
        </View>
        
        {/* Content */}
        <View style={styles.bottomSheetContent}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: theme.primaryText }]}>
              {filteredCafes.length} Cafés Found
            </Text>
          </View>
          
          {/* Filters */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => {
                // Simple city cycle for demo
                const cities = ['All Cities', 'Madrid', 'Murcia', 'Barcelona', 'Málaga'];
                const currentIndex = cities.indexOf(selectedCity);
                const nextIndex = (currentIndex + 1) % cities.length;
                handleCitySelect(cities[nextIndex]);
              }}
            >
              <Ionicons name="location-outline" size={20} color={theme.primaryText} />
              <Text style={[styles.filterText, { color: theme.primaryText }]}>{selectedCity}</Text>
              <Ionicons name="chevron-down" size={16} color={theme.primaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.filterButton,
                { backgroundColor: theme.cardBackground },
                isOpenNowEnabled && { backgroundColor: theme.primaryText }
              ]}
              onPress={() => setIsOpenNowEnabled(!isOpenNowEnabled)}
            >
              <Text style={[
                styles.filterText,
                { color: theme.primaryText },
                isOpenNowEnabled && { color: theme.background }
              ]}>
                Open Now
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Cafe List */}
          <FlatList
            data={filteredCafes}
            renderItem={renderCafeItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.cafesList}
            contentContainerStyle={styles.cafesListContent}
          />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedMapMarker: {
    transform: [{ scale: 1.2 }],
    zIndex: 10,
  },
  locateMeButton: {
    position: 'absolute',
    right: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    zIndex: 10,
  },
  handleBarContainer: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cafesList: {
    flex: 1,
  },
  cafesListContent: {
    paddingBottom: 20,
  },
  cafeCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cafeImage: {
    width: '100%',
    height: 120,
  },
  cafeContent: {
    padding: 12,
  },
  cafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cafeLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
  },
  cafeTitleContainer: {
    flex: 1,
  },
  cafeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cafeLocation: {
    fontSize: 12,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  openStatus: {
    backgroundColor: '#E7F7EE',
  },
  closedStatus: {
    backgroundColor: '#FEECEA',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
  },
  cafeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    marginLeft: 4,
  },
  mapGridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapGridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.3,
  },
  mapGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    opacity: 0.3,
  },
  mapRoad: {
    position: 'absolute',
    borderRadius: 2,
  },
  mapPark: {
    position: 'absolute',
    borderRadius: 8,
  },
  mapWater: {
    position: 'absolute',
    borderRadius: 12,
  },
  mapCityLabel: {
    position: 'absolute',
    backgroundColor: 'transparent',
    padding: 2,
  },
  mapCityText: {
    fontSize: 10,
    fontWeight: '500',
  },
  userLocationMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
  },
  userLocationRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4285F4',
    opacity: 0.5,
  },
});

export default CafesListScreen;
