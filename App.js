import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, TouchableOpacity, ActionSheetIOS, Platform, Alert } from 'react-native';
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
import { CoffeeProvider } from './src/context/CoffeeContext';
import { NotificationsProvider } from './src/context/NotificationsContext';
import { configureNavigationBar } from './src/lib/navigationBar';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Configure the navigation bar with white background and dark buttons
    configureNavigationBar('#ffffff', 'dark');
  }, []);

  // Function to handle action sheet for recipe options
  const handleRecipeOptions = (navigation, recipe) => {
    const options = ['Share', 'Remix', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Share functionality
            Alert.alert('Share', 'Sharing recipe feature coming soon!');
          } else if (buttonIndex === 1) {
            // Remix functionality - temporarily show alert since screen doesn't exist yet
            Alert.alert('Remix', 'Recipe remix feature coming soon!');
            // Will eventually navigate to RemixRecipe screen:
            // navigation.navigate('RemixRecipe', { 
            //   recipe,
            //   isRemixing: true
            // });
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
            onPress: () => Alert.alert('Remix', 'Recipe remix feature coming soon!')
            // Will eventually navigate to RemixRecipe screen:
            // onPress: () => navigation.navigate('RemixRecipe', { 
            //   recipe,
            //   isRemixing: true
            // })
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  return (
    <SafeAreaProvider>
      <NotificationsProvider>
        <NavigationContainer>
          <CoffeeProvider>
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#ffffff',
                },
                headerTintColor: '#000000',
                cardStyle: { backgroundColor: '#ffffff' }
              }}
            >
              <Stack.Screen 
                name="MainTabs" 
                component={BottomTabNavigator} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="CoffeeDetail" 
                component={CoffeeDetailScreen} 
                options={({ navigation, route }) => ({ 
                  title: 'Coffee Details',
                  headerBackTitle: 'Back',
                  headerRight: () => {
                    const { isFavorite, handleToggleFavorite, isInCollection } = route.params || {};
                    if (!isInCollection) return null;
                    return (
                      <TouchableOpacity 
                        onPress={handleToggleFavorite}
                        style={{ marginRight: 16 }}
                      >
                        <Ionicons 
                          name={isFavorite ? "heart" : "heart-outline"} 
                          size={24} 
                          color={isFavorite ? "#FF3B30" : "#000000"} 
                        />
                      </TouchableOpacity>
                    );
                  }
                })} 
              />
              <Stack.Screen 
                name="RecipeDetail" 
                component={RecipeDetailScreen} 
                options={({ navigation, route }) => ({ 
                  title: route.params?.recipeName || 'Recipe Details',
                  headerBackTitle: 'Back',
                  headerRight: () => (
                    <TouchableOpacity 
                      onPress={() => handleRecipeOptions(navigation, route.params?.recipe)}
                      style={{ marginRight: 16 }}
                    >
                      <Ionicons 
                        name="ellipsis-horizontal" 
                        size={24} 
                        color="#000000" 
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
                options={({ route }) => ({ 
                  title: route.params?.userName || 'Profile',
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
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="PeopleList" 
                component={PeopleListScreen} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="CafesList" 
                component={CafesListScreen} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="Saved" 
                component={SavedScreen} 
                options={{ 
                  title: 'Saved',
                  headerBackTitle: 'Back'
                }} 
              />
            </Stack.Navigator>
          </CoffeeProvider>
        </NavigationContainer>
      </NotificationsProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
