import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import ThemeCoffeeLogCard from '../components/ThemeCoffeeLogCard';
import Toast from '../components/Toast';
import { useTheme } from '../context/ThemeContext';
import { checkSupabaseConnection, getCoffees } from '../data/dataService';

export default function HomeScreen({ navigation }) {
  const { allEvents, isLoading, loadData, recipes, addRecipe, currentAccount, removeCoffeeEvent, user } = useCoffee();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { theme, isDarkMode } = useTheme();

  console.log('HomeScreen rendering, allEvents length:', allEvents?.length || 0);

  // Load data once when the component mounts
  useEffect(() => {
    if (!initialLoadDone && (!allEvents || allEvents.length === 0) && currentAccount) {
      console.log('HomeScreen - Initial data load for account:', currentAccount);
      loadData(currentAccount);
      setInitialLoadDone(true);
    }
  }, [initialLoadDone, allEvents, loadData, currentAccount]);

  useEffect(() => {
    const testConnection = async () => {
      // Test Supabase connection
      const isConnected = await checkSupabaseConnection();
      console.log('Connection test result:', isConnected);
      
      // Test data fetching
      try {
        const coffees = await getCoffees();
        console.log('Fetched coffees:', coffees?.length);
      } catch (err) {
        console.error('Error fetching coffees:', err.message);
      }
    };
    
    testConnection();
  }, []);

  const onRefresh = useCallback(async () => {
    console.log('HomeScreen refresh triggered');
    if (!currentAccount) {
      console.log('No current account, skipping refresh');
      return;
    }
    
    setRefreshing(true);
    try {
      await loadData(currentAccount);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData, currentAccount]);

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

    console.log('Handling coffee press with event:', {
      type: event.type,
      id: event.id || event.coffeeId,
      name: event.name
    });
    
    // For coffee recommendations, directly use the properties
    if (event.type === 'coffee_recommendation' || event.type === 'similar_coffee_recommendation') {
      navigation.navigate('CoffeeDetail', { 
        coffeeId: event.coffeeId || event.id,
        skipAuth: true,
        // Use the coffee properties directly rather than nesting
        coffee: {
          id: event.coffeeId || event.id,
          name: event.name,
          roaster: event.roaster,
          image: event.image || event.imageUrl,
          origin: event.origin,
          process: event.process,
          description: event.description
        }
      });
      return;
    }
    
    // Standard navigation with just the ID
    navigation.navigate('CoffeeDetail', { 
      coffeeId: event.coffeeId || event.id,
      skipAuth: true,
      // If the event has coffee properties, pass them directly
      coffee: event.name ? {
        id: event.coffeeId || event.id,
        name: event.name || event.coffeeName,
        roaster: event.roaster || event.roasterName,
        image: event.image || event.imageUrl,
        description: event.description,
        origin: event.origin,
        process: event.process
      } : undefined
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
    console.log('HomeScreen - handleUserPress called with event:', event);
    
    // For current user, navigate to main Profile screen
    if (event.userId === currentAccount) {
      navigation.navigate('Profile');
      return;
    }

    // Try to find a matching user ID format if the event uses a different format
    let userId = event.userId;
    if (event.userName) {
      // If we have a userName, use it as a fallback
      userId = event.userId || event.userName;
    }
    
    // For other users, navigate directly to UserProfileScreen instead of UserProfileBridge
    navigation.navigate('UserProfileScreen', { 
      userId: userId,
      userName: event.userName,
      userAvatar: event.userAvatar,
      isBusinessAccount: event.isBusinessAccount || false,
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
      } else if (currentAccount) {
        // Fallback if function isn't available: reload data
        loadData(currentAccount);
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primaryText} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={allEvents}
        renderItem={({ item }) => {
          console.log('Rendering event:', {
            id: item.id,
            friends: item.friends,
            location: item.location,
            locationId: item.locationId
          });
          
          // Enhance item with default recipe data if missing
          const enhancedItem = {
            ...item,
            // If type is missing or null, set it to 'coffee_log'
            type: item.type || 'coffee_log',
            // Add default brewing method if missing
            brewingMethod: item.brewingMethod || item.method || 'V60',
            // Add default recipe data if missing
            amount: item.amount || '15',
            grindSize: item.grindSize || 'Medium',
            waterVolume: item.waterVolume || '250',
            brewTime: item.brewTime || '3:00'
          };
          
          return (
            <ThemeCoffeeLogCard 
              event={enhancedItem}
              onCoffeePress={handleCoffeePress}
              onRecipePress={handleRecipePress}
              onUserPress={handleUserPress}
              onOptionsPress={handleOptionsPress}
              onLikePress={handleLikePress}
              currentUserId={user?.id || currentAccount}
              showToast={showToast}
            />
          );
        }}
        keyExtractor={item => `${item.id}-${item.timestamp || Date.now()}`}
        contentContainerStyle={[
          styles.listContainer,
          { backgroundColor: theme.background },
          allEvents?.length === 0 && { flex: 1 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[isDarkMode ? '#FFFFFF' : '#000000']}
            tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
            <Ionicons name="cafe" size={50} color={theme.secondaryText} />
            <Text style={[styles.emptyText, { color: theme.primaryText }]}>No coffee logs yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>Log your first coffee brewing session!</Text>
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
  },
  listContainer: {
    borderTopWidth: 0,
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
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