import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';
import AppImage from '../components/common/AppImage';

const CoffeeDiscoveryScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { filter = null, sortBy = 'default' } = (route && route.params) || {};
  const [coffees, setCoffees] = useState([]);
  const [activeFilter, setActiveFilter] = useState(filter);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortOrder, setSortOrder] = useState(sortBy);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sellersList, setSellersList] = useState([]);
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(filters => filters.length > 0) || activeFilter;

  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: sortOrder === 'popularity' ? 'All Coffee' : (activeFilter ? `${activeFilter.label} Coffees` : 'All Coffee'),
      headerBackTitle: 'Back',
      headerRight: () => hasActiveFilters ? (
        <TouchableOpacity 
          style={{ marginRight: 16 }}
          onPress={clearAllFilters}
        >
          <Text style={{ color: '#007AFF', fontSize: 16 }}>Clear All</Text>
        </TouchableOpacity>
      ) : null
    });
  }, [navigation, sortOrder, activeFilter, hasActiveFilters]);

  // Available filter options
  const filterCategories = [
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
      id: 'region',
      label: 'Region',
      options: [
        { id: 'ethiopia', label: 'Ethiopia' },
        { id: 'colombia', label: 'Colombia' },
        { id: 'guatemala', label: 'Guatemala' },
        { id: 'brazil', label: 'Brazil' },
        { id: 'kenya', label: 'Kenya' },
        { id: 'costa_rica', label: 'Costa Rica' }
      ]
    },
    {
      id: 'process',
      label: 'Process',
      options: [
        { id: 'washed', label: 'Washed' },
        { id: 'natural', label: 'Natural' },
        { id: 'honey', label: 'Honey' },
        { id: 'anaerobic', label: 'Anaerobic' }
      ]
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
      options: []
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

  useEffect(() => {
    // Get all coffees from mockData
    let filteredCoffees = [...mockData.coffees];
    
    // Collect all sellers to build the filter options
    const allSellers = new Set();
    const coffeeSellerMap = {};
    
    // Process sellers data
    Object.entries(mockData.sellers || {}).forEach(([coffeeId, sellers]) => {
      coffeeSellerMap[coffeeId] = sellers;
      sellers.forEach(seller => {
        if (!allSellers.has(seller.id)) {
          allSellers.add(seller.id);
        }
      });
    });
    
    // Update the available sellers in the filter options
    const sellerOptions = Array.from(allSellers).map(sellerId => {
      const sellerInfo = Object.values(mockData.sellers).flat()
        .find(seller => seller.id === sellerId);
      return {
        id: sellerId,
        label: sellerInfo ? sellerInfo.name : sellerId
      };
    });
    
    // Sort sellers alphabetically
    sellerOptions.sort((a, b) => a.label.localeCompare(b.label));
    
    // Update the sellers filter options
    const availableInFilterIndex = filterCategories.findIndex(cat => cat.id === 'availableIn');
    if (availableInFilterIndex !== -1) {
      filterCategories[availableInFilterIndex].options = sellerOptions;
    }
    
    setSellersList(sellerOptions);
    
    // Apply initial filter if present
    if (activeFilter) {
      if (activeFilter.type === 'origin') {
        filteredCoffees = filteredCoffees.filter(coffee => 
          coffee.origin && coffee.origin.toLowerCase().includes(activeFilter.label.toLowerCase())
        );
      } else if (activeFilter.type === 'roast') {
        const roastLevel = activeFilter.label.split(' ')[0].toLowerCase();
        filteredCoffees = filteredCoffees.filter(coffee => 
          coffee.roastLevel && coffee.roastLevel.toLowerCase().includes(roastLevel)
        );
      } else if (activeFilter.type === 'notes') {
        const note = activeFilter.label.split(' ')[0].toLowerCase();
        filteredCoffees = filteredCoffees.filter(coffee => 
          (coffee.profile && coffee.profile.toLowerCase().includes(note)) ||
          (coffee.description && coffee.description.toLowerCase().includes(note))
        );
      }
    }
    
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
          case 'region':
            filteredCoffees = filteredCoffees.filter(coffee => 
              selectedOptions.some(option => 
                (coffee.origin && coffee.origin.toLowerCase().includes(option.toLowerCase())) ||
                (coffee.region && coffee.region.toLowerCase().includes(option.toLowerCase()))
              )
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
              // Check if this coffee is sold by any of the selected sellers
              const coffeeSellers = mockData.sellers[coffee.id] || [];
              return selectedOptions.some(option => 
                coffeeSellers.some(seller => seller.id === option)
              );
            });
            break;
          case 'tried':
            // Check if the coffee is in the user's collection
            // For this example, we'll use coffee events to determine if coffee has been tried
            // In a real app, this would use a proper user collection database
            if (selectedOptions.includes('yes')) {
              const triedCoffeeIds = mockData.coffeeEvents
                .filter(event => event.userId === 'currentUser' || 
                                 event.type === 'added_to_collection')
                .map(event => event.coffeeId);
              filteredCoffees = filteredCoffees.filter(coffee => 
                triedCoffeeIds.includes(coffee.id)
              );
            } else if (selectedOptions.includes('no')) {
              const triedCoffeeIds = mockData.coffeeEvents
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
    
    setCoffees(filteredCoffees);
  }, [activeFilter, activeFilters, sortOrder]);

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
    setActiveFilter(null);
    setActiveFilters({});
    setSortOrder('default');
  };

  const renderFilterBar = () => {
    return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBarContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterBarItem,
            sortOrder !== 'default' && styles.activeFilterBarItem
          ]}
          onPress={() => setSortModalVisible(true)}
        >
          <View style={styles.sortChipContent}>
            <Text>
              <Ionicons 
                name="swap-vertical" 
                size={14} 
                color={sortOrder !== 'default' ? '#FFFFFF' : '#000000'} 
                style={styles.sortIcon}
              />
            </Text>
            <Text 
              style={[
                styles.filterBarItemText,
                sortOrder !== 'default' && styles.activeFilterBarItemText
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
                activeCount > 0 && styles.activeFilterBarItem
              ]}
              onPress={() => openFilterModal(category)}
            >
              <Text 
                style={[
                  styles.filterBarItemText,
                  activeCount > 0 && styles.activeFilterBarItemText
                ]}
              >
                {category.label}
                {activeCount > 0 ? ` (${activeCount})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderActiveFilterChips = () => {
    // Flatten all selected filters into a single array of {categoryId, optionId, label} objects
    const allSelectedFilters = Object.entries(activeFilters).reduce((acc, [categoryId, options]) => {
      if (options.length === 0) return acc;
      
      const category = filterCategories.find(cat => cat.id === categoryId);
      const selectedOptions = options.map(optionId => {
        const option = category.options.find(opt => opt.id === optionId);
        return {
          categoryId,
          optionId,
          label: `${category.label}: ${option.label}`
        };
      });
      
      return [...acc, ...selectedOptions];
    }, []);

    // Add sort chip if not default
    const activeChips = [...allSelectedFilters];
    if (sortOrder !== 'default') {
      activeChips.unshift({
        categoryId: 'sort',
        optionId: sortOrder,
        label: `Sort: ${getCurrentSortLabel()}`
      });
    }

    if (activeChips.length === 0 && !activeFilter) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <View style={styles.chipContainer}>
          {activeFilter && (
            <TouchableOpacity
              style={styles.activeFilterChip}
              onPress={() => setActiveFilter(null)}
            >
              <Text style={styles.activeFilterChipText}>{activeFilter.label}</Text>
              <Text>
                <Ionicons name="close-circle" size={18} color="#FFFFFF" style={styles.closeIcon} />
              </Text>
            </TouchableOpacity>
          )}
          
          {activeChips.map((filter) => (
            <TouchableOpacity
              key={`${filter.categoryId}-${filter.optionId}`}
              style={styles.activeFilterChip}
              onPress={() => {
                if (filter.categoryId === 'sort') {
                  setSortOrder('default');
                } else {
                  toggleFilter(filter.categoryId, filter.optionId);
                }
              }}
            >
              <Text style={styles.activeFilterChipText}>{filter.label}</Text>
              <Text>
                <Ionicons name="close-circle" size={18} color="#FFFFFF" style={styles.closeIcon} />
              </Text>
            </TouchableOpacity>
          ))}
        </View>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCategory.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>
                  <Ionicons name="close" size={24} color="#000000" />
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
                      isSelected && styles.selectedModalOption
                    ]}
                    onPress={() => toggleFilter(selectedCategory.id, option.id)}
                  >
                    <Text 
                      style={[
                        styles.modalOptionText,
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

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Apply</Text>
              </TouchableOpacity>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Text>
                  <Ionicons name="close" size={24} color="#000000" />
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
                      isSelected && styles.selectedModalOption
                    ]}
                    onPress={() => {
                      setSortOrder(option.id);
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
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

  const renderCoffeeItem = ({ item }) => {
    // Get sellers for this coffee
    let sellers = mockData.sellers[item.id] || [];
    
    // If no sellers are specified but coffee has a roasterId, 
    // add the roaster as a seller
    if (sellers.length === 0 && item.roasterId) {
      // Find the roaster in existing sellers to get their data
      const roasterInfo = Object.values(mockData.sellers || {})
        .flat()
        .find(seller => seller.id === item.roasterId);
        
      if (roasterInfo) {
        sellers = [roasterInfo];
      } else {
        // Create basic seller info from the roaster data
        sellers = [{
          id: item.roasterId,
          name: item.roaster,
          avatar: item.image, // Use coffee image as fallback
          location: "",
          isRoaster: true,
          businessAccount: true
        }];
      }
    }
    
    return (
      <View style={styles.coffeeCardContainer}>
        <TouchableOpacity 
          style={styles.coffeeCard}
          onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
        >
          <AppImage 
            source={item.image || item.images?.[0]} 
            style={styles.coffeeImage}
            placeholder="coffee"
          />
          <View style={styles.coffeeContent}>
            <Text style={styles.coffeeName}>{item.name}</Text>
            <Text style={styles.coffeeRoaster}>{item.roaster}</Text>
            <View style={styles.coffeeDetailsRow}>
              <Text style={styles.coffeeOrigin}>{item.origin}</Text>
              <Text style={styles.coffeePrice}>${item.price.toFixed(2)}</Text>
            </View>
            {item.process && <Text style={styles.coffeeProcess}>{item.process}</Text>}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={coffees}
        renderItem={renderCoffeeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.coffeeList}
        ListHeaderComponent={
          <>
            {renderFilterBar()}
            {renderActiveFilterChips()}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No coffees found</Text>
          </View>
        }
      />
      
      {renderFilterModal()}
      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeFilterBarItem: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterBarItemText: {
    fontSize: 14,
    color: '#000000',
  },
  activeFilterBarItemText: {
    color: '#FFFFFF',
  },
  sortChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortIcon: {
    marginRight: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  activeFiltersContainer: {
    paddingBottom: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E5EA',
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
    borderBottomColor: '#E5E5EA',
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
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  modalButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 120,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  coffeeList: {
    paddingBottom: 32,
  },
  coffeeCardContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  coffeeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  coffeeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
    alignSelf: 'center',
    marginRight: 12,
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
    color: '#666666',
    marginBottom: 8,
  },
  coffeeDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  coffeeOrigin: {
    fontSize: 14,
    color: '#666666',
  },
  coffeePrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  coffeeProcess: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 4,
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
});

export default CoffeeDiscoveryScreen; 