import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

export default function SignInScreen() {
  const navigation = useNavigation();
  const { signIn } = useCoffee();
  const { theme, isDarkMode } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const emailInputRef = useRef(null);

  // Clear any existing session on mount (no autofocus)
  useEffect(() => {
    const clearSession = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    };

    clearSession();
  }, []);

  const isValidEmail = (value) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  };

  /* ----------------------------- Social Sign-In ---------------------------- */
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;

      // In case the OAuth flow returns immediately (mobile native), refresh context
      await signIn();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'apple' });
      if (error) throw error;

      await signIn();
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (error) {
      console.error('Apple sign-in error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------- Email Magic-link Flow --------------------------- */
  const handleEmailSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    Keyboard.dismiss();

    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          // emailRedirectTo only needed if using magic link deep linking; can omit for OTP.
        },
      });
      if (error) throw error;

      // Navigate to confirmation screen
      navigation.navigate('CheckEmail', { email });
    } catch (error) {
      console.error('OTP generation error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.topSection}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <View style={[styles.logoCircle, { backgroundColor: theme.primaryText }]}>
                  <Ionicons name="cafe" size={40} color={theme.background} />
                </View>
              </View>

              {/* USP tagline */}
              <Text style={[styles.uspText, { color: theme.primaryText }]}>
                Discover & share exceptional coffee
              </Text>
            </View>

            {/* Auth Methods Container */}
            <View style={styles.authMethodsContainer}>
              {/* Social sign-in buttons */}
              <View style={styles.socialSection}>
                <TouchableOpacity
                  style={[styles.socialButtonRow, { 
                    backgroundColor: theme.primaryText,
                    borderColor: theme.divider 
                  }]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-google" size={20} color={theme.background} />
                  <Text style={[styles.socialButtonText, { color: theme.background }]}>Continue with Google</Text>
                </TouchableOpacity>

                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.socialButtonRow, { 
                      backgroundColor: theme.primaryText,
                      borderColor: theme.divider 
                    }]}
                    onPress={handleAppleSignIn}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-apple" size={20} color={theme.background} />
                    <Text style={[styles.socialButtonText, { color: theme.background }]}>Continue with Apple</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* OR separator */}
              <View style={styles.orContainer}>
                <View style={[styles.orLine, { backgroundColor: theme.divider }]} />
                <Text style={[styles.orText, { color: theme.secondaryText }]}>OR</Text>
                <View style={[styles.orLine, { backgroundColor: theme.divider }]} />
              </View>

              {/* Email input with arrow */}
              <View
                style={[
                  styles.emailInputContainer,
                  { backgroundColor: theme.cardBackground, borderColor: theme.divider },
                ]}
              >
                <TextInput
                  ref={emailInputRef}
                  style={[styles.input, { color: theme.primaryText }]}
                  placeholder="Email"
                  placeholderTextColor={theme.secondaryText}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="go"
                  onSubmitEditing={handleEmailSubmit}
                  blurOnSubmit={false}
                />

                {email.length > 0 && (
                  <TouchableOpacity
                    style={[styles.emailIconButton, { backgroundColor: theme.primaryText }]}
                    onPress={handleEmailSubmit}
                    activeOpacity={0.8}
                    disabled={loading}
                  >
                    <Ionicons name="arrow-forward" size={20} color={theme.background} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Terms */}
            <Text style={[styles.termsText, { color: theme.secondaryText }]}>By continuing, you agree to our Privacy Policy</Text>
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
    justifyContent: 'center',
    paddingVertical: 24,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uspText: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 0,
  },
  authMethodsContainer: {
    width: '100%',
    marginBottom: 16,
  },
  socialSection: {
    gap: 12,
    width: '100%',
  },
  socialButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    width: '100%',
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    gap: 12,
  },
  orLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emailInputContainer: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    marginBottom: 12,
    width: '100%',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    paddingRight: 40, // space for arrow button
  },
  emailIconButton: {
    position: 'absolute',
    right: 4,
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
}); 