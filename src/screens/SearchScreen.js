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
import RecipeCard from '../components/RecipeCard';
import GearCard from '../components/GearCard';
import { useCoffee } from '../context/CoffeeContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import FollowButton from '../components/FollowButton';
import { incrementGearViewCount } from '../utils/gearBadgeManager';

// Import the gearData from GearDetailScreen for consistency
// This is the object used in GearDetailScreen.js to look up gear by name
import { gearData } from './GearDetailScreen';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 200;
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;
const SEARCH_INPUT_BG_COLOR = '#F0F0F0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  recentSearchText: {
    fontSize: 16,
    marginLeft: 12,
  },
  clearRecentText: {
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  resultBusinessImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  resultCoffeeImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
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
    alignItems: 'center',
  },
  suggestedUserAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#E5E5EA',
    borderWidth: 1,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  cafeListCard: {
    borderRadius: 12,
    marginRight: 12,
    width: 280,
    overflow: 'hidden',
  },
  cafeListImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
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
    resizeMode: 'cover',
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
  roundedImageContainer: {
    borderRadius: 24, // Half of the width/height for perfect circle
    overflow: 'hidden',
  },
  roundedImage: {
    borderRadius: 24, // Half of the width/height for perfect circle
  },
});

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { currentAccount, coffeeCollection, user } = useCoffee();
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef(null);
  const navigation = useNavigation();
  const isFirstMount = useRef(true);
  
  // State for different data types
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [popularGear, setPopularGear] = useState([]);
  const [popularCoffees, setPopularCoffees] = useState([]);
  const [goodCafes, setGoodCafes] = useState([]);

  // Load data from Supabase
  useEffect(() => {
    loadInitialData();
    loadRecentSearches();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load popular coffees
      const { data: coffees, error: coffeesError } = await supabase
        .from('coffees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (coffeesError) throw coffeesError;
      setPopularCoffees(coffees.map(coffee => ({
        ...coffee,
        type: 'coffee',
        imageUrl: coffee.image_url
      })));

      // Load good cafes
      const { data: cafes, error: cafesError } = await supabase
        .from('profiles')
        .select('*')
        .in('account_type', ['cafe', 'roaster'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (cafesError) throw cafesError;
      console.log('Raw cafes data:', cafes);

      if (!cafes || cafes.length === 0) {
        console.log('Using mock cafe data');
        const mockCafes = [
          {
            id: 'vertigo-cafe',
            type: 'cafe',
            name: 'Vértigo y Calambre',
            full_name: 'Vértigo y Calambre',
            location: 'Murcia',
            avatar_url: require('../../assets/businesses/vertigo-logo.jpg'),
            cover_url: require('../../assets/businesses/vertigo-cover.jpg'),
            rating: 4.8,
            review_count: 42,
            is_open: true,
            account_type: 'cafe'
          },
          {
            id: 'cafelab-cafe',
            type: 'cafe',
            name: 'CaféLab Murcia',
            full_name: 'CaféLab Murcia',
            location: 'Murcia',
            avatar_url: require('../../assets/businesses/cafelab-logo.png'),
            cover_url: require('../../assets/businesses/cafelab-murcia-cover.png'),
            rating: 4.7,
            review_count: 38,
            is_open: true,
            account_type: 'cafe'
          }
        ];
        setGoodCafes(mockCafes);
      } else {
        setGoodCafes(cafes.map(cafe => ({
          ...cafe,
          type: 'cafe',
          name: cafe.full_name,
          imageUrl: cafe.avatar_url,
          logo_url: cafe.avatar_url,
          cover_url: cafe.cover_url || cafe.avatar_url,
          rating: cafe.rating || 4.5,
          review_count: cafe.review_count || 0,
          is_open: true
        })));
      }

      // Load popular gear from Supabase
      try {
        const { data: gear, error: gearError } = await supabase
          .from('gear')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(4);

        if (gearError) {
          console.error('Error loading gear:', gearError);
          return;
        }

        console.log('Loaded gear from Supabase:', gear);
        
        // Map gear data and ensure all required fields are present
        setPopularGear(gear ? gear.map(item => {
          // Log each item's image URL for debugging
          console.log(`Processing gear item ${item.id}, image_url:`, item.image_url);
          
          // Get the public URL for the image
          const { data: { publicUrl } } = supabase.storage
            .from('gear')
            .getPublicUrl(`${item.id}.jpg`);
          
          return {
            ...item,
            type: 'gear',
            // Use the Supabase storage URL if available, otherwise use a default image
            imageUrl: publicUrl || 
              'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=2940&auto=format&fit=crop', // Default coffee gear image
            name: item.name || '',
            brand: item.brand || '',
            category: item.category || '',
            description: item.description || '',
            price: item.price || 0
          };
        }) : []);
      } catch (error) {
        console.error('Error loading gear:', error);
        setPopularGear([]);
      }

      // Load suggested users
      try {
        let query = supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, location, account_type')
          .eq('account_type', 'user')
          .order('created_at', { ascending: false })
          .limit(5);
        
        // Only add the neq filter if we have a valid user ID
        if (user?.id) {
          query = query.neq('id', user.id);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) throw usersError;
        
        console.log('Loaded users:', users);
        setSuggestedUsers(users ? users.map(user => ({
          ...user,
          id: user.id,
          type: 'user',
          userName: user.full_name || user.username,
          username: user.username,
          userAvatar: user.avatar_url,
          location: user.location
        })) : []);
      } catch (error) {
        console.error('Error loading suggested users:', error);
        setSuggestedUsers([]);
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Load recent searches from AsyncStorage
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

  const handleGearPress = (item) => {
    const gearName = item.name;
    console.log(`Navigating to gear detail for ${gearName}`);
    
    // Find the exact key in gearData that corresponds to this gear
    const exactMatchKey = Object.keys(gearData).find(key => 
      key.toLowerCase() === gearName.toLowerCase()
    );
    
    if (exactMatchKey) {
      navigation.navigate('GearDetail', { gearName: exactMatchKey });
      return;
    }
    
    // Try to find a partial match in gearData keys
    const partialMatchKey = Object.keys(gearData).find(key => {
      return key.toLowerCase().includes(gearName.toLowerCase()) || 
             gearName.toLowerCase().includes(key.toLowerCase());
    });
    
    if (partialMatchKey) {
      navigation.navigate('GearDetail', { gearName: partialMatchKey });
      return;
    }
    
    // Special cases
    if (gearName.includes("Baratza Encore")) {
      navigation.navigate('GearDetail', { gearName: "Baratza Encore" });
      return;
    }
    
    if (gearName.toLowerCase().includes("aeropress")) {
      navigation.navigate('GearDetail', { gearName: "AeroPress" });
      return;
    }
    
    // Fallback
    navigation.navigate('GearDetail', { gearName: gearName });
  };

  const handleSearch = async (text) => {
    // Ensure we remove extra whitespace at both ends to make search more forgiving
    const trimmedText = text.trim();
    setSearchQuery(text);
    setIsSearching(true);
    
    // If, after trimming, there is no text, reset results and exit early
    if (trimmedText.length === 0) {
      setSearchResults([]);
      return;
    }
    
    // Clean search text - remove @ from handles for better matching and convert to lower case
    const cleanSearchText = trimmedText.toLowerCase().replace('@', '');
    
    try {
      let results = [];
      
      // Search users in Supabase
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${cleanSearchText}%,full_name.ilike.%${cleanSearchText}%`)
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (usersError) throw usersError;
      
      if (users) {
        results.push(...users.map(user => {
          const isCafe = user.account_type === 'cafe';
          const isRoaster = user.account_type === 'roaster';
          const isBusinessAccount = isCafe || isRoaster;
          
          return {
            id: user.id,
            userId: user.id,
            name: isBusinessAccount ? user.full_name : (user.full_name || user.username),
            userName: user.full_name || user.username,
            username: user.username,
            location: user.location,
            type: isCafe ? 'cafe' : isRoaster ? 'roaster' : 'user',
            source: 'supabase',
            userAvatar: user.avatar_url,
            avatar: user.avatar_url,
            imageUrl: user.avatar_url,
            cover_url: user.cover_url,
            rating: user.rating,
            review_count: user.review_count,
            is_open: true // This should be dynamic based on opening hours
          };
        }));
      }
      
      // Search coffees
      const { data: coffees, error: coffeesError } = await supabase
        .from('coffees')
        .select('*')
        .or(`name.ilike.%${cleanSearchText}%,roaster.ilike.%${cleanSearchText}%`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (coffeesError) throw coffeesError;
      
      if (coffees) {
        results.push(...coffees.map(coffee => ({
          id: coffee.id,
          coffeeId: coffee.id,
          name: coffee.name,
          roaster: coffee.roaster,
          type: 'coffee',
          image: coffee.image_url,
          imageUrl: coffee.image_url
        })));
      }
      
      // Search gear
      const { data: gear, error: gearError } = await supabase
        .from('gear')
        .select('*')
        .or(`name.ilike.%${cleanSearchText}%,brand.ilike.%${cleanSearchText}%,category.ilike.%${cleanSearchText}%`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (gearError) throw gearError;
      
      if (gear) {
        results.push(...gear.map(item => {
          // Get the public URL for the image
          const { data: { publicUrl } } = supabase.storage
            .from('gear')
            .getPublicUrl(`${item.id}.jpg`);
            
          // Track gear view when it appears in search results
          if (item.id) {
            incrementGearViewCount(item.id);
          }
            
          return {
            id: item.id,
            gearId: item.id,
            name: item.name,
            brand: item.brand,
            type: 'gear',
            category: item.category,
            price: item.price,
            imageUrl: publicUrl || 'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=2940&auto=format&fit=crop',
            description: item.description
          };
        }));
      }
      
      // Search recipes
      const { data: recipes, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          author:author_id(full_name, avatar_url),
          coffee:coffee_id(name, roaster)
        `)
        .or(`title.ilike.%${cleanSearchText}%,method.ilike.%${cleanSearchText}%`)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recipesError) throw recipesError;
      
      if (recipes) {
        results.push(...recipes.map(recipe => ({
          id: recipe.id,
          name: recipe.title,
          type: 'recipe',
          method: recipe.method,
          creatorName: recipe.author?.full_name,
          creatorAvatar: recipe.author?.avatar_url,
          coffeeName: recipe.coffee?.name,
          roaster: recipe.coffee?.roaster,
          imageUrl: recipe.image_url
        })));
      }
      
      // Log the results for debugging
      console.log('Search results:', results.map(r => ({id: r.id, name: r.name, type: r.type})));
      
      setSearchResults(results);
      
    } catch (error) {
      console.error('Error searching:', error);
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

  const renderSearchResult = ({ item }) => {
    const title = item.name || 'Unknown';
    let subtitle = '';
    
    // Format the subtitle based on item type
    if (item.type === 'coffee') {
      subtitle = item.roaster || 'Unknown roaster';
    } else if (item.type === 'gear') {
      subtitle = `${item.brand || 'Unknown brand'} ${item.category || ''}`;
    } else {
      // For users or other types
      subtitle = item.location || '';
    }

    // Determine if the item is a user type (either regular user or business account)
    const isUserType = item.type === 'user' || item.type === 'cafe' || item.type === 'roaster';
    
    return (
      <TouchableOpacity 
        style={[styles.resultItem, { backgroundColor: theme.background }]}
        onPress={() => handleItemPress(item)}
      >
        <View style={[
          styles.searchResultImageContainer,
          isUserType && styles.roundedImageContainer
        ]}>
          {isUserType ? (
            <AppImage 
              source={item.imageUrl} 
              style={[styles.searchResultImage, isUserType && styles.roundedImage]}
              placeholder="person"
              placeholderStyle={{ backgroundColor: '#E5E5EA' }}
            />
          ) : (
            <Image 
              source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
              style={styles.searchResultImage}
            />
          )}
        </View>
        <View style={styles.resultContent}>
          <Text style={[styles.coffeeName, { color: theme.primaryText }]}>{title}</Text>
          <Text style={[styles.roasterName, { color: theme.secondaryText }]}>
            {item.type === 'coffee' ? `Coffee · ${subtitle}` : 
             item.type === 'gear' ? `Gear · ${subtitle}` : 
             item.type === 'roaster' ? `Roaster · ${subtitle}` :
             item.type === 'cafe' ? `Café · ${subtitle}` : 
             `Profile · ${subtitle}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleItemPress = (item) => {
    // Add to recent searches
    saveRecentSearch(item.name);

    // Handle navigation based on item type
    if (item.type === 'coffee') {
      navigation.navigate('CoffeeDetail', {
        coffeeId: item.id,
        name: item.name,
        roaster: item.roaster,
        imageUrl: item.imageUrl
      });
    } else if (item.type === 'recipe') {
      navigation.navigate('RecipeDetail', {
        recipeId: item.id,
        title: item.name,
        method: item.method,
        creatorName: item.creatorName,
        creatorAvatar: item.creatorAvatar,
        coffeeName: item.coffeeName,
        roaster: item.roaster,
        imageUrl: item.imageUrl
      });
    } else if (item.type === 'gear') {
      navigation.navigate('GearDetail', {
        gearId: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        price: item.price,
        imageUrl: item.imageUrl,
        description: item.description
      });
    } else if (item.type === 'user') {
      navigation.replace('UserProfileBridge', {
        userId: item.id,
        userName: item.name || item.userName,
        userAvatar: item.userAvatar || item.avatar,
        location: item.location,
        isCurrentUser: currentAccount?.id === item.id,
        skipAuth: true
      });
    } else if (item.type === 'roaster') {
      navigation.replace('UserProfileBridge', {
        userId: item.id,
        userName: item.name,
        userAvatar: item.imageUrl,
        isBusinessAccount: true,
        isRoaster: true,
        skipAuth: true
      });
    } else if (item.type === 'cafe') {
      // Special handling for Vértigo y Calambre
      if (item.name === 'Vértigo y Calambre' || item.full_name === 'Vértigo y Calambre') {
        navigation.replace('UserProfileBridge', {
          userId: 'business-vertigo',
          userName: 'Vértigo y Calambre',
          userAvatar: item.avatar_url || item.logo_url,
          coverImage: item.cover_url,
          isBusinessAccount: true,
          isRoaster: false,
          skipAuth: true
        });
      } else {
        navigation.replace('UserProfileBridge', {
          userId: item.id,
          userName: item.name,
          userAvatar: item.avatar_url || item.logo_url,
          coverImage: item.cover_url,
          isBusinessAccount: true,
          isRoaster: false,
          skipAuth: true
        });
      }
    }
  };

  const renderFilterChips = () => {
    const filters = [
      { id: 'all', label: 'All' },
      { id: 'coffee', label: 'Coffees' },
      { id: 'user', label: 'People' },
      { id: 'cafe', label: 'Cafés' },
      { id: 'gear', label: 'Gear' }
    ];

    return (
      <View style={[styles.filterChipsContainer, { backgroundColor: theme.background, borderBottomColor: theme.divider }]}>
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
                activeFilter === filter.id && styles.activeFilterChip,
                { 
                  backgroundColor: activeFilter === filter.id 
                    ? theme.tintColor 
                    : isDarkMode ? theme.altCardBackground : '#F2F2F7',
                  borderColor: isDarkMode ? 'transparent' : theme.divider
                }
              ]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text 
                style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.activeFilterText,
                  { color: activeFilter === filter.id ? '#FFFFFF' : theme.primaryText }
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

  const renderPopularCoffeeCarousel = () => {
    if (!popularCoffees || popularCoffees.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.carouselSectionTitle, { color: theme.primaryText }]}>Discover Coffee</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CoffeeDiscovery')}>
            <Text style={[styles.viewAllText, { color: theme.primaryText, borderBottomColor: theme.primaryText }]}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={popularCoffees}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[
                styles.popularCoffeeCard, 
                { 
                  borderWidth: isDarkMode ? 0 : 1,
                  borderColor: isDarkMode ? 'transparent' : theme.divider,
                  backgroundColor: isDarkMode ? theme.cardBackground : 'transparent' 
                }
              ]}
              onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
            >
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.popularCoffeeImage} 
                resizeMode="cover"
              />
              <View style={styles.popularCoffeeContent}>
                <Text style={[styles.popularCoffeeName, { color: theme.primaryText }]}>{item.name}</Text>
                <Text style={[styles.popularCoffeeRoaster, { color: theme.secondaryText }]}>{item.roaster}</Text>
                <View style={styles.popularCoffeeDetails}>
                  <View style={styles.popularCoffeeOriginContainer}>
                    <Text style={[styles.popularCoffeeOrigin, { color: theme.secondaryText }]}>{item.origin}</Text>
                  </View>
                  <Text style={[styles.popularCoffeePrice, { color: theme.primaryText }]}>€{item.price.toFixed(2)}</Text>
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

  const renderGoodCafesSection = () => {
    console.log('Rendering Good Cafés section, cafes:', goodCafes);
    
    if (!goodCafes || goodCafes.length === 0) {
      console.log('No cafes available to render');
      return null;
    }
    
    return (
      <View style={styles.carouselSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.carouselSectionTitle, { color: theme.primaryText }]}>Good Cafés</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CafesList')}>
            <Text style={[styles.viewAllText, { color: theme.primaryText, borderBottomColor: theme.primaryText }]}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={goodCafes}
          renderItem={({ item }) => {
            console.log('Rendering cafe item:', item);
            
            // Function to handle image source based on whether it's a local or remote URL
            const getImageSource = (image) => {
              if (typeof image === 'string') {
                return { uri: image };
              }
              return image; // If it's already a required local image
            };
            
            return (
              <TouchableOpacity 
                style={[
                  styles.cafeListCard, 
                  { 
                    backgroundColor: isDarkMode ? theme.cardBackground : 'transparent',
                    borderColor: theme.divider,
                    borderWidth: isDarkMode ? 0 : 1
                  }
                ]}
                onPress={() => {
                  // Special handling for Vértigo y Calambre
                  if (item.name === 'Vértigo y Calambre' || item.full_name === 'Vértigo y Calambre') {
                    navigation.replace('UserProfileBridge', {
                      userId: 'business-vertigo',
                      userName: 'Vértigo y Calambre',
                      userAvatar: typeof item.avatar_url === 'string' ? item.avatar_url : require('../../assets/businesses/vertigo-logo.jpg'),
                      coverImage: typeof item.cover_url === 'string' ? item.cover_url : require('../../assets/businesses/vertigo-cover.jpg'),
                      isBusinessAccount: true,
                      isRoaster: false,
                      skipAuth: true
                    });
                  } else {
                    navigation.replace('UserProfileBridge', {
                      userId: item.id,
                      userName: item.name,
                      userAvatar: getImageSource(item.avatar_url || item.logo_url),
                      coverImage: getImageSource(item.cover_url),
                      isBusinessAccount: true,
                      isRoaster: false,
                      skipAuth: true
                    });
                  }
                }}
              >
                <Image 
                  source={getImageSource(item.cover_url || item.image_url)}
                  style={styles.cafeListImage}
                />
                <View style={styles.cafeListContent}>
                  <View style={styles.cafeListHeader}>
                    <Image 
                      source={getImageSource(item.avatar_url || item.logo_url)}
                      style={[styles.cafeListLogo, { borderColor: theme.divider }]}
                      resizeMode="cover"
                    />
                    <View style={styles.cafeListTitleContainer}>
                      <Text style={[styles.cafeListName, { color: theme.primaryText }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                      <Text style={[styles.cafeListLocation, { color: theme.secondaryText }]}>{item.location}</Text>
                    </View>
                    
                    <View style={[styles.statusIndicator, item.is_open ? styles.openStatus : styles.closedStatus]}>
                      <Text style={styles.statusText}>{item.is_open ? 'Open' : 'Closed'}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cafeListStats}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={[styles.ratingText, { color: theme.primaryText }]}>{item.rating ? item.rating.toFixed(1) : '4.5'}</Text>
                      <Text style={[styles.reviewCount, { color: theme.secondaryText }]}>({item.review_count || '0'} reviews)</Text>
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

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: theme.background,
        paddingTop: insets.top
      }
    ]}>
      <View style={styles.searchRow}>
        <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? theme.altCardBackground : '#F0F0F0' }]}>
          <Ionicons name="search" size={20} color={theme.primaryText} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { color: theme.primaryText }]}
            placeholder="Search coffees, cafés, roasters and users"
            placeholderTextColor={theme.secondaryText}
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
              <Ionicons name="close-circle" size={20} color={theme.primaryText} />
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
            <Text style={[styles.cancelButtonText, { color: theme.primaryText }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {isSearching && searchQuery.length > 0 ? (
        <View style={styles.searchResultsWrapper}>
          {!isInputFocused && renderFilterChips()}
          <FlatList
            data={filteredResults}
            renderItem={renderSearchResult}
            keyExtractor={(item, index) => `${item.type}-${item.id}-${index}`}
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
            <Text style={[styles.recentSearchesTitle, { color: theme.primaryText }]}>Recent Searches</Text>
            {recentSearches.length > 0 && (
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text style={[styles.clearRecentText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentSearches.length > 0 ? (
            recentSearches.map((search, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.recentSearchItem, 
                  { 
                    backgroundColor: isDarkMode ? theme.cardBackground : '#FFFFFF',
                    borderWidth: isDarkMode ? 0 : 1,
                    borderColor: theme.divider
                  }
                ]}
                onPress={() => handleRecentSearchPress(search)}
              >
                <Ionicons name="time-outline" size={20} color={theme.primaryText} />
                <Text style={[styles.recentSearchText, { color: theme.primaryText }]}>{search}</Text>
                <TouchableOpacity 
                  style={styles.removeRecentButton}
                  onPress={() => removeRecentSearch(search)}
                >
                  <Ionicons name="close" size={16} color={theme.primaryText} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyRecentContainer}>
              <Text style={[styles.emptyRecentText, { color: theme.secondaryText }]}>No recent searches</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.discoveryContainer}
          contentContainerStyle={styles.discoveryContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderPopularCoffeeCarousel()}
          {renderGoodCafesSection()}
          
          {/* Coffee Gear Section - Always try to render */}
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.carouselSectionTitle, { color: theme.primaryText }]}>Coffee Gear</Text>
              <TouchableOpacity onPress={() => navigation.navigate('GearList')}>
                <Text style={[styles.viewAllText, { color: theme.primaryText, borderBottomColor: theme.primaryText }]}>View more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={popularGear}
              renderItem={({ item, index }) => {
                // Track gear view when card is rendered
                if (item.id) {
                  incrementGearViewCount(item.id);
                }
                
                return (
                  <View style={{ marginRight: index < popularGear.length - 1 ? 12 : 0 }}>
                    <GearCard
                      item={item}
                      onPress={() => handleGearPress(item)}
                      theme={theme}
                      showAvatars={false}
                    />
                  </View>
                );
              }}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselContainer}
            />
          </View>

          {/* People You Might Know Section - Always try to render */}
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.carouselSectionTitle, { color: theme.primaryText }]}>People You Might Know</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PeopleList', { suggestedUsers })}>
                <Text style={[styles.viewAllText, { color: theme.primaryText, borderBottomColor: theme.primaryText }]}>View more</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={suggestedUsers}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.suggestedUserCard, 
                    { 
                      backgroundColor: isDarkMode ? theme.cardBackground : '#FFFFFF',
                      borderWidth: isDarkMode ? 0 : 1,
                      borderColor: theme.divider
                    }
                  ]}
                  onPress={() => navigation.navigate('UserProfileBridge', {
                    userId: item.id,
                    userName: item.userName,
                    userAvatar: item.userAvatar,
                    location: item.location,
                    isCurrentUser: currentAccount?.id === item.id,
                    skipAuth: true
                  })}
                >
                  <AppImage 
                    source={item.userAvatar} 
                    style={[styles.suggestedUserAvatar, { borderColor: theme.divider }]}
                    resizeMode="cover"
                    placeholder="person"
                  />
                  <Text style={[styles.suggestedUserName, { color: theme.primaryText }]} numberOfLines={1}>{item.userName}</Text>
                  <Text style={[styles.suggestedUserHandle, { color: theme.secondaryText }]} numberOfLines={1}>@{item.username}</Text>
                  <FollowButton 
                    userId={item.id}
                    style={[
                      styles.followButton, 
                      { 
                        backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                        borderWidth: isDarkMode ? 1 : 0,
                        borderColor: isDarkMode ? theme.divider : 'transparent'
                      }
                    ]}
                    textStyle={{ color: isDarkMode ? '#000000' : '#FFFFFF' }}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.userCarouselContainer}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}