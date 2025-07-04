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
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReviewCoffeeScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { addToCollection } = useCoffee();
  const insets = useSafeAreaInsets();

  // Draft coming from previous step (may be empty)
  const incomingDraft = route.params?.coffeeDraft || {};

  const [coffeeData, setCoffeeData] = useState({
    // Basic info – fall back to empty strings
    name: incomingDraft.name || '',
    roaster: incomingDraft.roaster || '',
    origin: incomingDraft.origin || '',
    region: incomingDraft.region || '',
    producer: incomingDraft.producer || '',
    altitude: incomingDraft.altitude || '',
    varietal: incomingDraft.varietal || '',
    process: incomingDraft.process || '',
    profile: incomingDraft.profile || '',
    price: incomingDraft.price || '',
    description: incomingDraft.description || '',
    image: incomingDraft.image || '',
    roastLevel: incomingDraft.roastLevel || '',
    roastDate: incomingDraft.roastDate || '',
    bagSize: incomingDraft.bagSize || '',
    certifications: incomingDraft.certifications || '',
    cupping: {
      acidity: incomingDraft.cupping?.acidity || '',
      body: incomingDraft.cupping?.body || '',
      sweetness: incomingDraft.cupping?.sweetness || '',
      complexity: incomingDraft.cupping?.complexity || '',
    },
  });

  // Header config
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
      title: 'Review Coffee',
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={!coffeeData.name || !coffeeData.roaster}
        >
          <Text
            style={[
              styles.saveButtonText,
              { color: coffeeData.name && coffeeData.roaster ? theme.primaryText : theme.secondaryText },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, coffeeData.name, coffeeData.roaster]);

  const handleSave = async () => {
    if (!coffeeData.name || !coffeeData.roaster) {
      Alert.alert('Error', 'Please ensure coffee name and roaster are filled', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light',
      });
      return;
    }

    try {
      const newCoffee = {
        id: `coffee-${Date.now()}`,
        ...coffeeData,
        stats: {
          acidity: coffeeData.cupping.acidity ? parseInt(coffeeData.cupping.acidity) : null,
          body: coffeeData.cupping.body ? parseInt(coffeeData.cupping.body) : null,
          sweetness: coffeeData.cupping.sweetness ? parseInt(coffeeData.cupping.sweetness) : null,
          complexity: coffeeData.cupping.complexity ? parseInt(coffeeData.cupping.complexity) : null,
        },
        addedAt: new Date().toISOString(),
      };

      if (addToCollection) {
        await addToCollection(newCoffee);
      }

      Alert.alert(
        'Success',
        'Coffee added to your collection!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' },
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add coffee to collection', [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light',
      });
    }
  };

  const renderFormField = (label, key, placeholder, multiline = false, keyboardType = 'default') => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>{label}</Text>
      <TextInput
        style={[multiline ? styles.textAreaInput : styles.textInput, { backgroundColor: theme.cardBackground, borderColor: theme.border, color: theme.primaryText }]}
        value={coffeeData[key]}
        onChangeText={(text) => setCoffeeData((prev) => ({ ...prev, [key]: text }))}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image preview */}
        {coffeeData.image ? (
          <View style={[styles.imagePreviewContainer, { backgroundColor: theme.cardBackground }]}>
            <Image source={{ uri: coffeeData.image }} style={styles.previewImage} resizeMode="cover" />
          </View>
        ) : null}

        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Basic Information</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.secondaryText }]}>Review the details we found — edit anything you need.</Text>

          {renderFormField('Coffee Name*', 'name', 'e.g., Ethiopia Guji')}
          {renderFormField('Roaster*', 'roaster', 'e.g., Proud Mary')}
          {renderFormField('Price', 'price', 'e.g., €18.50', false, 'numeric')}
          {renderFormField('Bag Size', 'bagSize', 'e.g., 250g')}
          {renderFormField('Image URL', 'image', 'https://example.com/coffee.jpg', false, 'url')}
        </View>

        {/* Origin & Processing */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Origin & Processing</Text>
          {renderFormField('Origin Country', 'origin', 'e.g., Ethiopia')}
          {renderFormField('Region', 'region', 'e.g., Sidamo')}
          {renderFormField('Producer/Farm', 'producer', 'e.g., Test Farm')}
          {renderFormField('Altitude', 'altitude', 'e.g., 1,900m')}
          {renderFormField('Varietal', 'varietal', 'e.g., Heirloom')}
          {renderFormField('Process', 'process', 'e.g., Washed')}
        </View>

        {/* Flavor & Notes */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Flavor & Notes</Text>
          {renderFormField('Flavor Profile', 'profile', 'e.g., Floral, citrus, tea-like', true)}
          {renderFormField('Description', 'description', 'Any other notes…', true)}
        </View>

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
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
});