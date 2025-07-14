import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function RecipeForm({ 
  recipeData, 
  setRecipeData, 
  coffeeInfo = null,
  showRemixAttribution = false,
  remixRecipe = null,
  scrollViewRef = null,
  onSave,
  isDarkMode
}) {
  const { theme } = useTheme();
  
  // Selector states
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [showGearSelector, setShowGearSelector] = useState(false);
  const [showGrinderSelector, setShowGrinderSelector] = useState(false);

  // Define options arrays
  const brewingMethods = ['V60', 'Chemex', 'AeroPress', 'French Press', 'Espresso', 'Kalita Wave', 'Siphon'];
  const gearOptions = ['V60', 'Chemex', 'AeroPress', 'French Press', 'Espresso Machine', 'Kalita Wave', 'Siphon', 'Scale', 'Timer', 'Thermometer'];
  const grinderOptions = ['Commandante', 'Baratza Encore', 'Hario Mini Mill', 'Timemore C2', '1Zpresso JX', 'Manual', 'Other'];

  // Handler functions
  const handleMethodSelect = (method) => {
    // Auto-select the coffee maker based on brewing method
    let newGear = [];
    if (method === 'Chemex') {
      newGear = ['Chemex'];
    } else if (method === 'V60') {
      newGear = ['V60'];
    } else if (method === 'AeroPress') {
      newGear = ['AeroPress'];
    } else if (method === 'French Press') {
      newGear = ['French Press'];
    } else if (method === 'Espresso') {
      newGear = ['Espresso Machine'];
    } else if (method === 'Kalita Wave') {
      newGear = ['Kalita Wave'];
    } else if (method === 'Siphon') {
      newGear = ['Siphon'];
    } else {
      // For other methods, keep existing gear or add the method if it exists in gear options
      newGear = [...(recipeData.gear || [])];
      if (gearOptions.includes(method) && !newGear.includes(method)) {
        newGear.push(method);
      }
    }
    setRecipeData({...recipeData, method, gear: newGear});
    setShowMethodSelector(false);
  };
  
  const handleGearToggle = (gearItem) => {
    const currentGear = recipeData.gear || [];
    const newGear = currentGear.includes(gearItem)
      ? currentGear.filter(g => g !== gearItem)
      : [...currentGear, gearItem];
    setRecipeData({...recipeData, gear: newGear});
  };
  
  const handleGrinderSelect = (grinder) => {
    setRecipeData({...recipeData, grinder, clicks: grinder === 'Commandante' ? recipeData.clicks : ''});
    setShowGrinderSelector(false);
  };

  const calculateTotalBrewTime = () => {
    if (recipeData.brewMinutes || recipeData.brewSeconds) {
      const minutes = parseInt(recipeData.brewMinutes) || 0;
      const seconds = parseInt(recipeData.brewSeconds) || 0;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return recipeData.brewTime || '';
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        ref={scrollViewRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 300 }}
        nestedScrollEnabled={true}
      >
        {/* Coffee Info */}
        {coffeeInfo && (
          <View style={[styles.selectedCoffeeContainer, { backgroundColor: theme.altBackground }]}>
            <Image 
              source={{ uri: coffeeInfo.imageUrl || coffeeInfo.image }} 
              style={styles.selectedCoffeeImage} 
            />
            <View style={styles.selectedCoffeeInfo}>
              <Text style={[styles.selectedCoffeeName, { color: theme.primaryText }]}>{coffeeInfo.name}</Text>
              <Text style={[styles.selectedCoffeeRoaster, { color: theme.secondaryText }]}>{coffeeInfo.roaster}</Text>
            </View>
          </View>
        )}
        
        {/* Remix Attribution */}
        {showRemixAttribution && remixRecipe && (
          <View style={[styles.remixAttribution, { backgroundColor: theme.altBackground }]}>
            <Text style={[styles.remixAttributionText, { color: theme.secondaryText }]}>
              Based on recipe by {remixRecipe.userName || remixRecipe.creatorName || 'Unknown'}
            </Text>
          </View>
        )}
        
        <View style={styles.recipeFormContainer}>
          {/* Brewing Method */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Brewing Method *</Text>
            <TouchableOpacity 
              style={[styles.selectorButton, { backgroundColor: theme.altBackground, borderColor: theme.border }]}
              onPress={() => {
                setShowGearSelector(false);
                setShowGrinderSelector(false);
                setShowMethodSelector(!showMethodSelector);
              }}
            >
              <Text style={[styles.selectorButtonText, { color: theme.primaryText }]}>
                {recipeData.method || 'Select brewing method'}
              </Text>
              <Ionicons 
                name={showMethodSelector ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.secondaryText} 
              />
            </TouchableOpacity>
            
            {showMethodSelector && (
              <ScrollView style={[styles.inlineSelector, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                {brewingMethods.map(method => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.inlineSelectorItem,
                      recipeData.method === method && styles.inlineSelectorItemSelected
                    ]}
                    onPress={() => handleMethodSelect(method)}
                  >
                    <Text style={[styles.inlineSelectorText, { color: theme.primaryText }]}>
                      {method}
                    </Text>
                    {recipeData.method === method && (
                      <Ionicons name="checkmark" size={20} color={theme.accent || '#007AFF'} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Coffee Maker */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Coffee Maker</Text>
            <TouchableOpacity 
              style={[styles.selectorButton, { backgroundColor: theme.altBackground, borderColor: theme.border }]}
              onPress={() => {
                setShowMethodSelector(false);
                setShowGrinderSelector(false);
                setShowGearSelector(!showGearSelector);
              }}
            >
              <Text style={[styles.selectorButtonText, { color: theme.primaryText }]}>
                {recipeData.gear?.length > 0 ? recipeData.gear.join(', ') : 'Select coffee maker'}
              </Text>
              <Ionicons 
                name={showGearSelector ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.secondaryText} 
              />
            </TouchableOpacity>
            
            {showGearSelector && (
              <ScrollView style={[styles.inlineSelector, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                {gearOptions.map(gear => (
                  <TouchableOpacity
                    key={gear}
                    style={[
                      styles.inlineSelectorItem,
                      recipeData.gear?.includes(gear) && styles.inlineSelectorItemSelected
                    ]}
                    onPress={() => handleGearToggle(gear)}
                  >
                    <Text style={[styles.inlineSelectorText, { color: theme.primaryText }]}>
                      {gear}
                    </Text>
                    {recipeData.gear?.includes(gear) && (
                      <Ionicons name="checkmark" size={20} color={theme.accent || '#007AFF'} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Grinder */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Grinder</Text>
            <TouchableOpacity 
              style={[styles.selectorButton, { backgroundColor: theme.altBackground, borderColor: theme.border }]}
              onPress={() => {
                setShowMethodSelector(false);
                setShowGearSelector(false);
                setShowGrinderSelector(!showGrinderSelector);
              }}
            >
              <Text style={[styles.selectorButtonText, { color: theme.primaryText }]}>
                {recipeData.grinder || 'Select grinder (optional)'}
              </Text>
              <Ionicons 
                name={showGrinderSelector ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.secondaryText} 
              />
            </TouchableOpacity>
            
            {showGrinderSelector && (
              <ScrollView style={[styles.inlineSelector, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                {grinderOptions.map(grinder => (
                  <TouchableOpacity
                    key={grinder}
                    style={[
                      styles.inlineSelectorItem,
                      recipeData.grinder === grinder && styles.inlineSelectorItemSelected
                    ]}
                    onPress={() => handleGrinderSelect(grinder)}
                  >
                    <Text style={[styles.inlineSelectorText, { color: theme.primaryText }]}>
                      {grinder}
                    </Text>
                    {recipeData.grinder === grinder && (
                      <Ionicons name="checkmark" size={20} color={theme.accent || '#007AFF'} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Grind Size */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>
              {recipeData.grinder === 'Commandante' ? 'Clicks' : 'Grind Size'}
            </Text>
            {recipeData.grinder === 'Commandante' ? (
              <TextInput
                style={[styles.input, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
                value={recipeData.clicks}
                onChangeText={(text) => setRecipeData({...recipeData, clicks: text})}
                placeholder="15"
                keyboardType="numeric"
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                placeholderTextColor={theme.secondaryText}
              />
            ) : (
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => {
                    const sizes = ['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse'];
                    const currentIndex = sizes.indexOf(recipeData.grindSize);
                    if (currentIndex > 0) {
                      setRecipeData({...recipeData, grindSize: sizes[currentIndex - 1]});
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color={theme.primaryText} />
                </TouchableOpacity>
                <Text style={[styles.stepperValue, { color: theme.primaryText }]}>
                  {recipeData.grindSize}
                </Text>
                <TouchableOpacity 
                  style={styles.stepperButton}
                  onPress={() => {
                    const sizes = ['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse'];
                    const currentIndex = sizes.indexOf(recipeData.grindSize);
                    if (currentIndex < sizes.length - 1) {
                      setRecipeData({...recipeData, grindSize: sizes[currentIndex + 1]});
                    }
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.primaryText} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Coffee Amount */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Coffee Amount (g) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
              value={recipeData.amount}
              onChangeText={(text) => setRecipeData({...recipeData, amount: text})}
              placeholder="20"
              keyboardType="numeric"
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              placeholderTextColor={theme.secondaryText}
            />
          </View>

          {/* Water Volume */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Water Volume (ml) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
              value={recipeData.waterVolume}
              onChangeText={(text) => setRecipeData({...recipeData, waterVolume: text})}
              placeholder="300"
              keyboardType="numeric"
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              placeholderTextColor={theme.secondaryText}
            />
          </View>

          {/* Ratio */}
          {recipeData.amount && recipeData.waterVolume && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.primaryText }]}>Ratio</Text>
              <View style={[styles.input, styles.ratioDisplay, { backgroundColor: theme.altBackground, borderColor: theme.border }]}>
                <Text style={[styles.ratioText, { color: theme.primaryText }]}>
                  1:{Math.round((parseFloat(recipeData.waterVolume) / parseFloat(recipeData.amount)) * 10) / 10}
                </Text>
              </View>
            </View>
          )}

          {/* Steps */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Steps (optional)</Text>
            {recipeData.steps?.length === 0 ? (
              <TouchableOpacity 
                style={styles.addStepButton}
                onPress={() => {
                  const newStep = { time: '', water: '', description: '' };
                  setRecipeData({...recipeData, steps: [newStep]});
                }}
              >
                <Ionicons name="add" size={20} color={theme.primaryText} />
                <Text style={[styles.addStepButtonText, { color: theme.primaryText }]}>Add brewing step</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.stepsContainer}>
                {recipeData.steps?.map((step, index) => (
                  <View key={index} style={[styles.stepRow, { backgroundColor: theme.altBackground, borderColor: theme.border }]}>
                    <Text style={[styles.stepNumber, { color: theme.primaryText }]}>{index + 1}</Text>
                    
                    <View style={styles.stepInputs}>
                      <View style={styles.stepInputGroup}>
                        <Text style={[styles.stepInputLabel, { color: theme.secondaryText }]}>Time</Text>
                        <TextInput
                          style={[styles.stepInput, { backgroundColor: theme.cardBackground, color: theme.primaryText, borderColor: theme.border }]}
                          value={step.time}
                          onChangeText={(text) => {
                            const newSteps = [...recipeData.steps];
                            newSteps[index] = {...newSteps[index], time: text};
                            setRecipeData({...recipeData, steps: newSteps});
                          }}
                          placeholder="0:30"
                          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                          placeholderTextColor={theme.secondaryText}
                        />
                      </View>
                      
                      <View style={styles.stepInputGroup}>
                        <Text style={[styles.stepInputLabel, { color: theme.secondaryText }]}>Water (g)</Text>
                        <TextInput
                          style={[styles.stepInput, { backgroundColor: theme.cardBackground, color: theme.primaryText, borderColor: theme.border }]}
                          value={step.water}
                          onChangeText={(text) => {
                            const newSteps = [...recipeData.steps];
                            newSteps[index] = {...newSteps[index], water: text};
                            setRecipeData({...recipeData, steps: newSteps});
                          }}
                          placeholder="50"
                          keyboardType="numeric"
                          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                          placeholderTextColor={theme.secondaryText}
                        />
                      </View>
                      
                      <View style={[styles.stepInputGroup, { flex: 1 }]}>
                        <Text style={[styles.stepInputLabel, { color: theme.secondaryText }]}>Description</Text>
                        <TextInput
                          style={[styles.stepInput, { backgroundColor: theme.cardBackground, color: theme.primaryText, borderColor: theme.border }]}
                          value={step.description}
                          onChangeText={(text) => {
                            const newSteps = [...recipeData.steps];
                            newSteps[index] = {...newSteps[index], description: text};
                            setRecipeData({...recipeData, steps: newSteps});
                          }}
                          placeholder="Pour slowly..."
                          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                          placeholderTextColor={theme.secondaryText}
                        />
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.removeStepButton}
                      onPress={() => {
                        const newSteps = recipeData.steps.filter((_, i) => i !== index);
                        setRecipeData({...recipeData, steps: newSteps});
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <TouchableOpacity 
                  style={styles.addStepButton}
                  onPress={() => {
                    const newStep = { time: '', water: '', description: '' };
                    setRecipeData({...recipeData, steps: [...recipeData.steps, newStep]});
                  }}
                >
                  <Ionicons name="add" size={20} color={theme.primaryText} />
                  <Text style={[styles.addStepButtonText, { color: theme.primaryText }]}>Add another step</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Total Immersion Time */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Total Immersion Time</Text>
            <View style={styles.timeInputContainer}>
              <View style={[styles.timeInputWrapper, { backgroundColor: theme.altBackground, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.timeInput, { color: theme.primaryText }]}
                  value={recipeData.brewMinutes}
                  onChangeText={(text) => setRecipeData({...recipeData, brewMinutes: text})}
                  placeholder="3"
                  keyboardType="numeric"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  placeholderTextColor={theme.secondaryText}
                  maxLength={2}
                />
                <Text style={[styles.timeLabel, { color: theme.secondaryText }]}>min</Text>
              </View>
              <Text style={[styles.timeSeparator, { color: theme.primaryText }]}>:</Text>
              <View style={[styles.timeInputWrapper, { backgroundColor: theme.altBackground, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.timeInput, { color: theme.primaryText }]}
                  value={recipeData.brewSeconds}
                  onChangeText={(text) => setRecipeData({...recipeData, brewSeconds: text})}
                  placeholder="30"
                  keyboardType="numeric"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  placeholderTextColor={theme.secondaryText}
                  maxLength={2}
                />
                <Text style={[styles.timeLabel, { color: theme.secondaryText }]}>sec</Text>
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
              value={recipeData.notes}
              onChangeText={(text) => setRecipeData({...recipeData, notes: text})}
              placeholder="Any brewing notes..."
              multiline
              textAlignVertical="top"
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              placeholderTextColor={theme.secondaryText}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  selectedCoffeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  selectedCoffeeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  selectedCoffeeInfo: {
    flex: 1,
  },
  selectedCoffeeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedCoffeeRoaster: {
    fontSize: 14,
  },
  remixAttribution: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 12,
  },
  remixAttributionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  recipeFormContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorButtonText: {
    fontSize: 16,
  },
  inlineSelector: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  inlineSelectorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  inlineSelectorItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  inlineSelectorText: {
    fontSize: 16,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
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
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  ratioDisplay: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 44,
  },
  ratioText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  stepInputs: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
    marginRight: 8,
  },
  stepInputGroup: {
    marginRight: 8,
    minWidth: 60,
  },
  stepInputLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  stepInput: {
    fontSize: 14,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed',
  },
  addStepButtonText: {
    fontSize: 16,
    marginLeft: 6,
  },
  removeStepButton: {
    padding: 8,
    marginTop: 4,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  timeInput: {
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14,
    marginLeft: 4,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '500',
    marginHorizontal: 8,
  },
});