import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const AddGearManually = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  
  // Form state based on Supabase gear table schema
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    description: '',
    price: '',
    image_url: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Predefined categories for dropdown-like selection
  const categories = [
    'Brewers',
    'Grinders', 
    'Kettles',
    'Scales',
    'Accessories',
    'Filters',
    'Other'
  ];
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }
    
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number';
    }
    
    if (formData.image_url && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate a unique ID for the gear
      const gearId = `gear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare data for Supabase
      const gearData = {
        id: gearId,
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        category: formData.category.trim(),
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        image_url: formData.image_url.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Inserting gear data:', gearData);
      
      const { data, error } = await supabase
        .from('gear')
        .insert([gearData])
        .select();
      
      if (error) {
        console.error('Error inserting gear:', error);
        Alert.alert('Error', 'Failed to add gear. Please try again.');
        return;
      }
      
      console.log('Gear added successfully:', data);
      
      Alert.alert(
        'Success',
        'Gear added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to gear list
              navigation.goBack();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error adding gear:', error);
      Alert.alert('Error', 'Failed to add gear. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderInput = (field, label, placeholder, options = {}) => {
    const {
      multiline = false,
      keyboardType = 'default',
      autoCapitalize = 'sentences'
    } = options;
    
    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.primaryText }]}>
          {label}
          {(field === 'name' || field === 'brand' || field === 'category') && (
            <Text style={styles.required}> *</Text>
          )}
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.surface,
              borderColor: errors[field] ? '#FF3B30' : theme.border,
              color: theme.primaryText
            },
            multiline && styles.multilineInput
          ]}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          placeholder={placeholder}
          placeholderTextColor={theme.secondaryText}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {errors[field] && (
          <Text style={styles.errorText}>{errors[field]}</Text>
        )}
      </View>
    );
  };
  
  const renderCategorySelector = () => {
    return (
      <View style={styles.inputContainer}>
        <Text style={[styles.label, { color: theme.primaryText }]}>
          Category <Text style={styles.required}>*</Text>
        </Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                { 
                  backgroundColor: formData.category === category 
                    ? (isDarkMode ? theme.primaryText : '#000000')
                    : theme.surface,
                  borderColor: formData.category === category 
                    ? (isDarkMode ? theme.primaryText : '#000000')
                    : theme.border
                }
              ]}
              onPress={() => handleInputChange('category', category)}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  { 
                    color: formData.category === category 
                      ? (isDarkMode ? theme.background : '#FFFFFF')
                      : theme.primaryText
                  }
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {errors.category && (
          <Text style={styles.errorText}>{errors.category}</Text>
        )}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.primaryText} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.primaryText }]}>Add Gear</Text>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.form}>
            {renderInput('name', 'Name', 'Enter gear name')}
            
            {renderInput('brand', 'Brand', 'Enter brand name')}
            
            {renderCategorySelector()}
            
            {renderInput('description', 'Description', 'Enter gear description (optional)', {
              multiline: true,
              autoCapitalize: 'sentences'
            })}
            
            {renderInput('price', 'Price (€)', 'Enter price (optional)', {
              keyboardType: 'decimal-pad',
              autoCapitalize: 'none'
            })}
            
            {renderInput('image_url', 'Image URL', 'Enter image URL (optional)', {
              keyboardType: 'url',
              autoCapitalize: 'none'
            })}
            
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: isDarkMode ? theme.primaryText : '#000000',
                  opacity: loading ? 0.7 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[
                styles.submitButtonText,
                { color: isDarkMode ? theme.background : '#FFFFFF' }
              ]}>
                {loading ? 'Adding Gear...' : 'Add Gear'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddGearManually; 