import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import eventEmitter from '../utils/EventEmitter';
import mockData from '../data/mockData.json';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function RecipeDetailScreen() {
  const { 
    coffeeCollection, 
    addToCollection, 
    removeFromCollection,
    recipes,
    coffeeEvents
  } = useCoffee();
  
  const navigation = useNavigation();
  const route = useRoute();
  const { recipeId, coffeeId, coffeeName, skipAuth } = route.params;
  const { 
    coffeeWishlist, 
    favorites, 
    addToWishlist, 
    removeFromWishlist,
    setCoffeeCollection,
    setCoffeeWishlist,
    toggleFavorite
  } = useCoffee();
  
  const insets = useSafeAreaInsets();
  const [recipe, setRecipe] = useState(null);
  const [coffee, setCoffee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCollection, setIsInCollection] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastActionText, setToastActionText] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removalTimeout, setRemovalTimeout] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        // Find the recipe in the recipes array
        const foundRecipe = recipes.find(r => r.id === recipeId);
        
        if (foundRecipe) {
          // Ensure recipe has tips array and prioritize user info from route params
          const recipeWithTips = {
            ...foundRecipe,
            tips: foundRecipe.tips || [
              'Use filtered water for best results',
              'Pre-wet the filter paper to remove paper taste',
              'Keep the water temperature consistent throughout the brew',
              'Pour in a circular motion for even extraction'
            ],
            // Prioritize user information from route params
            userId: route.params?.userId || foundRecipe.userId,
            userName: route.params?.userName || foundRecipe.userName,
            userAvatar: route.params?.userAvatar || foundRecipe.userAvatar
          };
          
          setRecipe(recipeWithTips);
          
          // If coffee info was passed as params, use it
          if (coffeeId && coffeeName) {
            setCoffee({
              id: coffeeId,
              name: coffeeName,
              roaster: route.params?.roaster || 'Coffee Roaster',
              image: route.params?.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
            });
          } else {
            // Try to find coffee info from the recipe
            const coffee = coffeeCollection.find(c => c.id === foundRecipe.coffeeId) ||
                          coffeeWishlist.find(c => c.id === foundRecipe.coffeeId);
            if (coffee) {
              setCoffee(coffee);
            }
          }
        } else {
          // Check if we can create a recipe from an event
          const event = coffeeEvents.find(e => e.id === recipeId);
          if (event) {
            const recipeFromEvent = {
              id: event.id,
              name: `${event.coffeeName} ${event.method}`,
              method: event.method,
              amount: event.amount,
              grindSize: event.grindSize,
              waterVolume: event.waterVolume,
              brewTime: event.brewTime,
              notes: event.notes,
              // Prioritize user information from route params
              userId: route.params?.userId || event.userId,
              userName: route.params?.userName || event.userName,
              userAvatar: route.params?.userAvatar || event.userAvatar,
              tips: [
                'Use filtered water for best results',
                'Pre-wet the filter paper to remove paper taste',
                'Keep the water temperature consistent throughout the brew',
                'Pour in a circular motion for even extraction'
              ]
            };
            setRecipe(recipeFromEvent);
            setCoffee({
              id: event.coffeeId,
              name: event.coffeeName,
              roaster: event.roaster,
              image: event.image
            });
          } else {
            // Fallback to mock data if recipe not found
            const mockRecipe = {
              id: recipeId,
              name: 'Ethiopian Yirgacheffe V60',
              method: 'Pour Over',
              amount: 18,
              grindSize: 'Medium',
              waterVolume: 300,
              brewTime: '3:30',
              notes: 'Bright and clean cup with floral notes',
              // Prioritize user information from route params
              userId: route.params?.userId || 'user1',
              userName: route.params?.userName || 'Coffee Lover',
              userAvatar: route.params?.userAvatar || 'https://randomuser.me/api/portraits/men/1.jpg',
              tips: [
                'Use filtered water for best results',
                'Pre-wet the filter paper to remove paper taste',
                'Keep the water temperature consistent throughout the brew',
                'Pour in a circular motion for even extraction'
              ]
            };
            setRecipe(mockRecipe);
            setCoffee({
              id: 'coffee1',
              name: 'Ethiopian Yirgacheffe',
              roaster: 'Coffee Roaster',
              image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
            });
          }
        }
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, coffeeCollection, coffeeWishlist, favorites, recipes, coffeeEvents, coffeeId, coffeeName, route.params]);

  const navigateToUserProfile = (userId) => {
    navigation.navigate('Profile', { userId, skipAuth: true });
  };

  const navigateToCoffeeDetail = () => {
    if (coffee) {
      // Get all recipes for this coffee
      const coffeeRecipes = recipes.filter(r => r.coffeeId === coffee.id);
      
      // Check if coffee is in collection or wishlist
      const isInCollection = coffeeCollection.some(c => c.id === coffee.id);
      const isInWishlist = coffeeWishlist.some(c => c.id === coffee.id);
      
      navigation.navigate('CoffeeDetail', { 
        coffeeId: coffee.id,
        skipAuth: true,
        // Pass all coffee information
        coffee: {
          ...coffee,
          isInCollection,
          isInWishlist,
          recipes: coffeeRecipes
        }
      });
    }
  };

  const navigateToCollection = () => {
    navigation.navigate('MainTabs', { 
      screen: 'Profile',
      params: { skipAuth: true }
    });
    
    setTimeout(() => {
      eventEmitter.emit('switchToCollectionTab');
    }, 100);
  };

  const handleAddToCollection = async () => {
    if (!recipe) return;
    
    try {
      if (isInCollection) {
        // Clear any existing timeout
        if (removalTimeout) {
          clearTimeout(removalTimeout);
          setRemovalTimeout(null);
        }
        
        // If there's a pending removal, cancel it
        if (pendingRemoval) {
          setPendingRemoval(null);
          return;
        }
        
        // Set the recipe as pending removal
        setPendingRemoval(recipe);
        
        // Update UI immediately
        setIsInCollection(false);
        
        // Show toast notification with undo option
        showToast('Removed from your collection', 'Undo', handleUndoRemoval);
        
        // Set a timeout to actually remove the recipe after the toast disappears
        const timeout = setTimeout(() => {
          if (pendingRemoval) {
            // Actually remove from collection
            setCoffeeCollection(prev => prev.filter(item => item.id !== recipe.id));
            setPendingRemoval(null);
          }
        }, 4000); // Same duration as the toast
        
        setRemovalTimeout(timeout);
      } else {
        // If in wishlist, remove it first
        if (isInWishlist) {
          console.log(`Mock: Removing ${recipe.name} from wishlist`);
          setIsInWishlist(false);
          // Update the wishlist state
          setCoffeeWishlist(prev => prev.filter(item => item.id !== recipe.id));
        }
        
        // Mock adding to collection
        console.log(`Mock: Adding ${recipe.name} to collection`);
        setIsInCollection(true);
        
        // Create a new recipe object with all necessary details
        const newRecipe = {
          id: recipe.id,
          name: recipe.name,
          method: recipe.method,
          amount: recipe.amount,
          grindSize: recipe.grindSize,
          waterVolume: recipe.waterVolume,
          brewTime: recipe.brewTime,
          rating: recipe.rating,
          notes: recipe.notes,
          timestamp: new Date().toISOString(),
          userId: 'currentUser',
          userName: 'You',
          userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg'
        };
        
        // Update the collection state
        setCoffeeCollection(prev => [...prev, newRecipe]);
        
        // Show toast notification without action link
        showToast('Added to your collection', '');
      }
    } catch (error) {
      console.error('Error updating collection:', error);
      Alert.alert('Error', 'Failed to update your collection. Please try again.');
    }
  };

  const handleUndoRemoval = () => {
    // Clear the timeout
    if (removalTimeout) {
      clearTimeout(removalTimeout);
      setRemovalTimeout(null);
    }
    
    // Restore the recipe to the collection
    setIsInCollection(true);
    setPendingRemoval(null);
    
    // Show a confirmation toast
    showToast('Restored to your collection', '');
  };

  const showToast = (message, actionText, onAction) => {
    setToastMessage(message);
    setToastActionText(actionText);
    setToastVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading recipe details...</Text>
        </View>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#CCCCCC" />
          <Text style={styles.errorText}>Recipe not found</Text>
          <Text style={styles.errorSubtext}>The recipe you're looking for doesn't exist or has been removed.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast 
        visible={toastVisible}
        message={toastMessage}
        actionText={toastActionText}
        onAction={toastActionText === 'Undo' ? handleUndoRemoval : navigateToCollection}
        onDismiss={() => setToastVisible(false)}
        duration={4000}
      />
      <ScrollView>
        {/* Recipe Header */}
        <View style={styles.header}>
          <View style={styles.methodContainer}>
            <Ionicons name="cafe" size={24} color="#000000" />
            <Text style={styles.methodText}>{recipe.method}</Text>
          </View>
          {recipe.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#000000" />
              <Text style={styles.ratingText}>{recipe.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <TouchableOpacity 
          style={styles.userContainer}
          onPress={() => navigateToUserProfile(recipe.userId)}
        >
          <Image 
            source={{ uri: recipe.userAvatar || 'https://via.placeholder.com/40' }} 
            style={styles.userAvatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{recipe.userName}</Text>
            <Text style={styles.timestamp}>
              {new Date(recipe.timestamp).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Associated Coffee */}
        {coffee && (
          <TouchableOpacity 
            style={styles.coffeeContainer}
            onPress={navigateToCoffeeDetail}
          >
            <View style={styles.coffeeHeader}>
              <Text style={styles.coffeeTitle}>Coffee</Text>
              <Ionicons name="chevron-forward" size={20} color="#666666" />
            </View>
            <View style={styles.coffeeInfo}>
              {coffee.image && (
                <Image 
                  source={{ uri: coffee.image }} 
                  style={styles.coffeeImage} 
                />
              )}
              <View style={styles.coffeeDetails}>
                <Text style={styles.coffeeName}>{coffee.name}</Text>
                {coffee.roaster && (
                  <Text style={styles.coffeeRoaster}>{coffee.roaster}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Recipe Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipe Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Coffee</Text>
              <Text style={styles.detailValue}>{recipe.amount}g</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Grind Size</Text>
              <Text style={styles.detailValue}>{recipe.grindSize}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Water</Text>
              <Text style={styles.detailValue}>{recipe.waterVolume}ml</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Brew Time</Text>
              <Text style={styles.detailValue}>{recipe.brewTime}</Text>
            </View>
          </View>
        </View>

        {/* Brewing Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brewing Steps</Text>
          {recipe.steps && recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step.action}</Text>
              {step.time && (
                <Text style={styles.stepTime}>{step.time}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips</Text>
          {recipe.tips && recipe.tips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Ionicons name="bulb" size={16} color="#000000" style={styles.tipIcon} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
          {(!recipe.tips || recipe.tips.length === 0) && (
            <Text style={styles.emptyText}>No tips available for this recipe.</Text>
          )}
        </View>

        {/* Notes */}
        {recipe.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{recipe.notes}</Text>
          </View>
        )}
      </ScrollView>
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999999',
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  methodText: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  timestamp: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  stepTime: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  notesText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  coffeeContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  coffeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coffeeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  coffeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coffeeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  coffeeDetails: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  coffeeRoaster: {
    fontSize: 14,
    color: '#666666',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
}); 