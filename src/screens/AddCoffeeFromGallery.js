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
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddCoffeeFromGallery({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { addToCollection } = useCoffee();
  const insets = useSafeAreaInsets();
  
  const [selectedImage, setSelectedImage] = useState(route.params?.selectedImage || null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
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

  // Auto-scan image if provided via route params
  useEffect(() => {
    if (route.params?.selectedImage) {
      handleScanImage(route.params.selectedImage);
    }
  }, [route.params?.selectedImage]);
  
  // Simulate image picker
  const handleSelectImage = async () => {
    try {
      // In a real app, this would use expo-image-picker
      // For now, simulate with a mock image selection
      
      // Simulate random selection - sometimes coffee, sometimes not
      const isCoffeeImage = Math.random() > 0.3; // 70% chance it's a coffee image
      
      if (isCoffeeImage) {
        const mockImageUri = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e';
        setSelectedImage(mockImageUri);
        
        // Automatically start OCR scanning
        handleScanImage(mockImageUri);
      } else {
        // Simulate selecting a non-coffee image
        const nonCoffeeImages = [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', // landscape
          'https://images.unsplash.com/photo-1574169208507-84376144848b', // person
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8' // food
        ];
        const randomImage = nonCoffeeImages[Math.floor(Math.random() * nonCoffeeImages.length)];
        setSelectedImage(randomImage);
        
        // Try to scan but will fail
        handleScanImage(randomImage, false);
      }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to select image. Please try again.', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    }
  };
  
  // Simulate OCR scanning
  const handleScanImage = async (imageUri, isCoffeeImage = true) => {
    setIsScanning(true);
    
    try {
      // Simulate OCR processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (isCoffeeImage) {
        // Mock OCR results for coffee images
        const mockOCRData = {
          name: 'Guatemala Antigua Volcano',
          roaster: 'Stumptown Coffee Roasters',
          origin: 'Guatemala',
          region: 'Antigua',
          producer: 'Finca Santa Isabel',
          altitude: '1,500m',
          varietal: 'Bourbon, Caturra',
          process: 'Fully Washed',
          profile: 'Dark chocolate, spice, full body',
          price: '€16.50',
          description: 'A classic Central American coffee with rich body and chocolate notes.',
          image: imageUri
        };
        
        setCoffeeData(mockOCRData);
        setScanComplete(true);
      } else {
        // No coffee found in image
        throw new Error('No coffee found');
      }
      
    } catch (error) {
      // Show "no coffee found" message for unrelated images
      Alert.alert(
        'No Coffee Found Here', 
        'We couldn\'t find coffee information in this image. Please select a clear photo of a coffee bag or label.', 
        [
          {
            text: 'Try Another Photo',
            onPress: () => {
              setSelectedImage(null);
              setScanComplete(false);
            }
          },
          {
            text: 'Enter Manually',
            onPress: () => {
              setScanComplete(true);
              // Keep the image but don't fill data
            }
          }
        ],
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
      );
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleSelectDifferentImage = () => {
    setSelectedImage(null);
    setScanComplete(false);
    setCoffeeData({
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
      image: ''
    });
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
        {/* Image Selection Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Select Photo</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Choose a photo from your gallery to automatically extract coffee details
          </Text>
          
          {!selectedImage ? (
            <TouchableOpacity
              style={[styles.galleryButton, { borderColor: theme.border }]}
              onPress={handleSelectImage}
            >
              <Ionicons name="image-outline" size={48} color={theme.secondaryText} />
              <Text style={[styles.galleryButtonText, { color: theme.secondaryText }]}>
                Tap to select from gallery
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.scanningText}>Scanning coffee details...</Text>
                </View>
              )}
              
              {scanComplete && coffeeData.name && (
                <View style={styles.scanCompleteOverlay}>
                  <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                  <Text style={styles.scanCompleteText}>Scan complete!</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.changeImageButton, { backgroundColor: theme.primaryText }]}
                onPress={handleSelectDifferentImage}
              >
                <Text style={[styles.changeImageButtonText, { color: theme.background }]}>
                  Select Different Photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Coffee Details Form - Only show after image is selected */}
        {selectedImage && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Coffee Details</Text>
            {scanComplete && coffeeData.name && (
              <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                Review and edit the extracted information
              </Text>
            )}
            {scanComplete && !coffeeData.name && (
              <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                Please enter the coffee details manually
              </Text>
            )}
            
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
        )}
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
  galleryButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  galleryButtonText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  scanCompleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(52, 199, 89, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  scanCompleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  changeImageButton: {
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  changeImageButtonText: {
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