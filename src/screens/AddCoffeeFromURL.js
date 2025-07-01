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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddCoffeeFromURL({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { addToCollection } = useCoffee();
  const insets = useSafeAreaInsets();
  
  const [url, setUrl] = useState(route.params?.url || '');
  const [isLoading, setIsLoading] = useState(false);
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
    roastDate: '',
    bagSize: ''
  });
  
  const [addToUserCollection, setAddToUserCollection] = useState(false);
  
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

  // Auto-parse URL if provided via route params
  useEffect(() => {
    if (route.params?.url && route.params.url.trim()) {
      parseURL(route.params.url.trim());
    }
  }, [route.params?.url]);
  
  // Parse URL and extract coffee data
  const parseURL = async (inputUrl) => {
    setIsLoading(true);
    
    try {
      // Simulate API call to parse URL
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use consistent mock data for any URL
      const mockData = {
        name: 'Colombia La Primavera',
        roaster: 'Intelligentsia Coffee',
        origin: 'Colombia',
        region: 'Huila',
        producer: 'Finca La Primavera',
        altitude: '1,750m',
        varietal: 'Caturra, Castillo',
        process: 'Washed',
        profile: 'Caramel, red apple, milk chocolate',
        price: '€21.50',
        description: 'A beautifully balanced Colombian coffee with sweet caramel notes and a crisp, apple-like acidity. The finish is reminiscent of milk chocolate, creating a comforting and refined cup.',
        image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
      };
      
      // Validate URL format before accepting
      if (!inputUrl.startsWith('http://') && !inputUrl.startsWith('https://')) {
        throw new Error('Invalid URL format');
      }
      
      setCoffeeData(mockData);
      
    } catch (error) {
      let errorMessage = 'Failed to parse URL. Please check the URL and try again.';
      if (error.message === 'Invalid URL format') {
        errorMessage = 'Please enter a valid URL starting with http:// or https://';
      }
      
      Alert.alert('Error', errorMessage, [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleParseURL = () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    
    parseURL(url);
  };
  
  const handleSave = async () => {
    if (!coffeeData.name || !coffeeData.roaster) {
      Alert.alert('Error', 'Please ensure coffee name and roaster are filled', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }
    
    try {
      const newCoffee = {
        id: `coffee-${Date.now()}`,
        ...coffeeData,
        addedAt: new Date().toISOString()
      };

      // Add to collection if checkbox is checked
      if (addToUserCollection) {
        if (addToCollection) {
          await addToCollection(newCoffee);
        }
        Alert.alert(
          'Success', 
          'Coffee added to your collection and the database!', 
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
        );
      } else {
        // Just add to the database
        if (addToCollection) {
          await addToCollection({
            ...newCoffee,
            addToCollectionOnly: false
          });
        }
        Alert.alert(
          'Success', 
          'Coffee added to the database!', 
          [{ text: 'OK', onPress: () => navigation.goBack() }],
          { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
        );
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to add coffee', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    }
  };
  
  const renderFormField = (label, key, placeholder, multiline = false) => (
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
      />
    </View>
  );
  
  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* URL Input Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Coffee URL</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Paste a URL from a coffee website to automatically extract coffee details
          </Text>
          
          <TextInput
            style={[
              styles.urlInput,
              { 
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.primaryText
              }
            ]}
            value={url}
            onChangeText={setUrl}
            placeholder="https://example.com/coffee-product"
            placeholderTextColor={theme.secondaryText}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          
          <TouchableOpacity
            style={[
              styles.parseButton,
              { backgroundColor: url.trim() ? theme.primaryText : theme.border }
            ]}
            onPress={handleParseURL}
            disabled={!url.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.background} size="small" />
            ) : (
              <Text style={[
                styles.parseButtonText,
                { color: url.trim() ? theme.background : theme.secondaryText }
              ]}>
                Parse URL
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Coffee Details Form */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Coffee Details</Text>
          
          {renderFormField('Coffee Name*', 'name', 'Enter coffee name')}
          {renderFormField('Roaster*', 'roaster', 'Enter roaster name')}
          {renderFormField('Origin', 'origin', 'Country of origin')}
          {renderFormField('Region', 'region', 'Growing region')}
          {renderFormField('Producer', 'producer', 'Farm or producer name')}
          {renderFormField('Altitude', 'altitude', 'Growing altitude')}
          {renderFormField('Varietal', 'varietal', 'Coffee varietal')}
          {renderFormField('Process', 'process', 'Processing method')}
          {renderFormField('Flavor Profile', 'profile', 'Tasting notes')}
          {renderFormField('Price', 'price', 'Price per bag')}
          {renderFormField('Description', 'description', 'Additional details about this coffee', true)}
          
          {/* Add to Collection Section */}
          <View style={styles.addToCollectionSection}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAddToUserCollection(!addToUserCollection)}
            >
              <View style={[
                styles.checkbox,
                { borderColor: theme.primaryText },
                addToUserCollection && { backgroundColor: theme.primaryText }
              ]}>
                {addToUserCollection && (
                  <Ionicons name="checkmark" size={16} color={theme.background} />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.primaryText }]}>
                Add to my collection
              </Text>
            </TouchableOpacity>
            
            {/* Additional fields when adding to collection */}
            {addToUserCollection && (
              <View style={styles.collectionFields}>
                {renderFormField('Roast Date', 'roastDate', 'e.g., 2024-01-15 (optional)')}
                {renderFormField('Bag Size', 'bagSize', 'e.g., 250g (optional)')}
              </View>
            )}
          </View>
        </View>
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
  urlInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  parseButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  parseButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addToCollectionSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  collectionFields: {
    marginTop: 8,
  },
}); 