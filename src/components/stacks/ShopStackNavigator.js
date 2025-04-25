import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ShopScreen from '../../screens/ShopScreen';
import ProductDetailScreen from '../../screens/ProductDetailScreen';

const ShopStack = createStackNavigator();

const ShopStackNavigator = () => {
  return (
    <ShopStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#8B4513',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <ShopStack.Screen 
        name="ShopMain" 
        component={ShopScreen} 
        options={{ title: 'Shop' }}
      />
      <ShopStack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={({ route }) => ({ title: route.params?.title || 'Product Detail' })}
      />
    </ShopStack.Navigator>
  );
};

export default ShopStackNavigator; 