import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SectionList,
  TouchableOpacity, 
  Image, 
  SafeAreaView,
  Modal,
  Pressable,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

import GearCard from '../components/GearCard';
import AppImage from '../components/common/AppImage';

const GearListScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);
  const { category = 'all', preselectedBrand } = route.params || {};
  const [gearList, setGearList] = useState([]);
  const [gearSections, setGearSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('popularity');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAddGearModal, setShowAddGearModal] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    category: category !== 'all' ? [category] : [],
    priceRange: [],
    brand: preselectedBrand ? [preselectedBrand] : []
  });
  
  // Available filter options - all will be populated dynamically
  const [filterOptions, setFilterOptions] = useState({
    category: [],
    priceRange: ['Under €50', '€50-€100', '€100-€200', 'Over €200'], // Keep price ranges static
    brand: []
  });
  
  const insets = useSafeAreaInsets();
  
  // Helper function to check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some(filterArray => filterArray.length > 0);
  };
  
  // Helper function to create alphabetical sections
  const createAlphabeticalSections = (gear) => {
    const sections = {};
    
    gear.forEach(item => {
      const firstChar = item.name.charAt(0).toUpperCase();
      // Group numbers under "#"
      const sectionKey = /[0-9]/.test(firstChar) ? '#' : firstChar;
      
      if (!sections[sectionKey]) {
        sections[sectionKey] = [];
      }
      sections[sectionKey].push(item);
    });
    
    // Create a flat array with section headers and paired items
    const flatData = [];
    const sortedKeys = Object.keys(sections).sort((a, b) => {
      // Put "#" at the beginning, then alphabetical
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    });
    
    sortedKeys.forEach(letter => {
      // Only add section header if there are items in this section
      if (sections[letter].length > 0) {
        // Add section header
        flatData.push({
          id: `header-${letter}`,
          type: 'header',
          title: letter
        });
        
        // Group items in pairs for 2-column layout
        const sectionItems = sections[letter];
        for (let i = 0; i < sectionItems.length; i += 2) {
          const leftItem = sectionItems[i];
          const rightItem = sectionItems[i + 1] || null;
          
          flatData.push({
            id: `row-${letter}-${i}`,
            type: 'row',
            leftItem: { ...leftItem, type: 'item', sectionTitle: letter },
            rightItem: rightItem ? { ...rightItem, type: 'item', sectionTitle: letter } : null
          });
        }
      }
    });
    
    return flatData;
  };
  
  // Helper function to create brand sections
  const createBrandSections = (gear) => {
    const sections = {};
    
    gear.forEach(item => {
      const brand = item.brand || 'Other';
      if (!sections[brand]) {
        sections[brand] = [];
      }
      sections[brand].push(item);
    });
    
    // Create a flat array with section headers and paired items
    const flatData = [];
    const sortedKeys = Object.keys(sections).sort();
    
    sortedKeys.forEach(brand => {
      // Only add section header if there are items in this section
      if (sections[brand].length > 0) {
        // Add section header
        flatData.push({
          id: `header-${brand}`,
          type: 'header',
          title: brand
        });
        
        // Group items in pairs for 2-column layout
        const sectionItems = sections[brand];
        for (let i = 0; i < sectionItems.length; i += 2) {
          const leftItem = sectionItems[i];
          const rightItem = sectionItems[i + 1] || null;
          
          flatData.push({
            id: `row-${brand}-${i}`,
            type: 'row',
            leftItem: { ...leftItem, type: 'item', sectionTitle: brand },
            rightItem: rightItem ? { ...rightItem, type: 'item', sectionTitle: brand } : null
          });
        }
      }
    });
    
    return flatData;
  };

  // Helper function to create category sections
  const createCategorySections = (gear) => {
          console.log('Creating category sections for gear:', gear.length, 'items');
    const sections = {};
    
    gear.forEach(item => {
      const category = item.category || 'Other';
      console.log(`Item ${item.name} has category: "${category}"`);
      if (!sections[category]) {
        sections[category] = [];
      }
      sections[category].push(item);
    });
    
    console.log('Category sections created:', Object.keys(sections));
    
    // Create a flat array with section headers and paired items
    const flatData = [];
    const sortedKeys = Object.keys(sections).sort();
    
    sortedKeys.forEach(category => {
      // Only add section header if there are items in this category
      if (sections[category].length > 0) {
        console.log(`Adding section header for category: ${category} with ${sections[category].length} items`);
        // Add section header
        flatData.push({
          id: `header-${category}`,
          type: 'header',
          title: category
        });
        
        // Group items in pairs for 2-column layout
        const sectionItems = sections[category];
        for (let i = 0; i < sectionItems.length; i += 2) {
          const leftItem = sectionItems[i];
          const rightItem = sectionItems[i + 1] || null;
          
          flatData.push({
            id: `row-${category}-${i}`,
            type: 'row',
            leftItem: { ...leftItem, type: 'item', sectionTitle: category },
            rightItem: rightItem ? { ...rightItem, type: 'item', sectionTitle: category } : null
          });
        }
      }
    });
    
    console.log('Category sections flat data created:', flatData.length, 'items');
    return flatData;
  };
  
  // Set up navigation header with Add button
  useEffect(() => {
    navigation.setOptions({
      title: 'Gear',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => setShowAddGearModal(true)}
          style={styles.headerAddButton}
        >
          <Ionicons name="add" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      )
    });
  }, [navigation, theme.primaryText]);
  
  useEffect(() => {
    console.log('useEffect triggered with sortBy:', sortBy, 'filters:', filters);
    const fetchGear = async () => {
      await loadGear();
    };
    fetchGear();
  }, [sortBy, filters]);
  
  const loadGear = async () => {
    setLoading(true);
    
    // Get gear from Supabase
    let transformedGear = [];
    try {
      const { data: gear, error } = await supabase
        .from('gear')
        .select('*');

      if (error) {
        console.error('Error fetching gear:', error);
        setGearList([]);
        return;
      }

      // Extract unique brands and categories for filter options
      const uniqueBrands = [...new Set(gear.map(item => item.brand).filter(Boolean))].sort();
      const uniqueCategories = [...new Set(gear.map(item => item.category).filter(Boolean))].sort();
      
      console.log('Raw gear data sample:', gear.slice(0, 3));
      console.log('Unique brands found:', uniqueBrands);
      console.log('Unique categories found:', uniqueCategories);
      
      setFilterOptions(prev => ({
        ...prev,
        brand: uniqueBrands,
        category: uniqueCategories
      }));

      // Transform the data to match our expected format
      transformedGear = gear.map(item => {
        // Add mock usedBy data based on gear type/name for demonstration
        let usedBy = [];
        const gearName = item.name?.toLowerCase() || '';
        
        // Add relevant users based on gear type
        if (gearName.includes('v60') || gearName.includes('pour') || gearName.includes('dripper')) {
          usedBy = [
            { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
            { id: 'user3', name: 'Carlos Hernández', avatar: 'assets/users/carlos-hernandez.jpg' },
            { id: 'user11', name: 'Elias Veris', avatar: 'assets/users/elias-veris.jpg' }
          ];
        } else if (gearName.includes('aeropress') || gearName.includes('brewer')) {
          usedBy = [
            { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
            { id: 'user11', name: 'Elias Veris', avatar: 'assets/users/elias-veris.jpg' }
          ];
        } else if (gearName.includes('grinder') || gearName.includes('encore') || gearName.includes('comandante')) {
          usedBy = [
            { id: 'user3', name: 'Carlos Hernández', avatar: 'assets/users/carlos-hernandez.jpg' },
            { id: 'user11', name: 'Elias Veris', avatar: 'assets/users/elias-veris.jpg' }
          ];
        } else if (gearName.includes('kettle') || gearName.includes('stagg')) {
          usedBy = [
            { id: 'user11', name: 'Elias Veris', avatar: 'assets/users/elias-veris.jpg' },
            { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
            { id: 'user3', name: 'Carlos Hernández', avatar: 'assets/users/carlos-hernandez.jpg' }
          ];
        } else {
          // Default users for other gear
          usedBy = [
            { id: 'user1', name: 'Ivo Vilches', avatar: 'assets/users/ivo-vilches.jpg' },
            { id: 'user11', name: 'Elias Veris', avatar: 'assets/users/elias-veris.jpg' }
          ];
        }
        
        return {
          ...item,
          type: 'gear',
          imageUrl: item.image_url || 'https://images.unsplash.com/photo-1510017803434-a899398421b3?q=80&w=2940&auto=format&fit=crop', // Use the original image_url field with fallback
          usedBy: usedBy
        };
      });
    } catch (error) {
      console.error('Error loading gear:', error);
      setGearList([]);
      return;
    }
    
    // Apply filters FIRST, before sorting and creating sections
    let filteredGear = transformedGear;
    
    if (filters.category.length > 0) {
      filteredGear = filteredGear.filter(item => filters.category.includes(item.category));
    }
    
    if (filters.brand.length > 0) {
      filteredGear = filteredGear.filter(item => 
        filters.brand.some(filterBrand => 
          filterBrand.toLowerCase() === (item.brand || '').toLowerCase()
        )
      );
    }
    
    if (filters.priceRange.length > 0) {
      filteredGear = filteredGear.filter(item => {
        return filters.priceRange.some(range => {
          if (range === 'Under €50' && item.price < 50) return true;
          if (range === '€50-€100' && item.price >= 50 && item.price < 100) return true;
          if (range === '€100-€200' && item.price >= 100 && item.price < 200) return true;
          if (range === 'Over €200' && item.price >= 200) return true;
          return false;
        });
      });
    }
    
    // Sort gear and create sections if needed (using filtered data)
    if (sortBy === 'price-low') {
      filteredGear.sort((a, b) => a.price - b.price);
      setGearList(filteredGear);
      setGearSections([]);
    } else if (sortBy === 'price-high') {
      filteredGear.sort((a, b) => b.price - a.price);
      setGearList(filteredGear);
      setGearSections([]);
    } else if (sortBy === 'rating') {
      filteredGear.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      setGearList(filteredGear);
      setGearSections([]);
    } else if (sortBy === 'alphabetical') {
      filteredGear.sort((a, b) => a.name.localeCompare(b.name));
      // Create alphabetical sections from filtered data
      const flatData = createAlphabeticalSections(filteredGear);
      setGearList(flatData);
      setGearSections([]);
    } else if (sortBy === 'brand') {
      filteredGear.sort((a, b) => {
        // First sort by brand, then by name within the same brand
        if (a.brand === b.brand) {
          return a.name.localeCompare(b.name);
        }
        return a.brand.localeCompare(b.brand);
      });
      // Create brand sections from filtered data
      const flatData = createBrandSections(filteredGear);
      setGearList(flatData);
      setGearSections([]);
    } else if (sortBy === 'type') {
      console.log('Sorting by category with', filteredGear.length, 'items');
      filteredGear.sort((a, b) => a.category.localeCompare(b.category));
      // Create category sections from filtered data
      const flatData = createCategorySections(filteredGear);
      console.log('Setting gear list with category sections:', flatData.length, 'items');
      setGearList(flatData);
      setGearSections([]);
    } else {
      // Default sort by popularity (review count as a proxy for popularity)
      filteredGear.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      setGearList(filteredGear);
      setGearSections([]);
    }
    
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
      case 'alphabetical':
        return 'A to Z';
      case 'brand':
        return 'By Brand';
      case 'type':
        return 'By Category';
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
  
  // Handle add gear modal options
  const handleAddGearOption = async (option) => {
    console.log('handleAddGearOption called with option:', option);
    setShowAddGearModal(false);
    
    try {
      switch (option) {
        case 'manual':
          navigation.navigate('AddGearManually');
          break;
        case 'url':
          handleURLInput();
          break;
        case 'camera':
          // TODO: Implement camera functionality for gear
          Alert.alert('Coming Soon', 'Camera functionality for gear will be available soon.');
          break;
        case 'gallery':
          // TODO: Implement gallery functionality for gear
          Alert.alert('Coming Soon', 'Gallery functionality for gear will be available soon.');
          break;
      }
    } catch (error) {
      console.error('Error in handleAddGearOption:', error);
    }
  };

  // Handle URL input with alert
  const handleURLInput = () => {
    Alert.prompt(
      'Enter Gear URL',
      'Paste the URL of a gear product page to extract details automatically',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Parse URL',
          onPress: (url) => {
            if (url && url.trim()) {
              // TODO: Navigate to AddGearFromURL screen when implemented
              Alert.alert('Coming Soon', 'URL parsing for gear will be available soon.');
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
            Category
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
                ? 'Filter by Category' 
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
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSortBy('alphabetical');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>A to Z</Text>
            {sortBy === 'alphabetical' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              setSortBy('brand');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>By Brand</Text>
            {sortBy === 'brand' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sortOption}
            onPress={() => {
              console.log('Setting sortBy to "type" (category)');
              setSortBy('type');
              setSortModalVisible(false);
            }}
          >
            <Text style={styles.sortOptionText}>By Category</Text>
            {sortBy === 'type' && (
              <Ionicons name="checkmark" size={20} color={theme.primaryText} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  const renderAddGearModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAddGearModal}
      onRequestClose={() => setShowAddGearModal(false)}
    >
      <View style={styles.addGearModalContainer}>
        <View style={[
          styles.addGearModalContent,
          { 
            paddingBottom: insets.bottom
          }
        ]}>
          <View style={[styles.addGearModalHeader, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.addGearModalTitle, { color: theme.primaryText }]}>Add Gear</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddGearModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.addGearOptionsContainer}>
            <TouchableOpacity
              style={styles.addGearOption}
              onPress={() => handleAddGearOption('manual')}
            >
              <Ionicons name="create-outline" size={24} color={theme.primaryText} />
              <View style={styles.addGearOptionTextContainer}>
                <Text style={[styles.addGearOptionTitle, { color: theme.primaryText }]}>Enter Manually</Text>
                <Text style={[styles.addGearOptionSubtitle, { color: theme.secondaryText }]}>Fill out gear details by hand</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addGearOption}
              onPress={() => handleAddGearOption('url')}
            >
              <Ionicons name="link-outline" size={24} color={theme.primaryText} />
              <View style={styles.addGearOptionTextContainer}>
                <Text style={[styles.addGearOptionTitle, { color: theme.primaryText }]}>Paste URL</Text>
                <Text style={[styles.addGearOptionSubtitle, { color: theme.secondaryText }]}>Add gear from a website URL</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addGearOption}
              onPress={() => handleAddGearOption('camera')}
            >
              <Ionicons name="camera-outline" size={24} color={theme.primaryText} />
              <View style={styles.addGearOptionTextContainer}>
                <Text style={[styles.addGearOptionTitle, { color: theme.primaryText }]}>Take Picture</Text>
                <Text style={[styles.addGearOptionSubtitle, { color: theme.secondaryText }]}>Scan gear with camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addGearOption}
              onPress={() => handleAddGearOption('gallery')}
            >
              <Ionicons name="image-outline" size={24} color={theme.primaryText} />
              <View style={styles.addGearOptionTextContainer}>
                <Text style={[styles.addGearOptionTitle, { color: theme.primaryText }]}>Select Picture</Text>
                <Text style={[styles.addGearOptionSubtitle, { color: theme.secondaryText }]}>Choose from photo library</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  
  const renderGearItem = ({ item, index }) => {
    // Debug logging
    console.log(`Rendering item ${index}:`, item.type, item.title || item.name);
    
    // Handle section headers
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeaderFull}>
          <Text style={styles.sectionHeaderText}>{item.title}</Text>
        </View>
      );
    }
    
    // Handle rows (pairs of items) for sectioned views
    if (item.type === 'row') {
      return (
        <View style={styles.sectionRow}>
          <View style={styles.gearCardWrapper}>
            <GearCard
              item={item.leftItem}
              isWishlist={item.leftItem.isInWishlist || false}
              showAvatars={true}
              onPress={() => navigation.navigate('GearDetail', { gearId: item.leftItem.id, gearName: item.leftItem.name })}
              onUserPress={(userId) => {
                console.log('Navigate to user profile:', userId);
              }}
            />
          </View>
          {item.rightItem ? (
            <View style={styles.gearCardWrapper}>
              <GearCard
                item={item.rightItem}
                isWishlist={item.rightItem.isInWishlist || false}
                showAvatars={true}
                onPress={() => navigation.navigate('GearDetail', { gearId: item.rightItem.id, gearName: item.rightItem.name })}
                onUserPress={(userId) => {
                  console.log('Navigate to user profile:', userId);
                }}
              />
            </View>
          ) : (
            <View style={styles.gearCardWrapper} />
          )}
        </View>
      );
    }
    
    // Handle regular items (for non-sectioned views)
    // Debug log to check if usedBy data is available
    console.log(`Rendering gear ${item.name}, usedBy:`, item.usedBy ? item.usedBy.length : 0);
    
    return (
      <View style={styles.gearCardWrapper}>
        <GearCard
          item={item}
          isWishlist={item.isInWishlist || false}
          showAvatars={true}
          onPress={() => navigation.navigate('GearDetail', { gearId: item.id, gearName: item.name })}
          onUserPress={(userId) => {
            console.log('Navigate to user profile:', userId);
            // Here you would navigate to user profile
            // navigation.navigate('UserProfile', { userId });
          }}
        />
      </View>
    );
  };

  // Helper function to get sticky header indices
  const getStickyHeaderIndices = () => {
    if (sortBy === 'alphabetical' || sortBy === 'brand' || sortBy === 'type') {
      return gearList
        .map((item, index) => item.type === 'header' ? index : null)
        .filter(index => index !== null);
    }
    return [];
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {renderFilterBar()}
      
      <FlatList
        key={sortBy === 'alphabetical' || sortBy === 'brand' || sortBy === 'type' ? 'sectioned' : 'grid'}
        data={gearList}
        renderItem={renderGearItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        numColumns={sortBy === 'alphabetical' || sortBy === 'brand' || sortBy === 'type' ? 1 : 2}
        columnWrapperStyle={sortBy === 'alphabetical' || sortBy === 'brand' || sortBy === 'type' ? null : styles.columnWrapper}
        stickyHeaderIndices={getStickyHeaderIndices()}
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
      {renderAddGearModal()}
      
      {/* Clear Filters FAB - only show when filters are active */}
      {hasActiveFilters() && (
        <TouchableOpacity 
          style={[
            styles.clearFiltersFab, 
            { 
              bottom: insets.bottom + 16,
              backgroundColor: isDarkMode ? '#FFFFFF' : '#000000'
            }
          ]}
          onPress={clearAllFilters}
        >
          <Text style={[styles.clearFiltersFabText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Clear filters</Text>
        </TouchableOpacity>
      )}
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
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 12,
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
  headerAddButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  sectionHeaderFull: {
    backgroundColor: theme.altBackground,
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 12,
  },

  clearFiltersFab: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 28,
    paddingHorizontal: 32,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  clearFiltersFabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  addGearModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addGearModalContent: {
    backgroundColor: theme.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  addGearModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  addGearModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primaryText,
  },
  addGearOptionsContainer: {
    padding: 16,
  },
  addGearOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.surface,
    marginBottom: 12,
  },
  addGearOptionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  addGearOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 2,
  },
  addGearOptionSubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
  },
});

export default GearListScreen; 