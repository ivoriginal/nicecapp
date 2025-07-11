import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Modal,
  SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const RoastersListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  
  // State management
  const [roasters, setRoasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState(route.params?.selectedCity || 'All Cities');
  const [sortBy, setSortBy] = useState('alphabetical'); // 'alphabetical' or 'city'
  const [showFilters, setShowFilters] = useState(false);
  const [citySheetVisible, setCitySheetVisible] = useState(false);

  // Configure header right button on mount
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )
    });
  }, [navigation, theme.primaryText]);

  // Reset header when screen comes into focus (fixes header disappearing issue)
  useFocusEffect(
    React.useCallback(() => {
      navigation.setOptions({
        headerShown: true,
        headerRight: () => (
          <TouchableOpacity 
            style={{ marginRight: 16 }}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="options-outline" size={24} color={theme.primaryText} />
          </TouchableOpacity>
        )
      });
    }, [navigation, theme.primaryText])
  );

  // Load roasters data
  const loadRoasters = async () => {
    try {
      console.log('🔍 RoastersListScreen: Starting to load roasters...');
      // Load from Supabase
      const { data: supabaseRoasters, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('account_type', 'roaster')
        .order('created_at', { ascending: false });

      console.log('📊 RoastersListScreen: Supabase query result:', { 
        dataLength: supabaseRoasters?.length, 
        error: error?.message 
      });

      if (error) {
        console.error('Error loading roasters from Supabase:', error);
        setRoasters([]);
        return;
      }

      if (supabaseRoasters && supabaseRoasters.length > 0) {
        console.log('✅ RoastersListScreen: Raw roasters data:', supabaseRoasters.map(r => ({ 
          id: r.id, 
          name: r.full_name, 
          username: r.username,
          location: r.location 
        })));

        const mappedSupabaseRoasters = supabaseRoasters.map(roaster => ({
          id: roaster.id,
          name: roaster.full_name || roaster.username,
          type: 'roaster',
          description: roaster.bio || roaster.description,
          logo: roaster.avatar_url,
          avatar: roaster.avatar_url,
          coverImage: roaster.cover_url,
          location: roaster.location || 'Location not specified',
          isRoaster: true,
          rating: roaster.rating || 4.5,
          reviewCount: roaster.review_count || 0,
          source: 'supabase'
        }));

        console.log('🎯 RoastersListScreen: Mapped roasters:', mappedSupabaseRoasters.map(r => ({ 
          id: r.id, 
          name: r.name, 
          location: r.location 
        })));

        setRoasters(mappedSupabaseRoasters);
      } else {
        console.log('No roasters found in Supabase');
        setRoasters([]);
      }
    } catch (error) {
      console.error('Error loading roasters:', error);
      setRoasters([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoasters();
  }, []);

  // Get unique cities for filtering
  const availableCities = useMemo(() => {
    const cities = new Set(['All Cities']);
    roasters.forEach(roaster => {
      if (roaster.location) {
        // Extract city from location (handle "City, Country" format)
        const city = roaster.location.split(',')[0].trim();
        if (city && city !== 'Location not specified') {
          cities.add(city);
        }
      }
    });
    return Array.from(cities).sort();
  }, [roasters]);

  // Filter and sort roasters
  const filteredAndSortedRoasters = useMemo(() => {
    console.log('🔄 RoastersListScreen: Filtering roasters...', { 
      totalRoasters: roasters.length, 
      selectedCity,
      sortBy 
    });

    let filtered = roasters.filter(roaster => {
      // Filter by city
      const matchesCity = selectedCity === 'All Cities' || 
        (roaster.location && roaster.location.toLowerCase().includes(selectedCity.toLowerCase()));

      console.log(`🏙️ RoastersListScreen: City filter for ${roaster.name}:`, { 
        roasterLocation: roaster.location, 
        selectedCity, 
        matchesCity 
      });

      return matchesCity;
    });

    console.log('✅ RoastersListScreen: After city filtering:', filtered.map(r => ({ 
      name: r.name, 
      location: r.location 
    })));

    // Sort the filtered results
    filtered.sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'city') {
        const cityA = a.location ? a.location.split(',')[0].trim() : '';
        const cityB = b.location ? b.location.split(',')[0].trim() : '';
        const cityComparison = cityA.localeCompare(cityB);
        // If cities are the same, sort by name
        return cityComparison !== 0 ? cityComparison : a.name.localeCompare(b.name);
      }
      return 0;
    });

    console.log('🎯 RoastersListScreen: Final filtered and sorted roasters:', filtered.map(r => ({ 
      name: r.name, 
      location: r.location 
    })));

    return filtered;
  }, [roasters, selectedCity, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoasters();
  };

  const renderRoasterItem = ({ item }) => {
    const logoSource = item.avatar || item.logo;
    const coverSource = item.coverImage || item.imageUrl;

    return (
      <TouchableOpacity
        style={styles.roasterListItem}
        onPress={() => {
          console.log('🔗 RoastersListScreen: Navigating to roaster profile:', {
            userId: item.id,
            userName: item.name,
            userAvatar: logoSource,
            coverImage: coverSource,
            itemAvatar: item.avatar,
            itemLogo: item.logo,
            itemCoverImage: item.coverImage
          });
          navigation.navigate('UserProfileBridge', {
            userId: item.id,
            userName: item.name,
            userAvatar: logoSource,
            coverImage: coverSource,
            isBusinessAccount: true,
            isRoaster: true
                    });
        }}
      >
        <AppImage
          source={logoSource}
          style={[styles.roasterListLogo, { borderColor: theme.divider }]}
          resizeMode="cover"
          placeholder="business"
        />
        <View style={styles.roasterListContent}>
          <Text style={[styles.roasterListName, { color: theme.primaryText }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.location && (
            <View style={styles.roasterListLocationContainer}>
              <Ionicons name="location-outline" size={12} color={theme.secondaryText} />
              <Text style={[styles.roasterListLocation, { color: theme.secondaryText }]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          )}
          {item.description && (
            <Text
              style={[styles.roasterListDescription, { color: theme.secondaryText }]}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
        </View>
        <View style={styles.roasterListRight}>
          <View style={styles.roasterListRating}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={[styles.roasterListRatingText, { color: theme.primaryText }]}>
              {typeof item.rating === 'number' ? item.rating.toFixed(1) : '4.5'}
            </Text>
          </View>
        </View>
        <View style={[styles.roasterListBorder, { borderBottomColor: theme.divider }]} />
      </TouchableOpacity>
    );
  };

  // City selection sheet
  const renderCitySheet = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={citySheetVisible}
        onRequestClose={() => setCitySheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom, backgroundColor: isDarkMode ? theme.cardBackground : '#FFFFFF' }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: theme.divider }]}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCitySheetVisible(false)}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: theme.primaryText }]}>Select City</Text>
              <View style={{ width: 40 }}><Text></Text></View>
            </View>
            
            <ScrollView style={styles.citiesList} contentContainerStyle={styles.citiesListContent}>
              {/* All Cities option */}
              <TouchableOpacity 
                style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                onPress={() => {
                  setSelectedCity('All Cities');
                  setCitySheetVisible(false);
                }}
              >
                <View style={styles.cityItemLeftContent}>
                  <Ionicons name="earth" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                  <Text style={[
                    styles.cityItemText, 
                    { color: theme.primaryText },
                    selectedCity === 'All Cities' && styles.selectedCityText
                  ]}>
                    All Cities
                  </Text>
                </View>
                {selectedCity === 'All Cities' && (
                  <Ionicons name="checkmark" size={20} color={theme.tintColor} />
                )}
              </TouchableOpacity>
              
              {/* Cities from available roasters */}
              {availableCities.filter(city => city !== 'All Cities').map((city, index) => (
                <TouchableOpacity 
                  key={`city-${index}`}
                  style={[styles.cityItem, { borderBottomColor: theme.divider }]}
                  onPress={() => {
                    setSelectedCity(city);
                    setCitySheetVisible(false);
                  }}
                >
                  <View style={styles.cityItemLeftContent}>
                    <Ionicons name="location-outline" size={20} color={theme.primaryText} style={styles.cityItemIcon} />
                    <Text style={[
                      styles.cityItemText, 
                      { color: theme.primaryText },
                      selectedCity === city && styles.selectedCityText
                    ]}>
                      {city}
                    </Text>
                  </View>
                  {selectedCity === city && (
                    <Ionicons name="checkmark" size={20} color={theme.tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalCancelText, { color: theme.primaryText }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Filter & Sort</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={[styles.modalDoneText, { color: theme.tintColor }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* City Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.primaryText }]}>Filter by City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityFilterContainer}>
              {availableCities.map(city => (
                <TouchableOpacity
                  key={city}
                  style={[
                    styles.cityFilterChip,
                    { backgroundColor: isDarkMode ? theme.cardBackground : '#F2F2F7' },
                    selectedCity === city && [styles.activeCityFilterChip, { backgroundColor: theme.primaryText }]
                  ]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text 
                    style={[
                      styles.cityFilterText,
                      { color: theme.primaryText },
                      selectedCity === city && [styles.activeCityFilterText, { color: theme.background }]
                    ]}
                  >
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: theme.primaryText }]}>Sort by</Text>
            <TouchableOpacity
              style={[
                styles.sortOption,
                { backgroundColor: isDarkMode ? theme.cardBackground : '#FFFFFF', borderColor: theme.divider }
              ]}
              onPress={() => setSortBy('alphabetical')}
            >
              <Text style={[styles.sortOptionText, { color: theme.primaryText }]}>Alphabetical (A-Z)</Text>
              {sortBy === 'alphabetical' && (
                <Ionicons name="checkmark" size={20} color={theme.tintColor} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortOption,
                { backgroundColor: isDarkMode ? theme.cardBackground : '#FFFFFF', borderColor: theme.divider }
              ]}
              onPress={() => setSortBy('city')}
            >
              <Text style={[styles.sortOptionText, { color: theme.primaryText }]}>By City</Text>
              {sortBy === 'city' && (
                <Ionicons name="checkmark" size={20} color={theme.tintColor} />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Filter UI */}
      <View style={[styles.filterContainer, { backgroundColor: theme.background }]}>
        <View style={styles.filterRow}>
          <TouchableOpacity 
            style={[styles.citySelector, { backgroundColor: theme.cardBackground }]}
            onPress={() => setCitySheetVisible(true)}
          >
            <Ionicons name="location-outline" size={20} color={theme.primaryText} />
            <Text style={[styles.cityText, { color: theme.primaryText }]}>{selectedCity}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.primaryText} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sortButton, { backgroundColor: theme.cardBackground }]}
            onPress={() => setShowFilters(true)}
          >
            <Text style={[styles.sortText, { color: theme.primaryText }]}>
              {sortBy === 'alphabetical' ? 'A-Z' : 'By City'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={theme.primaryText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* City Selection Sheet */}
      {renderCitySheet()}

      {/* Active Filters Display */}
      {(selectedCity !== 'All Cities' || sortBy !== 'alphabetical') && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedCity !== 'All Cities' && (
              <View style={[styles.activeFilterChip, { backgroundColor: theme.tintColor }]}>
                <Text style={styles.activeFilterText}>{selectedCity}</Text>
                <TouchableOpacity onPress={() => setSelectedCity('All Cities')}>
                  <Ionicons name="close" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}
            {sortBy !== 'alphabetical' && (
              <View style={[styles.activeFilterChip, { backgroundColor: theme.tintColor }]}>
                <Text style={styles.activeFilterText}>
                  {sortBy === 'city' ? 'Sorted by City' : 'Alphabetical'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: theme.secondaryText }]}>
          {filteredAndSortedRoasters.length} roaster{filteredAndSortedRoasters.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Roasters List */}
      <FlatList
        data={filteredAndSortedRoasters}
        renderItem={renderRoasterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.roastersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primaryText}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe-outline" size={48} color={theme.secondaryText} />
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
              {selectedCity !== 'All Cities' 
                ? 'No roasters found matching your criteria' 
                : 'No roasters found'
              }
            </Text>
            {selectedCity !== 'All Cities' && (
              <TouchableOpacity 
                style={[styles.clearFiltersButton, { backgroundColor: theme.tintColor }]}
                onPress={() => {
                  setSelectedCity('All Cities');
                }}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  filterContainer: {
    paddingVertical: 12,
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
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 50,
  },
  sortText: {
    fontSize: 16,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    minHeight: '60%',
    maxHeight: '60%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  closeButton: {
    padding: 4,
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500'
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 4
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500'
  },
  roastersList: {
    paddingHorizontal: 16
  },
  roasterListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  roasterListLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
    borderWidth: 1
  },
  roasterListContent: {
    flex: 1,
    marginRight: 10,
  },
  roasterListName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  roasterListLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roasterListLocation: {
    fontSize: 13,
    marginLeft: 4,
  },
  roasterListDescription: {
    fontSize: 13,
    lineHeight: 18
  },
  roasterListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  roasterListRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roasterListRatingText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  roasterListBorder: {
    position: 'absolute',
    bottom: 0,
    left: 52, // Avatar width (40) + margin (12)
    right: 0,
    height: 1,
    borderBottomWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA'
  },
  modalCancelText: {
    fontSize: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600'
  },
  modalContent: {
    flex: 1,
    padding: 16
  },
  filterSection: {
    marginBottom: 24
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  cityFilterContainer: {
    flexDirection: 'row'
  },
  cityFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeCityFilterChip: {
    // Background color set dynamically
  },
  cityFilterText: {
    fontSize: 14,
    fontWeight: '500'
  },
  activeCityFilterText: {
    // Color set dynamically
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500'
  }
});

export default RoastersListScreen;