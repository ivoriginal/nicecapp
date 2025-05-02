import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import mockData from '../data/mockData.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecipeCard from '../components/RecipeCard';
import AppImage from '../components/common/AppImage';
import { useCoffee } from '../context/CoffeeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 200;
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;
const SEARCH_INPUT_BG_COLOR = '#F0F0F0';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { currentAccount } = useCoffee();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef(null);
  const navigation = useNavigation();
  const isFirstMount = useRef(true);
  const [suggestedUsers, setSuggestedUsers] = useState(mockData.suggestedUsers);
  
  // Use recipes from mockData.json instead of hardcoded data
  const [popularRecipes, setPopularRecipes] = useState(mockData.recipes || []);

  // Get coffee suggestions and trending cafés from mock data
  const coffeeSuggestions = mockData.coffeeSuggestions;
  const trendingCafes = mockData.trendingCafes;
  
  // Get coffee events for the "People You Might Know" section from mockData
  const suggestedEvents = mockData.coffeeEvents
    .filter(event => 
      // Only include coffee brewing events, not other event types
      !event.type && 
      // Only include events from suggested users
      mockData.suggestedUsers.some(user => user.id === event.userId)
    )
    .slice(0, 3); // Take first 3 matching events

  // Load recent searches from AsyncStorage
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    };
    
    loadRecentSearches();
  }, []);

  useEffect(() => {
    // Set up a listener for tab press events
    const unsubscribe = navigation.addListener('tabPress', (e) => {
      // Check if we're already on the Search screen
      if (navigation.isFocused()) {
        // Prevent default behavior
        e.preventDefault();
        // Focus the search input
        searchInputRef.current?.focus();
      }
    });

    // Clean up the listener when component unmounts
    return unsubscribe;
  }, [navigation]);

  // Save a search to recent searches
  const saveRecentSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    try {
      // Remove the search term if it already exists
      const filteredSearches = recentSearches.filter(term => term !== searchTerm);
      
      // Add the new search term to the beginning of the array
      const updatedSearches = [searchTerm, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES);
      
      // Update state and AsyncStorage
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  // Remove a search from recent searches
  const removeRecentSearch = async (searchTerm) => {
    try {
      const updatedSearches = recentSearches.filter(term => term !== searchTerm);
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  };

  // Clear all recent searches
  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    setIsSearching(true);
    
    // Simulate search results
    if (text.length > 0) {
      // Create search results with proper IDs from mockData
      let mockResults = [];
      // Track names to avoid duplicates
      const addedNames = new Set();
      
      // Clean search text - remove @ from handles for better matching
      const cleanSearchText = text.toLowerCase().replace('@', '');
      
      // Add coffees
      mockData.coffees.forEach(coffee => {
        if (coffee.name.toLowerCase().includes(cleanSearchText) || 
            coffee.roaster.toLowerCase().includes(cleanSearchText)) {
          mockResults.push({
            id: `coffee-${coffee.id}`,
            coffeeId: coffee.id,
            name: coffee.name,
            roaster: coffee.roaster,
            type: 'coffee',
            image: coffee.image
          });
          addedNames.add(coffee.name.toLowerCase());
        }
      });
      
      // Add businesses/cafes/roasters - search through different sources
      // First, trendingCafes
      if (mockData.trendingCafes) {
        mockData.trendingCafes.forEach(business => {
          if (business.name && !addedNames.has(business.name.toLowerCase()) && 
              (business.name.toLowerCase().includes(cleanSearchText) || 
              (business.location && business.location.toLowerCase().includes(cleanSearchText)))) {
            mockResults.push({
              // Use the actual ID for Toma locations, not a prefixed one
              id: business.name && business.name.includes('Toma Café') ? business.id : `cafe-${business.id}`,
              businessId: business.businessId || business.id,
              name: business.name,
              location: business.location || 'Unknown location',
              type: business.businessId ? 'cafe' : 'roaster', // If it has a businessId, it's likely a café location
              isRoaster: business.businessId ? false : true, // If no businessId, treat as a standalone roaster
              logo: business.logo,
              avatar: business.avatar,
              imageUrl: business.imageUrl || business.coverImage
            });
            addedNames.add(business.name.toLowerCase());
          }
        });
      }
      
      // Then through businesses
      if (mockData.businesses) {
        mockData.businesses.forEach(business => {
          if (business.name && !addedNames.has(business.name.toLowerCase()) && 
              (business.name.toLowerCase().includes(cleanSearchText) || 
              (business.location && business.location.toLowerCase().includes(cleanSearchText)))) {
            // Determine if this is a roaster
            const isRoaster = business.type === 'roaster_coffee_shop' || business.id.toLowerCase().includes('roaster');
            mockResults.push({
              id: `business-${business.id}`,
              businessId: business.id,
              name: business.name,
              location: business.location || 'Unknown location',
              type: isRoaster ? 'roaster' : 'cafe',
              isRoaster: isRoaster,
              logo: business.logo,
              avatar: business.avatar,
              imageUrl: business.coverImage
            });
            addedNames.add(business.name.toLowerCase());
          }
        });
      }
      
      // Special case for roasters
      const roasterIds = ['business-toma', 'business-kima', 'business-cafelab'];
      roasterIds.forEach(roasterId => {
        const roaster = mockData.businesses.find(b => b.id === roasterId);
        if (roaster && !addedNames.has(roaster.name.toLowerCase()) &&
            (cleanSearchText === '' || // Always include main roasters in empty searches
             roaster.name.toLowerCase().includes(cleanSearchText) ||
             (roaster.location && roaster.location.toLowerCase().includes(cleanSearchText)))) {
          mockResults.push({
            id: `business-${roaster.id}`,
            businessId: roaster.id,
            name: roaster.name,
            location: roaster.location || 'Unknown location',
            type: 'roaster',
            isRoaster: true,
            logo: roaster.logo,
            avatar: roaster.avatar,
            imageUrl: roaster.coverImage
          });
          addedNames.add(roaster.name.toLowerCase());
        }
      });
      
      // Add users
      mockData.users.forEach(user => {
        // Generate username (handle) for matching
        const userHandle = user.userName?.toLowerCase().replace(/\s+/g, '');
        
        if ((user.userName && !addedNames.has(user.userName.toLowerCase()) && 
            (user.userName.toLowerCase().includes(cleanSearchText) || 
            (user.location && user.location.toLowerCase().includes(cleanSearchText)))) ||
            // Also search by username (handle)
            (userHandle && userHandle.includes(cleanSearchText))) {
          mockResults.push({
            id: `user-${user.id}`,
            userId: user.id,
            name: user.userName,
            username: userHandle,
            location: user.location,
            type: 'user',
            userAvatar: user.userAvatar
          });
          addedNames.add(user.userName.toLowerCase());
        }
      });
      
      // Also check for special case of Vértigo y Calambre which might be in different formats
      const vertigoTerms = ['vertigo', 'calambre', 'vértigo', 'vertigoycalambre'];
      if (vertigoTerms.some(term => cleanSearchText.includes(term))) {
        // Make sure we add Vértigo y Calambre if not already in results
        const hasVertigo = addedNames.has('vértigo y calambre');
        if (!hasVertigo) {
          // Look for it in users
          const vertigoUser = mockData.users.find(u => u.userName === 'Vértigo y Calambre');
          if (vertigoUser) {
            mockResults.push({
              id: `user-${vertigoUser.id}-special`,
              userId: vertigoUser.id,
              name: vertigoUser.userName,
              username: 'vertigoycalambre',
              location: vertigoUser.location || 'Murcia, Spain',
              type: 'user',
              userAvatar: vertigoUser.userAvatar
            });
            addedNames.add('vértigo y calambre');
          }
        }
      }
      
      // Log the results for debugging
      console.log('Search results:', mockResults.map(r => r.name));
      
      setSearchResults(mockResults);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      setIsInputFocused(false);
    }
  };

  const handleRecentSearchPress = (searchTerm) => {
    setSearchQuery(searchTerm);
    handleSearch(searchTerm);
    setIsInputFocused(false);
  };

  const filteredResults = searchResults.filter(item => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  // Helper function to handle both remote and local image sources
  const getImageSource = (imageUrl) => {
    // Add useful logging
    console.log('[SearchScreen] Loading image source:', typeof imageUrl === 'string' ? imageUrl : (typeof imageUrl === 'number' ? 'require() asset' : JSON.stringify(imageUrl)));
    
    // Check if it's a require statement result (for local assets)
    if (typeof imageUrl === 'number') {
      return imageUrl;
    }
    
    // Check if it's a string path that starts with 'assets/'
    if (typeof imageUrl === 'string' && imageUrl.startsWith('assets/')) {
      // Extract the asset path and load the appropriate image
      if (imageUrl === 'assets/users/ivo-vilches.jpg') {
        return require('../../assets/users/ivo-vilches.jpg');
      } else if (imageUrl === 'assets/users/carlos-hernandez.jpg') {
        return require('../../assets/users/carlos-hernandez.jpg');
      } else if (imageUrl === 'assets/businesses/vertigo-logo.jpg') {
        return require('../../assets/businesses/vertigo-logo.jpg');
      } else if (imageUrl === 'assets/businesses/vertigo-cover.jpg') {
        return require('../../assets/businesses/vertigo-cover.jpg');
      } else if (imageUrl === 'assets/businesses/cafelab-logo.png') {
        return require('../../assets/businesses/cafelab-logo.png');
      } else if (imageUrl === 'assets/businesses/cafelab-murcia-cover.png') {
        return require('../../assets/businesses/cafelab-murcia-cover.png');
      } else if (imageUrl === 'assets/businesses/cafelab-cartagena-cover.png') {
        return require('../../assets/businesses/cafelab-cartagena-cover.png');
      } else if (imageUrl === 'assets/businesses/toma-logo.jpg') {
        return require('../../assets/businesses/toma-logo.jpg');
      } else if (imageUrl === 'assets/businesses/kima-logo.jpg') {
        return require('../../assets/businesses/kima-logo.jpg');
      }
      // Log warning if asset not found
      console.warn('[SearchScreen] Local asset not found:', imageUrl);
      // Return a default image if the specific asset wasn't found
      return require('../../assets/users/ivo-vilches.jpg');
    }
    
    // For URLs and other types of sources
    return typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl;
  };

  const renderSearchResult = ({ item }) => {
    // Determine if we should show category labels based on the filter
    const showCategory = activeFilter === 'all';
    
    if (item.type === 'coffee') {
      // Coffee already has image from the search results
      const imageUrl = item.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e';
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.coffeeId || item.id })}
        >
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.resultCoffeeImage} 
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{showCategory ? `Coffee · ${item.roaster}` : item.roaster}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      );
    } else if (item.type === 'roaster') {
      // Use the avatar, logo or imageUrl provided in search results, prioritizing avatar
      let imageUrl = item.avatar || item.logo || item.imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';
      
      // Try to load local assets
      const imageSource = getImageSource(imageUrl);
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Use the business ID for roasters
            const roasterId = item.businessId || item.id;
            navigation.navigate('UserProfileBridge', { 
              userId: roasterId, 
              userName: item.name,
              skipAuth: true 
            });
          }}
        >
          <Image 
            source={imageSource} 
            style={styles.resultBusinessImage} 
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{showCategory ? `Roaster · ${item.location}` : item.location}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      );
    } else if (item.type === 'cafe') {
      // Use the avatar, logo or imageUrl provided in search results, prioritizing avatar
      let imageUrl = item.avatar || item.logo || item.imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';
      
      // Try to load local assets
      const imageSource = getImageSource(imageUrl);
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Special cases for Toma Cafe locations and Vertigo
            if (item.name && item.name.includes('Toma Café') && item.name !== 'Toma Café') {
              // For Toma Café locations (like Toma Café 1), navigate to the specific location
              // Debug log to see what ID we're using
              console.log('Navigating to Toma Café location:', item.id, item.name);
              
              // Use the correct ID format for Toma Café locations
              const locationId = item.id.startsWith('cafe-') ? item.id.replace('cafe-', '') : item.id;
              
              navigation.navigate('UserProfileBridge', { 
                userId: locationId,
                userName: item.name,
                skipAuth: true,
                isLocation: true,
                parentBusinessId: 'business-toma'
              });
            } else if (item.name && item.name === 'Toma Café') {
              // For the main Toma Café profile
              navigation.navigate('UserProfileBridge', { 
                userId: 'business-toma',
                userName: 'Toma Café',
                skipAuth: true
              });
            } else if ((item.name && item.name === 'Vértigo y Calambre') ||
                     (item.id === 'vertigo-calambre') ||
                     (item.businessId === 'business1')) {
              // For Vértigo y Calambre
              navigation.navigate('UserProfileBridge', { 
                userId: 'user2', // user2 is Vértigo y Calambre in the mock data
                userName: 'Vértigo y Calambre',
                skipAuth: true
              });
            }
            // Only use location-specific navigation for CaféLab and other locations
            else if (item.businessId && item.businessId !== item.id && 
                    item.businessId === 'business-cafelab') {
              navigation.navigate('UserProfileBridge', { 
                userId: item.id,
                userName: item.name,
                skipAuth: true,
                isLocation: true,
                parentBusinessId: item.businessId
              });
            } else {
              // For standalone cafes without a parent business, use regular navigation
              navigation.navigate('UserProfileBridge', { 
                userId: item.id,
                userName: item.name,
                skipAuth: true
              });
            }
          }}
        >
          <Image 
            source={imageSource}
            style={styles.resultBusinessImage}
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{showCategory ? `Café · ${item.location}` : item.location}</Text>
            {item.isRoaster && (
              <View style={styles.cafeRoasterTag}>
                <Text style={styles.cafeRoasterTagText}>Roaster</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      );
    } else if (item.type === 'user') {
      // Use the userAvatar provided in search results
      let imageUrl = item.userAvatar || 'https://randomuser.me/api/portraits/men/1.jpg';
      
      // Try to load local assets
      const imageSource = getImageSource(imageUrl);
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Navigate to the bridge component first
            navigation.navigate('UserProfileBridge', { 
              userId: item.userId || item.id.replace('user-', ''), 
              userName: item.userName || item.name,
              skipAuth: true,
              isCurrentUser: (item.userId === currentAccount) || (item.id.replace('user-', '') === currentAccount)
            });
          }}
        >
          <Image 
            source={imageSource}
            style={styles.resultUserImage} 
            resizeMode="cover"
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.userName || item.name}</Text>
            <Text style={styles.roasterName}>
              {showCategory ? `Profile · @${(item.userName || item.name)?.toLowerCase().replace(/\s+/g, '')}` : 
              `@${(item.userName || item.name)?.toLowerCase().replace(/\s+/g, '')}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      );
    }
  };

  const renderFilterChips = () => {
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'coffee', label: 'Coffees' },
      { id: 'roaster', label: 'Roasters' },
      { id: 'cafe', label: 'Cafés' },
      { id: 'user', label: 'Profiles' },
    ];

    return (
      <View style={styles.filterChipsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {filters.map(filter => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.filterChip,
                activeFilter === filter.id && styles.activeFilterChip
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text 
                style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.activeFilterText
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderCarouselItem = ({ item, type }) => {
    switch (type) {
      case 'recipe':
        // Format recipe data to work well with RecipeCard component
        const recipeData = {
          ...item,
          // Ensure the recipe has proper user information
          userId: item.creatorId || item.userId,
          userName: item.creatorName || item.userName,
          userAvatar: item.creatorAvatar || item.userAvatar,
          // Ensure the recipe has method (or use brewingMethod)
          method: item.method || item.brewingMethod,
          // Ensure the recipe has proper coffee information
          coffeeId: item.coffeeId,
          coffeeName: item.coffeeName,
          coffeeImage: item.coffeeImage || mockData.coffees.find(c => c.id === item.coffeeId)?.image || item.imageUrl,
          roaster: item.roaster,
          // Convert other properties if needed
          rating: item.rating || 4.5,
          amount: item.coffeeAmount || item.amount || 18,
          grindSize: item.grindSize || 'Medium',
          waterVolume: item.waterAmount || item.waterVolume || 300,
          brewTime: item.brewTime || '3:00'
        };

        return (
          <RecipeCard
            recipe={recipeData}
            onPress={(recipeId) => navigation.navigate('RecipeDetail', { 
              recipeId,
              coffeeName: item.coffeeName,
              roaster: item.roaster,
              imageUrl: item.imageUrl || item.image,
              userId: item.creatorId || item.userId,
              userName: item.creatorName || item.userName,
              userAvatar: item.creatorAvatar || item.userAvatar,
              skipAuth: true
            })}
            onUserPress={(userId) => navigation.navigate('UserProfileBridge', { 
              userId, 
              userName: item.creatorName || item.userName,
              skipAuth: true 
            })}
            showCoffeeInfo={true}
            style={{ backgroundColor: SEARCH_INPUT_BG_COLOR }}
          />
        );
      case 'coffee':
        // Get seller/roaster information
        const coffeeRoaster = item.roaster || '';
        const sellersForCoffee = mockData.sellers && mockData.sellers[item.id];
        const mainSeller = sellersForCoffee && sellersForCoffee.length > 0 ? 
          sellersForCoffee.find(s => s.isRoaster) || sellersForCoffee[0] : null;
          
        return (
          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
          >
            <AppImage 
              source={item.imageUrl || item.image} 
              style={styles.carouselImage} 
              resizeMode="cover"
            />
            <View style={styles.carouselOverlay}>
              <Text style={styles.carouselTitle}>{item.name}</Text>
              <View style={styles.carouselRoasterContainer}>
                {mainSeller && mainSeller.avatar && (
                  <AppImage
                    source={mainSeller.avatar}
                    style={styles.carouselRoasterLogo}
                    resizeMode="cover"
                  />
                )}
                <Text style={styles.carouselSubtitle}>{coffeeRoaster}</Text>
              </View>
              <View style={styles.carouselStats}>
                <Text style={styles.carouselPrice}>${item.price ? item.price.toFixed(2) : '0.00'}</Text>
                <Text style={styles.carouselOrigin}>{item.origin}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      case 'cafe':
        return (
          <TouchableOpacity 
            style={styles.carouselCard}
            onPress={() => {
              // Special cases for Toma Cafe locations and Vertigo
              if (item.name && item.name.includes('Toma Café') && item.name !== 'Toma Café') {
                // For Toma Café locations (like Toma Café 1), navigate to the specific location
                // Debug log to see what ID we're using
                console.log('Navigating to Toma Café location:', item.id, item.name);
                
                // Use the correct ID format for Toma Café locations
                const locationId = item.id.startsWith('cafe-') ? item.id.replace('cafe-', '') : item.id;
                
                navigation.navigate('UserProfileBridge', { 
                  userId: locationId,
                  userName: item.name,
                  skipAuth: true,
                  isLocation: true,
                  parentBusinessId: 'business-toma'
                });
              } else if (item.name && item.name === 'Toma Café') {
                // For the main Toma Café profile
                navigation.navigate('UserProfileBridge', { 
                  userId: 'business-toma',
                  userName: 'Toma Café',
                  skipAuth: true
                });
              } else if ((item.name && item.name === 'Vértigo y Calambre') ||
                      (item.id === 'vertigo-calambre') ||
                      (item.businessId === 'business1')) {
                // For Vértigo y Calambre
                navigation.navigate('UserProfileBridge', { 
                  userId: 'user2', // user2 is Vértigo y Calambre in the mock data
                  userName: 'Vértigo y Calambre',
                  skipAuth: true
                });
              }
              // Only use location-specific navigation for CaféLab and other locations
              else if (item.businessId && item.businessId !== item.id && 
                      item.businessId === 'business-cafelab') {
                navigation.navigate('UserProfileBridge', { 
                  userId: item.id,
                  userName: item.name,
                  skipAuth: true,
                  isLocation: true,
                  parentBusinessId: item.businessId
                });
              } else {
                // For standalone cafes without a parent business, use regular navigation
                navigation.navigate('UserProfileBridge', { 
                  userId: item.id,
                  userName: item.name,
                  skipAuth: true
                });
              }
            }}
          >
            <AppImage 
              source={item.coverImage || item.imageUrl} 
              style={styles.carouselImage}
              resizeMode="cover"
            />
            <View style={styles.carouselOverlay}>
              <View style={styles.cafeInfoRow}>
                <AppImage 
                  source={item.avatar || item.logo} 
                  style={styles.cafeLogo} 
                  resizeMode="cover"
                />
                <View style={styles.cafeTextContainer}>
                  <Text style={styles.carouselTitle}>{item.name}</Text>
                  <Text style={styles.carouselSubtitle}>{item.location}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      case 'user':
        return (
          <TouchableOpacity 
            style={styles.userCard}
            onPress={() => {
              // Navigate to the bridge component first
              navigation.navigate('UserProfileBridge', { 
                userId: item.id, 
                userName: item.userName,
                skipAuth: true 
              });
            }}
          >
            <AppImage 
              source={item.userAvatar} 
              style={styles.userAvatar} 
              resizeMode="cover"
            />
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.userUsername}>@{item.userName?.toLowerCase().replace(/\s+/g, '')}</Text>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      case 'event':
        return (
          <TouchableOpacity 
            style={styles.eventCard}
            onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.coffeeId })}
          >
            <AppImage 
              source={item.imageUrl} 
              style={styles.eventImage} 
              resizeMode="cover"
            />
            <View style={styles.eventContent}>
              <View style={styles.eventUserInfo}>
                <AppImage 
                  source={item.userAvatar} 
                  style={styles.eventUserAvatar} 
                  resizeMode="cover"
                />
                <Text style={styles.eventUserName}>{item.userName}</Text>
              </View>
              <Text style={styles.eventCoffeeName}>{item.coffeeName}</Text>
              <Text style={styles.eventRoaster}>{item.roaster}</Text>
              <View style={styles.eventRating}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.eventRatingText}>{item.rating ? item.rating.toFixed(1) : '0.0'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  const renderCarousel = (title, data, type, showViewMore = false, viewMoreDestination = null, viewMoreParams = {}) => {
    if (!data || data.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.carouselSectionTitle}>{title}</Text>
          {showViewMore && (
            <TouchableOpacity 
              onPress={() => navigation.navigate(viewMoreDestination, viewMoreParams)}
            >
              <Text style={styles.viewAllText}>View more</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={data}
          renderItem={({ item }) => {
            // If type is 'mixed', determine the actual type from the item
            const itemType = type === 'mixed' ? 
              item.type || 
              // If no type, but has coffeeId/coffeeName it's likely an event
              (item.coffeeId && item.coffeeName && !item.brewingMethod ? 'event' : 'user') 
              : type;
            
            return renderCarouselItem({ item, type: itemType });
          }}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={type === 'user' ? styles.userCarouselContainer : styles.carouselContainer}
        />
      </View>
    );
  };

  const renderPopularCoffeeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.popularCoffeeCard}
      onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
    >
      <Image 
        source={{ uri: item.imageUrl || item.image }} 
        style={styles.popularCoffeeImage} 
        resizeMode="cover"
      />
      <View style={styles.popularCoffeeContent}>
        <Text style={styles.popularCoffeeName}>{item.name}</Text>
        <Text style={styles.popularCoffeeRoaster}>{item.roaster}</Text>
        <View style={styles.popularCoffeeDetails}>
          <View style={styles.popularCoffeeOriginContainer}>
            <Text style={styles.popularCoffeeOrigin}>{item.origin}</Text>
          </View>
          <Text style={styles.popularCoffeePrice}>${item.price ? item.price.toFixed(2) : '0.00'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPopularCoffeeCarousel = (title, data, showViewMore = false, viewMoreDestination = null, viewMoreParams = {}) => {
    if (!data || data.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.carouselSectionTitle}>{title}</Text>
          {showViewMore && (
            <TouchableOpacity 
              onPress={() => navigation.navigate(viewMoreDestination, viewMoreParams)}
            >
              <Text style={styles.viewAllText}>View more</Text>
            </TouchableOpacity>
          )}
        </View>
        <FlatList
          data={data}
          renderItem={renderPopularCoffeeItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#000000" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search coffees, cafés, roasters and users"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setIsSearching(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
        {(isInputFocused || searchQuery.length > 0) && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
              setIsSearching(false);
              setIsInputFocused(false);
              searchInputRef.current?.blur();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSearching && searchQuery.length > 0 ? (
        <View style={styles.searchResultsWrapper}>
          {!isInputFocused && renderFilterChips()}
          <FlatList
            data={filteredResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.resultsContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            }
          />
        </View>
      ) : isInputFocused && !searchQuery ? (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={styles.clearRecentText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentSearches.length > 0 ? (
            recentSearches.map((search, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.recentSearchItem}
                onPress={() => handleRecentSearchPress(search)}
              >
                <Ionicons name="time-outline" size={20} color="#000000" />
                <Text style={styles.recentSearchText}>{search}</Text>
                <TouchableOpacity 
                  style={styles.removeRecentButton}
                  onPress={() => removeRecentSearch(search)}
                >
                  <Ionicons name="close" size={16} color="#000000" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyRecentContainer}>
              <Text style={styles.emptyRecentText}>No recent searches</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.discoveryContainer}
          contentContainerStyle={styles.discoveryContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderPopularCoffeeCarousel('Discover Coffee', mockData.coffees, true, 'CoffeeDiscovery', { sortBy: 'popularity' })}
          {renderCarousel('Good Cafés', trendingCafes, 'cafe', true, 'CafesList')}
          {renderCarousel('Recipes for you', popularRecipes, 'recipe', true, 'RecipesList')}
          {renderCarousel('People You Might Know', suggestedUsers, 'user', true, 'PeopleList')}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SEARCH_INPUT_BG_COLOR,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  filterChipsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterContainer: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterChip: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    color: '#000000',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  searchResultsWrapper: {
    flex: 1,
  },
  resultsContainer: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultContent: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  roasterName: {
    fontSize: 14,
    color: '#666666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
  discoveryContainer: {
    flex: 1,
  },
  discoveryContentContainer: {
    paddingTop: 16,
  },
  carouselSection: {
    marginBottom: 32,
  },
  carouselSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 4,
  },
  carouselContainer: {
    paddingHorizontal: 16,
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    padding: 12,
    paddingBottom: 4,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  carouselSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 1,
  },
  carouselStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  carouselPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  carouselOrigin: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  carouselType: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  recentSearchesContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 16,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  recentSearchText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  clearRecentText: {
    fontSize: 14,
    color: '#007AFF',
  },
  removeRecentButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyRecentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyRecentText: {
    fontSize: 16,
    color: '#666666',
  },
  userCard: {
    width: 180,
    height: 232,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userInfo: {
    width: '100%',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  userUsername: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 'auto',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  eventUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  eventUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  eventCoffeeName: {
    fontSize: 14,
    color: '#666666',
  },
  eventRoaster: {
    fontSize: 14,
    color: '#666666',
  },
  eventRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  cafeLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#242526',
    borderWidth: 1,
    borderColor: '#242526',
    marginRight: 12,
  },
  cafeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cafeTextContainer: {
    flex: 1,
  },
  popularCoffeeCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  popularCoffeeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E5EA',
  },
  popularCoffeeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  popularCoffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 3,
  },
  popularCoffeeRoaster: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  popularCoffeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularCoffeeOriginContainer: {
    flex: 1,
  },
  popularCoffeeOrigin: {
    fontSize: 14,
    color: '#666666',
  },
  popularCoffeePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  userCarouselContainer: {
    paddingHorizontal: 16,
  },
  cafeRoasterTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  cafeRoasterTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultUserImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultBusinessImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultCoffeeImage: {
    width: 44,
    height: 44,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  carouselRoasterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  carouselRoasterLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
}); 