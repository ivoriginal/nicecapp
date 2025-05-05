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
import mockData from '../data/mockData.json';
import gearDetails from '../data/gearDetails';
import GearCard from '../components/GearCard';

const GearListScreen = ({ navigation, route }) => {
  const { category = 'all' } = route.params || {};
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
    brand: []
  });
  
  // Available filter options
  const filterOptions = {
    category: ['Grinder', 'Kettle', 'Pour Over', 'Scale', 'Brewer'],
    priceRange: ['Under $50', '$50-$100', '$100-$200', 'Over $200'],
    brand: ['Fellow', 'Hario', 'Baratza', 'Comandante', 'AeroPress', 'Acaia']
  };
  
  useEffect(() => {
    loadGear();
  }, [sortBy, filters]);
  
  const loadGear = () => {
    setLoading(true);
    
    // Get gear from mock data
    let gear = [...mockData.gear];
    
    // Enhance gear with usedBy data from gearDetails
    gear = gear.map(item => {
      const detailedItem = gearDetails[item.name];
      if (detailedItem) {
        console.log(`Enhanced gear for ${item.name} with usedBy data:`, detailedItem.usedBy);
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
          <Text style={styles.sortButtonText}>{getCurrentSortLabel()}</Text>
          <Ionicons name="chevron-down" size={16} color="#000000" />
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
  
  const renderActiveFilterChips = () => {
    // Flatten all active filters into a single array of { category, value } objects
    const activeFilters = Object.entries(filters).flatMap(([category, values]) => 
      values.map(value => ({ category, value }))
    );
    
    if (activeFilters.length === 0) return null;
    
    return (
      <View style={styles.activeFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.activeFiltersContent}
        >
          {activeFilters.map((filter, index) => (
            <TouchableOpacity
              key={`${filter.category}-${filter.value}-${index}`}
              style={styles.activeFilterChip}
              onPress={() => toggleFilter(filter.category, filter.value)}
            >
              <Text style={styles.activeFilterChipText}>{filter.value}</Text>
              <Ionicons name="close-circle" size={16} color="#666666" />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };
  
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
              <Ionicons name="close" size={24} color="#000000" />
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
                  <Ionicons name="checkmark" size={20} color="#000000" />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.filterOptionsList}
          />
          
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setFilters(prev => ({
                  ...prev,
                  [selectedCategory]: []
                }));
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
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
              <Ionicons name="close" size={24} color="#000000" />
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
              <Ionicons name="checkmark" size={20} color="#000000" />
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
              <Ionicons name="checkmark" size={20} color="#000000" />
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
              <Ionicons name="checkmark" size={20} color="#000000" />
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
              <Ionicons name="checkmark" size={20} color="#000000" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const renderGearItem = ({ item }) => {
    return (
      <GearCard
        item={item}
        isWishlist={item.isInWishlist || false}
        showAvatars={true}
        onPress={() => navigation.navigate('GearDetail', { gearName: item.name })}
        onWishlistToggle={() => {
          // Here you would handle the wishlist toggle
          console.log('Toggle wishlist for:', item.name);
        }}
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderFilterBar()}
      {renderActiveFilterChips()}
      
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
      />
      
      {renderFilterModal()}
      {renderSortModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  filterBarContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
  },
  filterBarContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 14,
    color: '#000000',
    marginRight: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#000000',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  activeFilterText: {
    color: '#FFFFFF',
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
  activeFiltersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterChipText: {
    fontSize: 12,
    color: '#000000',
    marginRight: 4,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    marginRight: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: '#007AFF',
  },
  gearList: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'flex-start',
  },
  gearCard: {
    flex: 0,
    width: '46%',
    margin: 8,
    height: 330,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  filterOptionsList: {
    paddingHorizontal: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  modalButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  applyButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default GearListScreen; 