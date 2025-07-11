import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockCafes from '../data/mockCafes.json';

export default function AddCoffeeManually({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { addToCollection } = useCoffee();
  const insets = useSafeAreaInsets();
  
  const [coffeeData, setCoffeeData] = useState({
    name: '',
    roaster: '',
    origin: '',
    region: '',
    producer: '',
    altitude: '',
    varietal: '',
    process: '',
    profile: '',
    description: '',
    image: '',
    roastLevel: '',
    certifications: '',
    // Collection-specific fields
    price: '',
    bagSize: '',
    roastDate: '',
  });
  
  const [addToCollectionEnabled, setAddToCollectionEnabled] = useState(false);
  const [roasterSuggestions, setRoasterSuggestions] = useState([]);
  const [showRoasterSuggestions, setShowRoasterSuggestions] = useState(false);
  
  // Get roaster suggestions from mockCafes.json
  const allRoasters = mockCafes.roasters || [];
  
  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.divider,
      },
      headerTintColor: theme.primaryText,
      headerTitleStyle: {
        color: theme.primaryText,
        fontWeight: '600',
      },
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={!coffeeData.name || !coffeeData.roaster}
        >
          <Text style={[
            styles.saveButtonText, 
            { color: coffeeData.name && coffeeData.roaster ? theme.primaryText : theme.secondaryText }
          ]}>
            Save
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, coffeeData.name, coffeeData.roaster]);
  
  // Handle roaster input changes
  const handleRoasterChange = (text) => {
    setCoffeeData(prev => ({ ...prev, roaster: text }));
    
    if (text.trim()) {
      // Filter roasters based on input
      const filtered = allRoasters.filter(roaster =>
        roaster.name.toLowerCase().includes(text.toLowerCase())
      );
      setRoasterSuggestions(filtered);
      setShowRoasterSuggestions(true);
    } else {
      setShowRoasterSuggestions(false);
    }
  };
  
  // Handle roaster selection from suggestions
  const handleRoasterSelect = (roaster) => {
    setCoffeeData(prev => ({ ...prev, roaster: roaster.name }));
    setShowRoasterSuggestions(false);
  };
  
  // Handle roaster input focus
  const handleRoasterFocus = () => {
    if (allRoasters.length > 0) {
      setRoasterSuggestions(allRoasters);
      setShowRoasterSuggestions(true);
    }
  };
  
  // Handle roaster input blur
  const handleRoasterBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowRoasterSuggestions(false);
    }, 200);
  };
  
  const handleSave = async () => {
    if (!coffeeData.name || !coffeeData.roaster) {
      Alert.alert('Error', 'Please ensure coffee name and roaster are filled', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    
    try {
      // Add to collection if enabled
      if (addToCollectionEnabled && addToCollection) {
        const newCoffee = {
          id: `coffee-${Date.now()}`,
          ...coffeeData,
          addedAt: new Date().toISOString()
        };
        
        await addToCollection(newCoffee);
      }
      
      Alert.alert(
        'Success', 
        addToCollectionEnabled ? 'Coffee added to your collection!' : 'Coffee saved successfully!', 
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save coffee', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    }
  };
  
  const renderFormField = (label, key, placeholder, multiline = false, keyboardType = 'default') => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>{label}</Text>
      <TextInput
        style={[
          multiline ? styles.textAreaInput : styles.textInput,
          { 
            backgroundColor: theme.altBackground,
            borderColor: theme.border,
            color: theme.primaryText
          }
        ]}
        value={coffeeData[key]}
        onChangeText={(text) => setCoffeeData(prev => ({ ...prev, [key]: text }))}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        keyboardAppearance={isDarkMode ? 'dark' : 'light'}
      />
    </View>
  );
  
  const renderRoasterField = () => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Roaster*</Text>
      <View style={styles.roasterInputContainer}>
        <TextInput
          style={[
            styles.textInput,
            { 
              backgroundColor: theme.altBackground,
              borderColor: theme.border,
              color: theme.primaryText
            }
          ]}
          value={coffeeData.roaster}
          onChangeText={handleRoasterChange}
          onFocus={handleRoasterFocus}
          onBlur={handleRoasterBlur}
          placeholder="e.g., Kima Coffee, Toma Café"
          placeholderTextColor={theme.secondaryText}
          keyboardAppearance={isDarkMode ? 'dark' : 'light'}
        />
        {showRoasterSuggestions && roasterSuggestions.length > 0 && (
          <View style={[styles.suggestionsList, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <FlatList
              data={roasterSuggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.suggestionItem, { borderBottomColor: theme.divider }]}
                  onPress={() => handleRoasterSelect(item)}
                >
                  <Text style={[styles.suggestionText, { color: theme.primaryText }]}>{item.name}</Text>
                  <Text style={[styles.suggestionLocation, { color: theme.secondaryText }]}>{item.location}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsScrollView}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}
      </View>
    </View>
  );
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Basic Information</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Enter the essential details about this coffee
          </Text>
          
          {renderFormField('Coffee Name*', 'name', 'e.g., Single Origin Ethiopia Sidamo')}
          {renderRoasterField()}
          {renderFormField('Image URL', 'image', 'https://example.com/coffee-image.jpg', false, 'url')}
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        {/* Origin Details */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Origin & Processing</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Information about where and how this coffee was grown and processed
          </Text>
          
          {renderFormField('Origin Country', 'origin', 'e.g., Ethiopia, Colombia, Guatemala')}
          {renderFormField('Region', 'region', 'e.g., Sidamo, Huila, Antigua')}
          {renderFormField('Producer/Farm', 'producer', 'e.g., Duromina Cooperative')}
          {renderFormField('Altitude', 'altitude', 'e.g., 1,900m, 6,200ft')}
          {renderFormField('Varietal', 'varietal', 'e.g., Heirloom, Bourbon, Geisha')}
          {renderFormField('Processing Method', 'process', 'e.g., Washed, Natural, Honey')}
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        {/* Roasting & Quality */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Roasting & Quality</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Details about the roasting and quality aspects
          </Text>
          
          {renderFormField('Roast Level', 'roastLevel', 'e.g., Light, Medium, Dark')}
          {renderFormField('Certifications', 'certifications', 'e.g., Organic, Fair Trade, Bird Friendly')}
          {renderFormField('Flavor Profile', 'profile', 'e.g., Bright, floral, with notes of bergamot and chocolate', true)}
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        {/* Additional Notes */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Additional Notes</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Any other details or personal notes about this coffee
          </Text>
          
          {renderFormField('Description', 'description', 'Share your thoughts, brewing recommendations, or any other details about this coffee...', true)}
        </View>
        
        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.divider }]} />
        
        {/* Add to Collection */}
        <View style={[styles.section, { backgroundColor: theme.background }]}>
          <View style={styles.collectionToggleContainer}>
            <View style={styles.collectionToggleContent}>
              <Text style={[styles.sectionTitle, { color: theme.primaryText, marginBottom: 4 }]}>Add to my collection</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.secondaryText, marginBottom: 0 }]}>
                Track your coffee inventory and get notifications
              </Text>
            </View>
            <Switch
              value={addToCollectionEnabled}
              onValueChange={setAddToCollectionEnabled}
              trackColor={{ false: theme.divider, true: theme.accent || '#34C759' }}
              thumbColor={addToCollectionEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          {addToCollectionEnabled && (
            <View style={styles.collectionFields}>
              {renderFormField('Price', 'price', 'e.g., €18.50', false, 'numeric')}
              {renderFormField('Bag Size', 'bagSize', 'e.g., 12oz, 340g')}
              {renderFormField('Roast Date', 'roastDate', 'e.g., 2024-01-15', false, 'default')}
            </View>
          )}
        </View>
        
        {/* Bottom padding for safe area */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  roasterInputContainer: {
    position: 'relative',
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsScrollView: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  suggestionLocation: {
    fontSize: 14,
    marginTop: 2,
  },
  collectionToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  collectionToggleContent: {
    flex: 1,
    marginRight: 16,
  },
  collectionFields: {
    marginTop: 8,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 