import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import { useTheme } from '../context/ThemeContext';
import { useFonts, Molle_400Regular_Italic } from '@expo-google-fonts/molle';

export default function SignInScreen() {
  const navigation = useNavigation();
  const { signIn } = useCoffee();
  const { theme, isDarkMode } = useTheme();
  
  const [fontsLoaded] = useFonts({
    Molle_400Regular_Italic,
  });

  // Don't render anything if fonts aren't loaded yet
  if (!fontsLoaded) {
    return null;
  }

  const handleSignIn = async (provider) => {
    try {
      console.log('Starting sign in process with provider:', provider);
      
      // For now, fake the authentication and sign in as Ivo Vilches
      await signIn('user1'); // This will be the default user
      
      console.log('Sign in completed, navigating to Main');
      
      // Navigate to the main app (Home screen)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light" : "dark"} />
      
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={[styles.logoContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primaryText }]}>
            <Ionicons name="cafe" size={40} color={theme.background} />
          </View>
          {/* <Text style={[styles.appName, { color: theme.primaryText }]}>nicecup</Text> */}
        </View>

        {/* USP Content */}
        {/* <View style={styles.uspContainer}>
          <Text style={[styles.uspTitle, { color: theme.primaryText }]}>
            Your Coffee Journey,{'\n'}Perfectly Tracked
          </Text>
        </View> */}

        {/* Sign In Buttons */}
        <View style={styles.signInContainer}>
          {/* <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Ionicons name="library-outline" size={24} color={theme.primaryText} />
              <Text style={[styles.featureText, { color: theme.secondaryText }]}>
                Build your coffee collection
              </Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="restaurant-outline" size={24} color={theme.primaryText} />
              <Text style={[styles.featureText, { color: theme.secondaryText }]}>
                Track brewing recipes
              </Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="people-outline" size={24} color={theme.primaryText} />
              <Text style={[styles.featureText, { color: theme.secondaryText }]}>
                Connect with coffee lovers
              </Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="storefront-outline" size={24} color={theme.primaryText} />
              <Text style={[styles.featureText, { color: theme.secondaryText }]}>
                Discover local roasters
              </Text>
            </View>
          </View> */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.signInButton, styles.appleButton, { backgroundColor: theme.primaryText }]}
              onPress={() => handleSignIn('apple')}
            >
              <Ionicons name="logo-apple" size={20} color={theme.background} />
              <Text style={[styles.signInButtonText, { color: theme.background }]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.signInButton, styles.googleButton, { borderColor: theme.divider }]}
            onPress={() => handleSignIn('google')}
          >
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={[styles.signInButtonText, { color: theme.primaryText }]}>
              Continue with Google
            </Text>
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: theme.secondaryText }]}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    // paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    aspectRatio: 3/4,
    // height: '75%',
    // marginTop: '10%',
    // marginBottom: '8%',
    // marginBottom: '-24',
    marginTop: '-16',
    alignSelf: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontFamily: 'Molle_400Regular_Italic',
    marginTop: 4,
    color: '#000000',
    // display: 'none',
  },
  uspContainer: {
    alignItems: 'center',
    // paddingVertical: 32,
    paddingHorizontal: 24,
    // minHeight: 100,
  },
  uspTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    // marginBottom: 12,
    lineHeight: 38,
  },
  uspSubtitle: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    display: 'none',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 16,
    flex: 1,
  },
  signInContainer: {
    paddingBottom: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    // marginTop: 16,
    lineHeight: 16,
    paddingHorizontal: 16,
  },
}); 