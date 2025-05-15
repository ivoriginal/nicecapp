import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  RefreshControl,
  Platform,
  Pressable
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppImage from '../components/common/AppImage';
import TasteProfile from '../components/TasteProfile';
import { COLORS, SIZES, FONTS } from '../constants';
import mockRecipesData from '../data/mockRecipes.json';
import mockCoffees from '../data/mockCoffees.json';
import mockUsers from '../data/mockUsers.json';
import mockCafes from '../data/mockCafes.json';
import mockGear from '../data/mockGear.json';
import mockRecipes from '../data/mockRecipes.json';
import RecipeCard from '../components/RecipeCard';
import GearCard from '../components/GearCard';
import gearDetails from '../data/gearDetails';
import { useCoffee } from '../context/CoffeeContext';

// Import the gearData from GearDetailScreen for consistency
// This is the object used in GearDetailScreen.js to look up gear by name
import { gearData } from './GearDetailScreen';

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
  const [suggestedUsers, setSuggestedUsers] = useState(mockUsers.suggestedUsers);
  
  // Use recipes from mockRecipes.json instead of hardcoded data
  const [popularRecipes, setPopularRecipes] = useState(mockRecipes.recipes || []);
  
  // Get gear from mock data
  const [popularGear, setPopularGear] = useState([]);

  // Get coffee suggestions and trending cafés from mock data
  const coffeeSuggestions = mockCoffees.coffeeSuggestions;
  const trendingCafes = mockCafes.trendingCafes;
  
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
    
    // Check mockUsers for Emma Garcia data
    const emmaInMockUsers = mockUsers.users.find(user => user.userName === 'Emma Garcia');
    if (emmaInMockUsers) {
      console.log('Found Emma Garcia in mockUsers with data:', emmaInMockUsers);
      console.log('Emma avatar URL:', emmaInMockUsers.userAvatar);
    } else {
      console.log('Emma Garcia not found in mockUsers.users array');
    }
    
    // Check suggestedUsers for Emma Garcia data
    const emmaInSuggested = mockUsers.suggestedUsers.find(user => user.userName === 'Emma Garcia');
    if (emmaInSuggested) {
      console.log('Found Emma Garcia in suggestedUsers with data:', emmaInSuggested);
      console.log('Emma avatar URL in suggested:', emmaInSuggested.userAvatar);
    } else {
      console.log('Emma Garcia not found in mockUsers.suggestedUsers array');
    }
    
    // Enhance gear with usedBy data
    if (mockGear.gear && mockGear.gear.length > 0) {
      console.log('Loading gear from mockGear...');
      
      // Check if gearDetails has entries for Carlos and CaféLab
      console.log('Checking for Carlos Hernández and CaféLab in gearDetails:');
      Object.keys(gearDetails).forEach(gearName => {
        const gear = gearDetails[gearName];
        if (gear.usedBy) {
          gear.usedBy.forEach(user => {
            if (user.name === 'Carlos Hernández' || user.name.includes('CaféLab')) {
              console.log(`Found ${user.name} in ${gearName} with avatar: ${user.avatar}`);
            }
          });
        }
      });
      
      const enhancedGear = mockGear.gear.map(item => {
        const detailedItem = gearDetails[item.name];
        if (detailedItem) {
          console.log(`Enhanced gear for ${item.name} with usedBy data:`, detailedItem.usedBy);
          
          // Log each usedBy entry to check avatar paths
          if (detailedItem.usedBy && detailedItem.usedBy.length > 0) {
            detailedItem.usedBy.forEach(user => {
              console.log(`- User ${user.name} has avatar: ${user.avatar}`);
            });
          }
          
          return {
            ...item,
            ...detailedItem,
            imageUrl: detailedItem.image || item.imageUrl,
            usedBy: detailedItem.usedBy || []
          };
        }
        return {
          ...item,
          usedBy: []
        };
      });
      setPopularGear(enhancedGear);
    }
    
    // Make sure all suggestedUsers have the correct type property
    if (suggestedUsers && suggestedUsers.length > 0) {
      const updatedSuggestedUsers = suggestedUsers.map(user => ({
        ...user, 
        type: 'user'
      }));
      setSuggestedUsers(updatedSuggestedUsers);
    }
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

  const handleSearch = async (text) => {
    setSearchQuery(text);
    setIsSearching(true);
    
    // Simulate search results
    if (text.length > 0) {
      console.log('DEBUG: Searching for', text);
      
      // Create search results with proper IDs from split files (mockCoffees, mockRecipes, mockUsers, etc.)
      let mockResults = [];
      // Track names to avoid duplicates
      const addedNames = new Set();
      
      // Clean search text - remove @ from handles for better matching
      const cleanSearchText = text.toLowerCase().replace('@', '');
      
      // Add coffees
      mockCoffees.coffees.forEach(coffee => {
        if (coffee.name.toLowerCase().includes(cleanSearchText) || 
            coffee.roaster.toLowerCase().includes(cleanSearchText)) {
          
          // If ID doesn't already have 'coffee-' prefix, add it
          const formattedId = coffee.id.startsWith('coffee-') ? coffee.id : `coffee-${coffee.id}`;
          
          mockResults.push({
            id: formattedId,
            coffeeId: coffee.id, // The original ID should be preserved as coffeeId
            name: coffee.name,
            roaster: coffee.roaster,
            type: 'coffee',
            image: coffee.image || coffee.imageUrl,
            imageUrl: coffee.image || coffee.imageUrl
          });
          addedNames.add(coffee.name.toLowerCase());
        }
      });
      
      // Also check coffeeSuggestions
      mockCoffees.coffeeSuggestions.forEach(coffee => {
        if (!addedNames.has(coffee.name.toLowerCase()) && 
            (coffee.name.toLowerCase().includes(cleanSearchText) || 
            coffee.roaster.toLowerCase().includes(cleanSearchText))) {
          
          // If ID doesn't already have 'coffee-' prefix, add it
          const formattedId = coffee.id.startsWith('coffee-') ? coffee.id : `coffee-${coffee.id}`;
          
          mockResults.push({
            id: formattedId,
            coffeeId: coffee.id, // The original ID should be preserved as coffeeId
            name: coffee.name,
            roaster: coffee.roaster,
            type: 'coffee',
            image: coffee.image || coffee.imageUrl,
            imageUrl: coffee.image || coffee.imageUrl
          });
          addedNames.add(coffee.name.toLowerCase());
        }
      });
      
      // Add coffee gear with user avatars (NEW)
      mockGear.gear.forEach(gear => {
        if ((gear.name && gear.name.toLowerCase().includes(cleanSearchText)) || 
            (gear.brand && gear.brand.toLowerCase().includes(cleanSearchText)) ||
            (gear.type && gear.type.toLowerCase().includes(cleanSearchText))) {
          
          // Find detailed gear info if available
          const detailedGear = Object.keys(gearDetails).find(
            gearName => gearName.toLowerCase().includes(gear.name.toLowerCase())
          );
          
          const gearDetail = detailedGear ? gearDetails[detailedGear] : null;
          
          mockResults.push({
            id: gear.id,
            gearId: gear.id, // Store the original ID as gearId
            name: gear.name,
            brand: gear.brand,
            type: gear.type || "Gear",
            price: gear.price,
            imageUrl: gear.imageUrl || (gearDetail ? gearDetail.image : null) || gear.image,
            rating: gear.rating,
            reviewCount: gear.reviewCount,
            description: gear.description,
            type: 'gear',
            usedBy: gearDetail ? gearDetail.usedBy : []
          });
          addedNames.add(gear.name.toLowerCase());
        }
      });
      
      // Add businesses/cafés/roasters - search through different sources
      // First, trendingCafés
      if (mockCafes.trendingCafes) {
        mockCafes.trendingCafes.forEach(business => {
          if (business.name && !addedNames.has(business.name.toLowerCase()) && 
              (business.name.toLowerCase().includes(cleanSearchText) || 
              (business.location && business.location.toLowerCase().includes(cleanSearchText)))) {
            
            // Special handling for CaféLab - ALWAYS mark as roaster
            const isCafeLabItem = business.name && business.name.includes('CaféLab');
            
            if (isCafeLabItem) {
              console.log(`Found CaféLab in trendingCafes: ${business.name}`);
              // Force CaféLab to use logo for avatar
              const cafeLabAvatar = 'assets/businesses/cafelab-logo.png';
              
              // Determine the right ID format for CaféLab locations
              let cafeLabId = business.id;
              if (business.name === 'CaféLab') {
                cafeLabId = 'business-cafelab';
              } else if (business.name.includes('Murcia')) {
                cafeLabId = 'cafe-cafelab-murcia';
              } else if (business.name.includes('Cartagena')) {
                cafeLabId = 'cafe-cafelab-cartagena';
              }
              
              // The main issue - ensure avatar and logo are explicitly set to cafeLabAvatar
              mockResults.push({
                id: cafeLabId,
                businessId: 'business-cafelab',
                name: business.name,
                location: business.location || 'Unknown location',
                type: cafeLabId === 'business-cafelab' ? 'roaster' : 'cafe',
                isRoaster: cafeLabId === 'business-cafelab',
                logo: cafeLabAvatar,
                avatar: cafeLabAvatar,
                imageUrl: cafeLabAvatar
              });
            } else {
              // For non-CaféLab businesses
              mockResults.push({
                // Use the actual ID for Toma locations, not a prefixed one
                id: business.name && business.name.includes('Toma Café') ? business.id : `cafe-${business.id}`,
                businessId: business.businessId || business.id,
                name: business.name,
                location: business.location || 'Unknown location',
                type: business.businessId ? 'cafe' : 'roaster',
                isRoaster: business.businessId ? false : true, // If no businessId, treat as a standalone roaster
                logo: business.logo,
                avatar: business.avatar,
                imageUrl: business.avatar || business.logo || business.imageUrl || business.coverImage
              });
            }
            addedNames.add(business.name.toLowerCase());
          }
        });
      }
      
      // Then through businesses
      if (mockCafes.businesses) {
        mockCafes.businesses.forEach(business => {
          if (business.name && !addedNames.has(business.name.toLowerCase()) && 
              (business.name.toLowerCase().includes(cleanSearchText) || 
              (business.location && business.location.toLowerCase().includes(cleanSearchText)))) {
            // Determine if this is a roaster
            const isRoaster = business.type === 'roaster_coffee_shop' || 
                             business.id.toLowerCase().includes('roaster') || 
                             business.id === 'business-cafelab';
                             
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
        const roaster = mockCafes.businesses.find(b => b.id === roasterId);
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
      mockUsers.users.forEach(user => {
        // Generate username (handle) for matching
        const userHandle = user.userName?.toLowerCase().replace(/\s+/g, '');
        
        // Skip adding Vértigo y Calambre as a user since we'll add it as a café
        if (user.userName === 'Vértigo y Calambre') {
          return;
        }
        
        if ((user.userName && !addedNames.has(user.userName.toLowerCase()) && 
            (user.userName.toLowerCase().includes(cleanSearchText) || 
            (user.location && user.location.toLowerCase().includes(cleanSearchText)))) ||
            // Also search by username (handle)
            (userHandle && userHandle.includes(cleanSearchText))) {
          
          // Important: user ID should not be prefixed with "user-" if it already contains "user"
          const userId = user.id.startsWith('user') ? user.id : `user-${user.id}`;
          
          // Debug Emma Garcia
          if (user.userName.toLowerCase().includes('emma garcia')) {
            console.log('FOUND EMMA GARCIA IN handleSearch:', JSON.stringify(user, null, 2));
            console.log('Emma avatar URL before adding to results:', user.userAvatar);
          }
          
          mockResults.push({
            id: userId,
            userId: user.id, // Keep the original ID without prefix as a separate property
            name: user.userName,
            userName: user.userName, // Make sure userName is explicitly set
            username: userHandle,
            location: user.location,
            type: 'user',
            userAvatar: user.userAvatar,
            avatar: user.userAvatar,  // Add this line to ensure avatar is set too
            imageUrl: user.userAvatar // Add imageUrl as well for consistent access
          });
          
          // Check Emma in mockResults
          if (user.userName.toLowerCase().includes('emma garcia')) {
            console.log('EMMA ADDED TO RESULTS:', JSON.stringify(mockResults[mockResults.length-1], null, 2));
          }
          
          addedNames.add(user.userName.toLowerCase());
        }
      });
      
      // Special case for Vértigo y Calambre cafe - always add as a café, not a user
      const vertigoTerms = ['vertigo', 'calambre', 'vértigo', 'vertigoycalambre'];
      if (vertigoTerms.some(term => cleanSearchText.includes(term)) || cleanSearchText === '') {
        // Make sure we add Vértigo y Calambre if not already in results
        const hasVertigo = addedNames.has('vértigo y calambre');
        if (!hasVertigo) {
          mockResults.push({
            id: 'cafe-vertigo-calambre',
            businessId: 'business1',
            name: 'Vértigo y Calambre',
            location: 'Murcia, Spain',
            type: 'cafe', // Explicitly mark as cafe
            isRoaster: false,
            logo: 'assets/businesses/vertigo-logo.jpg',
            avatar: 'assets/businesses/vertigo-logo.jpg',
            imageUrl: 'assets/businesses/vertigo-logo.jpg'
          });
          addedNames.add('vértigo y calambre');
        }
      }
      
      // Special handling for The Fix
      if (cleanSearchText === '' || 'the fix'.includes(cleanSearchText) || 'madrid'.includes(cleanSearchText)) {
        // Always add The Fix as both a roaster and café
        if (!addedNames.has('the fix')) {
          console.log('Adding The Fix to search results with proper profile data');
          
          // Add The Fix as a roaster (business profile)
          mockResults.push({
            id: 'business-thefix',
            businessId: 'business-thefix',
            name: 'The Fix',
            location: 'Madrid, Spain',
            type: 'roaster',
            isRoaster: true,
            isBusinessAccount: true,
            logo: 'assets/businesses/thefix-logo.jpg',
            avatar: 'assets/businesses/thefix-logo.jpg',
            imageUrl: 'assets/businesses/thefix-logo.jpg'
          });
          
          // Also add The Fix as a café location
          mockResults.push({
            id: 'cafe-thefix-madrid',
            businessId: 'business-thefix',
            name: 'The Fix Madrid',
            location: 'Madrid, Spain',
            type: 'cafe',
            isRoaster: false,
            isBusinessAccount: true,
            logo: 'assets/businesses/thefix-logo.jpg',
            avatar: 'assets/businesses/thefix-logo.jpg',
            imageUrl: 'assets/businesses/thefix-logo.jpg'
          });
          
          addedNames.add('the fix');
          addedNames.add('the fix madrid');
        }
      }
      
      // Special handling for Vértigo y Calambre
      if (cleanSearchText === '' || 
          'vertigo'.includes(cleanSearchText) || 
          'calambre'.includes(cleanSearchText) || 
          'murcia'.includes(cleanSearchText)) {
        
        if (!addedNames.has('vértigo y calambre')) {
          console.log('Adding Vértigo y Calambre to search results with proper profile data');
          
          // Always use the business account for Vértigo profile
          mockResults.push({
            id: 'business1',
            businessId: 'business1',
            name: 'Vértigo y Calambre',
            location: 'Murcia, Spain', // Correct location
            type: 'cafe',
            isRoaster: false,
            isBusinessAccount: true,
            logo: 'assets/businesses/vertigo-logo.jpg',
            avatar: 'assets/businesses/vertigo-logo.jpg',
            imageUrl: 'assets/businesses/vertigo-logo.jpg'
          });
          
          addedNames.add('vértigo y calambre');
        }
      }
      
      // Log the results for debugging
      console.log('Search results:', mockResults.map(r => ({name: r.name, type: r.type})));
      
      // Force-fix Emma Garcia's avatar if she's in the results
      const emmaIndex = mockResults.findIndex(r => 
        r.name === 'Emma Garcia' || r.userName === 'Emma Garcia'
      );
      
      if (emmaIndex >= 0) {
        console.log('Forcing Emma Garcia avatar URL in search results');
        mockResults[emmaIndex].userAvatar = 'https://randomuser.me/api/portraits/women/33.jpg';
        mockResults[emmaIndex].avatar = 'https://randomuser.me/api/portraits/women/33.jpg';
        mockResults[emmaIndex].imageUrl = 'https://randomuser.me/api/portraits/women/33.jpg';
        console.log('Updated Emma:', JSON.stringify(mockResults[emmaIndex], null, 2));
      }
      
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

  /**
   * Convert image paths to actual source objects
   * Handles both remote URLs and local asset references
   */
  const getImageSource = (url) => {
    if (!url) {
      console.log('No image URL provided for search result');
      return { uri: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }; // Default coffee image
    }
    
    if (typeof url !== 'string') return url;
    
    // DEBUG: Log the URL being processed
    console.log('Processing image URL:', url);
    
    // If it's already a URL, use as is
    if (url.startsWith('http')) {
      // Special handling for randomuser.me URLs to ensure they work properly
      if (url.includes('randomuser.me')) {
        console.log('Using randomuser.me avatar URL:', url);
      }
      return { uri: url };
    }
    
    // For local assets, we need to resolve the path
    if (url.includes('assets/')) {
      // Handle user avatars from mockUsers.json
      if (url.includes('assets/users/')) {
        if (url.includes('ivo-vilches.jpg')) {
          return require('../../assets/users/ivo-vilches.jpg');
        } else if (url.includes('carlos-hernandez.jpg')) {
          return require('../../assets/users/carlos-hernandez.jpg');
        } else if (url.includes('elias-veris.jpg')) {
          return require('../../assets/users/elias-veris.jpg');
        } else {
          // For other user avatars, log the missing asset and return a default
          console.log('User avatar not explicitly imported:', url);
          return { uri: 'https://randomuser.me/api/portraits/men/1.jpg' };
        }
      } 
      // Handle business images
      else if (url.includes('vertigo-logo.jpg')) {
        return require('../../assets/businesses/vertigo-logo.jpg');
      } else if (url.includes('cafelab-logo.png')) {
        return require('../../assets/businesses/cafelab-logo.png');
      } else if (url.includes('cafelab-murcia-cover.png')) {
        return require('../../assets/businesses/cafelab-murcia-cover.png');
      } else if (url.includes('cafelab-cartagena-cover.png')) {
        return require('../../assets/businesses/cafelab-cartagena-cover.png');
      } else if (url.includes('toma-logo.jpg')) {
        return require('../../assets/businesses/toma-logo.jpg');
      } else if (url.includes('toma-1-cover.jpg')) {
        return require('../../assets/businesses/toma-1-cover.jpg');
      } else if (url.includes('toma-2-cover.jpg')) {
        return require('../../assets/businesses/toma-2-cover.jpg');
      } else if (url.includes('toma-3-cover.jpg')) {
        return require('../../assets/businesses/toma-3-cover.jpg');
      } else if (url.includes('kima-logo.jpg')) {
        return require('../../assets/businesses/kima-logo.jpg');
      } else if (url.includes('thefix-logo.jpg')) {
        return require('../../assets/businesses/thefix-logo.jpg');
      }
      // If we can't find a matching asset, return a default image URL
      console.log('Unknown local asset path:', url);
      return { uri: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' };
    }
    
    // Add support for Toma Café coffee images
    if (url.includes('ET_REF_G1') || 
        url.includes('COL_EL_SIL') || 
        url.includes('ET_BENT_NENK') || 
        url.includes('RUAN_TIT') || 
        url.includes('NIC_DIP_TERR') || 
        url.includes('COL_LA_PRIM') ||
        url.includes('IND_GAYO') ||
        url.includes('MEX_SUE-DECF')) {
      console.log('Loading Toma Café coffee image:', url);
      return { uri: url };
    }
    
    // Add support for Kima Coffee images
    if (url.includes('kimacoffee.com')) {
      console.log('Loading Kima Coffee image:', url);
      return { uri: url };
    }
    
    // Default fallback
    console.log('Using default image source with URI:', url);
    return { uri: url };
  };

  const renderSearchResult = ({ item }) => {
    // Special debug for CaféLab
    if (item.name && item.name.includes("CaféLab")) {
      console.log(`Found CaféLab item in search results:`, item);
      
      // Force CaféLab to be a roaster
      if (!item.isRoaster) {
        item.isRoaster = true;
        item.type = 'roaster';
      }
    }
    
    // Special handling for Kima Coffee - always treat as a roaster
    if (item.name === 'Kima Coffee' || 
        item.id === 'kima-coffee' || 
        item.id === 'business-kima' || 
        item.businessId === 'business-kima') {
      console.log(`Found Kima Coffee in search results:`, item);
      item.type = 'roaster';
      item.isRoaster = true;
      if (!item.avatar && !item.logo) {
        item.avatar = 'assets/businesses/kima-logo.jpg';
      }
    }
    
    // Special handling for Vértigo y Calambre - always treat as a café
    if (item.name === 'Vértigo y Calambre') {
      item.type = 'cafe';
      item.isRoaster = false;
      if (!item.avatar && !item.logo) {
        item.avatar = 'assets/businesses/vertigo-logo.jpg';
      }
      // Ensure proper location is set
      if (!item.location) {
        item.location = 'Murcia, Spain';
      }
    }
    
    // Check for coffee or gear items (coffee items have coffeeId or start with coffee-)
    const isCoffeeItem = item.type === 'coffee' || item.coffeeId || (item.id && item.id.startsWith('coffee-'));
    
    // Check for gear items
    const isGearItem = item.type === 'gear' || (item.id && item.id.startsWith('gear'));
    
    // Check for CaféLab items - they should always be classified as roasters
    const isCafeLabItem = item.name && item.name.includes("CaféLab");
    
    // Check for Vértigo y Calambre - it should always be a café
    const isVertigoItem = item.name === 'Vértigo y Calambre';
    
    // Check if this is a business or café
    const isBusiness = item.type === 'business' || item.isBusiness || item.type === 'cafe' || item.type === 'roaster';
    
    // Check if this is a roaster (either explicitly marked or it's CaféLab)
    const isRoaster = (item.isRoaster || isCafeLabItem || (item.id && item.id === 'business-cafelab')) && !isVertigoItem;
    
    // Figure out what kind of location this is
    const isRoasterLocation = isBusiness && isRoaster;
    const isCafeLocation = (isBusiness && !isRoaster) || isVertigoItem;
    
    // If it's a coffee item, check mockCoffees.json for the proper image
    let imageUrl = item.avatar || item.logo || item.imageUrl || item.coverImage;
    
    if (isCoffeeItem) {
      // Try to find the coffee in mockCoffees data
      const coffeeId = item.coffeeId || item.id;
      
      // First check in coffees array
      const matchedCoffee = mockCoffees.coffees.find(c => c.id === coffeeId);
      // If not found, check in coffeeSuggestions
      const matchedSuggestion = !matchedCoffee ? mockCoffees.coffeeSuggestions.find(c => c.id === coffeeId) : null;
      
      if (matchedCoffee) {
        console.log(`Found coffee ${coffeeId} in mockCoffees.coffees`);
        // Use the image from mockCoffees.json
        imageUrl = matchedCoffee.image || matchedCoffee.imageUrl || imageUrl;
      } else if (matchedSuggestion) {
        console.log(`Found coffee ${coffeeId} in mockCoffees.coffeeSuggestions`);
        // Use the image from mockCoffees.coffeeSuggestions
        imageUrl = matchedSuggestion.imageUrl || matchedSuggestion.image || imageUrl;
      }
    }
    
    // Make sure CaféLab uses the logo
    if (isCafeLabItem) {
      imageUrl = 'assets/businesses/cafelab-logo.png';
    }
    
    const title = item.name || 'Unknown';
    let subtitle = '';
    
    // Format the subtitle based on item type
    if (isCoffeeItem) {
      subtitle = item.roaster || 'Unknown roaster';
    } else if (isGearItem) {
      subtitle = `${item.brand || 'Unknown brand'} ${item.type || ''}`;
    } else if (isRoasterLocation || isCafeLocation) {
      subtitle = item.location || '';
    } else {
      // For users or other types
      subtitle = item.location || '';
    }
    
    // Handle when the item is pressed
    const handlePress = () => {
      // Log whenever something is pressed
      console.log('Search result pressed:', item);
      
      if (isCoffeeItem) {
        // For coffee items, extract the coffee ID 
        // We want to use the coffeeId property directly if available (non-prefixed version)
        // Otherwise, get the ID from the item.id property, removing the prefix if needed
        let coffeeId = item.coffeeId;
        
        if (!coffeeId && item.id) {
          if (item.id.startsWith('coffee-')) {
            coffeeId = item.id;
          } else {
            coffeeId = `coffee-${item.id}`;
          }
        }
        
        console.log(`Navigating to coffee detail for ${coffeeId}`);
        navigation.navigate('CoffeeDetail', { coffeeId });
      } else if (isGearItem) {
        // For gear items, navigate to gear detail
        // The GearDetailScreen only looks for gearName in the route.params
        const gearName = item.name;
        
        console.log(`Navigating to gear detail for ${gearName}`);
        console.log('Complete gear item data:', JSON.stringify(item, null, 2));
        
        // We need to find the exact key in gearData that corresponds to this gear
        // GearDetailScreen looks up gear using gearData[gearName]
        
        // First check if we have a direct match with a gearData key (e.g. "Baratza Encore")
        const exactMatchKey = Object.keys(gearData).find(key => 
          key.toLowerCase() === gearName.toLowerCase()
        );
        
        // If we have an exact match, use that key
        if (exactMatchKey) {
          console.log(`Found exact match in gearData: ${exactMatchKey}`);
          navigation.navigate('GearDetail', { 
            gearName: exactMatchKey 
          });
          return;
        }
        
        // Try to find a partial match in gearData keys
        const partialMatchKey = Object.keys(gearData).find(key => {
          // Try matching in both directions to handle cases like "Baratza Encore" and "Encore"
          return key.toLowerCase().includes(gearName.toLowerCase()) || 
                 gearName.toLowerCase().includes(key.toLowerCase());
        });
        
        if (partialMatchKey) {
          console.log(`Found partial match in gearData: ${partialMatchKey}`);
          navigation.navigate('GearDetail', { 
            gearName: partialMatchKey
          });
          return;
        }
        
        // If we still don't have a match, try some special cases
        // For "Baratza Encore Coffee Grinder", the key in gearData is "Baratza Encore"
        if (gearName.includes("Baratza Encore")) {
          console.log("Special case: Navigating to Baratza Encore");
          navigation.navigate('GearDetail', { 
            gearName: "Baratza Encore"
          });
          return;
        }
        
        // For AeroPress, match to "AeroPress"
        if (gearName.toLowerCase().includes("aeropress")) {
          console.log("Special case: Navigating to AeroPress");
          navigation.navigate('GearDetail', { 
            gearName: "AeroPress"
          });
          return;
        }
        
        // Fallback to the original approach - just using the item name directly
        console.log(`No match found in gearData, using name directly: ${gearName}`);
        navigation.navigate('GearDetail', { 
          gearName: gearName 
        });
      } else if (isCafeLabItem) {
        // Handle CaféLab items specially
        if (item.name.includes("Murcia") || item.name.includes("Cartagena")) {
          // For CaféLab locations, navigate to the specific location profile
          const locationId = item.id ? item.id : 
            item.name.includes("Murcia") ? 'cafe-cafelab-murcia' : 'cafe-cafelab-cartagena';
          
          console.log(`Navigating to CaféLab location: ${locationId}`);
          navigation.navigate('UserProfileBridge', {
            userId: locationId,
            userName: item.name,
            isLocation: true,
            parentBusinessId: 'business-cafelab',
            skipAuth: true
          });
        } else {
          // For main CaféLab, navigate to the business profile
          console.log('Navigating to main CaféLab business profile');
          navigation.navigate('UserProfileBridge', {
            userId: 'business-cafelab',
            userName: 'CaféLab',
            isBusinessAccount: true,
            isRoaster: true,
            skipAuth: true
          });
        }
      } else if (item.name === 'Kima Coffee' || 
                item.id === 'kima-coffee' || 
                item.id === 'business-kima' || 
                item.businessId === 'business-kima') {
        // Special handling for Kima Coffee - always navigate to roaster profile
        console.log('Navigating to Kima Coffee roaster profile');
        navigation.navigate('UserProfileBridge', {
          userId: 'business-kima',
          userName: 'Kima Coffee',
          isBusinessAccount: true,
          isRoaster: true,
          skipAuth: true
        });
      } else if (isVertigoItem) {
        // Special handling for Vértigo y Calambre - always navigate to café profile
        console.log('Navigating to Vértigo y Calambre café profile');
        navigation.navigate('UserProfileBridge', { 
          userId: 'user2', // Use user2 ID to match mockEvents.json and ensure data is found 
          userName: 'Vértigo y Calambre',
          skipAuth: true,
          isBusinessAccount: true,
          isRoaster: false, // Mark as café not roaster
          location: 'Murcia, Spain'
        });
      } else if (isRoasterLocation || isCafeLocation) {
        // For other businesses, navigate to user profile
        console.log(`Navigating to business profile for ${item.id}`);
        navigation.navigate('UserProfileBridge', {
          userId: item.id,
          userName: item.name,
          isBusinessAccount: true,
          isRoaster: isRoasterLocation,
          skipAuth: true
        });
      } else {
        // For users, use the userId property (without prefix) if available, otherwise use the id property
        const userId = item.userId || item.id;
        console.log(`Navigating to user profile for ${userId}`);
        navigation.navigate('UserProfileBridge', {
          userId: userId,
          userName: item.name,
          skipAuth: true
        });
      }
    };
    
    // Use the function to get the proper image source
    const imageSource = getImageSource(imageUrl);
    
    return (
      <TouchableOpacity 
        style={styles.resultItem}
        onPress={handlePress}
      >
        <Image 
          source={imageSource}
          style={isGearItem ? styles.resultCoffeeImage : 
                 isCoffeeItem ? styles.resultCoffeeImage : 
                 isRoaster || isCafeLocation ? styles.resultBusinessImage : 
                 styles.resultUserImage} 
          resizeMode="cover"
        />
        <View style={styles.resultContent}>
          <Text style={styles.coffeeName}>{title}</Text>
          <Text style={styles.roasterName}>
            {isCoffeeItem ? `Coffee · ${subtitle}` : 
             isGearItem ? `Gear · ${subtitle}` : 
             isCafeLabItem ? `Roaster · ${subtitle}` :
             isVertigoItem ? `Café · ${subtitle}` :
             isRoasterLocation ? `Roaster · ${subtitle}` : 
             isCafeLocation ? `Café · ${subtitle}` : 
             `Profile · ${subtitle}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterChips = () => {
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'coffee', label: 'Coffees' },
      { id: 'roaster', label: 'Roasters' },
      { id: 'cafe', label: 'Cafés' },
      { id: 'gear', label: 'Gear' },
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

  const renderCarouselItem = ({ item }) => {
    // Determine if we should show category labels based on the filter
    const showCategory = activeFilter === 'all';
    
    if (item.type === 'recipe') {
      // Handle recipe items
      const imageUrl = item.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd';
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => navigation.navigate('RecipeDetail', { recipeId: item.id })}
        >
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.resultCoffeeImage} 
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{showCategory ? `Recipe · ${item.coffeeName}` : item.coffeeName}</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'coffee') {
      // Coffee already has image from the search results - use image property from mockCoffees.json
      const imageUrl = item.image || item.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e';
      
      // Extract the coffee ID correctly
      let coffeeId;
      
      // First try to use the direct ID from the coffee object if available
      if (item.id && typeof item.id === 'string') {
        // If id is something like "coffee-pampojila", preserve it exactly
        coffeeId = item.id;
      }
      // If there's a separate coffeeId property, use that
      else if (item.coffeeId) {
        coffeeId = item.coffeeId;
      }
      // Fallback to just the name for search purposes
      else {
        coffeeId = item.name;
      }
      
      // Debug the ID to make sure it's being passed correctly
      console.log(`Navigating to coffee with ID: ${coffeeId}, name: ${item.name}`);
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Pass the exact coffeeId and also include the coffee object for direct use
            console.log(`Navigating to coffee detail for ${item.name} with ID: ${coffeeId}`);
            navigation.navigate('CoffeeDetail', { 
              coffeeId, 
              coffee: item // Pass the entire coffee object as a fallback
            });
          }}
        >
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.resultCoffeeImage} 
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{showCategory ? `Coffee · ${item.roaster}` : item.roaster}</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (item.type === 'roaster') {
      // Use the avatar, logo or imageUrl provided in search results, prioritizing avatar
      let imageUrl = item.avatar || item.logo || item.imageUrl || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24';
      
      // Try to load local assets
      const imageSource = getImageSource(imageUrl);
      
      // Special case for CaféLab locations
      const isCafeLabLocation = item.name && item.name.includes('CaféLab') && item.businessId === 'business-cafelab';
      const categoryLabel = isCafeLabLocation ? 'CaféLab Location' : 'Roaster';
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Special handling for CaféLab locations
            if (isCafeLabLocation) {
              console.log(`Navigating to CaféLab location (roaster): ${item.name} with ID: ${item.id}, businessId: ${item.businessId}`);
              
              // Ensure we have the correct ID format for CaféLab locations
              let locationId = item.id;
              if (!locationId.startsWith('cafe-')) {
                if (item.name.includes('Murcia')) {
                  locationId = 'cafe-cafelab-murcia';
                } else if (item.name.includes('Cartagena')) {
                  locationId = 'cafe-cafelab-cartagena';
                }
              }
              
              // Explicitly set avatar for the navigation
              navigation.navigate('UserProfileBridge', {
                userId: locationId,
                userName: item.name,
                skipAuth: true,
                isLocation: true,
                parentBusinessId: 'business-cafelab',
                avatar: 'assets/businesses/cafelab-logo.png' // Explicitly pass avatar
              });
              return;
            }
            
            // Special case for the main CaféLab profile
            if (item.name === 'CaféLab') {
              navigation.navigate('UserProfileBridge', { 
                userId: 'business-cafelab',
                userName: 'CaféLab',
                skipAuth: true,
                isBusinessAccount: true,
                isRoaster: true
              });
              return;
            }
            
            // Special case for Kima Coffee
            if (item.name === 'Kima Coffee' || item.id === 'business-kima' || item.businessId === 'business-kima') {
              navigation.navigate('UserProfileBridge', { 
                userId: 'business-kima',
                userName: 'Kima Coffee',
                skipAuth: true,
                isBusinessAccount: true,
                isRoaster: true
              });
              return;
            }
            
            // Use the business ID for other roasters
            const roasterId = item.businessId || item.id;
            navigation.navigate('UserProfileBridge', { 
              userId: roasterId, 
              userName: item.name,
              skipAuth: true,
              isBusinessAccount: true,
              isRoaster: true
            });
          }}
        >
          <Image 
            source={imageSource} 
            style={styles.resultBusinessImage} 
          />
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{showCategory ? `${categoryLabel} · ${item.location}` : item.location}</Text>
          </View>
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
              // For the main Toma Café, navigate as a café not a roaster
              navigation.navigate('UserProfileBridge', { 
                userId: 'cafe-toma',
                userName: 'Toma Café',
                skipAuth: true,
                isBusinessAccount: true,
                isRoaster: false // Changed to false for cafés
              });
            } else if ((item.name && item.name === 'Vértigo y Calambre') ||
                     (item.id === 'vertigo-calambre') ||
                     (item.businessId === 'business1')) {
              // For Vértigo y Calambre, we need to use user2 ID to match mockEvents.json
              navigation.navigate('UserProfileBridge', { 
                userId: 'user2', // Use user2 ID to match mockEvents.json
                userName: 'Vértigo y Calambre',
                skipAuth: true,
                isBusinessAccount: true,
                isRoaster: false, // Explicitly set as café, not roaster
                location: 'Murcia, Spain'
              });
            }
            // Handle The Fix profile
            else if ((item.name && item.name === 'The Fix') ||
                     (item.id === 'thefix-madrid') ||
                     (item.businessId === 'business-thefix')) {
              navigation.navigate('UserProfileBridge', { 
                userId: 'business-thefix',
                userName: 'The Fix',
                skipAuth: true,
                isBusinessAccount: true,
                isRoaster: true
              });
            }
            // Special case for Kima Coffee
            else if (item.name === 'Kima Coffee' || 
                    item.id === 'kima-coffee' || 
                    item.businessId === 'business-kima') {
              navigation.navigate('UserProfileBridge', { 
                userId: 'business-kima',
                userName: 'Kima Coffee',
                skipAuth: true,
                isBusinessAccount: true,
                isRoaster: true
              });
            }
            // Special handling for CaféLab locations
            else if (item.name && item.name.includes('CaféLab') && 
                     item.businessId === 'business-cafelab') {
                     
              console.log(`Navigating to CaféLab location: ${item.name} with ID: ${item.id}, businessId: ${item.businessId}`);
              
              // For main CaféLab profile, go to the roaster profile
              if (item.name === 'CaféLab') {
                navigation.navigate('UserProfileBridge', { 
                  userId: 'business-cafelab',
                  userName: 'CaféLab',
                  skipAuth: true,
                  isBusinessAccount: true,
                  isRoaster: true
                });
                return;
              }
              
              // For location-specific profiles (Cartagena, Murcia)
              // Ensure we have the correct ID format for CaféLab locations
              let locationId = item.id;
              if (!locationId.startsWith('cafe-')) {
                if (item.name.includes('Murcia')) {
                  locationId = 'cafe-cafelab-murcia';
                } else if (item.name.includes('Cartagena')) {
                  locationId = 'cafe-cafelab-cartagena';
                }
              }
              
              navigation.navigate('UserProfileBridge', { 
                userId: locationId,
                userName: item.name,
                skipAuth: true,
                isLocation: true,
                parentBusinessId: 'business-cafelab'
              });
            }
            // Only use location-specific navigation for CaféLab and other locations
            else if (item.businessId && item.businessId !== item.id) {
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
                skipAuth: true,
                isBusinessAccount: true
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
            <Text style={styles.roasterName}>{showCategory ? `${categoryLabel} · ${item.location}` : item.location}</Text>
          </View>

        </TouchableOpacity>
      );
    } else if (item.type === 'user') {
      // Use the userAvatar provided in search results
      let avatarUrl = item.userAvatar || item.avatar || item.imageUrl || 'https://randomuser.me/api/portraits/men/1.jpg';
      
      // Hardcoded fix for Emma Garcia
      if (item.userName === 'Emma Garcia' || item.name === 'Emma Garcia') {
        avatarUrl = 'https://randomuser.me/api/portraits/women/33.jpg';
        console.log('🔍 HARDCODED EMMA GARCIA AVATAR IN SEARCH RESULTS:', avatarUrl);
      }
      console.log(`Rendering user ${item.userName || item.name} with avatar:`, avatarUrl);
      
      // Special debug for Emma Garcia
      if ((item.userName === 'Emma Garcia' || item.name === 'Emma Garcia') && avatarUrl) {
        console.log('🔍 FOUND EMMA GARCIA IN CAROUSEL! Avatar URL:', avatarUrl);
        console.log('Emma complete item data:', JSON.stringify(item, null, 2));
      }
      
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Navigate to the bridge component first
            navigation.navigate('UserProfileBridge', { 
              userId: item.id, 
              userName: item.userName || item.name,
              userAvatar: avatarUrl, // Pass the avatar explicitly
              skipAuth: true,
              isCurrentUser: (item.userId === currentAccount) || (item.id.replace('user-', '') === currentAccount)
            });
          }}
        >
          {/* Handle local files vs remote URLs differently */}
          {avatarUrl && avatarUrl.startsWith('http') ? (
            <AppImage 
              source={{ uri: avatarUrl }}
              style={styles.resultUserImage} 
              resizeMode="cover"
            />
          ) : (
            <Image 
              source={getImageSource(avatarUrl)}
              style={styles.resultUserImage} 
              resizeMode="cover"
            />
          )}
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.userName || item.name}</Text>
            <Text style={styles.roasterName}>
              {showCategory ? `Profile · @${(item.userName || item.name)?.toLowerCase().replace(/\s+/g, '')}` : 
              `@${(item.userName || item.name)?.toLowerCase().replace(/\s+/g, '')}`}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderCarousel = (title, data, type, showViewMore = false, viewMoreDestination = null, viewMoreParams = {}) => {
    if (!data || data.length === 0) return null;
    
    // Handle specific case for recipes
    if (type === 'recipe') {
      const filteredRecipes = data.filter(item => item.isTrending === true);
      if (filteredRecipes.length === 0) return null;
      data = filteredRecipes;
    }
    
    // Handle specific case for cafes
    if (type === 'cafe') {
      const filteredCafes = data.filter(item => item.isGoodCafe === true);
      if (filteredCafes.length === 0) return null;
      data = filteredCafes;
    }
    
    // Handle specific case for users
    if (type === 'user') {
      // Ensure all items have type property
      data = data.map(item => ({
        ...item,
        type: 'user'
      }));
    }
    
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
            
            // Add type to item if missing
            const itemWithType = { ...item, type: itemType };
            return renderCarouselItem({ item: itemWithType });
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

  const renderGearCard = ({ item }) => {
    return (
      <GearCard
        item={item}
        compact={true}
        showAvatars={true}
        isWishlist={item.isInWishlist || false}
        onPress={() => navigation.navigate('GearDetail', { gearName: item.name })}
        onWishlistToggle={() => {
          // Here you would handle the wishlist toggle
          console.log('Toggle wishlist for:', item.name);
        }}
      />
    );
  };
  
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
  
  // Handle gear item press - navigate to gear detail
  const handleGearPress = (item) => {
    navigation.navigate('GearDetail', { 
      gearId: item.id,
      gearName: item.name,
      gear: item
    });
  };

  const renderGearCarousel = ({ title, items, seeAllRoute, onPress }) => {
    return (
      <View style={styles.carouselContainer}>
        <View style={styles.carouselHeader}>
          <Text style={styles.carouselTitle}>{title}</Text>
          <TouchableOpacity 
            style={styles.seeAllButton}
            onPress={() => navigation.navigate(seeAllRoute || 'GearList')}
          >
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselScrollContent}
        >
          {items.map((item, index) => (
            <GearCard 
              key={`${item.id || index}`}
              item={item}
              onPress={() => onPress(item)}
              style={styles.carouselCard}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderGoodCafesSection = () => {
    // Filter cafes that have isGoodCafe flag set to true
    const goodCafes = trendingCafes.filter(cafe => cafe.isGoodCafe === true);
    
    if (!goodCafes || goodCafes.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.carouselSectionTitle}>Good Cafés</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CafesList')}>
            <Text style={styles.viewAllText}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={goodCafes}
          renderItem={({ item }) => {
            const isOpen = Math.random() > 0.3; // Simulating open/closed status like in CafesListScreen
            
            // Special handling for image sources based on ID
            let coverImagePath;
            let logoImagePath;
            
            if (item.id === 'thefix-madrid' || item.businessId === 'business-thefix') {
              coverImagePath = 'assets/businesses/thefix-cover.jpg';
              logoImagePath = 'assets/businesses/thefix-logo.jpg';
            } else {
              coverImagePath = item.coverImage || item.imageUrl;
              logoImagePath = item.avatar || item.logo;
            }
            
            return (
              <TouchableOpacity 
                style={styles.cafeListCard}
                onPress={() => {
                  // Handle special cases - corrected for proper business profile handling
                  if (item.name && item.name.includes('Toma Café') && item.name !== 'Toma Café') {
                    // For Toma Café locations (like Toma Café 1), navigate to the specific location
                    const locationId = item.id;
                    navigation.navigate('UserProfileBridge', { 
                      userId: locationId,
                      userName: item.name,
                      skipAuth: true,
                      isLocation: true,
                      isBusinessAccount: true, // Add business account flag
                      parentBusinessId: 'business-toma'
                    });
                  } else if (item.name && item.name === 'Toma Café') {
                    // For main Toma Café, navigate as a business
                    navigation.navigate('UserProfileBridge', { 
                      userId: 'business-toma',
                      userName: 'Toma Café',
                      skipAuth: true,
                      isBusinessAccount: true,
                      isRoaster: true
                    });
                  } else if ((item.name && item.name === 'Vértigo y Calambre') ||
                           (item.id === 'vertigo-calambre') ||
                           (item.businessId === 'business1')) {
                    // For Vértigo y Calambre, we need to use user2 ID to match mockEvents.json
                    navigation.navigate('UserProfileBridge', { 
                      userId: 'user2', // Use user2 ID to match mockEvents.json
                      userName: 'Vértigo y Calambre',
                      skipAuth: true,
                      isBusinessAccount: true,
                      isRoaster: false, // Explicitly set as café, not roaster
                      location: 'Murcia, Spain'
                    });
                  } else if ((item.name && item.name === 'The Fix') ||
                           (item.id === 'thefix-madrid') ||
                           (item.businessId === 'business-thefix')) {
                    // For The Fix, ensure we're going to a café profile from Good Cafés
                    navigation.navigate('UserProfileBridge', { 
                      userId: 'cafe-thefix-madrid', // Use café ID
                      userName: 'The Fix',
                      skipAuth: true,
                      isBusinessAccount: true, // It's a business account
                      isLocation: true, // It's a location
                      parentBusinessId: 'business-thefix' // With a parent business
                    });
                  } else if (item.name === 'Kima Coffee' || 
                            item.id === 'kima-coffee' || 
                            item.businessId === 'business-kima') {
                    // For Kima Coffee, navigate to the specific café location, not the roaster
                    navigation.navigate('UserProfileBridge', { 
                      userId: 'kima-coffee', // Correct café ID
                      userName: 'Kima Coffee Málaga',
                      skipAuth: true,
                      isBusinessAccount: true,
                      isLocation: true,
                      parentBusinessId: 'business-kima',
                      type: 'cafe',
                      isRoaster: false
                    });
                  } else {
                    // For other cafés - use business ID if available
                    const cafeId = item.id;
                    const businessId = item.businessId;
                    
                    // Prepare complete data for navigation
                    const cafeData = {
                      userId: cafeId,
                      userName: item.name,
                      skipAuth: true,
                      isBusinessAccount: true,
                      isLocation: !!businessId,
                      parentBusinessId: businessId,
                      location: item.location
                    };
                    
                    // Debug what we're passing
                    console.log(`Navigating to café profile with data:`, cafeData);
                    
                    navigation.navigate('UserProfileBridge', cafeData);
                  }
                }}
              >
                <AppImage 
                  source={coverImagePath} 
                  style={styles.cafeListImage}
                />
                <View style={styles.cafeListContent}>
                  <View style={styles.cafeListHeader}>
                    <AppImage 
                      source={logoImagePath} 
                      style={styles.cafeListLogo}
                    />
                    <View style={styles.cafeListTitleContainer}>
                      <Text style={styles.cafeListName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                      <Text style={styles.cafeListLocation}>{item.location}</Text>
                    </View>
                    
                    {/* Open/Closed status indicator */}
                    <View style={[styles.statusIndicator, isOpen ? styles.openStatus : styles.closedStatus]}>
                      <Text style={styles.statusText}>{isOpen ? 'Open' : 'Closed'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cafeListStats}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{item.rating ? item.rating.toFixed(1) : '4.5'}</Text>
                      <Text style={styles.reviewCount}>({item.reviewCount || '0'} reviews)</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cafeListContainer}
        />
      </View>
    );
  };

  const renderRecipesForYouSection = () => {
    // Filter recipes that have isTrending flag set to true
    const trendingRecipes = mockRecipesData.recipes.filter(recipe => recipe.isTrending === true);
    
    if (!trendingRecipes || trendingRecipes.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.carouselSectionTitle}>Recipes for you</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RecipesList')}>
            <Text style={styles.viewAllText}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={trendingRecipes}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.recipeCard}
              onPress={() => navigation.navigate('RecipeDetail', { 
                recipeId: item.id,
                coffeeId: item.coffeeId,
                coffeeName: item.coffeeName,
                roaster: item.roaster,
                imageUrl: item.imageUrl,
                // Pass the full recipe object for direct rendering
                recipe: item,
                // Include creator details
                userId: item.creatorId,
                userName: item.creatorName,
                userAvatar: item.creatorAvatar
              })}
            >
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.recipeImage} 
              />
              <View style={styles.recipeContent}>
                <Text style={styles.recipeName}>{item.name}</Text>
                <Text style={styles.recipeCoffeeName}>{item.coffeeName}</Text>
                <View style={styles.recipeCreatorContainer}>
                  <Image 
                    source={getImageSource(item.creatorAvatar)} 
                    style={styles.recipeCreatorAvatar} 
                  />
                  <Text style={styles.recipeCreatorName}>{item.creatorName}</Text>
                </View>
                <View style={styles.recipeStatsContainer}>
                  <View style={styles.recipeStat}>
                    <Ionicons name="heart" size={14} color="#666666" />
                    <Text style={styles.recipeStatText}>{item.likes}</Text>
                  </View>
                  <View style={styles.recipeStat}>
                    <Ionicons name="bookmark" size={14} color="#666666" />
                    <Text style={styles.recipeStatText}>{item.saves}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContainer}
        />
      </View>
    );
  };

  const renderPeopleYouMightKnowSection = () => {
    if (!suggestedUsers || suggestedUsers.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.carouselSectionTitle}>People You Might Know</Text>
          <TouchableOpacity onPress={() => navigation.navigate('PeopleList')}>
            <Text style={styles.viewAllText}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={suggestedUsers}
          renderItem={({ item }) => {
            // Get avatar URL and prepare image source correctly
            let avatarUrl = item.userAvatar || item.avatar || 'https://randomuser.me/api/portraits/men/1.jpg';
            
            // Hardcoded fix for Emma Garcia
            if (item.userName === 'Emma Garcia') {
              avatarUrl = 'https://randomuser.me/api/portraits/women/33.jpg';
              console.log('🔍 HARDCODED EMMA GARCIA AVATAR IN PEOPLE YOU MIGHT KNOW:', avatarUrl);
            }
            console.log(`People You Might Know: User ${item.userName} avatar URL:`, avatarUrl);
            
            return (
            <TouchableOpacity 
              style={styles.suggestedUserCard}
              onPress={() => navigation.navigate('UserProfileBridge', { 
                userId: item.id, 
                userName: item.userName,
                userAvatar: avatarUrl,
                skipAuth: true 
              })}
            >
              {/* Render HTTP URLs directly with uri prop, use getImageSource for local assets */}
              {avatarUrl && avatarUrl.startsWith('http') ? (
                <AppImage 
                  source={{ uri: avatarUrl }}
                  style={styles.suggestedUserAvatar} 
                />
              ) : (
                <Image 
                  source={getImageSource(avatarUrl)}
                  style={styles.suggestedUserAvatar} 
                />
              )}
              <Text style={styles.suggestedUserName}>{item.userName}</Text>
              <Text style={styles.suggestedUserHandle}>{item.handle}</Text>
              <Text style={styles.mutualFriendsText}>
                {item.mutualFriends} {item.mutualFriends === 1 ? 'mutual' : 'mutuals'}
              </Text>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.userCarouselContainer}
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
          {renderPopularCoffeeCarousel('Discover Coffee', mockCoffees.coffees, true, 'CoffeeDiscovery', { sortBy: 'popularity' })}
          {renderGoodCafesSection()}
          {renderRecipesForYouSection()}
          
          {/* Coffee Gear Section */}
          {popularGear.length > 0 && (
            <View style={styles.carouselSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.carouselSectionTitle}>Coffee Gear</Text>
                <TouchableOpacity onPress={() => navigation.navigate('GearList')}>
                  <Text style={styles.viewAllText}>View more</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={popularGear.slice(0, 4)}
                renderItem={({ item, index }) => (
                  <View style={{ marginRight: index < popularGear.slice(0, 4).length - 1 ? 12 : 0 }}>
                    <GearCard
                      item={item}
                      onPress={() => handleGearPress(item)}
                    />
                  </View>
                )}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselContainer}
              />
            </View>
          )}
          
          {renderPeopleYouMightKnowSection()}
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
    // No shadow or elevation
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
    paddingVertical: 8,
    paddingHorizontal: 16,
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
    width: 160,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginRight: 12,
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
    // color: '#007AFF',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
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
    width: 64,
    height: 64,
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
  recipeCard: {
    width: 250,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  recipeImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E5E5EA',
  },
  recipeContent: {
    padding: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 3,
  },
  recipeCoffeeName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  recipeCreatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeCreatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  recipeCreatorName: {
    fontSize: 14,
    color: '#333333',
  },
  recipeStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  recipeStatText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },

  suggestedUserCard: {
    width: 170,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestedUserAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#E5E5EA',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  suggestedUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    textAlign: 'center',
  },
  suggestedUserHandle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  mutualFriendsText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
  },
  cafeListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    width: 280,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cafeListImage: {
    width: '100%',
    height: 120,
  },
  cafeListContent: {
    padding: 12,
  },
  cafeListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cafeListLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  cafeListTitleContainer: {
    flex: 1,
  },
  cafeListName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cafeListLocation: {
    fontSize: 13,
    color: '#666666',
  },
  cafeListStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 50,
    marginLeft: 4,
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
    fontSize: 11,
    color: '#666666',
    marginLeft: 4,
  },
  cafeListContainer: {
    paddingLeft: 16,
    paddingRight: 4,
  },
  gearCardContainer: {
    marginVertical: 12,
    marginHorizontal: 16,
    width: '90%',
  },
  gearUsersList: {
    marginTop: 8,
  },
  gearUsersListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  gearUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  gearUserAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  gearUserAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  gearUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchResultImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  searchResultImage: {
    width: '100%',
    height: '100%',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 4,
  },
  viewMoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  viewMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  gearCard: {
    marginRight: 12,
    width: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
}); 