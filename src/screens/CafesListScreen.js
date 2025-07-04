import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockCafes from '../data/mockCafes.json';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';
import * as Location from 'expo-location';

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
  
  // Filter states
  const [activeLocationFilter, setActiveLocationFilter] = useState('all');
  const [filteredCafes, setFilteredCafes] = useState(cafes);
  const [isNearbyEnabled, setIsNearbyEnabled] = useState(false);
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [citySheetVisible, setCitySheetVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  
  // Add Spanish cities
  const spanishCities = [
    "Madrid",
    "Barcelona",
    "Valencia",
    "Seville",
    "Zaragoza",
    "Málaga",
    "Murcia",
    "Palma",
    "Las Palmas",
    "Bilbao",
    "Alicante",
    "Córdoba",
    "Valladolid",
    "Vigo",
    "Gijón",
    "Granada"
  ];
  
  // Extract unique cities for filters - Here we're extracting the city from "Neighborhood, City" format
  const allCities = [
    ...new Set([
      ...cafes.map(cafe => {
        const locationParts = cafe.location?.split(', ');
        return locationParts && locationParts.length > 1 ? locationParts[1] : '';
      }),
      ...spanishCities
    ])
  ].filter(Boolean);
  
  // User location state
  const [userLocation, setUserLocation] = useState(null);

  // Helper to calculate the distance (in km) between two coordinates using the Haversine formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const deg2rad = (deg) => deg * (Math.PI / 180);
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Request location when nearby toggle is enabled
  useEffect(() => {
    const fetchLocation = async () => {
      if (isNearbyEnabled) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            console.log('Permission to access location was denied');
            setUserLocation(null);
            return;
          }
          const locationResult = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
          });
        } catch (error) {
          console.log('Error fetching location', error);
          setUserLocation(null);
        }
      } else {
        setUserLocation(null);
      }
    };

    fetchLocation();
  }, [isNearbyEnabled]);
  
  // Check if a cafe is currently open
  const isCafeOpen = (cafe) => {
    // In a real app, you would check opening hours against current time
    // For now, we'll just simulate with a random value for demonstration
    return Math.random() > 0.3; // 70% chance a cafe is "open"
  };
  
  // Apply filters based on city and nearby toggle
  const applyFilters = () => {
    let filtered = [...cafes];
    
    // Apply nearby filter based on actual distance
    if (isNearbyEnabled && userLocation) {
      filtered = filtered.filter((cafe) => {
        if (!cafe.coordinates || !cafe.coordinates.lat || !cafe.coordinates.lng) {
          return false;
        }
        const distance = getDistanceFromLatLonInKm(
          userLocation.latitude,
          userLocation.longitude,
          cafe.coordinates.lat,
          cafe.coordinates.lng
        );
        // Consider cafes within 10 km as "nearby"
        return distance <= 10;
      });
    }
    // Apply city filter (only if nearby is not enabled)
    else if (selectedCity !== 'All Cities') {
      filtered = filtered.filter(cafe => 
        cafe.location?.includes(selectedCity)
      );
    }
    
    // Apply open now filter
    if (isOpenNowEnabled) {
      filtered = filtered.filter(cafe => isCafeOpen(cafe));
    }
    
    setFilteredCafes(filtered);
  };
  
  // Apply filters when relevant states change
  useEffect(() => {
    applyFilters();
  }, [selectedCity, isNearbyEnabled, isOpenNowEnabled, userLocation]);
  
  // Toggle nearby filter
  const toggleNearbySwitch = () => {
    setIsNearbyEnabled(previousState => !previousState);
    
    // If user turns on nearby but hasn't allowed location access
    if (!isNearbyEnabled && !userLocation) {
      // In a real app, you would request location permissions here
      console.log("Would request location permissions");
    }
  };
  
  // Toggle open now filter
  const toggleOpenNow = () => {
    setIsOpenNowEnabled(prev => !prev);
  };
  
  // Filter cities based on search query
  const filteredCities = citySearchQuery 
    ? allCities.filter(city => 
        city.toLowerCase().includes(citySearchQuery.toLowerCase())
      )
    : allCities;
  
  // Select a city from the bottom sheet
  const handleCitySelect = (city) => {
    if (city === 'Nearby') {
      setIsNearbyEnabled(true);
      setSelectedCity('Nearby');
    } else {
      setIsNearbyEnabled(false);
      setSelectedCity(city);
    }
    setCitySheetVisible(false);
  };
  
  // Reset to show all cities
  const handleResetCity = () => {
    setSelectedCity('All Cities');
    setIsNearbyEnabled(false);
  };
  
  // Get the display text for the city selector
  const getLocationDisplayText = () => {
    if (isNearbyEnabled) {
      return 'Nearby';
    }
    return selectedCity;
  };
  
  // Render filter UI
  const renderFilterUI = () => {
    return (
      <View style={[styles.filterContainer, { backgroundColor: theme.background }]}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.citySelector, { backgroundColor: theme.cardBackground }]}
            onPress={() => setCitySheetVisible(true)}
          >
            <Ionicons 
              name={isNearbyEnabled ? "locate" : "location-outline"} 
              size={20} 
              color={theme.primaryText} 
            />
            <Text style={[styles.cityText, { color: theme.primaryText }]}>{getLocationDisplayText()}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.primaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.filterChip,
              { backgroundColor: theme.cardBackground },
              isOpenNowEnabled && [styles.activeFilterChip, { backgroundColor: theme.primaryText }]
            ]}
            onPress={toggleOpenNow}
          >
            <Text 
              style={[
                styles.chipText,
                { color: theme.primaryText },
                isOpenNowEnabled && [styles.activeChipText, { color: theme.background }]
              ]}
            >
              Open Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  // City selection bottom sheet
  const renderCitySheet = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={citySheetVisible}
        onRequestClose={() => setCitySheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom, backgroundColor: theme.cardBackground }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.divider }]}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCitySheetVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: theme.primaryText }]}>Select Location</Text>
              <View style={{ width: 40 }}><Text></Text></View>
            </View>
            
            <View style={[styles.searchContainer, { backgroundColor: theme.secondaryBackground }]}>
              <Ionicons name="search" size={20} color={theme.secondaryText} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.primaryText }]}
                placeholder="Search cities"
                placeholderTextColor={theme.secondaryText}
                value={citySearchQuery}
                onChangeText={setCitySearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
            
            <ScrollView style={styles.citiesList} contentContainerStyle={styles.citiesListContent}>
              {/* Nearby option */}
              <TouchableOpacity 
                style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleCitySelect('Nearby')}
              >
                <View style={styles.cityItemLeftContent}>
                  <Ionicons name="locate" size={20} color="#007AFF" style={styles.cityItemIcon} />
                  <Text style={[
                    styles.cityItemText, 
                    { color: theme.primaryText },
                    isNearbyEnabled && styles.selectedCityText
                  ]}>
                    Nearby
                  </Text>
                </View>
                {isNearbyEnabled && (
                  <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                )}
              </TouchableOpacity>
              
              {/* All Cities option */}
              <TouchableOpacity 
                style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                onPress={() => handleCitySelect('All Cities')}
              >
                <View style={styles.cityItemLeftContent}>
                  <Ionicons name="earth" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                  <Text style={[
                    styles.cityItemText, 
                    { color: theme.primaryText },
                    selectedCity === 'All Cities' && !isNearbyEnabled && styles.selectedCityText
                  ]}>
                    All Cities
                  </Text>
                </View>
                {selectedCity === 'All Cities' && !isNearbyEnabled && (
                  <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                )}
              </TouchableOpacity>
              
              {/* Group cities by country/region */}
              <View style={styles.cityGroup}>
                <Text style={[styles.cityGroupHeader, { backgroundColor: theme.secondaryBackground, color: theme.secondaryText }]}>Spanish Cities</Text>
                {filteredCities
                  .filter(city => spanishCities.includes(city))
                  .map((city, index) => (
                    <TouchableOpacity 
                      key={`spanish-${index}`}
                      style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                      onPress={() => handleCitySelect(city)}
                    >
                      <View style={styles.cityItemLeftContent}>
                        <Ionicons name="location-outline" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                        <Text style={[
                          styles.cityItemText, 
                          { color: theme.primaryText },
                          selectedCity === city && !isNearbyEnabled && styles.selectedCityText
                        ]}>
                          {city}
                        </Text>
                      </View>
                      {selectedCity === city && !isNearbyEnabled && (
                        <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                      )}
                    </TouchableOpacity>
                  ))
                }
              </View>
              
              <View style={styles.cityGroup}>
                <Text style={[styles.cityGroupHeader, { backgroundColor: theme.secondaryBackground, color: theme.secondaryText }]}>Other Cities</Text>
                {filteredCities
                  .filter(city => !spanishCities.includes(city) && city !== 'All Cities' && city !== 'Spain')
                  .map((city, index) => (
                    <TouchableOpacity 
                      key={`other-${index}`}
                      style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                      onPress={() => handleCitySelect(city)}
                    >
                      <View style={styles.cityItemLeftContent}>
                        <Ionicons name="location-outline" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                        <Text style={[
                          styles.cityItemText, 
                          { color: theme.primaryText },
                          selectedCity === city && !isNearbyEnabled && styles.selectedCityText
                        ]}>
                          {city}
                        </Text>
                      </View>
                      {selectedCity === city && !isNearbyEnabled && (
                        <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                      )}
                    </TouchableOpacity>
                  ))
                }
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  const renderCafeItem = ({ item }) => {
    const isOpen = isCafeOpen(item);
    
    // Special handling for The Fix
    let coverImageSource;
    let logoImageSource;
    
    if (item.name === 'The Fix' || item.id === 'thefix-madrid' || item.businessId === 'business-thefix') {
      // Use string paths instead of require() - AppImage will handle these properly
      coverImageSource = 'assets/businesses/thefix-cover.jpg';
      logoImageSource = 'assets/businesses/thefix-logo.jpg';
    } else {
      coverImageSource = item.coverImage || item.imageUrl;
      logoImageSource = item.avatar || item.logo;
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.cafeCard, 
          isDarkMode 
            ? { backgroundColor: theme.cardBackground, borderWidth: 0 }
            : { backgroundColor: 'transparent', borderColor: theme.border }
        ]}
        onPress={() => {
          navigation.navigate('UserProfileBridge', { 
            userId: item.id, 
            userName: item.name,
            skipAuth: true 
          });
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
              <Text style={[styles.cafeName, { color: theme.primaryText }]}>{item.name}</Text>
              <Text style={[styles.cafeLocation, { color: theme.secondaryText }]}>{item.location}</Text>
            </View>
            
            {/* Open/Closed status indicator */}
            <View style={[styles.statusIndicator, isOpen ? styles.openStatus : styles.closedStatus]}>
              <Text style={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</Text>
            </View>
          </View>
          
          <Text 
            style={[styles.cafeDescription, { color: theme.secondaryText }]} 
            numberOfLines={2}
          >
            {item.description || 'Specialty coffee shop offering a variety of brews and pastries in a cozy atmosphere.'}
          </Text>
          
          <View style={styles.cafeStats}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.primaryText }]}>{item.rating ? item.rating.toFixed(1) : '4.5'}</Text>
              <Text style={[styles.reviewCount, { color: theme.secondaryText }]}>({item.reviewCount || '0'} reviews)</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? theme.background : '#FFFFFF' }]}>
      {renderFilterUI()}
      {renderCitySheet()}

      <FlatList
        data={filteredCafes}
        renderItem={renderCafeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.cafesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No cafés found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    flex: 1,
    marginRight: 10,
  },
  cityText: {
    fontSize: 16,
    marginLeft: 8,
    marginRight: 4,
    flex: 1,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
  },
  activeFilterChip: {
    backgroundColor: '#000000',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: '80%',
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  citiesList: {
    flex: 1,
  },
  citiesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cityItemLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cityItemIcon: {
    marginRight: 12,
  },
  cityItemText: {
    fontSize: 16,
  },
  selectedCityText: {
    fontWeight: '600',
  },
  cityGroup: {
    marginTop: 12,
  },
  cityGroupHeader: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: -16,
  },
  cafesList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  cafeCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cafeImage: {
    width: '100%',
    height: 160,
  },
  cafeContent: {
    padding: 16,
  },
  cafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cafeLogo: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1,
  },
  cafeTitleContainer: {
    flex: 1,
  },
  cafeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  cafeLocation: {
    fontSize: 14,
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    marginLeft: 8,
  },
  openStatus: {
    backgroundColor: '#E7F7EE',
  },
  closedStatus: {
    backgroundColor: '#FEECEA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  cafeDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
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
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
  },
});

export default CafesListScreen;
