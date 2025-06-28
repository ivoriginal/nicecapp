import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Animated,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import mockGear from '../data/mockGear.json';
import gearDetails from '../data/gearDetails';
import eventEmitter from '../utils/EventEmitter';
import { useTheme } from '../context/ThemeContext';

// Sample list of cities in Spain
const CITIES = [
  'Madrid, Spain',
  'Barcelona, Spain',
  'Valencia, Spain',
  'Seville, Spain',
  'Zaragoza, Spain',
  'Málaga, Spain',
  'Murcia, Spain',
  'Palma, Spain',
  'Las Palmas, Spain',
  'Bilbao, Spain',
  'Alicante, Spain',
  'Córdoba, Spain',
  'Valladolid, Spain',
  'Vigo, Spain',
  'Gijón, Spain',
  'Granada, Spain'
];

// Custom Toast component for iOS
const Toast = ({ visible, message, duration = 2000 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(duration - 600),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, opacity, duration]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.toastText, { color: theme.primaryText }]}>{message}</Text>
    </Animated.View>
  );
};

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { userData: initialUserData } = route.params || {};
  const searchInputRef = useRef(null);
  const { theme, isDarkMode } = useTheme();
  
  const { 
    user,
    currentAccount,
    accounts,
    switchAccount,
    loadData
  } = useCoffee();

  const [userData, setUserData] = useState({
    userName: '',
    location: '',
    userAvatar: null,
    userHandle: '',
    gear: []
  });
  const [initialGear, setInitialGear] = useState([]);
  const [showGearModal, setShowGearModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedGear, setSelectedGear] = useState([]);
  const [gearOptions, setGearOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Flag to bypass the beforeRemove warning when saving
  const [isSaving, setIsSaving] = useState(false);

  // Configure navigation header
  useEffect(() => {
    navigation.setOptions({
      title: 'Edit Profile',
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges()}
          style={{ marginRight: 16, opacity: hasChanges() ? 1 : 0.5 }}
        >
          <Text style={{ 
            color: hasChanges() ? theme.primaryText : theme.secondaryText, 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            Save
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, userData, selectedGear, user, route.params, theme.primaryText, theme.secondaryText]);

  // Load user data on mount
  useEffect(() => {
    console.log("EditProfileScreen - Initial user data:", user);
    console.log("EditProfileScreen - currentAccount:", currentAccount);
    console.log("EditProfileScreen - Location from user:", user?.location);
    console.log("EditProfileScreen - Route params:", route.params);
    
    // Get location from multiple possible sources to ensure we have it
    const routeParamsUserData = route.params?.userData || {};
    const locationFromParams = routeParamsUserData.location;
    console.log("EditProfileScreen - Location from route params:", locationFromParams);
    
    if (user || routeParamsUserData.userName) {
      console.log("EditProfileScreen - User gear:", user?.gear || routeParamsUserData.gear);
      
      // Handle avatar properly - convert require() to URI if needed
      const rawAvatar = user?.userAvatar || routeParamsUserData.userAvatar;
      const avatarUri = getAvatarUri(rawAvatar);
      console.log("EditProfileScreen - Raw avatar:", rawAvatar, "Processed URI:", avatarUri);
      
      const finalUserData = {
        userName: user?.userName || routeParamsUserData.userName || '',
        // Prioritize location from route params if available, fallback to user context location
        location: locationFromParams || user?.location || 'Murcia, Spain',
        userAvatar: avatarUri,
        userHandle: user?.userHandle || routeParamsUserData.userHandle || '',
        gear: user?.gear || routeParamsUserData.gear || []
      };
      
      setUserData(finalUserData);
      
      // Ensure we log the location after setting userData
      console.log("EditProfileScreen - Set location to:", finalUserData.location);
      
      setInitialGear(finalUserData.gear);
      setSelectedGear(finalUserData.gear);

      // If gear is missing but we know which user we're editing, try to get default gear
      if ((!user.gear || user.gear.length === 0) && currentAccount) {
        console.log("EditProfileScreen - Trying to get default gear for account:", currentAccount);
        try {
          // Dynamically import mockUsers to get default gear
          import('../data/mockUsers.json').then(mockUsersModule => {
            const mockUsers = mockUsersModule.default || mockUsersModule;
            const defaultUser = mockUsers.users.find(u => u.id === currentAccount);
            
            if (defaultUser && defaultUser.gear && defaultUser.gear.length > 0) {
              console.log("EditProfileScreen - Found default gear:", defaultUser.gear);
              setUserData(prev => ({
                ...prev,
                gear: defaultUser.gear
              }));
              setInitialGear(defaultUser.gear);
              setSelectedGear(defaultUser.gear);
            }
          }).catch(err => {
            console.error("Error importing mockUsers:", err);
          });
        } catch (error) {
          console.error("Error getting default gear:", error);
        }
      }
    }
    
    // Load all available gear options
    const allGear = mockGear.gear.map(gear => gear.name);
    const allDetailedGear = Object.keys(gearDetails);
    
    // Combine all gear options and remove duplicates
    const combinedGear = [...new Set([...allGear, ...allDetailedGear])];
    setGearOptions(combinedGear.sort());
  }, [user]);

  // Helper function to get gear image
  const getGearImage = (gearName) => {
    try {
      // First try to find gear in mockGear.gear
      const mockGearItem = mockGear.gear.find(g => g.name === gearName);
      
      // Then check if we have detailed gear data
      const detailedGear = gearDetails[gearName];
      
      // Return the image URL from either source
      const imageUrl = mockGearItem?.imageUrl || detailedGear?.image || null;
      return imageUrl;
    } catch (error) {
      console.error('Error getting gear image:', error);
      return null; // Return null if any error occurs
    }
  };

  // Helper function to convert avatar to displayable URI
  const getAvatarUri = (avatar) => {
    if (!avatar) return null;
    
    // If it's already a string (URI), return as is
    if (typeof avatar === 'string') {
      return avatar;
    }
    
    // If it's a require() statement (number), we need to handle it differently
    if (typeof avatar === 'number') {
      // For now, we'll return null to show placeholder
      // In a real app, you might convert require() to URI or use Image.resolveAssetSource()
      console.log("Avatar is a require() statement, showing placeholder");
      return null;
    }
    
    return null;
  };

  // Handle image picker
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      
      if (!result.canceled) {
        setUserData(prev => ({
          ...prev,
          userAvatar: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Check if user has made changes
  const hasChanges = () => {
    // Get the original data from either user context or route params
    const routeParamsUserData = route.params?.userData || {};
    const originalData = user || routeParamsUserData;
    
    console.log('hasChanges check:');
    console.log('  originalData:', originalData);
    console.log('  userData:', userData);
    console.log('  selectedGear:', selectedGear);
    
    if (originalData && originalData.userName && userData.userName) {
      const changes = {
        nameChanged: originalData.userName !== userData.userName,
        locationChanged: originalData.location !== userData.location,
        avatarChanged: originalData.userAvatar !== userData.userAvatar,
        handleChanged: originalData.userHandle !== userData.userHandle,
        gearChanged: !arraysEqual(originalData.gear || [], selectedGear || [])
      };
      
      console.log('  changes:', changes);
      
      const hasAnyChanges = changes.nameChanged || changes.locationChanged || 
                           changes.avatarChanged || changes.handleChanged || changes.gearChanged;
      
      console.log('  hasAnyChanges:', hasAnyChanges);
      
      return hasAnyChanges;
    }
    
    console.log('  returning false (no original data or userData)');
    return false;
  };
  
  // Helper to compare arrays
  const arraysEqual = (a, b) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((item, index) => item === sortedB[index]);
  };

  // Show toast notification based on platform
  const showToast = (message) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // Use our custom Toast component for iOS
      setToastMessage(message);
      setToastVisible(true);
      
      // Hide the toast after 2 seconds
      setTimeout(() => {
        setToastVisible(false);
      }, 2000);
    }
  };

  // Handle saving profile changes
  const handleSave = () => {
    // Debug logging
    console.log('handleSave called with userData:', userData);
    console.log('userData.userName:', userData.userName);
    console.log('hasChanges():', hasChanges());
    
    // Validate fields
    if (!userData.userName || !userData.userName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    // Check if there are actual changes before saving
    if (!hasChanges()) {
      // No changes, just go back without showing a toast
      navigation.goBack();
      return;
    }
    
    // Set saving flag to bypass the beforeRemove warning IMMEDIATELY
    setIsSaving(true);
    
    // Use setTimeout to ensure the flag is set before the navigation listener checks it
    setTimeout(() => {
      console.log('Saving profile with data:', userData);
      console.log('Location being saved:', userData.location);
      
      // Create updated user data
      const updatedUser = {
        ...user,
        id: currentAccount,
        userName: userData.userName,
        location: userData.location || 'Murcia, Spain', // Ensure location is never empty
        userAvatar: userData.userAvatar,
        userHandle: userData.userHandle || user.userHandle,
        gear: selectedGear
      };
      
      console.log('Final updated user data:', updatedUser);
      
      // In a real app, you would update the backend here
      // For our mock app, we can update the context
      try {
        // Go back to Profile screen first to avoid navigation conflicts
        navigation.goBack();
        
        // After a short delay to allow navigation to complete, update the ProfileScreen
        setTimeout(() => {
          // Create a profile update event for the profile screen to detect
          console.log('Emitting profile update with location:', updatedUser.location);
          eventEmitter.emit('profileUpdated', { 
            user: {
              ...updatedUser,
              // Ensure location is explicitly included with a fallback value
              location: updatedUser.location || 'Murcia, Spain'
            },
            message: 'Profile updated'
          });
        }, 100);
      } catch (error) {
        console.error('Error saving profile:', error);
        setIsSaving(false); // Reset the saving flag on error
        Alert.alert('Error', 'Failed to update profile');
      }
    }, 50); // Small delay to ensure isSaving flag is set
  };

  // Handle back navigation with unsaved changes warning
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // If we're saving, don't show the warning
      if (isSaving) {
        return;
      }
      
      if (!hasChanges()) {
        // If there are no changes, let the user leave normally
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Prompt the user before leaving the screen
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action) 
          }
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasChanges, isSaving]);

  // Handle opening gear modal
  const handleOpenGearModal = () => {
    setSelectedGear(userData.gear || []);
    setShowGearModal(true);
  };

  // Add gear to user's gear list
  const handleAddGear = (gearName) => {
    if (!selectedGear.includes(gearName)) {
      setSelectedGear(prev => [...prev, gearName]);
    } else {
      setSelectedGear(prev => prev.filter(g => g !== gearName));
    }
  };

  // Handle adding new gear that doesn't exist in the list
  const handleAddNewGear = (gearName) => {
    // For now, just add it to the gear options and select it
    // Later we'll implement the full flow to add it to the app
    Alert.alert(
      'Add New Gear',
      `We'll work on the flow to add "${gearName}" to the app later. For now, it will be added to your personal gear list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Add', 
          onPress: () => {
            // Add to gear options
            setGearOptions(prev => [...prev, gearName].sort());
            // Add to selected gear
            setSelectedGear(prev => [...prev, gearName]);
            // Clear search
            setSearchQuery('');
          }
        }
      ]
    );
  };

  // Handle confirming gear selection
  const handleConfirmGearSelection = () => {
    console.log('Confirming gear selection:', selectedGear);
    setUserData(prev => ({
      ...prev,
      gear: selectedGear
    }));
    setShowGearModal(false);
  };

  // Filter gear options based on search query
  const filteredGearOptions = gearOptions.filter(gear => 
    gear.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render a gear item with avatar
  const renderGearItem = (item) => {
    const gearImage = getGearImage(item);
    
    return (
      <View style={[styles.gearItem, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.gearItemContent}>
          <View style={styles.gearItemAvatarContainer}>
            {gearImage ? (
              <Image
                source={{ uri: gearImage }}
                style={styles.gearItemAvatar}
                resizeMode="cover"
                onError={() => console.log(`Failed to load image for gear: ${item}`)}
              />
            ) : (
              <View style={styles.gearItemAvatarPlaceholder}>
                <Ionicons name="hardware-chip-outline" size={16} color={theme.secondaryText} />
              </View>
            )}
          </View>
          <Text style={[styles.gearItemText, { color: theme.primaryText }]}>{item}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeGearButton} 
          onPress={() => {
            const updatedGear = userData.gear.filter(gear => gear !== item);
            setUserData(prev => ({ ...prev, gear: updatedGear }));
            setSelectedGear(updatedGear);
          }}
        >
          <Ionicons name="close-circle" size={22} color={theme.secondaryText} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Image Section */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            style={styles.avatarWrapper}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            {userData.userAvatar ? (
              <Image 
                source={{ uri: userData.userAvatar }}
                style={styles.avatar}
                onError={(error) => {
                  console.log('Avatar image error:', error);
                  // On error, clear the avatar to show placeholder
                  setUserData(prev => ({ ...prev, userAvatar: null }));
                }}
              />
            ) : (
              <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: theme.placeholder }]}>
                <Ionicons name="person" size={50} color={theme.secondaryText} />
              </View>
            )}
            <View style={[styles.changePhotoButton, { backgroundColor: theme.cardBackground }]}>
              <Ionicons name="camera" size={20} color={theme.primaryText} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Display Name</Text>
            <TextInput
              style={[styles.input, { color: theme.primaryText, backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              value={userData.userName}
              onChangeText={(text) => setUserData({...userData, userName: text})}
              placeholder="Your name"
              placeholderTextColor={theme.secondaryText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Username</Text>
            <TextInput
              style={[styles.input, { color: theme.primaryText, backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              value={userData.userHandle}
              onChangeText={(text) => setUserData({...userData, userHandle: text})}
              placeholder="@username"
              placeholderTextColor={theme.secondaryText}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Location</Text>
            <TouchableOpacity
              style={[styles.input, styles.locationInput, { color: theme.primaryText, backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => setShowLocationModal(true)}
            >
              <Text style={{ color: userData.location ? theme.primaryText : theme.secondaryText }}>
                {userData.location || "Select your location"}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primaryText }]}>Your Gear</Text>
            <TouchableOpacity
              style={[styles.gearButton, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}
              onPress={handleOpenGearModal}
            >
              <Text style={[styles.gearButtonText, { color: theme.primaryText }]}>
                {selectedGear.length > 0 ? `${selectedGear.length} items selected` : 'Add your gear'}
              </Text>
              <Ionicons name="add-circle-outline" size={20} color={theme.primaryText} />
            </TouchableOpacity>

            {selectedGear.length > 0 && (
              <FlatList
                data={selectedGear}
                keyExtractor={(item, index) => `gear-${index}`}
                renderItem={({ item }) => renderGearItem(item)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.gearList}
                style={{ marginTop: 12 }}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Gear Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showGearModal}
        onRequestClose={() => setShowGearModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Select Your Gear</Text>
              <TouchableOpacity onPress={() => setShowGearModal(false)}>
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.secondaryBackground }]}>
              <Ionicons name="search" size={20} color={theme.secondaryText} style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={[styles.searchInput, { color: theme.primaryText }]}
                placeholder="Search gear..."
                placeholderTextColor={theme.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={gearOptions.filter(gear => 
                gear.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              keyExtractor={(item, index) => `option-${index}`}
              renderItem={({ item }) => {
                const isSelected = selectedGear.includes(item);
                return (
                  <TouchableOpacity 
                    style={[styles.gearOption, { borderBottomColor: theme.divider }]}
                    onPress={() => handleAddGear(item)}
                  >
                    <Text style={[styles.gearOptionText, { color: theme.primaryText }]}>{item}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={24} color={theme.primaryText} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => {
                if (searchQuery.trim().length > 0) {
                  return (
                    <View style={styles.emptyGearSearchContainer}>
                      <Text style={[styles.emptyGearSearchText, { color: theme.secondaryText }]}>
                        No gear found for "{searchQuery}"
                      </Text>
                      <TouchableOpacity 
                        style={[styles.addNewGearButton, { backgroundColor: theme.primaryText }]}
                        onPress={() => handleAddNewGear(searchQuery.trim())}
                      >
                        <Ionicons name="add" size={20} color={theme.background} style={{ marginRight: 8 }} />
                        <Text style={[styles.addNewGearButtonText, { color: theme.background }]}>
                          Add "{searchQuery.trim()}" as new gear
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                }
                return null;
              }}
            />

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: theme.primaryText }]}
                onPress={handleConfirmGearSelection}
              >
                <Text style={[styles.confirmButtonText, { color: theme.background }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLocationModal}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Select Location</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchContainer, { backgroundColor: theme.secondaryBackground }]}>
              <Ionicons name="search" size={20} color={theme.secondaryText} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: theme.primaryText }]}
                placeholder="Search cities..."
                placeholderTextColor={theme.secondaryText}
                value={locationSearchQuery}
                onChangeText={setLocationSearchQuery}
              />
              {locationSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={CITIES.filter(city => 
                city.toLowerCase().includes(locationSearchQuery.toLowerCase())
              )}
              keyExtractor={(item, index) => `city-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.locationOption, { borderBottomColor: theme.divider }]}
                  onPress={() => {
                    setUserData({...userData, location: item});
                    setShowLocationModal(false);
                    setLocationSearchQuery('');
                  }}
                >
                  <Text style={[styles.locationOptionText, { color: theme.primaryText }]}>{item}</Text>
                  {userData.location === item && (
                    <Ionicons name="checkmark" size={24} color={theme.primaryText} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Custom Toast for iOS */}
      {Platform.OS === 'ios' && (
        <Toast 
          visible={toastVisible} 
          message={toastMessage} 
          duration={2000} 
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  placeholderAvatar: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000000',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gearButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  gearList: {
    paddingTop: 8,
  },
  gearItem: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    marginRight: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gearItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gearItemAvatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  gearItemAvatar: {
    width: '100%',
    height: '100%',
  },
  gearItemAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearItemText: {
    fontSize: 16,
    color: '#000000',
  },
  removeGearButton: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 16,
    maxHeight: Platform.OS === 'ios' ? '80%' : '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  confirmButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    padding: 16,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  gearOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  gearOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  emptyGearSearchContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyGearSearchText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#666666',
  },
  addNewGearButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewGearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
}); 