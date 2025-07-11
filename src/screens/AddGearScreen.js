import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import mockGear from '../data/mockGear.json';
import mockUsers from '../data/mockUsers.json';
import gearDetails from '../data/gearDetails';

export default function AddGearScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, isDarkMode, insets);
  
  const { userId } = route.params || {};
  
  const [searchText, setSearchText] = useState('');
  const [gearSuggestions, setGearSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGear, setSelectedGear] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parsedGearData, setParsedGearData] = useState(null);
  const [editableGearData, setEditableGearData] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [isAddingGear, setIsAddingGear] = useState(false);
  
  const searchInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Auto-focus search input when screen mounts
  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);

    // Set initial suggestions to popular gear
    setGearSuggestions((mockGear?.gear || []).slice(0, 8));

    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      clearTimeout(focusTimer);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);



  const searchGearDatabase = async (query) => {
    if (!query.trim()) {
      setGearSuggestions((mockGear?.gear || []).slice(0, 8));
      return;
    }

    setIsLoading(true);
    try {
      // Check if query looks like a URL
      if (query.includes('http') || query.includes('www.') || query.includes('.com')) {
        // Handle URL parsing (mock implementation)
        await handleURLParsing(query);
        return;
      }

      // Search through mock gear
      const filteredGear = (mockGear?.gear || []).filter(gear =>
        gear.name.toLowerCase().includes(query.toLowerCase()) ||
        gear.brand.toLowerCase().includes(query.toLowerCase()) ||
        gear.type.toLowerCase().includes(query.toLowerCase())
      );
      
      // Also search through gearDetails
      const detailedGearArray = Object.entries(gearDetails)
        .filter(([name, gear]) =>
          name.toLowerCase().includes(query.toLowerCase()) ||
          gear.brand?.toLowerCase().includes(query.toLowerCase()) ||
          gear.type?.toLowerCase().includes(query.toLowerCase())
        )
        .map(([name, gear]) => ({
          ...gear,
          name: name, // Add the name from the key
          imageUrl: gear.image, // Map image to imageUrl for consistency
        }));
      
      // Combine and deduplicate results
      const allResults = [...filteredGear, ...detailedGearArray];
      const uniqueResults = allResults.filter((gear, index, self) => 
        index === self.findIndex(g => (g.id === gear.id) || (g.name === gear.name))
      );
      
      setGearSuggestions(uniqueResults);
    } catch (error) {
      console.error('Error searching gear database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleURLParsing = async (url) => {
    setIsLoading(true);
    
    // Simulate URL parsing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock parsed data - in reality this would be extracted from the URL
    const mockParsedData = {
      name: 'Timemore C2 Hand Grinder',
      brand: 'Timemore',
      type: 'Grinder',
      price: 85.99,
      description: 'Portable manual coffee grinder with stainless steel conical burrs and adjustable grind settings.',
      imageUrl: 'https://images.unsplash.com/photo-1610889556528-9a770e32642f',
      features: [
        'Stainless steel conical burrs',
        'Portable design',
        'Adjustable grind settings',
        'Easy to clean'
      ],
      rating: 4.6,
      reviewCount: 450,
      sourceUrl: url
    };
    
    setParsedGearData(mockParsedData);
    setEditableGearData({
      name: mockParsedData.name,
      brand: mockParsedData.brand,
      type: mockParsedData.type,
      price: mockParsedData.price.toString(),
      description: mockParsedData.description,
    });
    setShowConfirmation(true);
    setIsLoading(false);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    searchGearDatabase(text);
  };

  const handleGearSelect = (gear) => {
    setSelectedGear(gear);
    setEditableGearData({
      name: gear.name || '',
      brand: gear.brand || '',
      type: gear.type || '',
      price: gear.price ? gear.price.toString() : '',
      description: gear.description || '',
    });
    setShowConfirmation(true);
    Keyboard.dismiss();
  };

  const handleClearInput = () => {
    setSearchText('');
    setGearSuggestions((mockGear?.gear || []).slice(0, 8));
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleAddToWishlist = async () => {
    try {
      if (!editableGearData || !editableGearData.name.trim()) {
        Alert.alert('Error', 'Please enter a gear name.');
        return;
      }

      // Use the edited data
      const gearToAdd = {
        id: `gear-${Date.now()}`,
        ...editableGearData,
        price: editableGearData.price ? parseFloat(editableGearData.price) : 0,
        imageUrl: selectedGear?.imageUrl || parsedGearData?.imageUrl || null,
        type: editableGearData.type || 'Other',
        avgRating: selectedGear?.avgRating || 0,
        numReviews: selectedGear?.numReviews || 0
      };

      // Close the confirmation modal and go back
      setShowConfirmation(false);
      
      // Update the parent screen's state directly
      if (route.params?.onAddGear) {
        route.params.onAddGear(gearToAdd);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error adding gear to wishlist:', error);
      Alert.alert('Error', 'Failed to add gear to wishlist. Please try again.');
    }
  };

  const renderGearSuggestion = (gear, index) => (
    <TouchableOpacity
      key={gear.id || index}
      style={[
        styles.suggestionItem,
        index === gearSuggestions.length - 1 && styles.suggestionItemLast
      ]}
      onPress={() => handleGearSelect(gear)}
    >
      <Image 
        source={{ uri: gear.imageUrl || gear.image }} 
        style={styles.suggestionImage} 
      />
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionName}>{gear.name}</Text>
        <Text style={styles.suggestionBrand}>{gear.brand}</Text>
        <Text style={styles.suggestionType}>{gear.type}</Text>
        {gear.price && (
          <Text style={styles.suggestionPrice}>
            €{typeof gear.price === 'number' ? gear.price.toFixed(2) : gear.price}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderNoResults = () => (
    <View style={styles.noResultsContainer}>
      <Text style={styles.noResultsText}>
        Can't find your gear?
      </Text>
      <Text style={styles.noResultsSubtext}>
        Paste a URL in the search box and we'll add it for you
      </Text>
      <View style={styles.urlExampleContainer}>
        <Ionicons name="link-outline" size={16} color={theme.secondaryText} />
        <Text style={styles.urlExampleText}>
          Example: amazon.com/coffee-grinder or roaster-website.com/product
        </Text>
      </View>
    </View>
  );

  const renderConfirmationModal = () => {
    const gear = selectedGear || parsedGearData;
    if (!gear || !editableGearData) return null;

    return (
      <Modal
        visible={showConfirmation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowConfirmation(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Confirm Gear</Text>
            <TouchableOpacity 
              onPress={handleAddToWishlist}
              disabled={isAddingGear}
            >
              <Text style={[
                styles.modalConfirm,
                isAddingGear && { opacity: 0.5 }
              ]}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.gearPreview}>
              <Image 
                source={{ uri: gear.imageUrl || gear.image }} 
                style={styles.gearPreviewImage} 
              />
            </View>

            <View style={styles.editableFieldsContainer}>
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Name</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editableGearData.name}
                  onChangeText={(text) => setEditableGearData({...editableGearData, name: text})}
                  placeholder="Gear name"
                  placeholderTextColor={theme.secondaryText}
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Brand</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editableGearData.brand}
                  onChangeText={(text) => setEditableGearData({...editableGearData, brand: text})}
                  placeholder="Brand name"
                  placeholderTextColor={theme.secondaryText}
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Type</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editableGearData.type}
                  onChangeText={(text) => setEditableGearData({...editableGearData, type: text})}
                  placeholder="e.g. Grinder, Kettle, Pour Over"
                  placeholderTextColor={theme.secondaryText}
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Price (€)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={editableGearData.price}
                  onChangeText={(text) => setEditableGearData({...editableGearData, price: text})}
                  placeholder="0.00"
                  placeholderTextColor={theme.secondaryText}
                  keyboardType="numeric"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput
                  style={[styles.fieldInput, styles.descriptionInput]}
                  value={editableGearData.description}
                  onChangeText={(text) => setEditableGearData({...editableGearData, description: text})}
                  placeholder="Brief description of the gear"
                  placeholderTextColor={theme.secondaryText}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                />
              </View>
            </View>

            {gear.features && gear.features.length > 0 && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Features</Text>
                {gear.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}

            {parsedGearData && (
              <View style={styles.sourceContainer}>
                <Text style={styles.sourceTitle}>Source</Text>
                <Text style={styles.sourceUrl}>{parsedGearData.sourceUrl}</Text>
                <Text style={styles.sourceNote}>
                  This information was automatically extracted from the URL. Please verify it's correct before adding.
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.secondaryText} style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => {
              if (searchText.includes('http') || searchText.includes('www.') || searchText.includes('.com')) {
                handleURLParsing(searchText);
              }
            }}
            placeholder="Search gear or paste URL..."
            placeholderTextColor={theme.secondaryText}
            keyboardAppearance={isDarkMode ? 'dark' : 'light'}
            keyboardType="default"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearInput} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.resultsContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryText} />
            <Text style={styles.loadingText}>
              {searchText.includes('http') ? 'Parsing URL...' : 'Searching gear...'}
            </Text>
          </View>
        ) : gearSuggestions.length > 0 ? (
          <>
            {gearSuggestions.map((gear, index) => renderGearSuggestion(gear, index))}
          </>
        ) : searchText.trim() ? (
          renderNoResults()
        ) : null}
      </ScrollView>

      {renderConfirmationModal()}
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme, isDarkMode, insets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.placeholder,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 2,
  },
  suggestionBrand: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  suggestionType: {
    fontSize: 12,
    color: theme.secondaryText,
    marginBottom: 4,
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primaryText,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: theme.secondaryText,
    textAlign: 'center',
    marginBottom: 16,
  },
  urlExampleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  urlExampleText: {
    fontSize: 12,
    color: theme.secondaryText,
    marginLeft: 6,
    flex: 1,
  },
  loadingContainer: {
    padding: 48,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.secondaryText,
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.primaryText,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  modalConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  gearPreview: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  gearPreviewImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: theme.placeholder,
  },
  editableFieldsContainer: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: theme.altBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.primaryText,
    borderWidth: 1,
    borderColor: theme.border,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  descriptionContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.secondaryText,
    lineHeight: 20,
  },
  featuresContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: theme.secondaryText,
    marginLeft: 8,
    flex: 1,
  },
  sourceContainer: {
    backgroundColor: theme.altBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  sourceUrl: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  sourceNote: {
    fontSize: 12,
    color: theme.secondaryText,
    fontStyle: 'italic',
  },
}); 