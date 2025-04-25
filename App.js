import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, TouchableOpacity } from 'react-native';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import CoffeeDetailScreen from './src/screens/CoffeeDetailScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import UserProfileBridge from './src/screens/UserProfileBridge';
import GearDetailScreen from './src/screens/GearDetailScreen';
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

  return (
    <SafeAreaProvider>
      <NotificationsProvider>
        <NavigationContainer>
          <CoffeeProvider>
            <Stack.Navigator>
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
                options={({ route }) => ({ 
                  title: route.params?.recipeName || 'Recipe Details',
                  headerBackTitle: 'Back',
                })} 
              />
              <Stack.Screen 
                name="UserProfileBridge" 
                component={UserProfileBridge} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="UserProfile" 
                component={UserProfileScreen} 
                options={({ route }) => ({ 
                  title: route.params?.userName || 'Profile',
                  headerBackTitle: 'Back',
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
