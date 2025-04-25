import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';

const CoffeeDiscoveryScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { filter, sortBy } = route.params || {};
  const [coffees, setCoffees] = useState([]);
  const [activeFilter, setActiveFilter] = useState(filter);
  const [activeFilters, setActiveFilters] = useState({});
  const [sortOrder, setSortOrder] = useState(sortBy || 'default');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  
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

  // Check if any filters are active
  const hasActiveFilters = Object.values(activeFilters).some(filters => filters.length > 0) || activeFilter;

  useEffect(() => {
    // Get all coffees from mockData
    let filteredCoffees = [...mockData.coffees];
    
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
              selectedOptions.some(option => 
                coffee.roastLevel && coffee.roastLevel.toLowerCase().includes(option.toLowerCase())
              )
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
          case 'tried':
            // This would normally use user data to filter by tried/not tried
            // For now, we'll just use a random condition as an example
            if (selectedOptions.includes('yes')) {
              filteredCoffees = filteredCoffees.filter(coffee => 
                parseInt(coffee.id.replace(/[^0-9]/g, '')) % 2 === 0
              );
            } else if (selectedOptions.includes('no')) {
              filteredCoffees = filteredCoffees.filter(coffee => 
                parseInt(coffee.id.replace(/[^0-9]/g, '')) % 2 !== 0
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
            <Ionicons 
              name="swap-vertical" 
              size={14} 
              color={sortOrder !== 'default' ? '#FFFFFF' : '#000000'} 
              style={styles.sortIcon}
            />
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
                {activeCount > 0 && ` (${activeCount})`}
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
              <Ionicons name="close-circle" size={18} color="#FFFFFF" style={styles.closeIcon} />
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
              <Ionicons name="close-circle" size={18} color="#FFFFFF" style={styles.closeIcon} />
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
                <Ionicons name="close" size={24} color="#000000" />
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
                    {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
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
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptionsContainer}>
              {sortOptions.map(option => {
                const isSelected = sortOrder === option.id;
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
                    <Text 
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.selectedModalOptionText
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderCoffeeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.coffeeCard}
      onPress={() => navigation.navigate('CoffeeDetail', { coffeeId: item.id })}
    >
      <Image 
        source={{ uri: item.image || item.images?.[0] }} 
        style={styles.coffeeImage}
        resizeMode="cover"
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
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {sortOrder === 'popularity' ? 'All Coffee' : (activeFilter ? `${activeFilter.label} Coffees` : 'All Coffees')}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={clearAllFilters}
          >
            <Text style={styles.clearFilterText}>Clear All</Text>
          </TouchableOpacity>
        )}
        {!hasActiveFilters && <View style={{ width: 60 }} />} {/* Spacer for balance when no "Clear All" */}
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  clearFilterButton: {
    padding: 8,
    width: 60,
  },
  clearFilterText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'right',
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
    paddingBottom: 16,
  },
  coffeeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  coffeeImage: {
    width: 100,
    height: 120,
  },
  coffeeContent: {
    flex: 1,
    padding: 12,
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