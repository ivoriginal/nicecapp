import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useCoffee } from '../context/CoffeeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper function to format brew time as MM:SS
const formatBrewTime = (value) => {
  const cleanedValue = value.replace(/[^0-9:]/g, '');
  
  if (/^\d+$/.test(cleanedValue) && cleanedValue.length > 2) {
    const minutes = cleanedValue.slice(0, -2);
    const seconds = cleanedValue.slice(-2);
    return `${minutes}:${seconds}`;
  }
  
  if (cleanedValue.includes(':')) {
    const [minutes, seconds] = cleanedValue.split(':');
    if (seconds && seconds.length > 2) {
      return `${minutes}:${seconds.slice(0, 2)}`;
    }
  }
  
  return cleanedValue;
};

export default function CreateRecipeScreen({ navigation, route }) {
  const { addRecipe, currentAccount } = useCoffee();
  const insets = useSafeAreaInsets();
  
  // Get params from navigation
  const { coffee, recipe, isRemixing } = route.params || {};

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      title: isRemixing ? 'Remix Recipe' : 'Create Recipe',
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 16 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isRemixing]);
  
  const [recipeData, setRecipeData] = useState({
    method: recipe?.method || recipe?.brewingMethod || '',
    amount: recipe?.amount?.toString() || recipe?.coffeeAmount?.toString() || '',
    grindSize: recipe?.grindSize || 'Medium',
    waterVolume: recipe?.waterVolume?.toString() || recipe?.waterAmount?.toString() || '',
    brewTime: recipe?.brewTime || '',
    brewMinutes: '',
    brewSeconds: '',
    notes: recipe?.notes || '',
    grinderUsed: '',
    steps: recipe?.steps || [],
  });

  // List of brewing methods
  const brewingMethods = [
    'V60', 'Chemex', 'AeroPress', 'French Press', 'Espresso', 'Moka Pot', 'Cold Brew', 'Kalita Wave', 'Hario Switch'
  ];

  // List of common grind sizes
  const grindSizes = [
    'Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse', 'Extra Coarse'
  ];

  // List of common grinders
  const grinders = [
    'Comandante C40', 'Baratza Encore', 'Fellow Ode', 'Timemore C2', 'Kinu M47', 'Weber Key', '1Zpresso JX-Pro',
    'Niche Zero', 'DF64', 'Wilfa Uniform', 'Weber EG-1', 'Other'
  ];

  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [showGrinderSelector, setShowGrinderSelector] = useState(false);

  // Extract minutes and seconds from brewTime if provided
  useEffect(() => {
    if (recipe?.brewTime && typeof recipe.brewTime === 'string' && recipe.brewTime.includes(':')) {
      const [minutes, seconds] = recipe.brewTime.split(':');
      setRecipeData(prev => ({
        ...prev,
        brewMinutes: minutes,
        brewSeconds: seconds
      }));
    }
  }, [recipe]);

  // Format steps if remixing
  useEffect(() => {
    if (isRemixing && recipe) {
      if (Array.isArray(recipe.steps) && typeof recipe.steps[0] === 'string') {
        const formattedSteps = recipe.steps.map((description, index) => {
          const timeMatch = description.match(/(\d+)\s*seconds|(\d+):(\d+)/);
          const waterMatch = description.match(/(\d+)g/);
          
          return {
            time: timeMatch ? (timeMatch[1] || `${timeMatch[2]}:${timeMatch[3]}`) : '',
            water: waterMatch ? waterMatch[1] : '',
            description: description
          };
        });
        
        setRecipeData(prev => ({
          ...prev,
          steps: formattedSteps
        }));
      }
    }
  }, [isRemixing, recipe]);

  const handleAddBrewingStep = () => {
    const newSteps = [...recipeData.steps, { time: '', water: '', description: '' }];
    setRecipeData({ ...recipeData, steps: newSteps });
  };

  const handleUpdateBrewingStep = (index, field, value) => {
    const updatedSteps = [...recipeData.steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    
    const totalWater = updatedSteps.reduce((sum, step) => {
      return sum + (parseInt(step.water) || 0);
    }, 0);
    
    setRecipeData({ 
      ...recipeData, 
      steps: updatedSteps,
      waterVolume: totalWater.toString()
    });
  };

  const handleRemoveBrewingStep = (index) => {
    const updatedSteps = [...recipeData.steps];
    updatedSteps.splice(index, 1);
    
    const totalWater = updatedSteps.reduce((sum, step) => {
      return sum + (parseInt(step.water) || 0);
    }, 0);
    
    setRecipeData({ 
      ...recipeData, 
      steps: updatedSteps,
      waterVolume: totalWater.toString()
    });
  };

  const calculateTotalBrewTime = () => {
    if (!recipeData.steps || recipeData.steps.length === 0) {
      return recipeData.brewTime || '';
    }
    
    let lastStepTime = '0:00';
    recipeData.steps.forEach(step => {
      if (step.time) {
        const [mins, secs] = step.time.split(':').map(num => parseInt(num) || 0);
        const currentStepSeconds = mins * 60 + secs;
        
        const [lastMins, lastSecs] = lastStepTime.split(':').map(num => parseInt(num) || 0);
        const lastStepSeconds = lastMins * 60 + lastSecs;
        
        if (currentStepSeconds > lastStepSeconds) {
          lastStepTime = step.time;
        }
      }
    });
    
    return lastStepTime;
  };

  const renderBrewingSteps = () => {
    if (!['V60', 'Chemex', 'Kalita Wave'].includes(recipeData.method)) {
      return null;
    }

    return (
      <View style={styles.brewingStepsContainer}>
        <Text style={styles.brewingStepsTitle}>Brewing Steps</Text>
        {recipeData.steps.map((step, index) => (
          <View key={index} style={styles.brewingStepRow}>
            <View style={styles.brewingStepInputGroup}>
              <Text style={styles.brewingStepLabel}>Time</Text>
              <TextInput
                style={styles.brewingStepInput}
                value={step.time}
                onChangeText={(value) => {
                  const formattedTime = formatBrewTime(value);
                  handleUpdateBrewingStep(index, 'time', formattedTime);
                }}
                placeholder="0:30"
                keyboardType="numbers-and-punctuation"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.brewingStepInputGroup}>
              <Text style={styles.brewingStepLabel}>Water (g)</Text>
              <TextInput
                style={styles.brewingStepInput}
                value={step.water}
                onChangeText={(value) => handleUpdateBrewingStep(index, 'water', value)}
                placeholder="50"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.brewingStepInputGroup}>
              <Text style={styles.brewingStepLabel}>Description</Text>
              <TextInput
                style={[styles.brewingStepInput, { flex: 1 }]}
                value={step.description}
                onChangeText={(value) => handleUpdateBrewingStep(index, 'description', value)}
                placeholder="Bloom"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity 
              style={styles.removeStepButton}
              onPress={() => handleRemoveBrewingStep(index)}
            >
              <Ionicons name="remove-circle-outline" size={24} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity 
          style={styles.addStepButton}
          onPress={handleAddBrewingStep}
        >
          <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.addStepButtonText}>Add Step</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSave = async () => {
    try {
      const calculatedBrewTime = calculateTotalBrewTime();
      const recipeId = `recipe-${Date.now()}`;
      
      const newRecipe = {
        id: recipeId,
        name: `${coffee.name} ${recipeData.method}`,
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        method: recipeData.method,
        amount: recipeData.amount,
        grindSize: recipeData.grindSize,
        waterVolume: recipeData.waterVolume,
        brewTime: calculatedBrewTime || recipeData.brewTime,
        steps: recipeData.steps,
        notes: recipeData.notes,
        grinderUsed: recipeData.grinderUsed,
        creatorId: currentAccount?.id || 'user-default',
        creatorName: currentAccount?.userName || 'You',
        creatorAvatar: currentAccount?.userAvatar,
        timestamp: new Date().toISOString(),
        rating: 5,
        isCustom: true,
        originalRecipe: isRemixing ? {
          id: recipe.id,
          method: recipe.method,
          amount: recipe.amount,
          grindSize: recipe.grindSize,
          waterVolume: recipe.waterVolume,
          brewTime: recipe.brewTime,
          userName: recipe.userName || recipe.creatorName || 'Ivo Vilches',
        } : null,
      };
      
      await addRecipe(newRecipe);
      
      // Simply go back to the previous screen
      // The recipe will be available through the context
      navigation.goBack();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const isFormValid = () => {
    const hasRequired = recipeData.method && 
           recipeData.amount && 
           recipeData.grindSize && 
           recipeData.waterVolume && 
           (recipeData.brewTime || (recipeData.brewMinutes && recipeData.brewSeconds));

    if (isRemixing && recipe) {
      // Determine if the user changed any field compared to the original recipe
      const originalSteps = recipe?.steps || [];
      const stepsChanged = JSON.stringify(recipeData.steps) !== JSON.stringify(originalSteps);

      const hasChanges =
        recipeData.method !== (recipe?.method || recipe?.brewingMethod || '') ||
        recipeData.amount !== (recipe?.amount?.toString() || recipe?.coffeeAmount?.toString() || '') ||
        recipeData.grindSize !== (recipe?.grindSize || 'Medium') ||
        recipeData.waterVolume !== (recipe?.waterVolume?.toString() || recipe?.waterAmount?.toString() || '') ||
        ((calculateTotalBrewTime() || recipeData.brewTime) !== (recipe?.brewTime || '')) ||
        recipeData.notes !== (recipe?.notes || '') ||
        stepsChanged;

      return hasRequired && hasChanges;
    }

    return hasRequired;
  };

  // Handle missing coffee data
  if (!coffee || !coffee.name) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: Coffee data is missing</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Coffee Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>
              {isRemixing ? 'Remix Recipe' : 'Create Recipe'}
            </Text>
            <Text style={styles.headerSubtitle}>for {coffee.name}</Text>
          </View>

          {isRemixing && recipe && (
            <View style={styles.basedOnContainer}>
              <View style={styles.basedOnContent}>
                <Ionicons name="git-branch-outline" size={20} color="#666666" style={styles.remixIcon} />
                <Text style={styles.basedOnText}>Remixing a recipe by</Text>
                <Text style={styles.basedOnAuthor}>
                  {recipe.creatorName || recipe.userName || 'Ivo Vilches'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Method</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={() => setShowMethodSelector(true)}
              >
                <Text style={styles.selectorButtonText}>
                  {recipeData.method || "Select brewing method"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Amount (g)</Text>
              <TextInput
                style={styles.input}
                value={recipeData.amount}
                onChangeText={(text) => setRecipeData({ ...recipeData, amount: text })}
                placeholder="Enter coffee amount in grams"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Grind Size</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => {
                    const currentIndex = grindSizes.indexOf(recipeData.grindSize);
                    if (currentIndex > 0) {
                      setRecipeData({ ...recipeData, grindSize: grindSizes[currentIndex - 1] });
                    }
                  }}
                >
                  <Ionicons name="remove" size={24} color="#666666" />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{recipeData.grindSize}</Text>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => {
                    const currentIndex = grindSizes.indexOf(recipeData.grindSize);
                    if (currentIndex < grindSizes.length - 1) {
                      setRecipeData({ ...recipeData, grindSize: grindSizes[currentIndex + 1] });
                    }
                  }}
                >
                  <Ionicons name="add" size={24} color="#666666" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Grinder Used (Optional)</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={() => setShowGrinderSelector(true)}
              >
                <Text style={styles.selectorButtonText}>
                  {recipeData.grinderUsed || "Select grinder"}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            
            {!['V60', 'Chemex', 'Kalita Wave'].includes(recipeData.method) && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Water Volume (ml)</Text>
                <TextInput
                  style={styles.input}
                  value={recipeData.waterVolume}
                  onChangeText={(text) => setRecipeData({ ...recipeData, waterVolume: text })}
                  placeholder="Enter water volume in ml"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            )}
            
            {!['V60', 'Chemex', 'Kalita Wave'].includes(recipeData.method) && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Brew Time</Text>
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={styles.timeInput}
                      value={recipeData.brewMinutes || ''}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, '');
                        const minutes = numericText.length > 0 ? numericText : '';
                        const seconds = recipeData.brewSeconds || '00';
                        const brewTime = minutes ? `${minutes}:${seconds}` : '';
                        
                        setRecipeData({ 
                          ...recipeData, 
                          brewMinutes: minutes,
                          brewTime: brewTime
                        });
                      }}
                      placeholder="0"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>min</Text>
                  </View>
                  
                  <Text style={styles.timeSeparator}>:</Text>
                  
                  <View style={styles.timeInputWrapper}>
                    <TextInput
                      style={styles.timeInput}
                      value={recipeData.brewSeconds || ''}
                      onChangeText={(text) => {
                        const numericText = text.replace(/[^0-9]/g, '');
                        let seconds = numericText;
                        
                        if (seconds.length > 0) {
                          if (seconds.length > 2) {
                            seconds = seconds.slice(-2);
                          }
                          const secondsNum = parseInt(seconds, 10);
                          if (secondsNum > 59) {
                            seconds = '59';
                          }
                        }
                        
                        const minutes = recipeData.brewMinutes || '0';
                        const paddedSeconds = seconds.length > 0 ? seconds.padStart(2, '0') : '00';
                        const brewTime = `${minutes}:${paddedSeconds}`;
                        
                        setRecipeData({ 
                          ...recipeData, 
                          brewSeconds: seconds,
                          brewTime: brewTime
                        });
                      }}
                      placeholder="00"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                      maxLength={2}
                    />
                    <Text style={styles.timeLabel}>sec</Text>
                  </View>
                </View>
              </View>
            )}
            
            {renderBrewingSteps()}
            
            {['V60', 'Chemex', 'Kalita Wave'].includes(recipeData.method) && recipeData.steps.length > 0 && (
              <View style={styles.totalContainer}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Water:</Text>
                  <Text style={styles.totalValue}>{recipeData.waterVolume} ml</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Time:</Text>
                  <Text style={styles.totalValue}>{calculateTotalBrewTime()}</Text>
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                placeholder="Add notes about this recipe..."
                value={recipeData.notes}
                onChangeText={(text) => setRecipeData({...recipeData, notes: text})}
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity
            style={[styles.saveButton, !isFormValid() && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!isFormValid()}
          >
            <Text style={[styles.saveButtonText, !isFormValid() && styles.saveButtonTextDisabled]}>
              {isRemixing ? 'Save Remix' : 'Save Recipe'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Method selector modal */}
      <Modal
        visible={showMethodSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMethodSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Brewing Method</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMethodSelector(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={brewingMethods}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.modalItem,
                    recipeData.method === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setRecipeData({ ...recipeData, method: item });
                    setShowMethodSelector(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    recipeData.method === item && styles.modalItemTextSelected
                  ]}>{item}</Text>
                  {recipeData.method === item && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
      
      {/* Grinder selector modal */}
      <Modal
        visible={showGrinderSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGrinderSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Grinder</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowGrinderSelector(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={grinders}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.modalItem,
                    recipeData.grinderUsed === item && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setRecipeData({ ...recipeData, grinderUsed: item });
                    setShowGrinderSelector(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    recipeData.grinderUsed === item && styles.modalItemTextSelected
                  ]}>{item}</Text>
                  {recipeData.grinderUsed === item && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  headerContainer: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  basedOnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#F8F8F8',
  },
  basedOnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  remixIcon: {
    marginRight: 6,
  },
  basedOnText: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '500',
    marginRight: 4,
  },
  basedOnAuthor: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '600',
    marginLeft: 6,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: '#000000',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  selectorButton: {
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
  },
  stepperButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  timeInput: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    color: '#000000',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
    marginHorizontal: 8,
  },
  brewingStepsContainer: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F8F8F8',
    marginBottom: 16,
  },
  brewingStepsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  brewingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  brewingStepInputGroup: {
    marginRight: 12,
  },
  brewingStepLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  brewingStepInput: {
    fontSize: 14,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    width: 80,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addStepButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  removeStepButton: {
    padding: 4,
  },
  totalContainer: {
    marginTop: 16,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E8F4FF',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  notesInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#000000',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999999',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
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
  closeButton: {
    padding: 4,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
