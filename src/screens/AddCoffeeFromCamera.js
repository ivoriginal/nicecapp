import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
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
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AddCoffeeFromCamera({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { addToCollection } = useCoffee();
  const insets = useSafeAreaInsets();
  
  const [capturedImage, setCapturedImage] = useState(route.params?.capturedImage || null);
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
    if (route.params?.capturedImage) {
      handleScanImage(route.params.capturedImage);
    }
  }, [route.params?.capturedImage]);
  
  // Simulate camera capture
  const handleTakePhoto = async () => {
    try {
      // In a real app, this would use expo-camera or react-native-image-picker
      // For now, simulate with a mock image
      const mockImageUri = 'https://images.unsplash.com/photo-1447933601403-0c6688de566e';
      setCapturedImage(mockImageUri);
      
      // Automatically start OCR scanning
      handleScanImage(mockImageUri);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    }
  };
  
  // Simulate OCR scanning
  const handleScanImage = async (imageUri) => {
    setIsScanning(true);
    
    try {
      // Simulate OCR processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR results - in real app, this would use OCR service like Google Vision API
      const mockOCRData = {
        name: 'Colombia La Esperanza',
        roaster: 'Counter Culture Coffee',
        origin: 'Colombia',
        region: 'Huila',
        producer: 'Rodrigo Sanchez',
        altitude: '1,650m',
        varietal: 'Caturra, Castillo',
        process: 'Fully Washed',
        profile: 'Chocolate, caramel, orange zest',
        price: '€19.95',
        description: 'A well-balanced coffee with rich chocolate notes and bright citrus acidity.',
        image: imageUri
      };
      
      setCoffeeData(mockOCRData);
      setScanComplete(true);
      
    } catch (error) {
      // Show "no coffee found" message for unrelated images
      Alert.alert(
        'No Coffee Found', 
        'We couldn\'t find coffee information in this image. Please try taking a clearer photo of the coffee bag or label.', 
        [], 
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
      );
    } finally {
      setIsScanning(false);
    }
  };
  
  const handleRetakePhoto = () => {
    setCapturedImage(null);
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
        {/* Camera Section */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Take Photo</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
            Take a clear photo of the coffee bag to automatically extract details
          </Text>
          
          {!capturedImage ? (
            <TouchableOpacity
              style={[styles.cameraButton, { borderColor: theme.border }]}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera-outline" size={48} color={theme.secondaryText} />
              <Text style={[styles.cameraButtonText, { color: theme.secondaryText }]}>
                Tap to take photo
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              
              {isScanning && (
                <View style={styles.scanningOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.scanningText}>Scanning coffee details...</Text>
                </View>
              )}
              
              {scanComplete && (
                <View style={styles.scanCompleteOverlay}>
                  <Ionicons name="checkmark-circle" size={48} color="#34C759" />
                  <Text style={styles.scanCompleteText}>Scan complete!</Text>
                </View>
              )}
              
              <TouchableOpacity
                style={[styles.retakeButton, { backgroundColor: theme.primaryText }]}
                onPress={handleRetakePhoto}
              >
                <Text style={[styles.retakeButtonText, { color: theme.background }]}>
                  Retake Photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Coffee Details Form - Only show after image is captured */}
        {capturedImage && (
          <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Coffee Details</Text>
            {scanComplete && (
              <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>
                Review and edit the extracted information
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
  cameraButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  cameraButtonText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  capturedImage: {
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
  retakeButton: {
    marginTop: 12,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retakeButtonText: {
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