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
  TextInput,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActionSheetIOS
} from 'react-native';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import eventEmitter from '../utils/EventEmitter';
import mockRecipes from '../data/mockRecipes.json';
import mockUsers from '../data/mockUsers.json';
import mockCoffees from '../data/mockCoffees.json';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppImage from '../components/common/AppImage';
import RecipeStepCard from '../components/RecipeStepCard';
import RecipeAttributes from '../components/RecipeAttributes';
import { COLORS, FONTS, SIZES } from '../constants';
import ToolBar from '../components/common/ToolBar';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function RecipeDetailScreen() {
  const { 
    coffeeCollection, 
    addToCollection, 
    removeFromCollection,
    recipes,
    coffeeEvents,
    addCoffeeEvent,
    updateRecipe,
    favorites,
    toggleFavorite
  } = useCoffee();
  
  const navigation = useNavigation();
  const route = useRoute();
  const { recipeId, coffeeId, coffeeName, recipe: routeRecipe } = route.params;
  const { 
    coffeeWishlist, 
    addToWishlist, 
    removeFromWishlist,
    setCoffeeCollection,
    setCoffeeWishlist
  } = useCoffee();
  
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const [recipe, setRecipe] = useState(null);
  const [coffee, setCoffee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInCollection, setIsInCollection] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastActionText, setToastActionText] = useState('');
  const [toastAction, setToastAction] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removalTimeout, setRemovalTimeout] = useState(null);
  const [logged, setLogged] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  
  // Mock the current user id for demo purposes
  const currentUserId = 'user1';

  // Sample remixes data
  const sampleRemixes = [
    {
      id: `remix-${recipeId}-1`,
      name: "Stronger V60 Method",
      userId: "user5",
      userName: "Sophia Miller",
      userAvatar: "https://randomuser.me/api/portraits/women/68.jpg",
      grindSize: "Medium-Fine",
      amount: Number(recipe?.amount || 18) + 3,
      waterVolume: recipe?.waterVolume || 300,
      waterTemperature: 92,
      brewTime: recipe?.brewTime || "3:00",
      upvotes: 34,
      saves: 12,
      modifications: "+3g coffee, finer grind",
      date: "3 days ago"
    },
    {
      id: `remix-${recipeId}-2`,
      name: "Lighter V60 Recipe",
      userId: "user10",
      userName: "Lucas Brown",
      userAvatar: "https://randomuser.me/api/portraits/men/55.jpg",
      grindSize: recipe?.grindSize || "Medium",
      amount: recipe?.amount || 18,
      waterVolume: Number(recipe?.waterVolume || 300) - 30,
      waterTemperature: 88,
      brewTime: recipe?.brewTime || "3:00",
      upvotes: 27,
      saves: 8,
      modifications: "-30ml water, 88°C temperature",
      date: "1 week ago"
    }
  ];

  // Check if recipe is based on another recipe
  const [basedOnRecipe, setBasedOnRecipe] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        console.log('Route params:', JSON.stringify(route.params, null, 2));
        
        // Handle case where recipe is passed directly through route params
        if (route.params?.recipe) {
          const routeRecipe = route.params.recipe;
          setRecipe(routeRecipe);
          
          // Check if recipe is explicitly based on another recipe by checking route.params.basedOnRecipe
          if (route.params?.basedOnRecipe && route.params.basedOnRecipe.userName) {
            console.log('Setting based on recipe from route params:', route.params.basedOnRecipe.userName);
            setBasedOnRecipe(route.params.basedOnRecipe);
          } else {
            // Clear basedOnRecipe if not provided
            console.log('No basedOnRecipe in route params, clearing state');
            setBasedOnRecipe(null);
          }
          
          // Find coffee info from mockCoffees.json if possible
          const coffeeId = route.params?.coffeeId || routeRecipe.coffeeId;
          const coffeeInfo = coffeeId ? 
            (mockCoffees.coffees.find(c => c.id === coffeeId) || 
              mockCoffees.coffeeSuggestions.find(c => c.id === coffeeId)) : null;
          
          // Use coffee info from route params but with image from mockCoffees if available
          setCoffee({
            id: coffeeId,
            name: route.params?.coffeeName || routeRecipe.coffeeName,
            roaster: route.params?.roaster || routeRecipe.roaster || 'Coffee Roaster',
            image: coffeeInfo?.image || coffeeInfo?.imageUrl || 
                  route.params?.imageUrl || routeRecipe.imageUrl || 
                  'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
          });
          
          // Check if this coffee is in collection or wishlist
          const isInCol = coffeeCollection.some(c => c.id === coffeeId);
          const isInWish = coffeeWishlist.some(c => c.id === coffeeId);
          const isFav = favorites.includes(coffeeId);
          
          setIsInCollection(isInCol);
          setIsInWishlist(isInWish);
          setIsFavorite(isFav);
          
          // Check if current user has liked or saved this recipe
          setLogged(routeRecipe?.loggedUsers?.includes(currentUserId) || false);
          setSaved(routeRecipe?.savedUsers?.includes(currentUserId) || false);
          
          // Set log count, checking if this recipe was created from a logged coffee event
          const isFromLoggedEvent = route.params?.fromLoggedEvent || 
                                  route.params?.fromCoffeeEvent || 
                                  routeRecipe.fromCoffeeEvent;
          
          const logCountValue = isFromLoggedEvent ? 
                              Math.max(1, routeRecipe?.logs || 0) : 
                              routeRecipe?.logs || 0;
          
          setLogCount(logCountValue);
          setSaveCount(routeRecipe?.saves || 0);
          
          // If this recipe was created from a logged event, ensure logged state is true
          if (isFromLoggedEvent) {
            setLogged(true);
          }
          
          // Update route params to include the full recipe for ActionSheet access
          // Only update if needed to prevent infinite loop
          if (!route.params.recipeUpdated) {
            navigation.setParams({ 
              recipe: routeRecipe,
              recipeUpdated: true,
              fromLoggedEvent: isFromLoggedEvent
            });
          }
          
          setLoading(false);
          return;
        }
        
        // If no direct recipe, always clear basedOnRecipe as it's not relevant for recipes loaded from other sources
        setBasedOnRecipe(null);
        
        const { recipeId, coffeeId, coffeeName, roaster, imageUrl } = route.params || {};
        
        // First try to find the recipe in mockRecipes.json by ID
        const mockRecipeMatch = mockRecipes.recipes.find(r => r.id === recipeId);
        
        if (mockRecipeMatch) {
          // Use the recipe from mockRecipes.json
          setRecipe(mockRecipeMatch);
          
          // Find the coffee in mockCoffees.json to get the correct coffee image
          const coffeeInfo = mockCoffees.coffees.find(c => c.id === mockRecipeMatch.coffeeId) || 
                            mockCoffees.coffeeSuggestions.find(c => c.id === mockRecipeMatch.coffeeId);
          
          // Set coffee info from the recipe, but use the coffee's image from mockCoffees if available
          setCoffee({
            id: mockRecipeMatch.coffeeId,
            name: mockRecipeMatch.coffeeName,
            roaster: mockRecipeMatch.roaster,
            image: coffeeInfo?.image || coffeeInfo?.imageUrl || mockRecipeMatch.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
          });
          
          // Check if this coffee is in collection or wishlist
          const isInCol = coffeeCollection.some(c => c.id === mockRecipeMatch.coffeeId);
          const isInWish = coffeeWishlist.some(c => c.id === mockRecipeMatch.coffeeId);
          const isFav = favorites.includes(mockRecipeMatch.coffeeId);
          
          setIsInCollection(isInCol);
          setIsInWishlist(isInWish);
          setIsFavorite(isFav);
          
          setLogCount(mockRecipeMatch.logs || 0);
          setSaveCount(mockRecipeMatch.saves || 0);
          
          // Update route params to include the full recipe for ActionSheet access
          if (!route.params.recipeUpdated) {
            navigation.setParams({ 
              recipe: mockRecipeMatch,
              recipeUpdated: true 
            });
          }
          
          setLoading(false);
          return;
        }
        
        // If not found in mockRecipes.json, try to find the recipe in recipes array
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
            userAvatar: route.params?.userAvatar || foundRecipe.userAvatar,
            // Ensure likedUsers and savedUsers exist
            loggedUsers: foundRecipe.loggedUsers || [],
            savedUsers: foundRecipe.savedUsers || []
          };
          
          setRecipe(recipeWithTips);
          
          // If coffee info was passed as params, use it
          if (coffeeId && coffeeName) {
            // Find the coffee in mockCoffees.json to get the correct coffee image
            const coffeeInfo = mockCoffees.coffees.find(c => c.id === coffeeId) || 
                              mockCoffees.coffeeSuggestions.find(c => c.id === coffeeId);
            
            setCoffee({
              id: coffeeId,
              name: coffeeName,
              roaster: route.params?.roaster || 'Coffee Roaster',
              image: coffeeInfo?.image || coffeeInfo?.imageUrl || route.params?.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
            });
          } else {
            // Try to find coffee info from the recipe
            const coffeeId = foundRecipe.coffeeId;
            const coffeeInfo = coffeeId ? 
              (mockCoffees.coffees.find(c => c.id === coffeeId) || 
               mockCoffees.coffeeSuggestions.find(c => c.id === coffeeId)) : null;
            
            const coffee = coffeeCollection.find(c => c.id === foundRecipe.coffeeId) ||
                         coffeeWishlist.find(c => c.id === foundRecipe.coffeeId);
            if (coffee) {
              setCoffee({
                ...coffee,
                image: coffeeInfo?.image || coffeeInfo?.imageUrl || coffee.image
              });
            }
          }
          
          // Update route params to include the full recipe for ActionSheet access
          if (!route.params.recipeUpdated) {
            navigation.setParams({ 
              recipe: recipeWithTips,
              recipeUpdated: true 
            });
          }
          
          setLoading(false);
          return;
        }
        
        // Check if we can create a recipe from an event
        const event = coffeeEvents.find(e => e.id === recipeId);
        if (event) {
          const recipeFromEvent = {
            id: event.id,
            name: `${event.coffeeName} ${event.method || event.brewingMethod}`,
            method: event.method || event.brewingMethod,
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
            ],
            // Add empty arrays for likedUsers and savedUsers
            loggedUsers: [currentUserId],  // Add current user as a logger
            savedUsers: [],
            logs: 1,  // Set logs to 1 since this is from a logged event
            saves: 0,
            fromCoffeeEvent: true  // Mark this recipe as created from a coffee event
          };
          setRecipe(recipeFromEvent);
          
          // Find coffee in mockCoffees.json
          const coffeeInfo = event.coffeeId ? 
            (mockCoffees.coffees.find(c => c.id === event.coffeeId) || 
             mockCoffees.coffeeSuggestions.find(c => c.id === event.coffeeId)) : null;
          
          setCoffee({
            id: event.coffeeId,
            name: event.coffeeName,
            roaster: event.roaster || event.roasterName,
            image: coffeeInfo?.image || coffeeInfo?.imageUrl || event.imageUrl
          });
          
          // Set logged state since this is from a logged event
          setLogged(true);
          setLogCount(1);
          
          // Update route params to include the full recipe for ActionSheet access
          if (!route.params.recipeUpdated) {
            navigation.setParams({ 
              recipe: recipeFromEvent,
              recipeUpdated: true,
              fromLoggedEvent: true
            });
          }
          
          setLoading(false);
          return;
        }
        
        // Fallback to first recipe in mockRecipes.json if recipe not found anywhere
        const fallbackRecipe = mockRecipes.recipes[0] || {
          id: recipeId,
          name: 'Coffee Recipe',
          method: 'Pour Over',
          amount: 18,
          grindSize: 'Medium',
          waterVolume: 300,
          brewTime: '3:00',
          notes: 'A simple coffee recipe',
          userId: 'user1',
          userName: 'Coffee Lover',
          userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          tips: [
            'Use filtered water for best results',
            'Pre-wet the filter paper to remove paper taste'
          ],
          loggedUsers: [],
          savedUsers: [],
          logs: 0,
          saves: 0
        };
        
        console.log('Using fallback recipe:', fallbackRecipe.name);
        setRecipe(fallbackRecipe);
        
        // Find coffee in mockCoffees.json for the fallback recipe
        const coffeeInfo = fallbackRecipe.coffeeId ? 
          (mockCoffees.coffees.find(c => c.id === fallbackRecipe.coffeeId) || 
           mockCoffees.coffeeSuggestions.find(c => c.id === fallbackRecipe.coffeeId)) : null;
        
        // Set coffee info based on the fallback recipe
        setCoffee({
          id: fallbackRecipe.coffeeId || 'coffee1',
          name: fallbackRecipe.coffeeName || 'Coffee',
          roaster: fallbackRecipe.roaster || 'Coffee Roaster',
          image: coffeeInfo?.image || coffeeInfo?.imageUrl || fallbackRecipe.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e'
        });
        
        // Update route params to include the full recipe for ActionSheet access
        if (!route.params.recipeUpdated) {
          navigation.setParams({ 
            recipe: fallbackRecipe,
            recipeUpdated: true 
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId, coffeeCollection, coffeeWishlist, favorites, recipes, coffeeId, coffeeName, navigation]);

  // Check if recipe is in favorites/saved state
  useEffect(() => {
    if (recipe && favorites) {
      // Check if this recipe is in favorites (either by isSaved flag or presence in favorites array)
      const isSavedInFavorites = recipe.isSaved || favorites.includes(recipe.id);
      setSaved(isSavedInFavorites);
    }
  }, [recipe, favorites]);

  // Ensure logged state reflects the event data
  useEffect(() => {
    if (recipe) {
      // If this recipe was created from a logged event, it should show at least 1 log
      if (route.params?.fromLoggedEvent) {
        setLogCount(prev => Math.max(prev, 1));
        setLogged(true);
      }
    }
  }, [recipe, route.params]);

  useEffect(() => {
    // Calculate average rating if there are logs with ratings
    if (coffee) {
      // In a real app, this would be calculated from the server
      // Here we'll use a mock calculation
      const hasRatings = recipe?.logs && recipe.logs > 0;
      if (hasRatings) {
        // Calculate average from mock data (4.2 is just an example)
        // In a real app, this would be calculated from actual ratings
        const mockAverageRating = recipe.averageRating || 4.2;
        setAverageRating(mockAverageRating);
        setRatingCount(recipe.logs || logCount);
      }
    }
  }, [recipe, coffee, logCount]);

  const navigateToUserProfile = (userId) => {
    navigation.navigate('UserProfileBridge', { userId, skipAuth: true });
  };

  const navigateToCoffeeDetail = () => {
    if (coffee) {
      // Don't try to filter recipes here, just use what we have
      navigation.navigate('CoffeeDetail', { 
        coffeeId: coffee.id,
        skipAuth: true
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
        showToast('Added to your collection', '', null);
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
    showToast('Restored to your collection', '', null);
  };

  const showToast = (message, actionText, action) => {
    setToastMessage(message);
    setToastActionText(actionText);
    if (action) {
      // Store the action callback
      setToastAction(() => action);
    }
    setToastVisible(true);
  };

  const handleUpvote = () => {
    // Always show the log modal
    setShowLogModal(true);
  };
  
  const handleSave = () => {
    if (!recipe) return;
    
    // Toggle saved state
    const newSavedState = !saved;
    
    // Update state immediately to prevent UI flashing
    setSaved(newSavedState);
    setSaveCount(prevCount => newSavedState ? prevCount + 1 : prevCount - 1);
    
    // Update in favorites via CoffeeContext to persist the change
    if (toggleFavorite && recipe.id) {
      toggleFavorite(recipe.id);
      
      // Update the recipe in context if it exists
      if (updateRecipe && typeof updateRecipe === 'function') {
        // Create a new recipe object with updated saved state
        const updatedRecipe = { 
          ...recipe, 
          isSaved: newSavedState,
          savedUsers: newSavedState 
            ? [...(recipe.savedUsers || []), currentUserId]
            : (recipe.savedUsers || []).filter(id => id !== currentUserId)
        };
        
        // Update recipe in context
        updateRecipe(updatedRecipe);
        
        // Also update local recipe state directly
        setRecipe(updatedRecipe);
      }
    }
    
    // Show toast with action
    if (newSavedState) {
      showToast('Saved to your profile', 'View Saved', () => navigation.navigate('Saved', { type: 'recipes' }));
    } else {
      showToast('Removed from your profile', '', null);
    }
  };

  // Check event ID if it matches an event in mockEvents.json
  useEffect(() => {
    if (recipeId && recipeId.startsWith('event-') && coffeeEvents.length > 0) {
      // This is potentially an event ID from mockEvents.json
      const matchingEvent = coffeeEvents.find(e => e.id === recipeId);
      if (matchingEvent) {
        console.log('Recipe created from event in mockEvents.json:', matchingEvent.id);
        // Ensure this event-based recipe shows at least one log
        setLogCount(prev => Math.max(prev, 1));
        setLogged(true);
      }
    }
  }, [recipeId, coffeeEvents]);

  const handleLogSubmit = () => {
    // Create a log event
    const eventData = {
      id: `log-${Date.now()}`,
      coffeeName: coffee.name,
      coffeeId: coffee.id,
      roaster: coffee.roaster,
      imageUrl: coffee.image,
      method: recipe.method || recipe.brewingMethod,
      amount: recipe.amount,
      grindSize: recipe.grindSize,
      waterVolume: recipe.waterVolume,
      brewTime: recipe.brewTime,
      timestamp: new Date().toISOString(),
      rating: rating > 0 ? rating : null,
      notes: notes,
      recipeId: recipe.id,
      recipeName: recipe.name,
      userId: currentUserId,
      // Get user info from a more reliable source - mock data for now
      userName: 'Ivo Vilches', // Hard-coded for demo purposes
      userAvatar: 'assets/users/ivo-vilches.jpg',
    };

    // Add the event to context
    addCoffeeEvent(eventData);
    
    // Update log count - already sets it correctly
    setLogCount(prevCount => prevCount + 1);
    setLogged(true);
    
    // Update the loggedUsers array - this was missing
    const updatedLoggedUsers = recipe.loggedUsers ? 
      [...recipe.loggedUsers, currentUserId] : 
      [currentUserId];
    
    // Update the average rating if a rating was provided
    if (rating > 0) {
      // Calculate new average rating
      const newRatingCount = ratingCount + 1;
      const newTotalRating = (averageRating * ratingCount) + rating;
      const newAverageRating = newTotalRating / newRatingCount;
      
      setAverageRating(newAverageRating);
      setRatingCount(newRatingCount);
      
      // In a real app, you would update this on the server
      if (updateRecipe) {
        const updatedRecipe = {
          ...recipe,
          averageRating: newAverageRating,
          logs: logCount + 1, // Use the current logCount + 1
          loggedUsers: updatedLoggedUsers
        };
        updateRecipe(updatedRecipe);
        setRecipe(updatedRecipe); // Also update local recipe state
      }
    } else {
      // Update the recipe even if no rating was provided
      if (updateRecipe) {
        const updatedRecipe = {
          ...recipe,
          logs: logCount + 1,
          loggedUsers: updatedLoggedUsers
        };
        updateRecipe(updatedRecipe);
        setRecipe(updatedRecipe);
      }
    }
    
    // Hide the modal
    setShowLogModal(false);
    // Show success toast
    showToast('Log saved successfully');
  };

  const navigateToOriginalRecipe = () => {
    if (recipe?.originalRecipeId || (basedOnRecipe && basedOnRecipe.id)) {
      navigation.navigate('RecipeDetail', {
        recipeId: recipe?.originalRecipeId || basedOnRecipe?.id,
        coffeeId: recipe?.originalCoffeeId || basedOnRecipe?.coffeeId,
        coffeeName: recipe?.originalCoffeeName || basedOnRecipe?.coffeeName,
        roaster: recipe?.originalRoaster || basedOnRecipe?.roaster,
        imageUrl: recipe?.originalImageUrl || basedOnRecipe?.imageUrl,
        recipe: recipe?.originalRecipe || basedOnRecipe,
        userId: recipe?.originalUserId || basedOnRecipe?.userId,
        userName: recipe?.originalUserName || basedOnRecipe?.userName,
        userAvatar: recipe?.originalUserAvatar || basedOnRecipe?.userAvatar,
      }, {
        animation: 'slide_from_right'
      });
    }
  };

  const handleCreatorPress = () => {
    if (recipe?.creatorId) {
      // Find the creator in mockUsers
      const creator = mockUsers.users.find(user => user.id === recipe.creatorId);
      if (creator) {
        navigation.navigate('ProfileScreen', { userId: creator.id });
      }
    }
  };

  // Check if this is a business account (like Vértigo y Calambre)
  const isBusinessAccount = recipe && (
    route.params?.isBusinessAccount ||
    recipe.userName === 'Vértigo y Calambre' || 
    recipe.userName === 'Kima Coffee' ||
    recipe.userName?.includes('Café') ||
    recipe.userId?.startsWith('business-')
  );

  const handleShare = async () => {
    try {
      const shareMessage = `Check out this coffee recipe for ${coffee?.name}: "${recipe.name}" by ${recipe.userName}`;
      const shareOptions = {
        message: shareMessage,
        url: recipe.imageUrl || coffee?.image
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const showActionSheet = () => {
    const options = ['Share', 'Report', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
      },
      (buttonIndex) => {
        if (buttonIndex === 0) {
          handleShare();
        } else if (buttonIndex === 1) {
          // Handle report
          Alert.alert('Report Recipe', 'Are you sure you want to report this recipe?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Report', style: 'destructive', onPress: () => {
              // Handle report action
              showToast('Recipe reported', '');
            }}
          ]);
        }
      }
    );
  };

  // Safe way to render text values
  const safeRender = (value, defaultValue = '') => {
    if (value === null || value === undefined) {
      return defaultValue;
    }
    return String(value);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primaryText} />
          <Text style={[styles.loadingText, { color: theme.primaryText }]}>Loading recipe details...</Text>
        </View>
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
          <Ionicons name="alert-circle" size={50} color={theme.primaryText} />
          <Text style={[styles.errorText, { color: theme.primaryText }]}>Recipe not found</Text>
          <Text style={[styles.errorSubtext, { color: theme.secondaryText }]}>The recipe you're looking for doesn't exist or has been removed.</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.primaryText }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.background }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Toast 
        visible={toastVisible}
        message={toastMessage}
        actionText={toastActionText}
        onAction={toastAction}
        onDismiss={() => setToastVisible(false)}
        duration={4000}
      />
      
      {/* Log Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLogModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Log this brew</Text>
              <TouchableOpacity 
                onPress={() => setShowLogModal(false)}
                style={[styles.closeButton, { backgroundColor: theme.cardBackground }]}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={[styles.modalBody, { backgroundColor: theme.background }]} keyboardShouldPersistTaps="handled">
              <View style={[styles.previewCoffeeInfo, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.previewTitle, { color: theme.primaryText }]}>{recipe?.name}</Text>
                <Text style={[styles.previewSubtitle, { color: theme.secondaryText }]}>{coffee?.name} by {coffee?.roaster}</Text>
              </View>
              
              <View style={[styles.ratingContainer, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.ratingLabel, { color: theme.primaryText }]}>Rate this brew (optional)</Text>
                <View style={[styles.starsContainer, { backgroundColor: theme.background }]}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                      style={[styles.starButton, { backgroundColor: theme.background }]}
                    >
                      <Ionicons
                        name={star <= rating ? "star" : "star-outline"}
                        size={28}
                        color={star <= rating ? "#FFD700" : theme.secondaryText}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={[styles.notesContainer, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.notesLabel, { color: theme.primaryText }]}>Notes (optional)</Text>
                <TextInput
                  style={[styles.notesInput, { color: theme.primaryText, borderColor: theme.border, backgroundColor: theme.recipeContainer }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this brew..."
                  placeholderTextColor={theme.secondaryText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { paddingBottom: insets.bottom, backgroundColor: theme.cardBackground }]}>
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: "#007AFF" }]}
                onPress={handleLogSubmit}
              >
                <Text style={[styles.saveButtonText, { color: "#FFFFFF" }]}>Log this brew</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* For deleted recipes */}
        {recipe && recipe.deleted && (
          <View style={[styles.deletedRecipeContainer, { backgroundColor: theme.background }]}>
            <Ionicons name="warning-outline" size={50} color={theme.primaryText} />
            <Text style={[styles.deletedRecipeTitle, { color: theme.primaryText }]}>Recipe no longer available</Text>
            <Text style={[styles.deletedRecipeText, { color: theme.secondaryText }]}>
              This recipe has been deleted or is temporarily unavailable.
            </Text>
            
            {recipe.userName && (
              <View style={[styles.deletedRecipeUserInfo, { backgroundColor: theme.cardBackground }]}>
                <Text style={[styles.deletedRecipeUserText, { color: theme.primaryText }]}>
                  Created by <Text style={[styles.deletedRecipeUserName, { fontWeight: '600' }]}>{recipe.userName}</Text>
                </Text>
                {recipe.userAvatar && (
                  <AppImage
                    source={recipe.userAvatar}
                    style={[styles.deletedRecipeUserAvatar, { borderColor: theme.border }]}
                  />
                )}
              </View>
            )}
            
            {basedOnRecipe && basedOnRecipe.id && (
              <TouchableOpacity 
                style={[styles.viewOriginalButton, { backgroundColor: theme.primaryText }]}
                onPress={navigateToOriginalRecipe}
              >
                <Text style={[styles.viewOriginalButtonText, { color: "#FFFFFF" }]}>
                  View Original Recipe
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        {/* Regular Recipe Content */}
        {recipe && coffee && !recipe.deleted && (
          <>
            {/* Remixed from - Moved to the top */}
            {basedOnRecipe && basedOnRecipe.id && basedOnRecipe.userName && (
              <View style={[styles.basedOnContainer, { backgroundColor: theme.cardBackground }]}>
                <TouchableOpacity 
                  onPress={navigateToOriginalRecipe}
                  style={[styles.basedOnRow, { backgroundColor: theme.background }]}
                >
                  <Ionicons name="git-branch-outline" size={14} color={theme.secondaryText} style={[styles.basedOnIcon, { backgroundColor: theme.background }]} />
                  <Text style={[styles.basedOnText, { color: theme.primaryText }]}>
                    Remixed from a recipe by <Text style={[styles.basedOnHighlight, styles.basedOnLink, { fontWeight: '600' }]}>{basedOnRecipe.userName}</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          
            {/* Recipe Title with Chips */}
            <View style={[styles.recipeHeader, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.recipeMethodCoffeeContainer, { backgroundColor: theme.background }]}>
                {/* Method/Gear Chip */}
                <TouchableOpacity 
                  style={[styles.chip, { backgroundColor: theme.background }]}
                  onPress={() => navigation.navigate('GearDetail', { 
                    gearName: recipe.method || recipe.brewingMethod || 'Pour Over'
                  })}
                >
                  <Ionicons name="cafe" size={20} color={theme.primaryText} style={[styles.chipIcon, { backgroundColor: theme.background }]} />
                  <Text style={[styles.chipText, { color: theme.primaryText }]}>
                    {recipe.method || recipe.brewingMethod || 'Pour Over'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.recipeText, { color: theme.secondaryText }]}>recipe for</Text>
                
                {/* Coffee Chip */}
                <TouchableOpacity 
                  style={[styles.chip, { backgroundColor: theme.background }]}
                  onPress={navigateToCoffeeDetail}
                >
                  <AppImage 
                    source={coffee.image}
                    style={[styles.chipAvatar, { borderColor: theme.border }]}
                    placeholder="cafe"
                  />
                  <Text style={[styles.chipText, { color: theme.primaryText }]}>{coffee.name}</Text>
                </TouchableOpacity>
              </View>
              
              {/* User Chip in separate row */}
              <View style={[styles.recipeUserContainer, { backgroundColor: theme.background }]}>
                <Text style={[styles.recipeByText, { color: theme.secondaryText }]}>by</Text>
                <TouchableOpacity 
                  style={[styles.chip, { backgroundColor: theme.background }]}
                  onPress={() => recipe.userId && navigateToUserProfile(recipe.userId)}
                >
                  <AppImage 
                    source={recipe.userAvatar} 
                    style={[
                      styles.chipAvatar,
                      isBusinessAccount && styles.businessAvatarChip,
                      { borderColor: theme.border }
                    ]} 
                    placeholder="person"
                  />
                  <Text style={[styles.userChipText, { color: theme.primaryText }]}>{recipe.userName}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons for log and save - moved outside the container */}
            <View style={[styles.actionsOuterContainer, { backgroundColor: theme.background }]}>
              <View style={[styles.actionButtonsContainer, { backgroundColor: theme.background }]}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.background }]} 
                  onPress={handleUpvote}
                >
                  <Ionicons 
                    name="add-circle-outline" 
                    size={20} 
                    color={logged ? "#FF3B30" : theme.primaryText} 
                  />
                  <Text style={[styles.actionButtonText, { color: theme.primaryText }]}>
                    Log
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton,
                    saved && styles.actionButtonActive,
                    { backgroundColor: theme.background }
                  ]} 
                  onPress={handleSave}
                >
                  <Ionicons 
                    name={saved ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={saved ? "#007AFF" : theme.primaryText} 
                  />
                  <Text style={[
                    styles.actionButtonText,
                    saved && styles.actionButtonTextActive,
                    { color: theme.primaryText }
                  ]}>
                    {saved ? "Saved" : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Who tried it section - moved outside the container */}
              <View style={[
                styles.whoTriedContainer,
                !averageRating && styles.whoTriedContainerCentered,
                { backgroundColor: theme.background }
              ]}>
                <View style={[styles.whoTriedGroup, { backgroundColor: theme.background }]}>
                  {(logCount > 0 || (recipe.loggedUsers && recipe.loggedUsers.length > 0)) ? (
                    <>
                      <View style={[styles.avatarRow, { backgroundColor: theme.background }]}>
                        {/* Render up to 3 sample avatars - in real app, these would come from the API */}
                        <View style={[styles.triedAvatar, { zIndex: 5, backgroundColor: theme.background }]}>
                          <AppImage 
                            source="https://randomuser.me/api/portraits/women/33.jpg" 
                            style={[styles.triedAvatarImage, { borderColor: theme.border }]} 
                          />
                        </View>
                        {(logCount >= 2 || (recipe.loggedUsers && recipe.loggedUsers.length >= 2)) && (
                          <View style={[styles.triedAvatar, { zIndex: 4, marginLeft: -10, backgroundColor: theme.background }]}>
                            <AppImage 
                              source="https://randomuser.me/api/portraits/men/45.jpg" 
                              style={[styles.triedAvatarImage, { borderColor: theme.border }]} 
                            />
                          </View>
                        )}
                        {(logCount >= 3 || (recipe.loggedUsers && recipe.loggedUsers.length >= 3)) && (
                          <View style={[styles.triedAvatar, { zIndex: 3, marginLeft: -10, backgroundColor: theme.background }]}>
                            <AppImage 
                              source="https://randomuser.me/api/portraits/women/68.jpg" 
                              style={[styles.triedAvatarImage, { borderColor: theme.border }]} 
                            />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.whoTriedText, { color: theme.primaryText }]}>
                        {(logCount === 1 || (recipe.loggedUsers && recipe.loggedUsers.length === 1)) ? 
                          "Logged 1 time" : 
                          `Logged ${safeRender(logCount || recipe.loggedUsers?.length)} times`}
                      </Text>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.beFirstContainer, { backgroundColor: theme.background }]}
                      onPress={handleUpvote}
                    >
                      <Text style={[styles.beFirstText, { color: theme.primaryText }]}>Be the first to try it</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {averageRating > 0 && logCount > 0 && (
                  <View style={[styles.averageRatingContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={[styles.averageRatingText, { color: theme.primaryText }]}>
                      {safeRender(averageRating.toFixed(1), '0.0')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Recipe Details */}
            <View style={[styles.section, { backgroundColor: theme.background }]}>
              <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: theme.primaryText }]}>Recipe Details</Text>
              </View>
              <View style={[styles.detailsGrid, { backgroundColor: theme.background }]}>
                <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                  <Text style={[styles.detailLabel, { color: theme.primaryText }]}>Coffee</Text>
                  <Text style={[styles.detailValue, { color: theme.primaryText }]}>{safeRender(recipe.amount, '18')}g</Text>
                </View>
                <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                  <Text style={[styles.detailLabel, { color: theme.primaryText }]}>Grind Size</Text>
                  <Text style={[styles.detailValue, { color: theme.primaryText }]}>{safeRender(recipe.grindSize, 'Medium')}</Text>
                </View>
                <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                  <Text style={[styles.detailLabel, { color: theme.primaryText }]}>Water</Text>
                  <Text style={[styles.detailValue, { color: theme.primaryText }]}>{safeRender(recipe.waterVolume, '300')}ml</Text>
                </View>
                <View style={[styles.detailItem, { backgroundColor: theme.background }]}>
                  <Text style={[styles.detailLabel, { color: theme.primaryText }]}>Brew Time</Text>
                  <Text style={[styles.detailValue, { color: theme.primaryText }]}>{safeRender(recipe.brewTime, '3:00')}</Text>
                </View>
              </View>
            </View>

            {/* Brewing Steps - only show if recipe has steps */}
            {recipe && recipe.steps && Array.isArray(recipe.steps) && recipe.steps.length > 0 && (
              <View style={[styles.section, { backgroundColor: theme.background }]}>
                <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: theme.primaryText }]}>Brewing Steps</Text>
                </View>
                {recipe.steps.map((step, index) => (
                  <View key={index} style={[styles.stepItem, { backgroundColor: theme.background }]}>
                    <View style={[styles.stepNumber, { backgroundColor: theme.background }]}>
                      <Text style={[styles.stepNumberText, { color: theme.primaryText }]}>{index + 1}</Text>
                    </View>
                    <View style={[styles.stepContentContainer, { backgroundColor: theme.background }]}>
                      <Text style={[styles.stepText, { color: theme.primaryText }]}>{step.description}</Text>
                      <View style={[styles.stepDetailContainer, { backgroundColor: theme.background }]}>
                        {step.time && (
                          <Text style={[styles.stepTime, { color: theme.secondaryText }]}>Time: {safeRender(step.time)}</Text>
                        )}
                        {step.water && parseInt(safeRender(step.water, '0')) > 0 && (
                          <Text style={[styles.stepWater, { color: theme.secondaryText }]}>Water: {safeRender(step.water)}g</Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Notes */}
            {recipe && recipe.notes && (
              <View style={[styles.section, { backgroundColor: theme.background }]}>
                <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: theme.primaryText }]}>Notes</Text>
                </View>
                <Text style={[styles.notesText, { color: theme.secondaryText }]}>{recipe.notes}</Text>
              </View>
            )}

            {/* New section: Remixes by Other Users */}
            {recipe && recipe.hasRemixes && (
              <View style={[styles.section, { backgroundColor: theme.background }]}>
                <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInHeader, { color: theme.primaryText }]}>Remixes</Text>
                </View>
                <View style={[styles.remixesContainer, { backgroundColor: theme.background }]}>
                  {/* Sample remixes - in a real app, these would come from the API */}
                  {sampleRemixes.length > 0 ? (
                    sampleRemixes.map((remix, index) => (
                      <TouchableOpacity 
                        key={remix.id}
                        style={[
                          styles.remixCard,
                          index === sampleRemixes.length - 1 && styles.lastRemixCard,
                          { backgroundColor: theme.background }
                        ]}
                        onPress={() => {
                          // Create a remix based on the original recipe
                          const remixRecipe = {
                            id: remix.id,
                            name: remix.name,
                            coffeeId: recipe.coffeeId,
                            coffeeName: recipe.coffeeName || coffee.name,
                            roaster: recipe.roaster || coffee.roaster,
                            userId: remix.userId,
                            userName: remix.userName,
                            userAvatar: remix.userAvatar,
                            method: recipe.method || recipe.brewingMethod || "Pour Over",
                            grindSize: remix.grindSize,
                            amount: remix.amount,
                            waterVolume: remix.waterVolume,
                            waterTemperature: remix.waterTemperature,
                            brewTime: remix.brewTime,
                            imageUrl: recipe.imageUrl || coffee.image,
                            steps: recipe.steps,
                            notes: recipe.notes,
                            upvotes: remix.upvotes,
                            saves: remix.saves,
                            modifications: remix.modifications,
                            basedOnRecipe: {
                              id: recipe.id,
                              name: recipe.name,
                              userName: recipe.userName
                            }
                          };

                          // Navigate to a new instance of RecipeDetailScreen
                          navigation.push('RecipeDetail', {
                            recipeId: remixRecipe.id,
                            recipe: remixRecipe,
                            coffeeName: remixRecipe.coffeeName,
                            coffeeId: remixRecipe.coffeeId,
                            roaster: remixRecipe.roaster,
                            imageUrl: remixRecipe.imageUrl,
                            userId: remixRecipe.userId,
                            userName: remixRecipe.userName,
                            userAvatar: remixRecipe.userAvatar,
                            basedOnRecipe: {
                              id: recipe.id,
                              name: recipe.name,
                              userName: recipe.userName
                            },
                            skipAuth: true
                          });
                        }}
                      >
                        <View style={[styles.remixUserRow, { backgroundColor: theme.background }]}>
                          <AppImage 
                            source={remix.userAvatar} 
                            style={[styles.remixUserAvatar, { borderColor: theme.border }]} 
                          />
                          <View style={[styles.remixUserInfo, { backgroundColor: theme.background }]}>
                            <Text style={[styles.remixUserName, { color: theme.primaryText }]}>{remix.userName}</Text>
                            <Text style={[styles.remixDate, { color: theme.secondaryText }]}>{remix.date}</Text>
                          </View>
                          <View>
                            <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
                          </View>
                        </View>
                        <View style={[styles.remixDetails, { backgroundColor: theme.background }]}>
                          <Text style={[styles.remixModification, { color: theme.primaryText }]}>
                            {remix.modifications}
                          </Text>
                          <View style={[styles.remixStats, { backgroundColor: theme.background }]}>
                            <View style={[styles.remixStat, { backgroundColor: theme.background }]}>
                              <Ionicons name="arrow-up" size={14} color={theme.secondaryText} />
                              <Text style={[styles.remixStatText, { color: theme.primaryText }]}>{remix.upvotes}</Text>
                            </View>
                            <View style={[styles.remixStat, { backgroundColor: theme.background }]}>
                              <Ionicons name="people-outline" size={14} color={theme.secondaryText} />
                              <Text style={[styles.remixStatText, { color: theme.primaryText }]}>{remix.saves}</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={[styles.emptyRemixesContainer, { backgroundColor: theme.background }]}>
                      <Ionicons name="git-branch" size={40} color={theme.primaryText} />
                      <Text style={[styles.emptyRemixesText, { color: theme.primaryText }]}>No remixes yet</Text>
                      <Text style={[styles.emptyRemixesSubtext, { color: theme.secondaryText }]}>Be the first to remix this recipe</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Bottom toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.cardBackground, borderTopColor: theme.divider }]}>
        <TouchableOpacity 
          style={[styles.toolbarButton, { backgroundColor: theme.background }]}
          onPress={handleUpvote}
        >
          <Ionicons 
            name={logged ? "heart" : "heart-outline"} 
            size={24} 
            color={logged ? "#FF3B30" : theme.primaryText} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, { backgroundColor: theme.background }]}
          onPress={() => setShowLogModal(true)}
        >
          <Ionicons 
            name="book-outline" 
            size={24} 
            color={theme.primaryText} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, { backgroundColor: theme.background }]}
          onPress={handleSave}
        >
          <Ionicons 
            name={saved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={saved ? "#007AFF" : theme.primaryText} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, { backgroundColor: theme.background }]}
          onPress={handleShare}
        >
          <Ionicons 
            name="share-outline" 
            size={24} 
            color={theme.primaryText} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.toolbarButton, { backgroundColor: theme.background }]}
          onPress={showActionSheet}
        >
          <Ionicons 
            name="ellipsis-horizontal" 
            size={24} 
            color={theme.primaryText} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  
  // Recipe header and related styles
  recipeHeaderContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingVertical: 24,
    margin: 16,
    // marginTop: 16,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
  },
  recipeHeaderPrefix: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  recipeMethodCoffeeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  recipeUserContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 16,
  },
  recipeByText: {
    fontSize: 14,
    color: '#666666',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingLeft: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    margin: 4,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  userChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  businessAvatarChip: {
    borderRadius: 4,
  },
  
  // Based on recipe section
  basedOnContainer: {
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
    marginBottom: -8,
  },
  basedOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basedOnIcon: {
    marginRight: 4,
  },
  basedOnText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  basedOnHighlight: {
    fontWeight: '500',
    color: '#000000',
  },
  basedOnLink: {
    fontWeight: '600',
  },
  
  // Action buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 8,
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  
  // Who tried it section
  whoTriedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  whoTriedContainerCentered: {
    justifyContent: 'center',
  },
  whoTriedGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarRow: {
    flexDirection: 'row',
    marginRight: 8,
  },
  triedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  triedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  whoTriedText: {
    fontSize: 14,
    color: '#666666',
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  averageRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 4,
  },
  
  // Recipe details section
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: 0,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
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
  
  // Steps and tips
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
  stepContentContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  stepDetailContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  stepText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  stepWater: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },
  stepTime: {
    fontSize: 14,
    color: '#666666',
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
    paddingBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  recipeText: {
    fontSize: 16,
    color: '#666666',
    marginHorizontal: 4,
    alignSelf: 'center',
  },
  // Remixes by others section
  remixesContainer: {
    marginTop: 8,
  },
  remixCard: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 16,
  },
  lastRemixCard: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  remixUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  remixUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  remixUserInfo: {
    flex: 1,
  },
  remixUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  remixDate: {
    fontSize: 12,
    color: '#666666',
  },
  remixDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remixModification: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  remixModificationHighlight: {
    fontWeight: '600',
  },
  remixStats: {
    flexDirection: 'row',
  },
  remixStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  remixStatText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginRight: 4,
  },
  sectionTitleInHeader: {
    marginBottom: 0,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '60%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  previewCoffeeInfo: {
    marginBottom: 24,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  ratingContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  starButton: {
    padding: 4,
  },
  notesContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  notesInput: {
    fontSize: 14,
    color: '#000000',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  saveButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Deleted recipe styles
  deletedRecipeContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 400,
  },
  deletedRecipeTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#333333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  deletedRecipeText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  deletedRecipeUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 12,
  },
  deletedRecipeUserText: {
    fontSize: 16,
    color: '#333333',
  },
  deletedRecipeUserName: {
    fontWeight: '600',
  },
  deletedRecipeUserAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginLeft: 10,
  },
  viewOriginalButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  viewOriginalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyRemixesContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyRemixesText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyRemixesSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  beFirstContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  beFirstText: {
    fontSize: 14,
    color: '#000000',
    // marginRight: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    fontWeight: '600',
  },
  actionsOuterContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 8,
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5EA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  toolbarButton: {
    padding: 8,
  },
  toolbarButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  toolbarButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  toolbarButtonTextActive: {
    color: '#FFFFFF',
  },
}); 