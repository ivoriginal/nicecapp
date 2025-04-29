import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import CoffeeLogCard from '../components/CoffeeLogCard';
import Toast from '../components/Toast';

export default function HomeScreen({ navigation }) {
  const { allEvents, isLoading, loadData, recipes, addRecipe } = useCoffee();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  console.log('HomeScreen rendering, allEvents length:', allEvents?.length || 0);

  // Load data once when the component mounts
  useEffect(() => {
    if (!initialLoadDone && (!allEvents || allEvents.length === 0)) {
      console.log('HomeScreen - Initial data load');
      loadData();
      setInitialLoadDone(true);
    }
  }, [initialLoadDone, allEvents, loadData]);

  const onRefresh = useCallback(async () => {
    console.log('HomeScreen refresh triggered');
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
    navigation.navigate('CoffeeDetail', { 
      coffeeId: event.coffeeId,
      skipAuth: true
    });
  };

  const handleRecipePress = (event) => {
    // Create a recipe object from the event data
    const recipe = {
      id: `recipe-${event.id}`,
      name: `${event.coffeeName} ${event.method || event.brewingMethod}`,
      method: event.method || event.brewingMethod,
      amount: event.amount,
      grindSize: event.grindSize,
      waterVolume: event.waterVolume,
      brewTime: event.brewTime,
      notes: event.notes,
      userId: event.userId,
      userName: event.userName,
      userAvatar: event.userAvatar,
      coffeeId: event.coffeeId,
      coffeeName: event.coffeeName,
      roaster: event.roaster,
      timestamp: event.timestamp,
      steps: [
        { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
        { time: '0:00', action: `Add ${event.amount}g coffee (${event.grindSize} grind)`, water: 0 },
        { time: '0:00', action: `Add ${Math.round(event.amount * 2)}g water for bloom`, water: Math.round(event.amount * 2) },
        { time: '0:30', action: 'Gently stir bloom', water: 0 },
        { time: '0:45', action: `Add water to ${Math.round(event.waterVolume * 0.3)}g`, water: Math.round(event.waterVolume * 0.3) },
        { time: '1:15', action: `Add water to ${Math.round(event.waterVolume * 0.5)}g`, water: Math.round(event.waterVolume * 0.5) },
        { time: '1:45', action: `Add water to ${Math.round(event.waterVolume * 0.7)}g`, water: Math.round(event.waterVolume * 0.7) },
        { time: '2:15', action: `Add water to ${event.waterVolume}g`, water: event.waterVolume },
        { time: event.brewTime, action: 'Drawdown complete', water: 0 }
      ],
      tips: [
        'Use filtered water for the best results',
        'Grind your coffee just before brewing',
        'Keep your equipment clean for consistent results',
        'Use a scale to measure your coffee and water precisely',
        'Maintain a consistent water temperature throughout the brew'
      ]
    };

    // Add the recipe to the recipes array if it doesn't exist
    if (!recipes.find(r => r.id === recipe.id)) {
      addRecipe(recipe);
    }

    // Navigate to the RecipeDetail screen with the recipe ID and coffee information
    navigation.navigate('RecipeDetail', { 
      recipeId: recipe.id,
      coffeeId: event.coffeeId,
      coffeeName: event.coffeeName,
      roaster: event.roaster
    });
  };

  const handleUserPress = (event) => {
    navigation.navigate('UserProfileBridge', { 
      userId: event.userId,
      userName: event.userName,
      skipAuth: true
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
        data={allEvents}
        renderItem={({ item }) => (
          <CoffeeLogCard 
            event={item}
            onCoffeePress={handleCoffeePress}
            onRecipePress={handleRecipePress}
            onUserPress={handleUserPress}
          />
        )}
        keyExtractor={item => `${item.id}-${item.timestamp || Date.now()}`}
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
      <Toast
        visible={toastVisible}
        message={toastMessage}
        onDismiss={() => setToastVisible(false)}
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