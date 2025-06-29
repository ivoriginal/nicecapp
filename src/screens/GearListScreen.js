import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Modal,
  Pressable,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import GearCard from '../components/GearCard';
import AppImage from '../components/common/AppImage';

const GearListScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);
  const { category = 'all', preselectedBrand } = route.params || {};
  const [gearList, setGearList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Filters state
  const [filters, setFilters] = useState({
    category: category !== 'all' ? [category] : [],
    priceRange: [],
    brand: preselectedBrand ? [preselectedBrand] : []
  });
  
  // Available filter options
  const filterOptions = {
    category: ['Grinder', 'Kettle', 'Pour Over', 'Scale', 'Brewer'],
    priceRange: ['Under $50', '$50-$100', '$100-$200', 'Over $200'],
    brand: ['Fellow', 'Hario', 'Baratza', 'Comandante', 'Aerobie', 'Acaia', 'Chemex']
  };
  
  const insets = useSafeAreaInsets();
  
  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some(filterArray => filterArray.length > 0);
  };
  
  // Set up navigation header with Clear All button
  useEffect(() => {
    navigation.setOptions({
      title: 'Gear',
      headerRight: () => 
        hasActiveFilters() ? (
          <TouchableOpacity 
            onPress={clearAllFilters}
            style={styles.headerClearButton}
          >
            <Text style={styles.headerClearText}>Clear filters</Text>
          </TouchableOpacity>
        ) : null
    });
  }, [filters, navigation]);
  
  useEffect(() => {
    loadGear();
  }, [sortBy, filters]);
  
  const loadGear = () => {
    setLoading(true);
    
    // Get gear from mock data
    let gear = [...mockGear.gear];
    
    // Enhance gear with usedBy data from gearDetails
    gear = gear.map(item => {
      const detailedItem = gearDetails[item.name];
      if (detailedItem) {
        // More detailed debug info
        console.log(`Enhanced gear for ${item.name}:`, {
          hasUsedBy: !!detailedItem.usedBy,
          usedByCount: detailedItem.usedBy ? detailedItem.usedBy.length : 0,
          usedBySample: detailedItem.usedBy ? detailedItem.usedBy.slice(0, 1) : []
        });
        
        return {
          ...item,
          ...detailedItem,
          // Ensure we keep the original image if detailed item doesn't have one
          imageUrl: detailedItem.image || item.imageUrl,
          usedBy: detailedItem.usedBy || []
        };
      }
      return {
        ...item,
        usedBy: []
      };
    });
    
    // Apply filters
    if (filters.category.length > 0) {
      gear = gear.filter(item => filters.category.includes(item.type));
    }
    
    if (filters.brand.length > 0) {
      gear = gear.filter(item => filters.brand.includes(item.brand));
    }
    
    if (filters.priceRange.length > 0) {
      gear = gear.filter(item => {
        return filters.priceRange.some(range => {
          if (range === 'Under $50' && item.price < 50) return true;
          if (range === '$50-$100' && item.price >= 50 && item.price < 100) return true;
          if (range === '$100-$200' && item.price >= 100 && item.price < 200) return true;
          if (range === 'Over $200' && item.price >= 200) return true;
          return false;
        });
      });
    }
    
    // Sort gear
    if (sortBy === 'price-low') {
      gear.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      gear.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      gear.sort((a, b) => b.rating - a.rating);
    } else {
      // Default sort by popularity (review count as a proxy for popularity)
      gear.sort((a, b) => b.reviewCount - a.reviewCount);
    }
    
    setGearList(gear);
    setLoading(false);
  };
  
  const getCurrentSortLabel = () => {
    switch (sortBy) {
      case 'popularity':
        return 'Most Popular';
      case 'price-low':
        return 'Price: Low to High';
      case 'price-high':
        return 'Price: High to Low';
      case 'rating':
        return 'Highest Rated';
      default:
        return 'Sort';
    }
  };
  
  const openFilterModal = (category) => {
    setSelectedCategory(category);
    setFilterModalVisible(true);
  };
  
  const toggleFilter = (category, option) => {
    setFilters(prevFilters => {
      const currentFilters = [...prevFilters[category]];
      const optionIndex = currentFilters.indexOf(option);
      
      if (optionIndex > -1) {
        currentFilters.splice(optionIndex, 1);
      } else {
        currentFilters.push(option);
      }
      
      return {
        ...prevFilters,
        [category]: currentFilters
      };
    });
  };
  
  const clearAllFilters = () => {
    setFilters({
      category: [],
      priceRange: [],
      brand: []
    });
  };
  
  const renderFilterBar = () => (
    <View style={styles.filterBarContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBarContent}
      >
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortModalVisible(true)}
        >
          <Ionicons name="swap-vertical" size={16} color={theme.primaryText} />
          <Text style={styles.sortButtonText}>{getCurrentSortLabel()}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.primaryText} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.category.length > 0 && styles.activeFilterButton
          ]}
          onPress={() => openFilterModal('category')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filters.category.length > 0 && styles.activeFilterText
            ]}
          >
            Type
          </Text>
          {filters.category.length > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{filters.category.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.brand.length > 0 && styles.activeFilterButton
          ]}
          onPress={() => openFilterModal('brand')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filters.brand.length > 0 && styles.activeFilterText
            ]}
          >
            Brand
          </Text>
          {filters.brand.length > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{filters.brand.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            filters.priceRange.length > 0 && styles.activeFilterButton
          ]}
          onPress={() => openFilterModal('priceRange')}
        >
          <Text 
            style={[
              styles.filterButtonText,
              filters.priceRange.length > 0 && styles.activeFilterText
            ]}
          >
            Price
          </Text>
          {filters.priceRange.length > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{filters.priceRange.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
  
  const renderFilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedCategory === 'category' 
                ? 'Filter by Type' 
                : selectedCategory === 'priceRange'
                  ? 'Filter by Price'
                  : 'Filter by Brand'}
            </Text>
            <TouchableOpacity
              onPress={() => setFilterModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filterOptions[selectedCategory] || []}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => toggleFilter(selectedCategory, item)}
              >
                <Text style={styles.filterOptionText}>{item}</Text>
                {filters[selectedCategory]?.includes(item) && (
                  <Ionicons name="checkmark" size={20} color={theme.primaryText} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterOptionsList}
          />
        </View>
      </View>
    </Modal>
  );
  
  const renderSortModal = () => (
    <Modal
      visible={sortModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setSortModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity
              onPress={() => setSortModalVisible(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSortBy('popularity');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Most Popular</Text>
            {sortBy === 'popularity' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSortBy('price-low');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Price: Low to High</Text>
            {sortBy === 'price-low' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSortBy('price-high');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Price: High to Low</Text>
            {sortBy === 'price-high' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSortBy('rating');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>Highest Rated</Text>
            {sortBy === 'rating' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const renderGearItem = ({ item }) => {
    // Debug log to check if usedBy data is available
    console.log(`Rendering gear ${item.name}, usedBy:`, item.usedBy ? item.usedBy.length : 0);
    
    return (
      <View style={styles.gearCardWrapper}>
        <GearCard
          item={item}
          isWishlist={item.isInWishlist || false}
          showAvatars={true}
          onPress={() => navigation.navigate('GearDetail', { gearName: item.name })}
          onUserPress={(userId) => {
            console.log('Navigate to user profile:', userId);
            // Here you would navigate to user profile
            // navigation.navigate('UserProfile', { userId });
          }}
        />
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderFilterBar()}
      
      <FlatList
        data={gearList}
        renderItem={renderGearItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gearList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {loading ? 'Loading gear...' : 'No gear found with these filters.'}
            </Text>
          </View>
        }
        style={styles.flatList}
      />
      
      {renderFilterModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
};

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  filterBarContainer: {
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5EA',
    paddingVertical: 16,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: theme.primaryText,
    marginLeft: 4,
    marginRight: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: theme.primaryText,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.primaryText,
  },
  activeFilterText: {
    color: theme.background,
  },
  filterCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  filterCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gearList: {
    paddingHorizontal: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gearCardWrapper: {
    flex: 1,
    maxWidth: '48%',
  },
  gearImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F2F2F7',
  },
  gearContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  gearName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  gearType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  gearMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  gearReviews: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 4,
  },
  gearReviewCount: {
    fontSize: 12,
    color: '#666666',
  },
  gearPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  gearUsers: {
    flexDirection: 'column',
    marginTop: 8,
  },
  gearUsersText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  gearAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearUserAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreUsersCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreUsersText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.cardBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  filterOptionsList: {
    paddingHorizontal: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0,
    // borderBottomColor: '#E5E5EA',
  },
  filterOptionText: {
    fontSize: 16,
    color: theme.primaryText,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: theme.divider,
  },
  sortOptionText: {
    fontSize: 16,
    color: theme.primaryText,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: 'center',
  },
  flatList: {
    flex: 1,
  },
  headerClearButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: '100%',
  },
  headerClearText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default GearListScreen; 