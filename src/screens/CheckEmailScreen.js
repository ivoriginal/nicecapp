import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { supabase } from '../lib/supabase';

export default function CheckEmailScreen({ route, navigation }) {
  const { email } = route.params || {};
  const { theme, isDarkMode } = useTheme();
  const { signIn } = useCoffee();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef(null);

  useEffect(() => {
    otpInputRef.current?.focus();
  }, []);

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      if (session) {
        await signIn();
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.contentWrapper}>
          <Ionicons name="mail-outline" size={64} color={theme.primaryText} style={{ marginBottom: 24 }} />

          <Text style={[styles.title, { color: theme.primaryText }]}>Check your email</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>We sent a verification code to</Text>
          <Text style={[styles.emailText, { color: theme.primaryText }]}>{email}</Text>

          <View style={[styles.otpContainer, { backgroundColor: theme.cardBackground, borderColor: theme.divider }]}>
            <TextInput
              ref={otpInputRef}
              autoFocus
              style={[styles.otpInput, { color: theme.primaryText }]}
              placeholder="Enter verification code"
              placeholderTextColor={theme.secondaryText}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoCapitalize="none"
              onSubmitEditing={verifyOtp}
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, { backgroundColor: theme.primaryText }]}
            onPress={verifyOtp}
            disabled={loading}
          >
            <Text style={[styles.verifyButtonText, { color: theme.background }]}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.changeButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.changeButtonText, { color: theme.primaryText }]}>Change email address</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.termsText, { color: theme.secondaryText }]}>By continuing, you agree to our Privacy Policy</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  emailText: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  changeButton: {
    marginTop: 32,
    // height: 48,
    paddingBottom: 4,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 24,
  },
  otpContainer: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 32,
    marginBottom: 16,
    width: '100%',
  },
  otpInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  verifyButton: {
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
  },
}); 