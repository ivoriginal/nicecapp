import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import mockData from '../data/mockData.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = 200;
const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef(null);
  const navigation = useNavigation();
  const isFirstMount = useRef(true);

  // Get coffee suggestions and trending cafés from mock data
  const coffeeSuggestions = mockData.coffees.slice(0, 5);
  const trendingCafes = mockData.businesses.filter(business => 
    business.type === 'coffee_shop' || business.type === 'roaster_coffee_shop'
  ).slice(0, 5);
  
  // Get suggested users from mock data
  const suggestedUsers = mockData.users.filter(user => user.id !== 'currentUser').slice(0, 5);
  
  // Get coffee events for the "People You Might Know" section
  const suggestedEvents = [
    {
      id: 'event-suggested-1',
      type: 'event',
      userId: 'user5',
      userName: 'Emma Garcia',
      userAvatar: 'https://randomuser.me/api/portraits/women/33.jpg',
      coffeeName: 'Ethiopian Yirgacheffe',
      roaster: 'Blue Bottle Coffee',
      imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      rating: 4.8,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      brewingMethod: 'Pour Over',
      grindSize: 'Medium',
      notes: 'Bright acidity with floral notes. Very clean cup.'
    },
    {
      id: 'event-suggested-2',
      type: 'event',
      userId: 'user6',
      userName: 'David Kim',
      userAvatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      coffeeName: 'Colombian Supremo',
      roaster: 'Stumptown Coffee Roasters',
      imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      rating: 4.5,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      brewingMethod: 'Espresso',
      grindSize: 'Fine',
      notes: 'Rich chocolate notes with a hint of caramel. Good body.'
    },
    {
      id: 'event-suggested-3',
      type: 'event',
      userId: 'user7',
      userName: 'Sophia Miller',
      userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      coffeeName: 'Kenya AA',
      roaster: 'Blue Bottle Coffee',
      imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
      rating: 4.9,
      date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      brewingMethod: 'Chemex',
      grindSize: 'Medium',
      notes: 'Complex berry notes with a clean finish. Excellent!'
    }
  ];

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
      // This would be replaced with actual API calls to your backend
      const mockResults = [
        { id: '1', name: 'Ethiopian Yirgacheffe', roaster: 'Blue Bottle', type: 'coffee' },
        { id: '2', name: 'Colombian Supremo', roaster: 'Starbucks', type: 'coffee' },
        { id: '3', name: 'Kenya AA', roaster: 'Intelligentsia', type: 'coffee' },
        { id: '4', name: 'Guatemala Antigua', roaster: 'Peet\'s Coffee', type: 'coffee' },
        { id: '5', name: 'Sumatra Mandheling', roaster: 'Blue Bottle', type: 'coffee' },
        { id: '6', name: 'Blue Bottle Coffee', type: 'roaster', location: 'San Francisco, CA' },
        { id: '7', name: 'Starbucks', type: 'roaster', location: 'Seattle, WA' },
        { id: '8', name: 'Intelligentsia Coffee', type: 'roaster', location: 'Chicago, IL' },
        { id: '9', name: 'Peet\'s Coffee', type: 'roaster', location: 'Emeryville, CA' },
        { id: '10', name: 'John Doe', type: 'user', username: 'johndoe' },
        { id: '11', name: 'Jane Smith', type: 'user', username: 'janesmith' },
        { id: '12', name: 'Coffee Enthusiast', type: 'user', username: 'coffeelover' },
        { id: '13', name: 'CodingCarlos', type: 'user', username: 'codingcarlos' },
        { id: '14', name: 'Elias', type: 'user', username: 'elias' },
        { id: '15', name: 'Alena', type: 'user', username: 'alena' },
        { id: '16', name: 'CafeLab', type: 'roaster', location: 'Murcia, Spain' },
        { id: '17', name: 'The Fix', type: 'roaster', location: 'Madrid, Spain' },
      ].filter(item => 
        item.name.toLowerCase().includes(text.toLowerCase()) || 
        (item.roaster && item.roaster.toLowerCase().includes(text.toLowerCase())) ||
        (item.username && item.username.toLowerCase().includes(text.toLowerCase()))
      );
      
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

  const renderSearchResult = ({ item }) => {
    if (item.type === 'coffee') {
      return (
        <TouchableOpacity style={styles.resultItem}>
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{item.roaster}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      );
    } else if (item.type === 'roaster') {
      return (
        <TouchableOpacity style={styles.resultItem}>
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>{item.location}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#000000" />
        </TouchableOpacity>
      );
    } else if (item.type === 'user') {
      return (
        <TouchableOpacity 
          style={styles.resultItem}
          onPress={() => {
            // Navigate to the bridge component first
            navigation.navigate('UserProfileBridge', { 
              userId: item.id, 
              userName: item.name,
              skipAuth: true 
            });
          }}
        >
          <View style={styles.resultContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.roasterName}>@{item.username}</Text>
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
      { id: 'user', label: 'Users' },
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
    if (type === 'coffee') {
      return (
        <TouchableOpacity 
          style={styles.carouselCard}
          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
        >
          <Image 
            source={{ uri: item.image }} 
            style={styles.carouselImage} 
            resizeMode="cover"
          />
          <View style={styles.carouselOverlay}>
            <Text style={styles.carouselTitle}>{item.name}</Text>
            <Text style={styles.carouselSubtitle}>{item.roaster}</Text>
            <View style={styles.carouselStats}>
              <Text style={styles.carouselPrice}>${item.price.toFixed(2)}</Text>
              <Text style={styles.carouselOrigin}>{item.origin}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else if (type === 'cafe') {
      return (
        <TouchableOpacity 
          style={styles.carouselCard}
          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
        >
          <Image 
            source={{ uri: item.coverImage }} 
            style={styles.carouselImage} 
            resizeMode="cover"
          />
          <View style={styles.carouselOverlay}>
            <Text style={styles.carouselTitle}>{item.name}</Text>
            <Text style={styles.carouselSubtitle}>{item.location}</Text>
            <View style={styles.carouselStats}>
              <Text style={styles.carouselType}>{item.type === 'roaster_coffee_shop' ? 'Roaster & Café' : 'Café'}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    } else if (type === 'user') {
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
          <Image 
            source={{ uri: item.userAvatar }} 
            style={styles.userAvatar} 
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.userUsername}>@{item.email.split('@')[0]}</Text>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    } else if (type === 'event') {
      return (
        <TouchableOpacity 
          style={styles.eventCard}
          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
        >
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.eventImage} 
            resizeMode="cover"
          />
          <View style={styles.eventContent}>
            <View style={styles.eventUserInfo}>
              <Image 
                source={{ uri: item.userAvatar }} 
                style={styles.eventUserAvatar} 
                resizeMode="cover"
              />
              <Text style={styles.eventUserName}>{item.userName}</Text>
            </View>
            <Text style={styles.eventCoffeeName}>{item.coffeeName}</Text>
            <Text style={styles.eventRoaster}>{item.roaster}</Text>
            <View style={styles.eventRating}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.eventRatingText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  };

  const renderCarousel = (title, data, type) => {
    if (!data || data.length === 0) return null;
    
    return (
      <View style={styles.carouselSection}>
        <Text style={styles.carouselSectionTitle}>{title}</Text>
        <FlatList
          data={data}
          renderItem={({ item }) => renderCarouselItem({ item, type: type === 'mixed' ? (item.type || 'user') : type })}
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#000000" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search coffees, roasters, users..."
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

      {isSearching && searchQuery.length > 0 ? (
        <View style={styles.searchResultsWrapper}>
          {renderFilterChips()}
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
          {renderCarousel('Coffee you might like', coffeeSuggestions, 'coffee')}
          {renderCarousel('Trending Cafés', trendingCafes, 'cafe')}
          {renderCarousel('People You Might Know', suggestedUsers, 'user')}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  filterChipsContainer: {
    backgroundColor: '#F2F2F7',
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
    backgroundColor: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    marginBottom: 24,
  },
  carouselSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  carouselContainer: {
    paddingHorizontal: 8,
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
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
    marginBottom: 8,
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
    width: CARD_WIDTH,
    height: 100,
    borderRadius: 12,
    marginHorizontal: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: '#666666',
  },
  followButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
}); 