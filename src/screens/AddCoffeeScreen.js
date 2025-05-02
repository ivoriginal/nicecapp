import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Switch, ActionSheetIOS, Platform, Modal, Alert, KeyboardAvoidingView } from 'react-native';
import { CoffeeContext } from '../context/CoffeeContext';
import { useCoffee } from '../context/CoffeeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';

export default function AddCoffeeScreen({ navigation, route }) {
  const { addCoffeeEvent } = useCoffee();
  const insets = useSafeAreaInsets();
  const [coffeeData, setCoffeeData] = useState({
    name: '',
    coffeeId: null,
    method: '',
    amount: '',
    grindSize: '',
    waterVolume: '',
    brewTime: '',
    notes: '',
  });
  const [coffeeSuggestions, setCoffeeSuggestions] = useState([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('suggested');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showOriginalRecipe, setShowOriginalRecipe] = useState(false);
  const [rating, setRating] = useState(0);
  const nameInputRef = useRef(null);

  useEffect(() => {
    // Auto-focus the coffee name input when the screen mounts
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
  }, []);

  useEffect(() => {
    // Check if we should save (triggered by the Save button in the modal)
    if (route.params?.shouldSave) {
      // Show the preview modal first
      setShowPreview(true);
    }
  }, [route.params?.shouldSave]);

  // Add useEffect for handling text input updates
  useEffect(() => {
    if (nameInputRef.current && coffeeData.name) {
      nameInputRef.current.setNativeProps({ text: coffeeData.name });
    }
  }, [coffeeData.name]);

  const searchCoffeeDatabase = async (query) => {
    if (!query.trim()) {
      setCoffeeSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search through mock coffees
      const filteredCoffees = mockData.coffees.filter(coffee =>
        coffee.name.toLowerCase().includes(query.toLowerCase())
      );
      setCoffeeSuggestions(filteredCoffees);
    } catch (error) {
      console.error('Error searching coffee database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchRecipeDatabase = async (coffeeId) => {
    setIsLoading(true);
    try {
      // Get mock recipes for the selected coffee
      const mockRecipes = [
        {
          method: 'V60',
          amount: '18',
          grindSize: 'Medium-Fine',
          waterVolume: '300',
          brewTime: '3:30',
          userName: 'Ivo Vilches'
        },
        {
          method: 'AeroPress',
          amount: '17',
          grindSize: 'Fine',
          waterVolume: '250',
          brewTime: '2:00',
          userName: 'Vértigo y Calambre'
        },
        {
          method: 'Chemex',
          amount: '22',
          grindSize: 'Medium',
          waterVolume: '350',
          brewTime: '4:30',
          userName: 'Carlos Hernández'
        }
      ];
      setRecipeSuggestions(mockRecipes);
    } catch (error) {
      console.error('Error searching recipe database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (text) => {
    setCoffeeData({ ...coffeeData, name: text });
    searchCoffeeDatabase(text);
  };

  const handleCoffeeSelect = async (coffee) => {
    // Create new coffee data object
    const newCoffeeData = {
      ...coffeeData,
      name: coffee.name,
      coffeeId: coffee.id
    };
    
    // Update state
    setCoffeeData(newCoffeeData);
    
    // Clear suggestions
    setCoffeeSuggestions([]);
    
    // Search for recipes
    searchRecipeDatabase(coffee.id);
    
    // Force update the text input
    if (nameInputRef.current) {
      nameInputRef.current.setNativeProps({ text: coffee.name });
    }
  };

  const handleClearInput = () => {
    setCoffeeData({ ...coffeeData, name: '', coffeeId: null });
    setCoffeeSuggestions([]);
  };

  const handleRecipeSelect = (recipe) => {
    setCoffeeData({
      ...coffeeData,
      method: recipe.method || '',
      amount: recipe.amount || '',
      grindSize: recipe.grindSize || '',
      waterVolume: recipe.waterVolume || '',
      brewTime: recipe.brewTime || '',
    });
    setSelectedRecipe(recipe);
  };

  const handleRecipePress = (recipe) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Use as is', 'Customize'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setSelectedRecipe(recipe);
            setShowPreview(true);
          } else if (buttonIndex === 2) {
            handleRecipeSelect(recipe);
            setSelectedTab('custom');
          }
        }
      );
    } else {
      Alert.alert(
        'Recipe Options',
        'What would you like to do with this recipe?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Use as is',
            onPress: () => {
              setSelectedRecipe(recipe);
              setShowPreview(true);
            },
          },
          {
            text: 'Customize',
            onPress: () => {
              handleRecipeSelect(recipe);
              setSelectedTab('custom');
            },
          },
        ]
      );
    }
  };

  const handleSave = async () => {
    try {
      // Create a mock event ID for local storage
      const mockEventId = `local-${Date.now()}`;
      
      const eventData = {
        id: mockEventId,
        coffeeName: coffeeData.name,
        coffeeId: coffeeData.coffeeId,
        method: coffeeData.method,
        amount: coffeeData.amount,
        grindSize: coffeeData.grindSize,
        waterVolume: coffeeData.waterVolume,
        brewTime: coffeeData.brewTime,
        timestamp: new Date().toISOString(),
        isPrivate,
        rating: rating > 0 ? rating : null,
        notes: coffeeData.notes,
        originalRecipe: selectedRecipe ? {
          method: selectedRecipe.method,
          amount: selectedRecipe.amount,
          grindSize: selectedRecipe.grindSize,
          waterVolume: selectedRecipe.waterVolume,
          brewTime: selectedRecipe.brewTime,
          userName: selectedRecipe.userName || 'Ivo Vilches',
        } : null,
      };

      // Log the event data to console for debugging
      console.log('Saving coffee event:', eventData);
      
      // Add the event to the context
      await addCoffeeEvent(eventData);
      
      // Close the preview modal first
      setShowPreview(false);
      
      // Small delay to ensure the preview modal is closed before navigating
      setTimeout(() => {
        // Use goBack() to return to the previous screen (which should be Home)
        navigation.goBack();
      }, 100);
    } catch (error) {
      console.error('Error saving coffee:', error);
      Alert.alert('Error', 'Failed to save coffee event. Please try again.');
    }
  };

  const handleCustomSave = () => {
    // Create a recipe object from the custom data
    const customRecipe = {
      method: coffeeData.method,
      amount: coffeeData.amount,
      grindSize: coffeeData.grindSize,
      waterVolume: coffeeData.waterVolume,
      brewTime: coffeeData.brewTime,
    };
    setSelectedRecipe(customRecipe);
    setShowPreview(true);
  };

  const handleClearRecipe = () => {
    setCoffeeData({
      ...coffeeData,
      method: '',
      amount: '',
      grindSize: '',
      waterVolume: '',
      brewTime: '',
    });
    setSelectedRecipe(null);
  };

  const renderSegmentedControl = () => (
    <View style={styles.segmentedControl}>
      <TouchableOpacity
        style={[
          styles.segment,
          selectedTab === 'suggested' && styles.segmentActive
        ]}
        onPress={() => setSelectedTab('suggested')}
      >
        <Text style={[
          styles.segmentText,
          selectedTab === 'suggested' && styles.segmentTextActive
        ]}>Suggested Recipes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.segment,
          selectedTab === 'custom' && styles.segmentActive
        ]}
        onPress={() => setSelectedTab('custom')}
      >
        <Text style={[
          styles.segmentText,
          selectedTab === 'custom' && styles.segmentTextActive
        ]}>Create My Own</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuggestedRecipes = () => (
    <View style={styles.recipesContainer}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="small" color="#000000" />
      ) : recipeSuggestions.length > 0 ? (
        recipeSuggestions.map((recipe, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recipeCard}
            onPress={() => handleRecipePress(recipe)}
          >
            <View style={styles.recipeHeader}>
              <View>
                <Text style={styles.recipeMethod}>{recipe.method}</Text>
                <Text style={styles.recipeAuthor}>by {recipe.userName || 'Ivo Vilches'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
            <View style={styles.recipeDetails}>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Coffee</Text>
                <Text style={styles.detailValue}>{recipe.amount}g</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Grind Size</Text>
                <Text style={styles.detailValue}>{recipe.grindSize}</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Water</Text>
                <Text style={styles.detailValue}>{recipe.waterVolume}ml</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Brew Time</Text>
                <Text style={styles.detailValue}>{recipe.brewTime}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.emptyText}>No recipes found for this coffee</Text>
      )}
    </View>
  );

  const renderCustomRecipe = () => (
    <View style={styles.customRecipeContainer}>
      {selectedRecipe && (
        <View style={styles.basedOnContainer}>
          <Text style={styles.basedOnText}>
            Based on a recipe by {selectedRecipe.userName || 'Ivo Vilches'}
          </Text>
          <TouchableOpacity 
            onPress={handleClearRecipe}
            style={styles.clearButton}
          >
            <Ionicons name="refresh" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Method</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.method}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, method: text })}
          placeholder="Enter brewing method"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (g)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.amount}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, amount: text })}
          placeholder="Enter coffee amount in grams"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Grind Size</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.grindSize}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, grindSize: text })}
          placeholder="Enter grind size"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Water Volume (ml)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.waterVolume}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, waterVolume: text })}
          placeholder="Enter water volume in ml"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Brew Time</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.brewTime}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, brewTime: text })}
          placeholder="Enter brew time"
          placeholderTextColor="#999"
        />
      </View>

      {selectedTab === 'custom' && (
        <View style={styles.bottomSaveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.bottomSaveButton,
              (!coffeeData.name || !coffeeData.method || !coffeeData.amount || !coffeeData.grindSize || !coffeeData.waterVolume || !coffeeData.brewTime) && styles.bottomSaveButtonDisabled
            ]}
            onPress={handleCustomSave}
            disabled={!coffeeData.name || !coffeeData.method || !coffeeData.amount || !coffeeData.grindSize || !coffeeData.waterVolume || !coffeeData.brewTime}
          >
            <Text style={[
              styles.bottomSaveButtonText,
              (!coffeeData.name || !coffeeData.method || !coffeeData.amount || !coffeeData.grindSize || !coffeeData.waterVolume || !coffeeData.brewTime) && styles.bottomSaveButtonTextDisabled
            ]}>Save Coffee</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPreviewSheet = () => (
    <Modal
      visible={showPreview}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreview(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview</Text>
            <TouchableOpacity 
              onPress={() => setShowPreview(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.previewContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <Text style={styles.previewCoffeeName}>{coffeeData.name}</Text>
            
            <View style={styles.recipePreview}>
              <Text style={styles.recipeTitle}>
                Recipe {selectedRecipe?.userName ? `by ${selectedRecipe.userName}` : ''}
              </Text>
              <View style={styles.recipeDetails}>
                <View style={styles.recipeDetail}>
                  <Text style={styles.detailLabel}>Method</Text>
                  <Text style={styles.detailValue}>{selectedRecipe?.method}</Text>
                </View>
                <View style={styles.recipeDetail}>
                  <Text style={styles.detailLabel}>Coffee</Text>
                  <Text style={styles.detailValue}>{selectedRecipe?.amount}g</Text>
                </View>
                <View style={styles.recipeDetail}>
                  <Text style={styles.detailLabel}>Grind Size</Text>
                  <Text style={styles.detailValue}>{selectedRecipe?.grindSize}</Text>
                </View>
                <View style={styles.recipeDetail}>
                  <Text style={styles.detailLabel}>Water</Text>
                  <Text style={styles.detailValue}>{selectedRecipe?.waterVolume}ml</Text>
                </View>
                <View style={styles.recipeDetail}>
                  <Text style={styles.detailLabel}>Brew Time</Text>
                  <Text style={styles.detailValue}>{selectedRecipe?.brewTime}</Text>
                </View>
              </View>
            </View>

            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Rate this brew (optional)</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={28}
                      color={star <= rating ? "#FFD700" : "#CCCCCC"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={coffeeData.notes}
                onChangeText={(text) => setCoffeeData({ ...coffeeData, notes: text })}
                placeholder="Add any notes about this brew..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            {/* Add extra padding at the bottom to ensure scrollability */}
            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={styles.sharingContainer}>
            <View style={styles.sharingOptions}>
              <View style={styles.sharingTextContainer}>
                <Text style={styles.sharingLabel}>Share with community</Text>
                <Text style={styles.sharingDescription}>
                  {isPrivate ? 'Only you can see this brew' : 'Everyone can see this brew'}
                </Text>
              </View>
              <Switch
                value={!isPrivate}
                onValueChange={(value) => setIsPrivate(!value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={!isPrivate ? '#2196F3' : '#f4f4f4'}
              />
            </View>
          </View>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderOriginalRecipeModal = () => (
    <Modal
      visible={showOriginalRecipe}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOriginalRecipe(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Original Recipe</Text>
            <TouchableOpacity 
              onPress={() => setShowOriginalRecipe(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.originalRecipeContent}>
            <View style={styles.originalRecipeHeader}>
              <Text style={styles.originalRecipeTitle}>
                {selectedRecipe?.userName || 'Ivo Vilches'}'s Recipe
              </Text>
              <Text style={styles.originalRecipeSubtitle}>
                Original recipe for {coffeeData.name}
              </Text>
            </View>
            <View style={styles.recipeDetails}>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Method</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.method}</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Coffee</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.amount}g</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Grind Size</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.grindSize}</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Water</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.waterVolume}ml</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Brew Time</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.brewTime}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Coffee Name</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={nameInputRef}
              style={styles.input}
              value={coffeeData.name}
              onChangeText={handleNameChange}
              placeholder="Enter coffee name"
              placeholderTextColor="#999"
              autoFocus
              onBlur={() => {
                // Force update the value when the input loses focus
                if (nameInputRef.current) {
                  nameInputRef.current.setNativeProps({ text: coffeeData.name });
                }
              }}
            />
            {coffeeData.name.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={handleClearInput}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          {coffeeSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {coffeeSuggestions.map((coffee, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestion}
                  onPress={() => handleCoffeeSelect(coffee)}
                >
                  <Text style={styles.coffeeName}>{coffee.name}</Text>
                  <Text style={styles.roasterText}>{coffee.roaster}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {coffeeData.coffeeId && renderSegmentedControl()}

        {coffeeData.coffeeId && (
          selectedTab === 'suggested' ? renderSuggestedRecipes() : renderCustomRecipe()
        )}
      </ScrollView>
      
      {renderPreviewSheet()}
      {renderOriginalRecipeModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 12,
    paddingRight: 40, // Make room for the clear button
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    maxHeight: 200,
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  coffeeName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  roasterText: {
    fontSize: 14,
    color: '#666666',
  },
  loader: {
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  segmentTextActive: {
    color: '#000000',
  },
  recipesContainer: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  recipeAuthor: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeDetail: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
    marginTop: 24,
  },
  customRecipeContainer: {
    padding: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '90%',
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
  },
  previewContent: {
    padding: 16,
  },
  previewCoffeeName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  recipePreview: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: 4,
  },
  notesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  notesInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  bottomSaveButtonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    marginTop: 16,
  },
  bottomSaveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomSaveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  bottomSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSaveButtonTextDisabled: {
    color: '#999999',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customSaveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  customSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  basedOnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  basedOnText: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '500',
  },
  sharingContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  sharingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sharingTextContainer: {
    flex: 1,
  },
  sharingLabel: {
    fontSize: 16,
    color: '#000000',
  },
  sharingDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  originalRecipeContent: {
    padding: 16,
  },
  originalRecipeHeader: {
    marginBottom: 16,
  },
  originalRecipeTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  originalRecipeSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  closeButton: {
    borderRadius: 8,
    alignItems: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  recipeAttribution: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 