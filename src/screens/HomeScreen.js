import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import CoffeeLogCard from '../components/CoffeeLogCard';

export default function HomeScreen({ navigation }) {
  const { coffeeEvents, isLoading, loadData } = useCoffee();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleCoffeePress = (event) => {
    // Navigate to coffee detail screen with mock data
    navigation.navigate('CoffeeDetail', { 
      coffeeId: event.coffeeId,
      skipAuth: true // Add flag to skip authentication
    });
  };

  const handleRecipePress = (event) => {
    // Navigate to recipe detail screen with mock data
    navigation.navigate('RecipeDetail', { 
      recipeId: event.recipeId,
      skipAuth: true // Add flag to skip authentication
    });
  };

  const handleUserPress = (event) => {
    // Navigate to user profile with mock data
    navigation.navigate('Profile', { 
      userId: event.userId,
      skipAuth: true // Add flag to skip authentication
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={coffeeEvents}
        renderItem={({ item }) => (
          <CoffeeLogCard 
            event={item}
            onCoffeePress={handleCoffeePress}
            onRecipePress={handleRecipePress}
            onUserPress={handleUserPress}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000000']}
            tintColor="#000000"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cafe" size={50} color="#CCCCCC" />
            <Text style={styles.emptyText}>No coffee logs yet</Text>
            <Text style={styles.emptySubtext}>Log your first coffee brewing session!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
}); 