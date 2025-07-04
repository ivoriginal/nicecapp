import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

/*
  Simple screen shown modally from CafesListScreen.  
  Props:
    onSave(cafeObject)   – called with the new cafe when the user taps Save
    onCancel()           – called when the user dismisses the modal
*/
const AddCafeScreen = ({ onSave, onCancel }) => {
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // Local form state
  const [cafeData, setCafeData] = useState({
    name: '',
    location: '',
    city: '',
    mapsUrl: '',
    description: '',
    coverImage: '',
    logoImage: '',
  });

  // ---------------- Google Maps URL parsing ----------------
  const parseGoogleMapsUrl = (url) => {
    if (!url) return {};
    let name = '';
    let latitude = '';
    let longitude = '';

    try {
      // Match /place/<NAME>/@
      const placeMatch = url.match(/\/place\/([^/@]+)/);
      if (placeMatch && placeMatch[1]) {
        name = decodeURIComponent(placeMatch[1]).replace(/\+/g, ' ');
      }
      // Match coordinates after @lat,lng,
      const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        latitude = coordMatch[1];
        longitude = coordMatch[2];
      }
      // Alternate: q=lat,lng
      const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
        latitude = latitude || qMatch[1];
        longitude = longitude || qMatch[2];
      }
    } catch (err) {
      // Silently ignore parse errors
    }

    return { name, latitude, longitude };
  };

  useEffect(() => {
    if (cafeData.mapsUrl && cafeData.mapsUrl.includes('maps')) {
      const parsed = parseGoogleMapsUrl(cafeData.mapsUrl);
      if (parsed.name && !cafeData.name) {
        setCafeData((prev) => ({ ...prev, name: parsed.name }));
      }
      if (parsed.latitude && parsed.longitude && !cafeData.location) {
        setCafeData((prev) => ({
          ...prev,
          location: `${parsed.latitude}, ${parsed.longitude}`,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeData.mapsUrl]);

  // ---------------- Handlers ----------------
  const handleSave = () => {
    if (!cafeData.name || !cafeData.location) {
      Alert.alert(
        'Missing information',
        'Please fill in at least the café name and location.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ],
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' },
      );
      return;
    }

    const newCafe = {
      id: `user-cafe-${Date.now()}`,
      name: cafeData.name,
      location: cafeData.location,
      city: cafeData.city,
      description: cafeData.description,
      coverImage: cafeData.coverImage,
      logo: cafeData.logoImage,
      rating: 4.5,
      reviewCount: 0,
    };

    if (onSave) onSave(newCafe);
  };

  // Helper for rendering inputs
  const renderField = (
    label,
    key,
    placeholder,
    multiline = false,
    keyboardType = 'default',
  ) => (
    <View style={styles.fieldContainer} key={key}>
      <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>{label}</Text>
      <TextInput
        style={[
          multiline ? styles.textArea : styles.textInput,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
            color: theme.primaryText,
          },
        ]}
        value={cafeData[key]}
        onChangeText={(text) => setCafeData((prev) => ({ ...prev, [key]: text }))}
        placeholder={placeholder}
        placeholderTextColor={theme.secondaryText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View
        style={[styles.header, { borderBottomColor: theme.divider, backgroundColor: theme.background }]}
      >
        <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
          <Ionicons name="close" size={24} color={theme.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>Add Café</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
          disabled={!cafeData.name || !cafeData.location}
        >
          <Ionicons
            name="checkmark"
            size={24}
            color={
              !cafeData.name || !cafeData.location
                ? theme.secondaryText
                : theme.primaryText
            }
          />
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {renderField('Café Name*', 'name', 'e.g., The Fix')}
        {renderField('Location*', 'location', 'Street & City or coordinates')}
        {renderField('City', 'city', 'e.g., Madrid')}
        {renderField('Google Maps URL', 'mapsUrl', 'Paste share link', false, 'url')}
        {renderField('Cover Image URL', 'coverImage', 'https://…', false, 'url')}
        {renderField('Logo Image URL', 'logoImage', 'https://…', false, 'url')}
        {renderField(
          'Description',
          'description',
          'Tell something about this café…',
          true,
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  fieldContainer: {
    marginTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default AddCafeScreen;