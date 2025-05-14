import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import CoffeeLogCard from '../components/CoffeeLogCard';
import Toast from '../components/Toast';

export default function HomeScreen({ navigation }) {
  const { allEvents, isLoading, loadData, recipes, addRecipe, currentAccount, removeCoffeeEvent } = useCoffee();
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

  // Function to show toast messages
  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleCoffeePress = (event) => {
    // Check if this is a gear item that needs to navigate to GearDetail
    if (event.navigateTo === 'GearDetail') {
      navigation.navigate('GearDetail', { 
        gearName: event.gearName,
        gearId: event.gearId
      });
      return;
    }
    
    navigation.navigate('CoffeeDetail', { 
      coffeeId: event.coffeeId,
      skipAuth: true
    });
  };

  const handleRecipePress = (event) => {
    // Ensure we have a valid event object before proceeding
    if (!event || !event.id) {
      console.error('Invalid event object passed to handleRecipePress:', event);
      return;
    }

    // Navigate to the RecipeDetail screen with the original event as the recipe
    navigation.navigate('RecipeDetail', { 
      recipeId: event.id,
      coffeeId: event.coffeeId,
      coffeeName: event.coffeeName,
      roaster: event.roaster || event.roasterName,
      recipe: {
        ...event,
        // Only generate steps if they don't already exist
        steps: event.steps || [
          { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
          { time: '0:00', action: `Add ${event.amount || 18}g coffee (${event.grindSize || 'Medium'} grind)`, water: 0 },
          { time: '0:00', action: `Add ${Math.round((event.amount || 18) * 2)}g water for bloom`, water: Math.round((event.amount || 18) * 2) },
          { time: '0:30', action: 'Gently stir bloom', water: 0 },
          { time: '0:45', action: `Add water to ${Math.round((event.waterVolume || 300) * 0.3)}g`, water: Math.round((event.waterVolume || 300) * 0.3) },
          { time: '1:15', action: `Add water to ${Math.round((event.waterVolume || 300) * 0.5)}g`, water: Math.round((event.waterVolume || 300) * 0.5) },
          { time: '1:45', action: `Add water to ${Math.round((event.waterVolume || 300) * 0.7)}g`, water: Math.round((event.waterVolume || 300) * 0.7) },
          { time: '2:15', action: `Add water to ${event.waterVolume || 300}g`, water: (event.waterVolume || 300) },
          { time: event.brewTime || '3:00', action: 'Drawdown complete', water: 0 }
        ],
        // Only add tips if they don't already exist
        tips: event.tips || [
          'Use filtered water for the best results',
          'Grind your coffee just before brewing',
          'Keep your equipment clean for consistent results',
          'Use a scale to measure your coffee and water precisely',
          'Maintain a consistent water temperature throughout the brew'
        ],
        // Ensure method is properly set
        method: event.method || event.brewingMethod || 'Pour Over'
      },
      imageUrl: event.imageUrl
    });
  };

  const handleUserPress = (event) => {
    navigation.navigate('UserProfileBridge', { 
      userId: event.userId,
      userName: event.userName,
      skipAuth: true
    });
  };

  const handleOptionsPress = (event, action) => {
    console.log('Options action:', action, 'for event:', event.id);
    // Handle different actions like delete, edit, etc.
    if (action === 'delete') {
      // Delete the event and refresh list
      if (removeCoffeeEvent) {
        removeCoffeeEvent(event.id);
        // Show delete success toast
        showToast('Post deleted');
      } else {
        // Fallback if function isn't available: reload data
        loadData();
      }
    } else if (action === 'report') {
      // Handle report action
      showToast('Post reported');
    }
  };

  const handleLikePress = (eventId, isLiked) => {
    console.log('Like pressed:', eventId, isLiked);
    // Handle liking/unliking
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={allEvents}
        renderItem={({ item }) => {
          console.log('Rendering event:', {
            id: item.id,
            friends: item.friends,
            location: item.location,
            locationId: item.locationId
          });
          return (
            <CoffeeLogCard 
              event={item}
              onCoffeePress={handleCoffeePress}
              onRecipePress={handleRecipePress}
              onUserPress={handleUserPress}
              onOptionsPress={handleOptionsPress}
              onLikePress={handleLikePress}
              currentUserId={currentAccount}
              showToast={showToast}
            />
          );
        }}
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
      
      {/* FAB - temporarily hidden
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom }]}
        onPress={() => navigation.navigate('AddCoffee')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    // backgroundColor: '#FFFFFF',
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
  fab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 