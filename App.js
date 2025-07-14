import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators, useFocusEffect } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, TouchableOpacity, ActionSheetIOS, Platform, Alert, Share, StatusBar as RNStatusBar, View, Linking } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import CoffeeDetailScreen from './src/screens/CoffeeDetailScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import UserProfileBridge from './src/screens/UserProfileBridge';
import GearDetailScreen from './src/screens/GearDetailScreen';
import GearWishlistScreen from './src/screens/GearWishlistScreen';
import GearListScreen from './src/screens/GearListScreen';
import CoffeeDiscoveryScreen from './src/screens/CoffeeDiscoveryScreen';
import RecipesListScreen from './src/screens/RecipesListScreen';
import PeopleListScreen from './src/screens/PeopleListScreen';
import CafesListScreen from './src/screens/CafesListScreen';
import SavedScreen from './src/screens/SavedScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import AddCoffeeScreen from './src/screens/AddCoffeeScreen';
import CreateRecipeScreen from './src/screens/CreateRecipeScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FollowersScreen from './src/screens/FollowersScreen';
import SignInScreen from './src/screens/SignInScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
// Add Coffee screens
import AddCoffeeFromURL from './src/screens/AddCoffeeFromURL';
import AddCoffeeFromCamera from './src/screens/AddCoffeeFromCamera';
import AddCoffeeFromGallery from './src/screens/AddCoffeeFromGallery';
import AddCoffeeManually from './src/screens/AddCoffeeManually';
import AddGearScreen from './src/screens/AddGearScreen';
import { CoffeeProvider, useCoffee } from './src/context/CoffeeContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SearchDataProvider } from './src/context/SearchDataContext';
import * as NavigationBar from 'expo-navigation-bar';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import CheckEmailScreen from './src/screens/CheckEmailScreen';
import { supabase } from './src/lib/supabase';

const Stack = createStackNavigator();

// Configure the navigation bar with theme-aware background and buttons
const configureNavigationBar = (backgroundColor, buttonColor) => {
  if (Platform.OS === 'android') {
    NavigationBar.setBackgroundColorAsync(backgroundColor);
    NavigationBar.setButtonStyleAsync(buttonColor);
  }
};

// Main App component with ThemeProvider
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Inner component that uses the theme
function AppContent() {
  const { theme, isDarkMode } = useTheme();
  
  useEffect(() => {
    // Configure the navigation bar with theme-aware background and buttons
    configureNavigationBar(theme.cardBackground, isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, theme]);

  // Function to handle action sheet for recipe options
  const handleRecipeOptions = (navigation, recipe) => {
    const options = ['Share', 'Remix', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Share functionality
            Alert.alert('Share', 'Sharing recipe feature coming soon!');
          } else if (buttonIndex === 1) {
            // Remix functionality
            console.log('Remixing recipe:', recipe);
            
            // Navigate to MainTabs with the AddCoffee screen and pass the recipe
            navigation.navigate('MainTabs', { 
              screen: 'AddCoffee',
              params: { 
                recipe: recipe,
                isRemixing: true
              }
            });
          }
        }
      );
    } else {
      // For Android, we would use a different approach here
      Alert.alert(
        'Recipe Options',
        'What would you like to do?',
        [
          {
            text: 'Share',
            onPress: () => Alert.alert('Share', 'Sharing recipe feature coming soon!')
          },
          {
            text: 'Remix',
            onPress: () => {
              console.log('Remixing recipe:', recipe);
              
              // Navigate to MainTabs with the AddCoffee screen and pass the recipe
              navigation.navigate('MainTabs', { 
                screen: 'AddCoffee',
                params: { 
                  recipe: recipe,
                  isRemixing: true
                }
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Function to handle action sheet for coffee options
  const handleCoffeeOptions = (navigation, coffee) => {
    const options = ['Share', 'Add to Collection', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Share coffee
            shareCoffee(coffee);
          } else if (buttonIndex === 1) {
            // Add to Collection - we'll need to access the coffee context
            // For now, show an alert indicating the action
            Alert.alert('Add to Collection', 'Coffee added to your collection!');
          }
        }
      );
    } else {
      // For Android
      Alert.alert(
        'Coffee Options',
        'What would you like to do?',
        [
          {
            text: 'Share',
            onPress: () => shareCoffee(coffee)
          },
          {
            text: 'Add to Collection',
            onPress: () => Alert.alert('Add to Collection', 'Coffee added to your collection!')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const shareCoffee = async (coffee) => {
    try {
      const coffeeName = coffee?.name || 'this coffee';
      const roasterName = coffee?.roaster || 'Unknown Roaster';
      
      await Share.share({
        message: `Check out ${coffeeName} from ${roasterName} on Nice Coffee App!`,
      });
    } catch (error) {
      console.error('Error sharing coffee:', error);
    }
  };

  // Use theme-aware colors for headers
  const headerStyle = {
    backgroundColor: theme.background,
    elevation: 0, // Remove shadow on Android
    shadowOpacity: 0, // Remove shadow on iOS
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  };
  
  const headerTintColor = theme.primaryText;
  
  const cardStyle = { 
    backgroundColor: theme.background
  };

  // iOS-specific navigation container theme to prevent background color issues
  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: theme.primaryText,
      background: Platform.OS === 'ios' ? 'transparent' : theme.background,
      card: theme.cardBackground,
      text: theme.primaryText,
      border: theme.divider,
      notification: '#FF3B30',
    },
    fonts: Platform.select({
      web: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400',
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500',
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '600',
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '700',
        },
      },
      ios: {
        regular: {
          fontFamily: 'System',
          fontWeight: '400',
        },
        medium: {
          fontFamily: 'System',
          fontWeight: '500',
        },
        bold: {
          fontFamily: 'System',
          fontWeight: '600',
        },
        heavy: {
          fontFamily: 'System',
          fontWeight: '700',
        },
      },
      default: {
        regular: {
          fontFamily: 'sans-serif',
          fontWeight: 'normal',
        },
        medium: {
          fontFamily: 'sans-serif-medium',
          fontWeight: 'normal',
        },
        bold: {
          fontFamily: 'sans-serif',
          fontWeight: '600',
        },
        heavy: {
          fontFamily: 'sans-serif',
          fontWeight: '700',
        },
      },
    }),
  };

  return (
    <>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
              <NotificationsProvider>
          <SearchDataProvider>
            <NavigationContainer theme={navigationTheme}>
              <View style={{ flex: 1, backgroundColor: theme.background }}>
                <CoffeeProvider>
                  <AuthenticatedNavigator 
                    theme={theme} 
                    handleRecipeOptions={handleRecipeOptions} 
                    handleCoffeeOptions={handleCoffeeOptions}
                    headerStyle={headerStyle}
                    headerTintColor={headerTintColor}
                    cardStyle={cardStyle}
                  />
                </CoffeeProvider>
              </View>
            </NavigationContainer>
          </SearchDataProvider>
        </NotificationsProvider>
    </>
  );
}

// AuthenticatedNavigator component that checks auth status
function AuthenticatedNavigator({ theme, handleRecipeOptions, handleCoffeeOptions, headerStyle, headerTintColor, cardStyle }) {
  const { isAuthenticated } = useCoffee();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle,
        headerTintColor,
        cardStyle,
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
      initialRouteName={isAuthenticated ? "Main" : "SignIn"}
    >
      <Stack.Screen 
        name="SignIn" 
        component={SignInScreen} 
        options={{ 
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }} 
      />
      <Stack.Screen 
        name="Onboarding" 
        component={OnboardingScreen} 
        options={{ 
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }} 
      />
      <Stack.Screen 
        name="CheckEmail" 
        component={CheckEmailScreen} 
        options={{ 
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }} 
      />
      <Stack.Screen 
        name="Main" 
        options={{ 
          headerShown: false,
          cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
        }} 
      >
        {(props) => <MainNavigator {...props} theme={theme} handleRecipeOptions={handleRecipeOptions} handleCoffeeOptions={handleCoffeeOptions} headerStyle={headerStyle} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// MainNavigator component to handle all screens when authenticated
function MainNavigator({ theme, handleRecipeOptions, handleCoffeeOptions, headerStyle }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.divider,
        },
        headerTintColor: theme.primaryText,
        cardStyle: { backgroundColor: theme.background },
        cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        options={{ headerShown: false }} 
      >
        {(props) => <BottomTabNavigator {...props} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{ 
          title: 'Notifications',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="PeopleList" 
        component={PeopleListScreen} 
        options={{ 
          title: 'People',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="CoffeeDetail" 
        component={CoffeeDetailScreen} 
        options={({ navigation, route }) => ({ 
          title: 'Coffee Details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => handleCoffeeOptions(navigation, route.params?.coffee)}
              style={{ marginRight: 16 }}
            >
              <Ionicons 
                name="ellipsis-horizontal" 
                size={24} 
                color={theme.primaryText}
              />
            </TouchableOpacity>
          )
        })} 
      />
      <Stack.Screen 
        name="RecipeDetail" 
        component={RecipeDetailScreen} 
        options={({ navigation, route }) => ({ 
          title: 'Recipe Details',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => handleRecipeOptions(navigation, route.params?.recipe)}
              style={{ marginRight: 16 }}
            >
              <Ionicons 
                name="ellipsis-horizontal" 
                size={24} 
                color={theme.primaryText}
              />
            </TouchableOpacity>
          )
        })} 
      />
      <Stack.Screen 
        name="UserProfileBridge" 
        component={UserProfileBridge} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="UserProfileScreen" 
        component={UserProfileScreen} 
        options={() => ({ 
          title: '',
          headerBackTitle: 'Back',
          headerTransparent: false,
        })} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={({ route }) => ({ 
          title: route.params?.userName || 'Edit Profile',
          headerBackTitle: 'Back',
          headerTransparent: false,
        })} 
      />
      <Stack.Screen 
        name="GearDetail" 
        component={GearDetailScreen} 
        options={({ route }) => ({ 
          title: route.params?.gearName || 'Gear Details',
          headerBackTitle: 'Back',
        })} 
      />
      <Stack.Screen 
        name="GearWishlist" 
        component={GearWishlistScreen} 
        options={({ route }) => ({ 
          headerShown: true, 
          title: route.params?.isCurrentUser ? 'My Gear Wishlist' : `${route.params?.userName}'s Gear Wishlist`,
          headerBackTitle: 'Back'
        })} 
      />
      <Stack.Screen 
        name="AddGear" 
        component={AddGearScreen} 
        options={{ 
          title: 'Add Gear',
          headerBackTitle: 'Back',
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        }} 
      />
      <Stack.Screen 
        name="GearList" 
        component={GearListScreen} 
        options={{ headerShown: true, title: 'Coffee Gear', headerBackTitle: 'Back' }} 
      />
      <Stack.Screen 
        name="CoffeeDiscovery" 
        component={CoffeeDiscoveryScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="RecipesList" 
        component={RecipesListScreen} 
        options={({ route }) => ({ 
          headerShown: true, 
          title: route.params?.title || 'Recipes for you',
          headerBackTitle: 'Back' 
        })} 
      />
      <Stack.Screen 
        name="CafesList" 
        component={CafesListScreen} 
        options={{ headerShown: true, title: 'Cafés Near You', headerBackTitle: 'Back' }} 
      />
      <Stack.Screen 
        name="Saved" 
        component={SavedScreen} 
        options={{ 
          title: 'Saved',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="AddCoffee" 
        component={AddCoffeeScreen} 
        options={{ 
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="CreateRecipe" 
        component={CreateRecipeScreen} 
        options={{ 
          title: 'Create Recipe',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          title: 'Settings',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="FollowersScreen" 
        component={FollowersScreen} 
        options={({ route }) => ({ 
          title: route.params?.type === 'followers' ? 'Followers' : 'Following',
          headerBackTitle: 'Back'
        })} 
      />
      <Stack.Screen 
        name="AddCoffeeFromURL" 
        component={AddCoffeeFromURL} 
        options={{ 
          title: 'Add from URL',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="AddCoffeeFromCamera" 
        component={AddCoffeeFromCamera} 
        options={{ 
          title: 'Add from Camera',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="AddCoffeeFromGallery" 
        component={AddCoffeeFromGallery} 
        options={{ 
          title: 'Add from Gallery',
          headerBackTitle: 'Back'
        }} 
      />
      <Stack.Screen 
        name="AddCoffeeManually" 
        component={AddCoffeeManually} 
        options={{ 
          title: 'Add Manually',
          headerBackTitle: 'Back'
        }} 
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
