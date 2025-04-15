import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import CoffeeDetailScreen from '../screens/CoffeeDetailScreen';
import RecipeDetailScreen from '../screens/RecipeDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CoffeeDetail" 
          component={CoffeeDetailScreen}
          options={({ route }) => ({ 
            title: route.params?.coffeeName || 'Coffee Details',
            headerTitleStyle: {
              fontWeight: '600',
            },
          })}
        />
        <Stack.Screen 
          name="RecipeDetail" 
          component={RecipeDetailScreen}
          options={({ route }) => ({ 
            title: route.params?.recipeName || 'Recipe Details',
            headerTitleStyle: {
              fontWeight: '600',
            },
          })}
        />
        <Stack.Screen 
          name="UserProfile" 
          component={UserProfileScreen} 
          options={({ route }) => ({ 
            title: route.params?.userName || 'Profile',
            headerTitleStyle: {
              fontWeight: '600',
            },
          })} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
} 