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
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { userData: initialUserData } = route.params || {};
  const searchInputRef = useRef(null);
  
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
    
    if (user) {
      console.log("EditProfileScreen - User gear:", user.gear);
      setUserData({
        userName: user.userName || '',
        // Prioritize location from route params if available, fallback to user context location
        location: locationFromParams || user.location || 'Murcia, Spain',
        userAvatar: user.userAvatar || null,
        userHandle: user.userHandle || '',
        gear: user.gear || []
      });
      
      // Ensure we log the location after setting userData
      console.log("EditProfileScreen - Set location to:", locationFromParams || user.location || 'Murcia, Spain');
      
      setInitialGear(user.gear || []);
      setSelectedGear(user.gear || []);

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
    if (user) {
      return user.userName !== userData.userName || 
             user.location !== userData.location || 
             user.userAvatar !== userData.userAvatar ||
             !arraysEqual(user.gear || [], userData.gear || []);
    }
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
    // Validate fields
    if (!userData.userName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    // Check if there are actual changes before saving
    if (!hasChanges()) {
      // No changes, just go back without showing a toast
      navigation.goBack();
      return;
    }
    
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
      // Get the route that opened this screen
      const route = navigation.getState().routes.find(r => r.name === 'EditProfile');
      const sourceScreen = route?.params?.sourceScreen || 'Profile';
      
      // Use goBack with updatedUserData directly in the context
      if (currentAccount) {
        // Update local user data in context directly
        const existingUser = user || {};
        const mergedUser = {
          ...existingUser,
          id: currentAccount,
          userName: userData.userName,
          location: userData.location,
          userAvatar: userData.userAvatar,
          userHandle: userData.userHandle || existingUser.userHandle,
          gear: selectedGear
        };
        
        // Go back to Profile screen
        navigation.goBack();
        
        // After a short delay to allow navigation to complete, update the ProfileScreen
        setTimeout(() => {
          // Create a profile update event for the profile screen to detect
          console.log('Emitting profile update with location:', mergedUser.location);
          eventEmitter.emit('profileUpdated', { 
            user: {
              ...mergedUser,
              // Ensure location is explicitly included with a fallback value
              location: mergedUser.location || 'Murcia, Spain'
            },
            message: 'Profile updated'
          });
        }, 100);
      } else {
        // Fallback: just go back
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  // Handle canceling edits
  const handleCancel = () => {
    // Only show confirmation if there are changes
    if (hasChanges()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            style: 'destructive',
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } else {
      // No changes, just go back
      navigation.goBack();
    }
  };

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

  // Handle confirming gear selection
  const handleConfirmGearSelection = () => {
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
      <View style={styles.gearItem}>
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
                <Ionicons name="hardware-chip-outline" size={16} color="#999999" />
              </View>
            )}
          </View>
          <Text style={styles.gearItemText}>{item}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeGearButton} 
          onPress={() => {
            const updatedGear = userData.gear.filter(gear => gear !== item);
            setUserData(prev => ({ ...prev, gear: updatedGear }));
            setSelectedGear(updatedGear);
          }}
        >
          <Ionicons name="close-circle" size={22} color="#999999" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {userData.userAvatar ? (
              <Image 
                source={typeof userData.userAvatar === 'string' ? { uri: userData.userAvatar } : userData.userAvatar} 
                style={styles.avatar} 
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#999999" />
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.usernameLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={userData.userName}
            onChangeText={(text) => setUserData(prev => ({ ...prev, userName: text }))}
            placeholder="Your name"
            placeholderTextColor="#999999"
          />
          
          <Text style={styles.usernameLabel}>Username</Text>
          <View style={styles.handleInputContainer}>
            <Text style={styles.handlePrefix}>@</Text>
            <TextInput
              style={styles.handleInput}
              value={userData.userHandle}
              onChangeText={(text) => setUserData(prev => ({ ...prev, userHandle: text }))}
              placeholder="username"
              placeholderTextColor="#999999"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <Text style={styles.usernameLabel}>Location</Text>
          <TouchableOpacity 
            style={styles.locationSelector}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={userData.location ? styles.locationText : styles.locationPlaceholder}>
              {userData.location || "Select your location"}
            </Text>
            <Ionicons name="chevron-down" size={18} color="#666666" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Gear</Text>
            <TouchableOpacity onPress={handleOpenGearModal}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.gearList}>
            {userData.gear && userData.gear.length > 0 ? (
              userData.gear.map((item, index) => (
                <React.Fragment key={index}>
                  {renderGearItem(item)}
                </React.Fragment>
              ))
            ) : (
              <Text style={styles.noGearText}>No gear added yet</Text>
            )}
          </View>
        </View>
      </ScrollView>
      
      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Custom Toast for iOS */}
      {Platform.OS === 'ios' && (
        <Toast 
          visible={toastVisible} 
          message={toastMessage} 
          duration={2000}
        />
      )}
      
      {/* Gear Selection Modal */}
      <Modal
        visible={showGearModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGearModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowGearModal(false)}>
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Gear</Text>
                <TouchableOpacity onPress={handleConfirmGearSelection}>
                  <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#999999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search gear..."
                  placeholderTextColor="#999999"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
              </View>
              
              <FlatList
                data={filteredGearOptions}
                keyExtractor={(item, index) => `gear-${index}`}
                renderItem={({ item }) => {
                  const gearImage = getGearImage(item);
                  
                  return (
                    <TouchableOpacity
                      style={styles.gearOption}
                      onPress={() => handleAddGear(item)}
                    >
                      <View style={styles.gearOptionContent}>
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
                              <Ionicons name="hardware-chip-outline" size={16} color="#999999" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.gearOptionText}>{item}</Text>
                      </View>
                      <View style={styles.checkboxContainer}>
                        {selectedGear.includes(item) ? (
                          <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                        ) : (
                          <Ionicons name="ellipse-outline" size={24} color="#CCCCCC" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 12 }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Location</Text>
                <View style={{width: 24}} />
              </View>
              
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#999999" style={styles.searchIcon} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.searchInput}
                  value={locationSearchQuery}
                  onChangeText={setLocationSearchQuery}
                  placeholder="Search cities or type a custom location"
                  placeholderTextColor="#999999"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                />
                {locationSearchQuery.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => setLocationSearchQuery('')}
                  >
                    <Ionicons name="close-circle" size={18} color="#999999" />
                  </TouchableOpacity>
                )}
              </View>
              
              <FlatList
                data={CITIES.filter(city => 
                  city.toLowerCase().includes(locationSearchQuery.toLowerCase())
                )}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.locationOption}
                    onPress={() => {
                      setUserData(prev => ({ ...prev, location: item }));
                      setShowLocationModal(false);
                      setLocationSearchQuery('');  // Reset search after selection
                    }}
                  >
                    <Text style={styles.locationOptionText}>{item}</Text>
                    {userData.location === item && (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    )}
                  </TouchableOpacity>
                )}
                ListHeaderComponent={() => (
                  // Show current search as a selectable option if it's not empty and not in the list
                  locationSearchQuery && !CITIES.find(city => 
                    city.toLowerCase() === locationSearchQuery.toLowerCase()
                  ) ? (
                    <TouchableOpacity
                      style={[styles.locationOption, styles.customLocationOption]}
                      onPress={() => {
                        setUserData(prev => ({ ...prev, location: locationSearchQuery }));
                        setShowLocationModal(false);
                        setLocationSearchQuery('');  // Reset search after selection
                      }}
                    >
                      <View style={styles.customLocationContent}>
                        <Text style={styles.locationOptionText}>{locationSearchQuery}</Text>
                        <Text style={styles.customLocationLabel}>Add custom location</Text>
                      </View>
                      <Ionicons name="add-circle" size={24} color="#34C759" />
                    </TouchableOpacity>
                  ) : null
                )}
                ListFooterComponent={null}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  avatarPlaceholder: {
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
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
  usernameLabel: {
    alignSelf: 'flex-start',
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
    marginBottom: 16,
  },
  handleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    paddingLeft: 16,
  },
  handlePrefix: {
    fontSize: 16,
    color: '#666666',
  },
  handleInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#000000',
    paddingHorizontal: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    // borderTopWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    paddingTop: 8,
  },
  editText: {
    fontSize: 16,
    color: '#007AFF',
  },
  gearList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  gearItem: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
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
  noGearText: {
    fontSize: 16,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  doneText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
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
  clearButton: {
    padding: 5,
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
  gearOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gearOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeGearButton: {
    padding: 4,
    marginLeft: 8,
    height: 30,
    width: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    padding: 16,
    // borderTopWidth: 1,
    // borderTopColor: '#E5E5EA',
  },
  toastText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationSelector: {
    width: '100%',
    height: 44,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationText: {
    fontSize: 16,
    color: '#000000',
  },
  locationPlaceholder: {
    fontSize: 16,
    color: '#999999',
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
  customLocationOption: {
    backgroundColor: '#F9F9F9',
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  customLocationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  customLocationLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
}); 