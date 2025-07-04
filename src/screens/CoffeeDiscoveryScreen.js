import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import mockCoffees from '../data/mockCoffees.json';
import mockCafes from '../data/mockCafes.json';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';

const CoffeeDiscoveryScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { getAllAvailableCoffees } = useCoffee();
  const { preselectedFilter = null, sortBy = 'default' } = (route && route.params) || {};
  const [coffees, setCoffees] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortOrder, setSortOrder] = useState(sortBy);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [showAddCoffeeModal, setShowAddCoffeeModal] = useState(false);

  // NEW STATE: search bar visibility & query
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [filterCategories, setFilterCategories] = useState([]);
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(filters => filters.length > 0);

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: 'All Coffee',
      headerBackTitle: 'Back',
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => setShowAddCoffeeModal(true)}
        >
          <Ionicons name="add" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )
    });
  }, [navigation, theme.primaryText]);

  // Initialize filter categories
  useEffect(() => {
    // Get all coffees to build filter options
    const allCoffees = [...mockCoffees.coffees];
    
    // Collect all origins
    const allOrigins = new Set();
    allCoffees.forEach(coffee => {
      if (coffee.origin && coffee.origin !== 'Unknown') {
        allOrigins.add(coffee.origin);
      }
    });
    
    // Collect all regions
    const allRegions = new Set();
    allCoffees.forEach(coffee => {
      if (coffee.region && coffee.region !== 'Unknown') {
        allRegions.add(coffee.region);
      }
    });
    
    // Collect all producers
    const allProducers = new Set();
    allCoffees.forEach(coffee => {
      if (coffee.producer && coffee.producer !== 'Unknown') {
        allProducers.add(coffee.producer);
      }
    });
    
    // Collect all roasters
    const allRoasters = new Set();
    allCoffees.forEach(coffee => {
      if (coffee.roaster) {
        allRoasters.add(coffee.roaster);
      }
    });
    
    // Build available in options from both roasters and cafes in mockCafes.json
    const availableInOptions = [];
    
    // Add all roasters
    mockCafes.roasters.forEach(roaster => {
      availableInOptions.push({
        id: roaster.id,
        label: roaster.name
      });
    });
    
    // Add all cafes
    mockCafes.cafes.forEach(cafe => {
      availableInOptions.push({
        id: cafe.id,
        label: cafe.name
      });
    });
    
    // Sort alphabetically
    availableInOptions.sort((a, b) => a.label.localeCompare(b.label));
    
    // Create filter categories with populated options
    const categories = [
      {
        id: 'roastLevel',
        label: 'Roast Level',
        options: [
          { id: 'light', label: 'Light' },
          { id: 'medium', label: 'Medium' },
          { id: 'dark', label: 'Dark' }
        ]
      },
      {
        id: 'origin',
        label: 'Origin',
        options: Array.from(allOrigins).map(origin => ({
          id: origin.toLowerCase().replace(/\s+/g, '_'),
          label: origin
        })).sort((a, b) => a.label.localeCompare(b.label))
      },
      {
        id: 'region',
        label: 'Region',
        options: Array.from(allRegions).map(region => ({
          id: region.toLowerCase().replace(/\s+/g, '_'),
          label: region
        })).sort((a, b) => a.label.localeCompare(b.label))
      },
      {
        id: 'process',
        label: 'Process',
        options: [
          { id: 'washed', label: 'Washed' },
          { id: 'natural', label: 'Natural' },
          { id: 'honey', label: 'Honey' },
          { id: 'anaerobic', label: 'Anaerobic' },
          { id: 'swiss_water', label: 'Swiss Water Process' },
          { id: 'black_honey', label: 'Black Honey' },
          { id: 'carbonic_maceration', label: 'Carbonic Maceration' }
        ]
      },
      {
        id: 'varietal',
        label: 'Varietal',
        options: [
          { id: 'catuai', label: 'Catuai' },
          { id: 'caturra', label: 'Caturra' },
          { id: 'sidra', label: 'Sidra' },
          { id: 'geisha', label: 'Geisha' },
          { id: 'pink_bourbon', label: 'Pink Bourbon' },
          { id: 'red_bourbon', label: 'Red Bourbon' },
          { id: 'bourbon', label: 'Bourbon' },
          { id: 'typica', label: 'Typica' }
        ]
      },
      {
        id: 'altitude',
        label: 'Altitude',
        options: [
          { id: 'low', label: 'Low (1000-1400m)' },
          { id: 'medium', label: 'Medium (1400-1700m)' },
          { id: 'high', label: 'High (1700-2000m)' },
          { id: 'very_high', label: 'Very High (2000m+)' }
        ]
      },
      {
        id: 'price',
        label: 'Price',
        options: [
          { id: 'budget', label: 'Budget (€0-15)' },
          { id: 'mid', label: 'Mid-range (€15-25)' },
          { id: 'premium', label: 'Premium (€25+)' }
        ]
      },
      {
        id: 'producer',
        label: 'Producer',
        options: Array.from(allProducers).map(producer => ({
          id: producer.toLowerCase().replace(/\s+/g, '_'),
          label: producer
        })).sort((a, b) => a.label.localeCompare(b.label))
      },
      {
        id: 'roaster',
        label: 'Roaster',
        options: Array.from(allRoasters).map(roaster => ({
          id: roaster.toLowerCase().replace(/\s+/g, '_'),
          label: roaster
        })).sort((a, b) => a.label.localeCompare(b.label))
      },
      {
        id: 'notes',
        label: 'Flavor Notes',
        options: [
          { id: 'fruity', label: 'Fruity' },
          { id: 'chocolate', label: 'Chocolate' },
          { id: 'citrus', label: 'Citrus' },
          { id: 'floral', label: 'Floral' },
          { id: 'nutty', label: 'Nutty' },
          { id: 'caramel', label: 'Caramel' }
        ]
      },
      {
        id: 'availableIn',
        label: 'Available In',
        options: availableInOptions
      },
      {
        id: 'tried',
        label: 'Tried',
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' }
        ]
      }
    ];
    
    setFilterCategories(categories);
  }, []);

  // Sort options
  const sortOptions = [
    { id: 'default', label: 'Default' },
    { id: 'popularity', label: 'Popular' },
    { id: 'alphabetical', label: 'A-Z' },
    { id: 'price-low', label: 'Price (Low to High)' },
    { id: 'price-high', label: 'Price (High to Low)' }
  ];

  // Get the current sort label to display
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.id === sortOrder);
    return option ? option.label : 'Sort';
  };

  // Initialize filters from preselected filter
  useEffect(() => {
    if (preselectedFilter) {
      setActiveFilters(prev => ({
        ...prev,
        [preselectedFilter.categoryId]: [preselectedFilter.optionId]
      }));
    }
  }, [preselectedFilter]);

  // Refresh coffee list when screen comes into focus (e.g., returning from add coffee screens)
  useFocusEffect(
    React.useCallback(() => {
      // Force re-render of coffee list to show newly added coffees
      setCoffees(getAllAvailableCoffees());
    }, [getAllAvailableCoffees])
  );

  useEffect(() => {
    // Get all coffees from both mock data and user-added coffees
    let filteredCoffees = getAllAvailableCoffees();
    
    // Apply additional filters
    Object.entries(activeFilters).forEach(([category, selectedOptions]) => {
      if (selectedOptions.length > 0) {
        switch(category) {
          case 'roastLevel':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => {
                // If coffee doesn't have a roastLevel, default to "Medium"
                const coffeeRoastLevel = coffee.roastLevel ? coffee.roastLevel.toLowerCase() : "medium";
                const filterOption = option.toLowerCase();
                
                // More flexible matching for roast levels
                return coffeeRoastLevel.includes(filterOption) || 
                      (filterOption === 'light' && coffeeRoastLevel.includes('claro')) ||
                      (filterOption === 'medium' && (coffeeRoastLevel.includes('medio') || 
                                                     coffeeRoastLevel.includes('medium') || 
                                                     !coffee.roastLevel)) || // Default to medium if not specified
                      (filterOption === 'dark' && (coffeeRoastLevel.includes('oscuro') || 
                                                  coffeeRoastLevel.includes('dark')));
              })
            );
            break;
          case 'origin':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => 
                coffee.origin && coffee.origin.toLowerCase().includes(option.toLowerCase())
              )
            );
            break;
          case 'region':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => 
                coffee.region && coffee.region.toLowerCase().includes(option.toLowerCase())
              )
            );
            break;
          case 'varietal':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => 
                coffee.varietal && coffee.varietal.toLowerCase().includes(option.toLowerCase())
              )
            );
            break;
          case 'altitude':
            filteredCoffees = filteredCoffees.filter(coffee => {
              if (!coffee.altitude || coffee.altitude === 'Unknown') return false;
              
              return selectedOptions.some(option => {
                const altitudeText = coffee.altitude.toLowerCase();
                // Extract numbers from altitude text
                const altitudeNumbers = altitudeText.match(/\d+/g);
                if (!altitudeNumbers) return false;
                
                const avgAltitude = altitudeNumbers.length > 1 
                  ? (parseInt(altitudeNumbers[0]) + parseInt(altitudeNumbers[1])) / 2
                  : parseInt(altitudeNumbers[0]);
                
                switch(option) {
                  case 'low': return avgAltitude >= 1000 && avgAltitude < 1400;
                  case 'medium': return avgAltitude >= 1400 && avgAltitude < 1700;
                  case 'high': return avgAltitude >= 1700 && avgAltitude < 2000;
                  case 'very_high': return avgAltitude >= 2000;
                  default: return false;
                }
              });
            });
            break;
          case 'price':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => {
                const price = coffee.price;
                switch(option) {
                  case 'budget': return price >= 0 && price < 15;
                  case 'mid': return price >= 15 && price < 25;
                  case 'premium': return price >= 25;
                  default: return false;
                }
              })
            );
            break;
          case 'producer':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => {
                const producerId = coffee.producer ? coffee.producer.toLowerCase().replace(/\s+/g, '_') : '';
                return producerId === option;
              })
            );
            break;
          case 'roaster':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => {
                const roasterId = coffee.roaster ? coffee.roaster.toLowerCase().replace(/\s+/g, '_') : '';
                return roasterId === option;
              })
            );
            break;
          case 'process':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => 
                coffee.process && coffee.process.toLowerCase().includes(option.toLowerCase())
              )
            );
            break;
          case 'notes':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => 
                (coffee.profile && coffee.profile.toLowerCase().includes(option.toLowerCase())) ||
                (coffee.description && coffee.description.toLowerCase().includes(option.toLowerCase()))
              )
            );
            break;
          case 'availableIn':
            filteredCoffees = filteredCoffees.filter(coffee => {
              // Check if this coffee is sold by any of the selected cafes/roasters
              const coffeeSellers = mockCoffees.sellers[coffee.id] || [];
              
              return selectedOptions.some(selectedBusinessId => {
                // Check if the coffee is directly sold by this business
                const directMatch = coffeeSellers.some(seller => seller.id === selectedBusinessId);
                
                // If it's a cafe, also check if the coffee is sold by its parent roaster
                const selectedCafe = mockCafes.cafes.find(cafe => cafe.id === selectedBusinessId);
                if (selectedCafe && selectedCafe.roasterId) {
                  const roasterMatch = coffeeSellers.some(seller => seller.id === selectedCafe.roasterId);
                  return directMatch || roasterMatch;
                }
                
                // If it's a roaster, also check if any of its cafes sell this coffee
                const selectedRoaster = mockCafes.roasters.find(roaster => roaster.id === selectedBusinessId);
                if (selectedRoaster) {
                  const roasterCafes = mockCafes.cafes.filter(cafe => cafe.roasterId === selectedBusinessId);
                  const cafeMatch = roasterCafes.some(cafe => 
                    coffeeSellers.some(seller => seller.id === cafe.id)
                  );
                  return directMatch || cafeMatch;
                }
                
                return directMatch;
              });
            });
            break;
          case 'tried':
            // Check if the coffee is in the user's collection
            // For this example, we'll use coffee events to determine if coffee has been tried
            // In a real app, this would use a proper user collection database
            if (selectedOptions.includes('yes')) {
              const triedCoffeeIds = mockCoffees.coffeeEvents
                .filter(event => event.userId === 'currentUser' || 
                                 event.type === 'added_to_collection')
                .map(event => event.coffeeId);
              filteredCoffees = filteredCoffees.filter(coffee => 
                triedCoffeeIds.includes(coffee.id)
              );
            } else if (selectedOptions.includes('no')) {
              const triedCoffeeIds = mockCoffees.coffeeEvents
                .filter(event => event.userId === 'currentUser' || 
                                 event.type === 'added_to_collection')
                .map(event => event.coffeeId);
              filteredCoffees = filteredCoffees.filter(coffee => 
                !triedCoffeeIds.includes(coffee.id)
              );
            }
            break;
        }
      }
    });
    
    // Sort coffees based on sort order
    if (sortOrder === 'popularity') {
      // For this example, we'll simulate popularity by using price as a proxy
      // In a real app, you would sort by actual popularity metrics
      filteredCoffees = filteredCoffees.sort((a, b) => {
        // Extract a numeric value from the ID to simulate popularity
        const popA = parseInt(a.id.replace(/[^0-9]/g, '') || '0');
        const popB = parseInt(b.id.replace(/[^0-9]/g, '') || '0');
        return popB - popA; // Higher "popularity" first
      });
    } else if (sortOrder === 'alphabetical') {
      filteredCoffees = filteredCoffees.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOrder === 'price-low') {
      filteredCoffees = filteredCoffees.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price-high') {
      filteredCoffees = filteredCoffees.sort((a, b) => b.price - a.price);
    }
    
    // NEW: apply text search filter (coffee name only)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredCoffees = filteredCoffees.filter(coffee => coffee.name.toLowerCase().includes(query));
    }

    setCoffees(filteredCoffees);
  }, [activeFilters, sortOrder, filterCategories, getAllAvailableCoffees, searchQuery]);

  const openFilterModal = (category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const toggleFilter = (category, option) => {
    setActiveFilters(prev => {
      const currentCategoryFilters = prev[category] || [];
      
      // Check if this option is already selected
      const isAlreadySelected = currentCategoryFilters.includes(option);
      
      if (isAlreadySelected) {
        // Remove the option if already selected
        return {
          ...prev,
          [category]: currentCategoryFilters.filter(opt => opt !== option)
        };
      } else {
        // Add the option if not already selected
        return {
          ...prev,
          [category]: [...currentCategoryFilters, option]
        };
      }
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSortOrder('default');
  };

  // Handle add coffee modal options
  const handleAddCoffeeOption = async (option) => {
    setShowAddCoffeeModal(false);
    
    switch (option) {
      case 'url':
        handleURLInput();
        break;
      case 'camera':
        await handleTakePhoto();
        break;
      case 'gallery':
        await handleSelectFromGallery();
        break;
      case 'manual':
        navigation.navigate('AddCoffeeManually');
        break;
    }
  };

  // Handle URL input with alert
  const handleURLInput = () => {
    Alert.prompt(
      'Enter Coffee URL',
      'Paste the URL of a coffee product page to extract details automatically',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Parse URL',
          onPress: (url) => {
            if (url && url.trim()) {
              navigation.navigate('AddCoffeeFromURL', { url: url.trim() });
            } else {
              Alert.alert('Error', 'Please enter a valid URL');
            }
          }
        }
      ],
      'plain-text',
      '',
      'url'
    );
  };

  // Handle camera capture
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('AddCoffeeFromCamera', { 
          capturedImage: result.assets[0].uri 
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle gallery selection
  const handleSelectFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('AddCoffeeFromGallery', { 
          selectedImage: result.assets[0].uri 
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const renderFilterBar = () => {
    return (
      <View>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBarContainer}
        >
          <TouchableOpacity
            style={[
              styles.filterBarItem,
              { 
                backgroundColor: isDarkMode ? theme.cardBackground : '#F2F2F7',
                borderColor: isDarkMode ? theme.border : '#E5E5EA'
              },
              sortOrder !== 'default' && [
                styles.activeFilterBarItem,
                { 
                  backgroundColor: isDarkMode ? theme.primaryText : '#000000',
                  borderColor: isDarkMode ? theme.primaryText : '#000000'
                }
              ]
            ]}
            onPress={() => setSortModalVisible(true)}
          >
            <View style={styles.sortChipContent}>
              <Ionicons 
                name="swap-vertical" 
                size={14} 
                color={sortOrder !== 'default' ? (isDarkMode ? theme.background : '#FFFFFF') : theme.primaryText} 
                style={styles.sortIcon}
              />
              <Text 
                style={[
                  styles.filterBarItemText,
                  { color: theme.primaryText },
                  sortOrder !== 'default' && [
                    styles.activeFilterBarItemText,
                    { color: isDarkMode ? theme.background : '#FFFFFF' }
                  ]
                ]}
              >
                {getCurrentSortLabel()}
              </Text>
            </View>
          </TouchableOpacity>

          {filterCategories.map(category => {
            const activeCount = (activeFilters[category.id] || []).length;
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.filterBarItem,
                  { 
                    backgroundColor: isDarkMode ? theme.cardBackground : '#F2F2F7',
                    borderColor: isDarkMode ? theme.border : '#E5E5EA'
                  },
                  activeCount > 0 && [
                    styles.activeFilterBarItem,
                    { 
                      backgroundColor: isDarkMode ? theme.primaryText : '#000000',
                      borderColor: isDarkMode ? theme.primaryText : '#000000'
                    }
                  ]
                ]}
                onPress={() => openFilterModal(category)}
              >
                <Text 
                  style={[
                    styles.filterBarItemText,
                    { color: theme.primaryText },
                    activeCount > 0 && [
                      styles.activeFilterBarItemText,
                      { color: isDarkMode ? theme.background : '#FFFFFF' }
                    ]
                  ]}
                >
                  {category.label}
                  {activeCount > 0 ? ` (${activeCount})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderFilterModal = () => {
    if (!selectedCategory) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>{selectedCategory.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>
                  <Ionicons name="close" size={24} color={theme.primaryText} />
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptionsContainer}>
              {selectedCategory.options.map(option => {
                const isSelected = (activeFilters[selectedCategory.id] || []).includes(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: theme.divider },
                      isSelected && styles.selectedModalOption
                    ]}
                    onPress={() => toggleFilter(selectedCategory.id, option.id)}
                  >
                    <Text 
                      style={[
                        styles.modalOptionText,
                        { color: theme.primaryText },
                        isSelected && styles.selectedModalOptionText
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && <Text><Ionicons name="checkmark" size={20} color="#FFFFFF" /></Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSortModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Sort By</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Text>
                  <Ionicons name="close" size={24} color={theme.primaryText} />
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptionsContainer}>
              {sortOptions.map(option => {
                const isSelected = option.id === sortOrder;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: theme.divider },
                      isSelected && styles.selectedModalOption
                    ]}
                    onPress={() => {
                      setSortOrder(option.id);
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      { color: theme.primaryText },
                      isSelected && styles.selectedModalOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {isSelected && <Text><Ionicons name="checkmark" size={20} color="#FFFFFF" /></Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Add this helper function before the component
  const getCountryFlag = (countryName) => {
    // Normalize country names
    const normalizedName = countryName === 'Ruanda' ? 'Rwanda' :
                          countryName === 'Perú' ? 'Peru' :
                          countryName === 'Bolivia (Plurinational State of)' ? 'Bolivia' :
                          countryName;
    
    const countryFlags = {
      'Ethiopia': '🇪🇹',
      'Bolivia': '🇧🇴',
      'Colombia': '🇨🇴',
      'Brazil': '🇧🇷',
      'Costa Rica': '🇨🇷',
      'Guatemala': '🇬🇹',
      'Honduras': '🇭🇳',
      'Indonesia': '🇮🇩',
      'Kenya': '🇰🇪',
      'Mexico': '🇲🇽',
      'Nicaragua': '🇳🇮',
      'Panama': '🇵🇦',
      'Peru': '🇵🇪',
      'Rwanda': '🇷🇼',
      'Tanzania': '🇹🇿',
      'Uganda': '🇺🇬',
      'Vietnam': '🇻🇳',
      'Yemen': '🇾🇪',
      // Add more countries as needed
    };
    
    return countryFlags[normalizedName] || '';
  };

  const renderCoffeeItem = ({ item }) => {
    let sellers = mockCoffees.sellers[item.id] || [];
    
    if (sellers.length === 0 && item.roasterId) {
      const roasterInfo = Object.values(mockCoffees.sellers || {})
        .flat()
        .find(seller => seller.id === item.roasterId);
        
      if (roasterInfo) {
        sellers = [roasterInfo];
      } else {
        sellers = [{
          id: item.roasterId,
          name: item.roaster,
          avatar: item.image,
          location: "",
          isRoaster: true,
          businessAccount: true
        }];
      }
    }
    
    const countryFlag = getCountryFlag(item.origin);
    
    return (
      <View style={[styles.coffeeCardContainer, { borderBottomColor: theme.divider }]}>
        <TouchableOpacity 
          style={[styles.coffeeCard, { backgroundColor: theme.background }]}
          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
        >
          <View style={[styles.coffeeImageContainer, { backgroundColor: theme.placeholder }]}>
            <AppImage 
              source={item.image || item.images?.[0]} 
              style={[styles.coffeeImage, { backgroundColor: theme.placeholder }]}
              placeholder="cafe"
            />
          </View>
          <View style={styles.coffeeContent}>
            <Text style={[styles.coffeeName, { color: theme.primaryText }]}>{item.name}</Text>
            <Text style={[styles.coffeeRoaster, { color: theme.secondaryText }]}>{item.roaster}</Text>
            <View style={styles.coffeeDetailsRow}>
              <View style={styles.originProcessContainer}>
                <Text 
                  style={[styles.coffeeOrigin, { color: theme.secondaryText }]}
                  numberOfLines={1}
                >
                  {countryFlag} {item.origin}
                  {item.process && <Text style={[styles.coffeeProcess, { color: theme.secondaryText }]}> • {item.process}</Text>}
                </Text>
              </View>
              <Text style={[styles.coffeePrice, { color: theme.primaryText }]}>€{item.price.toFixed(2)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // NEW: scroll handler to toggle search input visibility
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY < -40 && !showSearchInput) {
      setShowSearchInput(true);
    } else if (offsetY > 0 && showSearchInput) {
      setShowSearchInput(false);
    }
  };

  // NEW: render search input above filters
  const renderSearchInput = () => (
    <View style={[styles.searchContainer, { height: showSearchInput ? 50 : 0 }]}>      
      {showSearchInput && (
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: isDarkMode ? theme.cardBackground : '#F2F2F7',
              color: theme.primaryText,
              borderColor: isDarkMode ? theme.border : '#E5E5EA'
            }
          ]}
          placeholder="Search coffee"
          placeholderTextColor={theme.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={coffees}
        renderItem={renderCoffeeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.coffeeList}
        ListHeaderComponent={() => (
          <View>
            {renderSearchInput()}
            {renderFilterBar()}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No coffees found</Text>
          </View>
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
      
      {renderFilterModal()}
      {renderSortModal()}
      
      {/* Clear Filters FAB - only show when filters are active */}
      {hasActiveFilters && (
        <TouchableOpacity 
          style={[
            styles.clearFiltersFab, 
            { 
              bottom: insets.bottom,
              backgroundColor: isDarkMode ? '#FFFFFF' : '#000000'
            }
          ]}
          onPress={clearAllFilters}
        >
          <Text style={[styles.clearFiltersFabText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Clear filters</Text>
        </TouchableOpacity>
      )}

      {/* Add Coffee Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAddCoffeeModal}
        onRequestClose={() => setShowAddCoffeeModal(false)}
      >
        <View style={styles.addCoffeeModalContainer}>
                     <View style={[
             styles.addCoffeeModalContent,
             { 
               paddingBottom: insets.bottom + 12, 
               backgroundColor: isDarkMode ? theme.altBackground : '#f4f4f4' 
             }
           ]}>
             <View style={[styles.addCoffeeModalHeader, { borderBottomColor: theme.divider }]}>
               <Text style={[styles.addCoffeeModalTitle, { color: theme.primaryText }]}>Add Coffee</Text>
               <TouchableOpacity 
                 style={styles.closeButton}
                 onPress={() => setShowAddCoffeeModal(false)}
               >
                 <Ionicons name="close" size={24} color={theme.primaryText} />
               </TouchableOpacity>
             </View>
             
             <View style={styles.addCoffeeOptionsContainer}>
                             <TouchableOpacity
                 style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                 onPress={() => handleAddCoffeeOption('url')}
               >
                 <Ionicons name="link-outline" size={24} color={theme.primaryText} />
                 <View style={styles.addCoffeeOptionTextContainer}>
                   <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Paste URL</Text>
                   <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Add coffee from a website URL</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                 onPress={() => handleAddCoffeeOption('camera')}
               >
                 <Ionicons name="camera-outline" size={24} color={theme.primaryText} />
                 <View style={styles.addCoffeeOptionTextContainer}>
                   <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Take Picture</Text>
                   <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Scan coffee bag with camera</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                 onPress={() => handleAddCoffeeOption('gallery')}
               >
                 <Ionicons name="image-outline" size={24} color={theme.primaryText} />
                 <View style={styles.addCoffeeOptionTextContainer}>
                   <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Select Picture</Text>
                   <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Choose from photo library</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
               </TouchableOpacity>
               
               <TouchableOpacity
                 style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
                 onPress={() => handleAddCoffeeOption('manual')}
               >
                 <Ionicons name="create-outline" size={24} color={theme.primaryText} />
                 <View style={styles.addCoffeeOptionTextContainer}>
                   <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Enter Manually</Text>
                   <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Fill out coffee details by hand</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
               </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBarContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  filterBarItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeFilterBarItem: {
    // Styles applied inline with theme colors
  },
  filterBarItemText: {
    fontSize: 14,
  },
  activeFilterBarItemText: {
    // Styles applied inline with theme colors
  },
  sortChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIcon: {
    marginRight: 4,
  },
  activeFilterContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  activeFilterChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 4,
  },
  closeIcon: {
    marginLeft: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOptionsContainer: {
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  selectedModalOption: {
    backgroundColor: '#000000',
  },
  modalOptionText: {
    fontSize: 16,
  },
  selectedModalOptionText: {
    color: '#FFFFFF',
  },

  coffeeList: {
    paddingBottom: 60, // Reduced from 120 to account for just the FAB height + some spacing
  },
  coffeeCardContainer: {
    borderBottomWidth: 1,
  },
  coffeeCard: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  coffeeImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    // marginLeft: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: 'transparent',
  },
  coffeeContent: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coffeeRoaster: {
    fontSize: 14,
    marginBottom: 4,
  },
  coffeeDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  originProcessContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  coffeeOrigin: {
    fontSize: 12,
    flex: 1,
  },
  coffeeProcess: {
    fontSize: 12,
  },
  coffeePrice: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  clearFiltersFab: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 4.65,
    // elevation: 8,
  },
  clearFiltersFabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  addCoffeeModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addCoffeeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addCoffeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  addCoffeeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  addCoffeeOptionsContainer: {
    padding: 16,
  },
  addCoffeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
  },
  addCoffeeOptionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  addCoffeeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  addCoffeeOptionSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  searchContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 16,
  },
});

export default CoffeeDiscoveryScreen; 