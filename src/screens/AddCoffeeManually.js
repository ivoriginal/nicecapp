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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    price: '',
    description: '',
    image: '',
    // Additional fields for comprehensive coffee data
    roastLevel: '',
    roastDate: '',
    bagSize: '',
    certifications: '',
    cupping: {
      acidity: '',
      body: '',
      sweetness: '',
      complexity: ''
    }
  });
  
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
  
  const handleSave = async () => {
    if (!coffeeData.name || !coffeeData.roaster) {
      Alert.alert('Error', 'Please ensure coffee name and roaster are filled', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    
    try {
      // Add to collection
      if (addToCollection) {
        const newCoffee = {
          id: `coffee-${Date.now()}`,
          ...coffeeData,
          // Flatten cupping scores into stats for compatibility
          stats: {
            acidity: coffeeData.cupping.acidity ? parseInt(coffeeData.cupping.acidity) : null,
            body: coffeeData.cupping.body ? parseInt(coffeeData.cupping.body) : null,
            sweetness: coffeeData.cupping.sweetness ? parseInt(coffeeData.cupping.sweetness) : null,
            complexity: coffeeData.cupping.complexity ? parseInt(coffeeData.cupping.complexity) : null,
          },
          addedAt: new Date().toISOString()
        };
        
        await addToCollection(newCoffee);
      }
      
      Alert.alert(
        'Success', 
        'Coffee added to your collection!', 
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to add coffee to collection', [], {
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
            backgroundColor: theme.cardBackground,
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
      />
    </View>
  );
  
  const renderCuppingField = (label, key, placeholder) => (
    <View style={styles.cuppingFieldContainer}>
      <Text style={[styles.cuppingFieldLabel, { color: theme.primaryText }]}>{label}</Text>
      <TextInput
        style={[
          styles.cuppingInput,
          { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            color: theme.primaryText
          }
        ]}
        value={coffeeData.cupping[key]}
        onChangeText={(text) => setCoffeeData(prev => ({ 
          ...prev, 
          cupping: { ...prev.cupping, [key]: text } 
        }))}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        keyboardType="numeric"
        maxLength={2}
      />
      <Text style={[styles.scaleText, { color: theme.secondaryText }]}>/10</Text>
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
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Basic Information</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Enter the essential details about this coffee
          </Text>
          
          {renderFormField('Coffee Name*', 'name', 'e.g., Single Origin Ethiopia Sidamo')}
          {renderFormField('Roaster*', 'roaster', 'e.g., Blue Bottle Coffee')}
          {renderFormField('Price', 'price', 'e.g., €18.50', false, 'numeric')}
          {renderFormField('Bag Size', 'bagSize', 'e.g., 12oz, 340g')}
          {renderFormField('Image URL', 'image', 'https://example.com/coffee-image.jpg', false, 'url')}
        </View>
        
        {/* Origin Details */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
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
        
        {/* Roasting & Quality */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Roasting & Quality</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Details about the roasting and quality aspects
          </Text>
          
          {renderFormField('Roast Level', 'roastLevel', 'e.g., Light, Medium, Dark')}
          {renderFormField('Roast Date', 'roastDate', 'e.g., 2024-01-15', false, 'default')}
          {renderFormField('Certifications', 'certifications', 'e.g., Organic, Fair Trade, Bird Friendly')}
          {renderFormField('Flavor Profile', 'profile', 'e.g., Bright, floral, with notes of bergamot and chocolate', true)}
        </View>
        
        {/* Cupping Scores */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Cupping Scores</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Rate different aspects of this coffee on a scale of 1-10 (optional)
          </Text>
          
          <View style={styles.cuppingGrid}>
            {renderCuppingField('Acidity', 'acidity', '8')}
            {renderCuppingField('Body', 'body', '7')}
            {renderCuppingField('Sweetness', 'sweetness', '9')}
            {renderCuppingField('Complexity', 'complexity', '8')}
          </View>
        </View>
        
        {/* Additional Notes */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Additional Notes</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Any other details or personal notes about this coffee
          </Text>
          
          {renderFormField('Description', 'description', 'Share your thoughts, brewing recommendations, or any other details about this coffee...', true)}
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
    margin: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  cuppingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cuppingFieldContainer: {
    width: '48%',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cuppingFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  cuppingInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    width: 50,
    textAlign: 'center',
    marginRight: 4,
  },
  scaleText: {
    fontSize: 14,
    fontWeight: '500',
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