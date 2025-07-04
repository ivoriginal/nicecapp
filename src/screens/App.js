import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import UserProfileBridge from '../screens/UserProfileBridge';
import UserProfileScreen from '../screens/UserProfileScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="UserProfileBridge" 
        component={UserProfileBridge} 
        options={{ 
          headerShown: true,
          headerTransparent: true,
          title: ''
        }} 
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={({ route }) => ({ 
          title: route.params?.userName || 'Profile',
          headerBackTitle: 'Back',
          headerTransparent: false,
        })} 
      />
    </Stack.Navigator>
  );
};

export default App; 