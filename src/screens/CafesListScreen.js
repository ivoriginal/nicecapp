import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mockCafes from '../data/mockCafes.json';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

const CafesListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { title = 'Cafés Near You' } = route.params || {};
  
  // Set the navigation title dynamically
  useEffect(() => {
    navigation.setOptions({
      title: title,
      headerBackTitle: 'Back'
    });
  }, [navigation, title]);
  
  // Get good cafes by resolving IDs to full cafe data
  const goodCafeIds = mockCafes.goodCafes || [];
  const cafes = goodCafeIds.map(cafeId => {
    return mockCafes.cafes.find(cafe => cafe.id === cafeId);
  }).filter(Boolean);
  
  // State management
  const [userLocation, setUserLocation] = useState(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  const [filteredCafes, setFilteredCafes] = useState(cafes);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.9922, // Default to Murcia
    longitude: -1.1307,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  // Refs
  const mapRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const snapPoints = ['25%', '50%', '90%'];
  
  // Spanish cities for filtering
  const spanishCities = [
    "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", 
    "Murcia", "Palma", "Las Palmas", "Bilbao", "Alicante", "Córdoba", 
    "Valladolid", "Vigo", "Gijón", "Granada"
  ];
  
  // Request location permission and get user location
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location access is needed to show nearby cafés. We\'ll show cafés in Murcia instead.',
          [{ text: 'OK', onPress: () => {} }]
        );
        setHasLocationPermission(false);
        return false;
      }
      
      setHasLocationPermission(true);
      const location = await Location.getCurrentPositionAsync({});
      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userCoords);
      
      // Update map region to user location
      setMapRegion({
        latitude: userCoords.latitude,
        longitude: userCoords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to get location. Showing cafés in Murcia instead.');
      setHasLocationPermission(false);
      return false;
    }
  };
  
  // Request location on screen mount
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  // Check if a cafe is currently open
  const isCafeOpen = (cafe) => {
    // Simple mock implementation - in real app would check actual opening hours
    return Math.random() > 0.3; // 70% chance a cafe is "open"
  };
  
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
  }, [selectedCity, isOpenNowEnabled, cafes]);
  
  // Apply filters when relevant states change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  // Handle locate me button press
  const handleLocateMe = async () => {
    if (hasLocationPermission && userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    } else {
      const success = await requestLocationPermission();
      if (success && userLocation) {
        mapRef.current?.animateToRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }
    }
  };
  
  // Handle marker press
  const handleMarkerPress = (cafe) => {
    setSelectedCafe(cafe);
    bottomSheetRef.current?.snapToIndex(1);
  };
  
  // Handle city selection
  const handleCitySelect = (city) => {
    setSelectedCity(city);
    
    // If a specific city is selected, animate map to that city
    if (city !== 'All Cities') {
      const cityCoords = getCityCoordinates(city);
      if (cityCoords) {
        mapRef.current?.animateToRegion({
          ...cityCoords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }, 1000);
      }
    }
  };
  
  // Get coordinates for a city (simple implementation)
  const getCityCoordinates = (city) => {
    const cityCoords = {
      'Madrid': { latitude: 40.4168, longitude: -3.7038 },
      'Barcelona': { latitude: 41.3851, longitude: 2.1734 },
      'Valencia': { latitude: 39.4699, longitude: -0.3763 },
      'Seville': { latitude: 37.3891, longitude: -5.9845 },
      'Málaga': { latitude: 36.7213, longitude: -4.4214 },
      'Murcia': { latitude: 37.9922, longitude: -1.1307 },
      'Bilbao': { latitude: 43.2627, longitude: -2.9253 },
      'Alicante': { latitude: 38.3452, longitude: -0.4810 },
    };
    return cityCoords[city] || null;
  };
  
  // Render bottom sheet content
  const renderBottomSheetContent = () => {
    return (
      <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor: theme.background }]}>
        {/* Handle bar */}
        <View style={[styles.handleBar, { backgroundColor: theme.secondaryText }]} />
        
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
              // Simple city cycle for demo - in real app would show city selector
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
        <BottomSheetScrollView 
          style={styles.cafesList}
          showsVerticalScrollIndicator={false}
        >
          {filteredCafes.map((cafe) => renderCafeItem(cafe))}
        </BottomSheetScrollView>
      </BottomSheetView>
    );
  };
  
  // Render individual cafe item
  const renderCafeItem = (cafe) => {
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
        key={cafe.id}
        style={[
          styles.cafeCard,
          { backgroundColor: theme.cardBackground, borderColor: theme.border },
          isSelected && { borderColor: theme.primaryText, borderWidth: 2 }
        ]}
        onPress={() => {
          setSelectedCafe(cafe);
          // Center map on selected cafe
          if (cafe.coordinates) {
            mapRef.current?.animateToRegion({
              latitude: cafe.coordinates.lat,
              longitude: cafe.coordinates.lng,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }, 1000);
          }
        }}
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
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation={hasLocationPermission}
        showsMyLocationButton={false}
        userInterfaceStyle={isDarkMode ? 'dark' : 'light'}
      >
        {filteredCafes.map((cafe) => {
          if (!cafe.coordinates) return null;
          
          return (
            <Marker
              key={cafe.id}
              coordinate={{
                latitude: cafe.coordinates.lat,
                longitude: cafe.coordinates.lng,
              }}
              title={cafe.name}
              description={cafe.location}
              onPress={() => handleMarkerPress(cafe)}
            >
              <View style={[
                styles.markerContainer,
                selectedCafe?.id === cafe.id && styles.selectedMarker
              ]}>
                <View style={[styles.marker, { backgroundColor: theme.primaryText }]}>
                  <Ionicons name="cafe" size={20} color={theme.background} />
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>
      
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
      
      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: theme.background }}
        handleIndicatorStyle={{ backgroundColor: theme.secondaryText }}
      >
        {renderBottomSheetContent()}
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
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
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
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
  cafeCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
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
});

export default CafesListScreen;
