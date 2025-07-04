import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import { useTheme } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const { signIn } = useCoffee();
  const { theme, isDarkMode } = useTheme();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usernameValidating, setUsernameValidating] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const fullNameInputRef = useRef(null);
  const usernameInputRef = useRef(null);
  const usernameCheckTimeoutRef = useRef(null);

  // Initialize the screen with user data on mount
  useEffect(() => {
    initializeUserData();
  }, []);

  const initializeUserData = async () => {
    try {
      // Get authenticated user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user && user.email) {
        setUserEmail(user.email);
        
        // Generate and set initial username from email
        const initialUsername = generateUsernameFromEmail(user.email);
        setUsername(initialUsername);
        
        // Set initial full name from email if available
        const initialName = user.user_metadata?.full_name || 
                           user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        setFullName(initialName);
        
        // Get and set avatar from Gravatar
        const gravatarUrl = getGravatarUrl(user.email);
        setAvatar(gravatarUrl);
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  const generateUsernameFromEmail = (email) => {
    if (!email) return '';
    
    // Extract part before @ and clean it
    const username = email.split('@')[0]
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
      .toLowerCase();
    
    return username;
  };

  // Generate Gravatar URL from email
  const getGravatarUrl = (email) => {
    if (!email) return null;
    
    const md5 = require('../utils/md5').default;
    const hash = md5(email.toLowerCase().trim());
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
  };

  const generateSuggestedUsername = (name) => {
    if (!name) return '';
    
    // Remove special characters and spaces, convert to lowercase
    const cleanName = name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '');
    
    // Add a random number to make it more likely to be unique
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `${cleanName}${randomNum}`;
  };

  const handleNameChange = (text) => {
    setFullName(text);
    
    // Auto-suggest username based on full name only if username is empty or was auto-generated
    if (text && (!username || username === generateUsernameFromEmail(userEmail))) {
      const suggestedUsername = generateSuggestedUsername(text);
      setUsername(suggestedUsername);
      // Check the suggested username
      checkUsernameAvailability(suggestedUsername);
    }
  };

  const handleUsernameChange = (text) => {
    setUsername(text);
    setUsernameError('');
    
    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }
    
    // Validate format first
    if (text && !isValidUsername(text)) {
      setUsernameError('Username should be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }
    
    // Check availability after a short delay
    if (text && text.length >= 3) {
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(text);
      }, 500);
    }
  };

  const checkUsernameAvailability = async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck.length < 3) return;
    
    try {
      setUsernameValidating(true);
      setUsernameError('');
      
      const { data: existingUser, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', usernameToCheck)
        .single();
      
      // If we found a user and there's no error, username is taken
      if (existingUser && !usernameCheckError) {
        setUsernameError('Username is already taken');
      } else if (usernameCheckError && usernameCheckError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is good (username available)
        // Any other error is a real error
        console.error('Error checking username:', usernameCheckError);
        setUsernameError('Error checking username availability');
      }
      // If no user found (PGRST116 error), username is available - no error to set
      
    } catch (error) {
      console.error('Error checking username availability:', error);
      setUsernameError('Error checking username availability');
    } finally {
      setUsernameValidating(false);
    }
  };

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
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const isValidUsername = (username) => {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleContinue = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!isValidUsername(username)) {
      Alert.alert('Error', 'Username should be 3-20 characters and contain only letters, numbers, and underscores');
      return;
    }

    if (usernameError) {
      Alert.alert('Error', usernameError);
      return;
    }

    try {
      setLoading(true);

      // Try multiple approaches to get the authenticated user
      let user = null;
      let userError = null;

      // First attempt: Get user directly
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      } else {
        userError = getUserError;
      }

      // Second attempt: Get session if direct user fetch failed
      if (!user) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        } else {
          userError = sessionError || getUserError;
        }
      }

      // Third attempt: Try to refresh the session
      if (!user) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshData?.session?.user) {
          user = refreshData.session.user;
        } else {
          userError = refreshError || userError;
        }
      }

      if (!user) {
        console.error('Authentication error:', userError);
        Alert.alert(
          'Authentication Error', 
          'We\'re having trouble verifying your account. Please try signing in again.',
          [
            {
              text: 'Go to Sign In',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                });
              }
            }
          ]
        );
        return;
      }

      // Since we're already doing real-time validation, we don't need to check again
      // Just update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: username.trim(),
          avatar_url: avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update profile');
      }

      // Call context's signIn to initialize the app state
      await signIn();
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } catch (error) {
      console.error('Onboarding error:', error);
      Alert.alert('Error', error.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);

      // Try multiple approaches to get the authenticated user
      let user = null;
      let userError = null;

      // First attempt: Get user directly
      const { data: userData, error: getUserError } = await supabase.auth.getUser();
      if (userData?.user) {
        user = userData.user;
      } else {
        userError = getUserError;
      }

      // Second attempt: Get session if direct user fetch failed
      if (!user) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        } else {
          userError = sessionError || getUserError;
        }
      }

      // Third attempt: Try to refresh the session
      if (!user) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshData?.session?.user) {
          user = refreshData.session.user;
        } else {
          userError = refreshError || userError;
        }
      }

      if (!user) {
        console.error('Authentication error:', userError);
        Alert.alert(
          'Authentication Error', 
          'We\'re having trouble verifying your account. Please try signing in again.',
          [
            {
              text: 'Go to Sign In',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                });
              }
            }
          ]
        );
        return;
      }

      // Generate a default username from email
      const defaultUsername = generateSuggestedUsername(user.email.split('@')[0]);
      const defaultName = user.email.split('@')[0];

      // Update profile with minimal defaults
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: defaultName,
          username: defaultUsername,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw new Error('Failed to update profile');
      }

      // Call context's signIn to initialize the app state
      await signIn();
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });

    } catch (error) {
      console.error('Skip onboarding error:', error);
      Alert.alert('Error', error.message || 'Failed to complete setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light" : "dark"} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={handleSkip}
                style={styles.skipButton}
              >
                <Text style={[styles.skipText, { color: theme.secondaryText }]}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Welcome Text */}
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeTitle, { color: theme.primaryText }]}>
                Welcome to Nice Coffee!
              </Text>
              <Text style={[styles.welcomeSubtitle, { color: theme.secondaryText }]}>
                Let's set up your profile to get started
              </Text>
            </View>

            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatarWrapper}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                {avatar ? (
                  <Image 
                    source={{ uri: avatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar, { backgroundColor: theme.cardBackground }]}>
                    <Ionicons name="person" size={40} color={theme.secondaryText} />
                  </View>
                )}
                <View style={[styles.cameraButton, { backgroundColor: theme.primaryText }]}>
                  <Ionicons name="camera" size={16} color={theme.background} />
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarLabel, { color: theme.secondaryText }]}>
                Add a profile picture
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.primaryText }]}>Display Name</Text>
                <TextInput
                  ref={fullNameInputRef}
                  style={[styles.input, { 
                    backgroundColor: theme.cardBackground,
                    color: theme.primaryText,
                    borderColor: theme.divider
                  }]}
                  placeholder="Your name"
                  placeholderTextColor={theme.secondaryText}
                  value={fullName}
                  onChangeText={handleNameChange}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => usernameInputRef.current?.focus()}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.primaryText }]}>Username</Text>
                <View style={styles.usernameContainer}>
                  <TextInput
                    ref={usernameInputRef}
                    style={[styles.input, { 
                      backgroundColor: theme.cardBackground,
                      color: theme.primaryText,
                      borderColor: usernameError ? '#FF4444' : theme.divider
                    }]}
                    placeholder="@username"
                    placeholderTextColor={theme.secondaryText}
                    value={username}
                    onChangeText={handleUsernameChange}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleContinue}
                  />
                  {usernameValidating && (
                    <View style={styles.usernameValidationIcon}>
                      <ActivityIndicator size="small" color={theme.secondaryText} />
                    </View>
                  )}
                  {!usernameValidating && username.length >= 3 && !usernameError && (
                    <View style={styles.usernameValidationIcon}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                    </View>
                  )}
                  {!usernameValidating && usernameError && (
                    <View style={styles.usernameValidationIcon}>
                      <Ionicons name="close-circle" size={20} color="#FF4444" />
                    </View>
                  )}
                </View>
                {usernameError ? (
                  <Text style={[styles.errorText, { color: '#FF4444' }]}>
                    {usernameError}
                  </Text>
                ) : (
                  <Text style={[styles.helperText, { color: theme.secondaryText }]}>
                    3-20 characters, letters, numbers, and underscores only
                  </Text>
                )}
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={[
                styles.continueButton, 
                { 
                  backgroundColor: (loading || usernameValidating || usernameError || !fullName.trim() || !username.trim()) 
                    ? theme.secondaryText 
                    : theme.primaryText 
                }
              ]}
              onPress={handleContinue}
              disabled={loading || usernameValidating || usernameError || !fullName.trim() || !username.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Text style={[styles.continueButtonText, { color: theme.background }]}>
                  Continue
                </Text>
              )}
            </TouchableOpacity>

            <Text style={[styles.footerText, { color: theme.secondaryText }]}>
              You can always change these details later in your profile settings
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 16,
    paddingBottom: 32,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    fontSize: 14,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  continueButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  usernameValidationIcon: {
    marginLeft: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
}); 