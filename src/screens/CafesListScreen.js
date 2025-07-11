import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, SectionList, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Switch, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const CafesListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { title = 'Good Cafés' } = route.params || {};
  
  // Modal state for adding cafes
  const [showAddCafeModal, setShowAddCafeModal] = useState(false);
  
  // Set the navigation title dynamically
  useEffect(() => {
    navigation.setOptions({
      title: title,
      headerBackTitle: 'Back',
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
      },
      headerTintColor: theme.primaryText,
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => setShowAddCafeModal(true)}
        >
          <Ionicons name="add" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )
    });
  }, [navigation, title, theme.primaryText, theme.background, theme.divider]);

  // Reset header when screen comes into focus (fixes header disappearing issue when navigating back)
  useFocusEffect(
    React.useCallback(() => {
      // Force header to be shown and reset any conflicting options
      navigation.setOptions({
        headerShown: true,
        title: title,
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.divider,
        },
        headerTintColor: theme.primaryText,
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16 }}
            onPress={() => setShowAddCafeModal(true)}
          >
            <Ionicons name="add" size={24} color={theme.primaryText} />
          </TouchableOpacity>
        )
      });
    }, [navigation, title, theme.primaryText, theme.background, theme.divider])
  );
  
  // State for cafes data from Supabase
  const [cafes, setCafes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [activeLocationFilter, setActiveLocationFilter] = useState('all');
  const [filteredCafes, setFilteredCafes] = useState(cafes);
  const [isNearbyEnabled, setIsNearbyEnabled] = useState(false);
  const [isOpenNowEnabled, setIsOpenNowEnabled] = useState(false);
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [citySheetVisible, setCitySheetVisible] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  
  // Sort states
  const [sortBy, setSortBy] = useState('name'); // 'name' or 'rating'
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  
  // Cities organized by country
  const citiesByCountry = {
    Spain: [
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
    ],
    Belgium: [
      "Brussels",
      "Antwerp", 
      "Ghent",
      "Charleroi",
      "Liège",
      "Bruges"
    ],
    France: [
      "Paris",
      "Lyon",
      "Marseille",
      "Toulouse",
      "Nice",
      "Nantes"
    ]
  };
  
  // Extract unique cities from actual cafe data
  const allCities = [
    ...new Set([
      ...cafes.map(cafe => {
        // Try multiple location formats
        if (cafe.location) {
          const locationParts = cafe.location.split(', ');
          return locationParts.length > 1 ? locationParts[locationParts.length - 1] : cafe.location;
        }
        if (cafe.address) {
          const addressParts = cafe.address.split(', ');
          return addressParts.length > 1 ? addressParts[addressParts.length - 1] : cafe.address;
        }
        return '';
      }),
      ...Object.values(citiesByCountry).flat()
    ])
  ].filter(Boolean);
  
  // Real user location
  const [userLocation, setUserLocation] = useState(null);
  
  // Fetch cafes from Supabase
  const fetchCafes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'cafe');
      
      if (error) {
        console.error('Error fetching cafes:', error);
        Alert.alert('Error', 'Failed to load cafes');
        return;
      }
      
      // Transform Supabase data to match expected format
      const transformedCafes = data.map(cafe => ({
        id: cafe.id,
        name: cafe.full_name,
        location: cafe.location,
        description: cafe.bio,
        rating: cafe.rating,
        reviewCount: cafe.review_count,
        coverImage: cafe.cover_url,
        avatar: cafe.avatar_url,
        logo: cafe.avatar_url,
        imageUrl: cafe.cover_url,
        businessId: cafe.id,
        latitude: cafe.latitude,
        longitude: cafe.longitude,
        phone: cafe.phone,
        website: cafe.website,
        hours: cafe.hours,
        address: cafe.address,
        instagram: cafe.instagram,
        email: cafe.email,
        username: cafe.username
      }));
      
      setCafes(transformedCafes);
    } catch (error) {
      console.error('Error fetching cafes:', error);
      Alert.alert('Error', 'Failed to load cafes');
    } finally {
      setLoading(false);
    }
  };
  
  // Load cafes on component mount
  useEffect(() => {
    fetchCafes();
  }, []);
  
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };
  
  // Check if a cafe is currently open
  const isCafeOpen = (cafe) => {
    if (!cafe.hours) {
      // If no hours data, assume open
      return true;
    }
    
    try {
      const now = new Date();
      const currentDay = now.toLocaleLowerCase().substring(0, 3); // 'mon', 'tue', etc.
      const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 1430 for 2:30 PM
      
      // Parse hours object (assuming format like { "mon": "8:00-18:00", "tue": "8:00-18:00", ... })
      const todayHours = cafe.hours[currentDay];
      
      if (!todayHours || todayHours === 'Closed') {
        return false;
      }
      
      // Parse time range (e.g., "8:00-18:00")
      const [openTime, closeTime] = todayHours.split('-');
      const [openHour, openMin] = openTime.split(':').map(Number);
      const [closeHour, closeMin] = closeTime.split(':').map(Number);
      
      const openTimeNum = openHour * 100 + openMin;
      const closeTimeNum = closeHour * 100 + closeMin;
      
      return currentTime >= openTimeNum && currentTime <= closeTimeNum;
    } catch (error) {
      console.error('Error parsing hours:', error);
      // If parsing fails, assume open
      return true;
    }
  };
  
  // Group cafes into sections for display
  const groupCafesIntoSections = (cafes) => {
    if (sortBy === 'name') {
      // Group alphabetically
      const grouped = {};
      cafes.forEach(cafe => {
        const firstLetter = cafe.name.charAt(0).toUpperCase();
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(cafe);
      });
      
      // Convert to sections array
      return Object.keys(grouped)
        .sort()
        .map(letter => ({
          title: letter,
          data: grouped[letter]
        }));
    } else if (sortBy === 'rating') {
      // Group by rating ranges
      const highRated = cafes.filter(cafe => (cafe.rating || 4.5) >= 4.5);
      const mediumRated = cafes.filter(cafe => (cafe.rating || 4.5) >= 4.0 && (cafe.rating || 4.5) < 4.5);
      const lowerRated = cafes.filter(cafe => (cafe.rating || 4.5) < 4.0);
      
      const sections = [];
      if (highRated.length > 0) sections.push({ title: '4.5+ Stars', data: highRated });
      if (mediumRated.length > 0) sections.push({ title: '4.0-4.4 Stars', data: mediumRated });
      if (lowerRated.length > 0) sections.push({ title: 'Under 4.0 Stars', data: lowerRated });
      
      return sections;
    }
    
    // If "All Cities" is selected and we have multiple cities, group by city
    if (selectedCity === 'All Cities' && cafes.length > 0) {
      const grouped = {};
      cafes.forEach(cafe => {
        // Extract city from location
        let city = 'Other';
        if (cafe.location) {
          const locationParts = cafe.location.split(', ');
          city = locationParts.length > 1 ? locationParts[locationParts.length - 1] : cafe.location;
        }
        
        if (!grouped[city]) {
          grouped[city] = [];
        }
        grouped[city].push(cafe);
      });
      
      // Convert to sections array, sorted by city name
      const sections = Object.keys(grouped)
        .sort()
        .map(city => ({
          title: city,
          data: grouped[city].sort((a, b) => a.name.localeCompare(b.name))
        }));
      
      // Only return sections if we have more than one city
      if (sections.length > 1) {
        return sections;
      }
    }
    
    // No sections, return as single section
    return [{ title: null, data: cafes }];
  };

  // Apply filters and sorting
  const applyFilters = () => {
    let filtered = [...cafes];
    
    // Apply nearby filter with real distance calculation
    if (isNearbyEnabled && userLocation) {
      const NEARBY_RADIUS_KM = 10; // 10km radius
      
      // Filter cafes that have coordinate data
      const cafesWithCoords = filtered.filter(cafe => cafe.latitude && cafe.longitude);
      
      if (cafesWithCoords.length > 0) {
        filtered = cafesWithCoords.filter(cafe => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            cafe.latitude,
            cafe.longitude
          );
          
          return distance <= NEARBY_RADIUS_KM;
        });
        
        // Sort by distance when using nearby filter
        filtered.sort((a, b) => {
          const distanceA = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.latitude,
            a.longitude
          );
          const distanceB = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude
          );
          return distanceA - distanceB;
        });
      } else {
        // If no cafes have coordinate data, show all cafes with a message
        console.log('No coordinate data available for distance filtering');
      }
    }
    // Apply city filter (only if nearby is not enabled)
    else if (selectedCity !== 'All Cities') {
      filtered = filtered.filter(cafe => 
        cafe.location?.includes(selectedCity) || cafe.address?.includes(selectedCity)
      );
    }
    
    // Apply open now filter
    if (isOpenNowEnabled) {
      filtered = filtered.filter(cafe => isCafeOpen(cafe));
    }
    
    // Apply sorting (only if not using nearby filter, which already sorts by distance)
    if (!isNearbyEnabled) {
      if (sortBy === 'name') {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'rating') {
        filtered.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
      }
    }
    
    setFilteredCafes(filtered);
  };
  
  // Apply filters when relevant states change
  useEffect(() => {
    if (cafes.length > 0) {
      applyFilters();
    }
  }, [cafes, selectedCity, isNearbyEnabled, isOpenNowEnabled, userLocation, sortBy]);
  
  // Request location permission and get user location
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to show nearby cafés',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      return true;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Unable to get your location. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  // Toggle nearby filter
  const toggleNearbySwitch = async () => {
    if (!isNearbyEnabled) {
      // Request location permission when turning on nearby
      const permissionGranted = await requestLocationPermission();
      if (permissionGranted) {
        setIsNearbyEnabled(true);
      }
    } else {
      setIsNearbyEnabled(false);
      setUserLocation(null);
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
  const handleCitySelect = async (city) => {
    if (city === 'Nearby') {
      const permissionGranted = await requestLocationPermission();
      if (permissionGranted) {
        setIsNearbyEnabled(true);
        setSelectedCity('Nearby');
      }
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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
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
          
          <TouchableOpacity 
            style={[styles.filterChip, { backgroundColor: theme.cardBackground }]}
            onPress={() => setSortSheetVisible(true)}
          >
            <Text style={[styles.chipText, { color: theme.primaryText }]}>
              Sort by {sortBy === 'name' ? 'Name' : 'Rating'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.primaryText} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </ScrollView>
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
              {Object.entries(citiesByCountry).map(([country, cities]) => (
                <View key={country} style={styles.cityGroup}>
                  <Text style={[styles.cityGroupHeader, { backgroundColor: theme.secondaryBackground, color: theme.secondaryText }]}>{country}</Text>
                  {filteredCities
                    .filter(city => cities.includes(city))
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
                  ))}
                  
                  {/* Other cities not in any specific country */}
                  {(() => {
                    const categorizedCities = Object.values(citiesByCountry).flat();
                    const otherCities = filteredCities.filter(city => 
                      !categorizedCities.includes(city) && city !== 'All Cities'
                    );
                    
                    if (otherCities.length > 0) {
                      return (
                        <View style={styles.cityGroup}>
                          <Text style={[styles.cityGroupHeader, { backgroundColor: theme.secondaryBackground, color: theme.secondaryText }]}>Other Cities</Text>
                          {otherCities.map((city, index) => (
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
                          ))}
                        </View>
                      );
                    }
                                         return null;
                   })()}
              </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Sort selection modal
  const renderSortSheet = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortSheetVisible}
        onRequestClose={() => setSortSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom, backgroundColor: theme.cardBackground, minHeight: '30%', maxHeight: '30%' }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.divider }]}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setSortSheetVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: theme.primaryText }]}>Sort By</Text>
              <View style={{ width: 40 }}><Text></Text></View>
            </View>
            
            <View style={styles.sortOptionsContainer}>
              <TouchableOpacity 
                style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                onPress={() => {
                  setSortBy('name');
                  setSortSheetVisible(false);
                }}
              >
                <View style={styles.cityItemLeftContent}>
                  <Ionicons name="text-outline" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                  <Text style={[
                    styles.cityItemText, 
                    { color: theme.primaryText },
                    sortBy === 'name' && styles.selectedCityText
                  ]}>
                    Alphabetical
                  </Text>
                </View>
                {sortBy === 'name' && (
                  <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                onPress={() => {
                  setSortBy('rating');
                  setSortSheetVisible(false);
                }}
              >
                <View style={styles.cityItemLeftContent}>
                  <Ionicons name="star-outline" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                  <Text style={[
                    styles.cityItemText, 
                    { color: theme.primaryText },
                    sortBy === 'rating' && styles.selectedCityText
                  ]}>
                    Rating (Highest First)
                  </Text>
                </View>
                {sortBy === 'rating' && (
                  <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Handle add cafe modal options
  const handleAddCafeOption = (option) => {
    setShowAddCafeModal(false);
    
    switch (option) {
      case 'maps_url':
        handleGoogleMapsURL();
        break;
      case 'manual':
        handleManualEntry();
        break;
    }
  };

  // Handle Google Maps URL input
  const handleGoogleMapsURL = () => {
    Alert.prompt(
      'Enter Google Maps URL',
      'Paste the Google Maps URL of the cafe to extract details automatically',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Parse URL',
          onPress: (url) => {
            if (url && url.trim()) {
              // In a real app, you would navigate to a screen that processes the Google Maps URL
              Alert.alert('Success', 'Google Maps URL parsing would be implemented here');
            } else {
              Alert.alert('Error', 'Please enter a valid Google Maps URL');
            }
          }
        }
      ],
      'plain-text',
      '',
      'url'
    );
  };

  // Handle manual entry
  const handleManualEntry = () => {
    // In a real app, you would navigate to a manual cafe entry screen
    Alert.alert('Manual Entry', 'Manual cafe entry screen would be implemented here');
  };
  
  const renderCafeItem = ({ item }) => {
    const isOpen = isCafeOpen(item);
    
    // Use the URLs from Supabase or fallback to local assets
    let coverImageSource = item.coverImage || item.imageUrl;
    let logoImageSource = item.avatar || item.logo;
    
    // Special handling for cafes that might still need local assets
    if (item.name === 'The Fix' && (!coverImageSource || !logoImageSource)) {
      coverImageSource = coverImageSource || 'assets/businesses/thefix-cover.jpg';
      logoImageSource = logoImageSource || 'assets/businesses/thefix-logo.jpg';
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
              <Text style={[styles.reviewCount, { color: theme.secondaryText }]}>
                {item.reviewCount === 0 ? 'No reviews' : `(${item.reviewCount || '0'} reviews)`}
              </Text>
            </View>
            
            {/* Show distance when using nearby filter and coordinates are available */}
            {isNearbyEnabled && userLocation && item.latitude && item.longitude && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location-outline" size={14} color={theme.secondaryText} />
                <Text style={[styles.distanceText, { color: theme.secondaryText }]}>
                  {calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    item.latitude,
                    item.longitude
                  ).toFixed(1)} km
                </Text>
              </View>
            )}
            
            {/* Show message when nearby is enabled but no coordinates available */}
            {isNearbyEnabled && userLocation && (!item.latitude || !item.longitude) && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location-outline" size={14} color={theme.secondaryText} />
                <Text style={[styles.distanceText, { color: theme.secondaryText }]}>
                  Location data pending
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Add Cafe Modal (add this before the return statement)
  const renderAddCafeModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddCafeModal}
        onRequestClose={() => setShowAddCafeModal(false)}
      >
        <View style={styles.addCafeModalContainer}>
          <View style={[
            styles.addCafeModalContent,
            { 
              paddingBottom: insets.bottom + 12, 
              backgroundColor: isDarkMode ? theme.altBackground : '#f4f4f4' 
            }
          ]}>
            <View style={[styles.addCafeModalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.addCafeModalTitle, { color: theme.primaryText }]}>Add Cafe</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowAddCafeModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.addCafeOptionsContainer}>
              <TouchableOpacity
                style={[styles.addCafeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                onPress={() => handleAddCafeOption('maps_url')}
              >
                <Ionicons name="map-outline" size={24} color={theme.primaryText} />
                <View style={styles.addCafeOptionTextContainer}>
                  <Text style={[styles.addCafeOptionTitle, { color: theme.primaryText }]}>Paste Google Maps URL</Text>
                  <Text style={[styles.addCafeOptionSubtitle, { color: theme.secondaryText }]}>Add cafe from Google Maps link</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addCafeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                onPress={() => handleAddCafeOption('manual')}
              >
                <Ionicons name="create-outline" size={24} color={theme.primaryText} />
                <View style={styles.addCafeOptionTextContainer}>
                  <Text style={[styles.addCafeOptionTitle, { color: theme.primaryText }]}>Enter Manually</Text>
                  <Text style={[styles.addCafeOptionSubtitle, { color: theme.secondaryText }]}>Fill out cafe details by hand</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? theme.background : '#FFFFFF' }]}>
      {renderFilterUI()}
      {renderCitySheet()}
      {renderSortSheet()}
      {renderAddCafeModal()}

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading cafés...</Text>
        </View>
      ) : (
        <SectionList
          sections={groupCafesIntoSections(filteredCafes)}
          renderItem={renderCafeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.cafesList}
          renderSectionHeader={({ section: { title } }) => 
            title ? (
              <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? theme.background : '#FFFFFF' }]}>
                <Text style={[styles.sectionHeaderText, { color: theme.primaryText }]}>{title}</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No cafés found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingVertical: 16,
    marginBottom: 0,
  },
  filterRow: {
    flexGrow: 0,
  },
  filterRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
    minWidth: 'auto', // Let it size to content
  },
  cityText: {
    fontSize: 16,
    marginLeft: 8,
    marginRight: 4,
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
  sortOptionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
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
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    fontSize: 16,
  },
  addCafeModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addCafeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addCafeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  addCafeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  addCafeOptionsContainer: {
    padding: 16,
  },
  addCafeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  addCafeOptionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  addCafeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  addCafeOptionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  closeButton: {
    padding: 5,
  },
});

export default CafesListScreen;
