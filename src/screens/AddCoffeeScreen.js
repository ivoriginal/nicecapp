import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Image,
  Modal,
  SafeAreaView,
  FlatList,
  Switch,
  ActionSheetIOS
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import CoffeeCard from '../components/CoffeeCard';
import RecipeCard from '../components/RecipeCard';
import RecipeCard2 from '../components/RecipeCard2';
import UserAvatar from '../components/UserAvatar';
import CoffeeInfo from '../components/CoffeeInfo';
import mockCafes from '../data/mockCafes.json';
import mockCoffees from '../data/mockCoffees.json';
import mockUsers from '../data/mockUsers.json';
import mockRecipes from '../data/mockRecipes.json';
import { mockFollowersData } from '../data/mockFollowers';

// Helper function to format brew time as MM:SS
const formatBrewTime = (value) => {
  // Remove any non-digit and non-colon characters
  const cleanedValue = value.replace(/[^0-9:]/g, '');
  
  // Handle the case where only digits are entered (add colon)
  if (/^\d+$/.test(cleanedValue) && cleanedValue.length > 2) {
    const minutes = cleanedValue.slice(0, -2);
    const seconds = cleanedValue.slice(-2);
    return `${minutes}:${seconds}`;
  }
  
  // If already has a colon, ensure seconds are formatted properly
  if (cleanedValue.includes(':')) {
    const [minutes, seconds] = cleanedValue.split(':');
    // If seconds part is more than 2 digits, format it
    if (seconds && seconds.length > 2) {
      return `${minutes}:${seconds.slice(0, 2)}`;
    }
  }
  
  return cleanedValue;
};

export default function AddCoffeeScreen({ navigation, route }) {
  const { addCoffeeEvent, currentAccount, addRecipe, getRecipesForCoffee, recipes } = useCoffee();
  const { theme, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  // Create dynamic styles based on current theme
  const styles = createStyles(theme, isDarkMode);
  
  // Check if we're remixing a recipe or have a created recipe
  const isRemixing = route.params?.isRemixing;
  const recipeToRemix = route.params?.recipe;
  const createdRecipe = route.params?.createdRecipe;
  const preSelectedRecipe = route.params?.preSelectedRecipe;
  
  const [coffeeData, setCoffeeData] = useState({
    name: recipeToRemix?.coffeeName || '',
    coffeeId: recipeToRemix?.coffeeId || null,
    method: recipeToRemix?.brewingMethod || recipeToRemix?.method || '',
    amount: recipeToRemix?.coffeeAmount?.toString() || recipeToRemix?.amount?.toString() || '',
    grindSize: recipeToRemix?.grindSize || 'Medium',
    waterVolume: recipeToRemix?.waterAmount?.toString() || recipeToRemix?.waterVolume?.toString() || '',
    brewTime: recipeToRemix?.brewTime || '',
    brewMinutes: '',
    brewSeconds: '',
    notes: recipeToRemix?.notes || '',
    grinderUsed: '',
    steps: recipeToRemix?.steps || [],
    location: 'Home',
    locationId: null,
  });
  
  // Extract minutes and seconds from brewTime if provided as "M:SS" format
  useEffect(() => {
    if (recipeToRemix?.brewTime && typeof recipeToRemix.brewTime === 'string' && recipeToRemix.brewTime.includes(':')) {
      const [minutes, seconds] = recipeToRemix.brewTime.split(':');
      setCoffeeData(prev => ({
        ...prev,
        brewMinutes: minutes,
        brewSeconds: seconds
      }));
    }
  }, [recipeToRemix]);
  
  // Handle created recipe from navigation
  useEffect(() => {
    if (createdRecipe) {
      setCustomRecipe(createdRecipe);
      setSelectedRecipe(null);
    }
  }, [createdRecipe]);
  
  // Handle pre-selected recipe from route params
  useEffect(() => {
    if (preSelectedRecipe) {
      setSelectedRecipe(preSelectedRecipe);
      setCustomRecipe(null);
    }
  }, [preSelectedRecipe]);
  
  const [coffeeSuggestions, setCoffeeSuggestions] = useState([]);
  const [recipeSuggestions, setRecipeSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [customRecipe, setCustomRecipe] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showOriginalRecipe, setShowOriginalRecipe] = useState(false);
  const [showCreateRecipe, setShowCreateRecipe] = useState(false);
  const [remixRecipe, setRemixRecipe] = useState(null);
  const [rating, setRating] = useState(0);
  const [showAddCoffeeModal, setShowAddCoffeeModal] = useState(false);

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [coffeeSearchLoading, setCoffeeSearchLoading] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [showTopBorder, setShowTopBorder] = useState(false);
  const nameInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const { autoSelectCoffee } = route.params || {};

  const { 
    coffeeId, 
    coffeeName, 
    coffeeImage,
    roaster,
    showOnlyRecipeForm = false,
    skipAuth = false 
  } = route.params || {};



  // Extract all cafés from mockCafes for the selector
  const cafeLocations = [
    { id: 'home', name: 'Home', isDefault: true },
    // Add cafes from the cafes array
    ...(mockCafes.cafes || []).map(cafe => ({
      id: cafe.id,
      name: cafe.name,
      address: cafe.address,
      businessId: cafe.roasterId,
      logo: cafe.avatar
    }))
  ];

  // State for location search and filtering
  const [locationSearchText, setLocationSearchText] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(cafeLocations);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  
  // State for friend tagging
  const [taggedFriends, setTaggedFriends] = useState([]);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [friendSearchText, setFriendSearchText] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Use mockUsers.json data instead of mock friends
  useEffect(() => {
    // Initialize filtered users with all users from mockUsers.json
    // Filter out businesses (cafés) and the current user
    const filteredUserList = (mockUsers?.users || []).filter(user => 
      // Remove business accounts that have a businessType property
      !user.businessType &&
      // Remove users with business-like names
      !user.userName.includes('Café') &&
      !user.userName.includes('Coffee') &&
      !user.userName.includes('Vértigo') &&
      !user.userName.includes('Kima') &&
      // Remove current user
      user.id !== currentAccount?.id
    );
    setFilteredUsers(filteredUserList);
  }, [currentAccount]);
  
  // Handle friend search
  const handleFriendSearch = (text) => {
    setFriendSearchText(text);
    
    // Filter out businesses and current user first
    const baseUserList = (mockUsers?.users || []).filter(user => 
      !user.businessType && 
      // Remove users with business-like names
      !user.userName.includes('Café') &&
      !user.userName.includes('Coffee') &&
      !user.userName.includes('Vértigo') &&
      !user.userName.includes('Kima') &&
      user.id !== currentAccount?.id
    );
    
    if (text.trim() === '') {
      setFilteredUsers(baseUserList);
    } else {
      const filtered = baseUserList.filter(user => 
        user.userName.toLowerCase().includes(text.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  };
  
  // Handler for friend selection
  const handleTagFriend = (friend) => {
    // Add friend if not already tagged
    if (!taggedFriends.some(f => f.id === friend.id)) {
      setTaggedFriends([...taggedFriends, friend]);
    }
  };
  
  // Handler for removing tagged friend
  const handleRemoveFriend = (friendId) => {
    setTaggedFriends(taggedFriends.filter(friend => friend.id !== friendId));
  };

  // Handle scroll to show/hide top border
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowTopBorder(offsetY > 10);
  };

  // Function to get proper image source based on path
  const getImageSource = (path) => {
    console.log('Getting image source for path:', path);
    if (!path) return null;
    
    if (path.startsWith('http')) {
      return { uri: path };
    }
    
    // Handle local asset paths for businesses
    if (path.startsWith('assets/businesses/')) {
      const filename = path.split('/').pop();
      
      // Map the filename to the correct require statement
      switch (filename) {
        case 'kima-logo.jpg':
          return require('../../assets/businesses/kima-logo.jpg');
        case 'vertigo-logo.jpg':
          return require('../../assets/businesses/vertigo-logo.jpg');
        case 'cafelab-logo.png':
          return require('../../assets/businesses/cafelab-logo.png');
        case 'thefix-logo.jpg':
          return require('../../assets/businesses/thefix-logo.jpg');
        case 'toma-logo.jpg':
          return require('../../assets/businesses/toma-logo.jpg');
        default:
          console.log('No matching asset for filename:', filename);
          // Return a default logo
          return require('../../assets/businesses/kima-logo.jpg');
      }
    }
    
    // Handle local asset paths for users
    if (path.startsWith('assets/users/')) {
      const filename = path.split('/').pop();
      
      // Map the filename to the correct require statement
      switch (filename) {
        case 'carlos-hernandez.jpg':
          return require('../../assets/users/carlos-hernandez.jpg');
        case 'elias-veris.jpg':
          return require('../../assets/users/elias-veris.jpg');
        case 'ivo-vilches.jpg':
          return require('../../assets/users/ivo-vilches.jpg');
        default:
          console.log('No matching user asset for filename:', filename);
          return null;
      }
    }
    
    return { uri: path };
  };

  // Log cafe locations for debugging
  console.log('Cafe locations:', cafeLocations);

  // Handle location search
  const handleLocationSearch = (text) => {
    setLocationSearchText(text);
    filterLocations(text, nearMeEnabled);
  };
  
  // Toggle near me filter
  const toggleNearMe = () => {
    const newNearMeState = !nearMeEnabled;
    setNearMeEnabled(newNearMeState);
    filterLocations(locationSearchText, newNearMeState);
  };
  
  // Filter locations based on search text and near me toggle
  const filterLocations = (searchText, nearMe) => {
    let filtered = cafeLocations;
    
    // Apply search text filter if provided
    if (searchText.trim() !== '') {
      filtered = filtered.filter(
        location => 
          // Always include Home
          location.isDefault || 
          // Filter by name or address containing the search text
          location.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (location.address && location.address.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // Apply near me filter if enabled
    if (nearMe) {
      // In a real app, this would filter based on user's GPS coordinates
      // For demo, just filter to show a subset of locations
      filtered = filtered.filter(
        location => 
          location.isDefault || 
          location.id.includes('kima') || 
          location.id.includes('cafelab')
      );
    }
    
    setFilteredLocations(filtered);
  };

  // Add focus listener to check for newly created recipes
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if there are any new recipes for the current coffee
      if (coffeeData.coffeeId) {
        console.log('Screen focused, refreshing recipes for coffee:', coffeeData.coffeeId);
        searchRecipeDatabase(coffeeData.coffeeId);
      }
    });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigation, coffeeData.coffeeId]);

  // Also listen for changes in the recipes context
  useEffect(() => {
    if (coffeeData.coffeeId) {
      console.log('Recipes context changed, refreshing recipes for coffee:', coffeeData.coffeeId);
      searchRecipeDatabase(coffeeData.coffeeId);
    }
  }, [recipes?.length, coffeeData.coffeeId]); // Use recipes.length instead of recipes to avoid infinite loops

  useEffect(() => {
    // Auto-focus the coffee name input when the screen mounts only if modal is visible
    console.log('AddCoffeeScreen mounted - setting up input focus');
    
    let focusTimer;
    
    // Set initial suggestions to popular coffees immediately
    if (coffeeSuggestions.length === 0) {
      setCoffeeSuggestions((mockCoffees?.coffees || []).slice(0, 5));
    }
    
    // Only auto-focus if the modal is visible AND we don't have a coffee selected already
    if (route.params?.isModalVisible && !coffeeData.coffeeId) {
      focusTimer = requestAnimationFrame(() => {
        // Use a small timeout to ensure the modal is fully rendered
        setTimeout(() => {
          if (nameInputRef.current && route.params?.isModalVisible && !coffeeData.coffeeId) {
            console.log('Setting input focus');
            nameInputRef.current.focus();
          }
        }, 50);
      });
    }
    
    // Add keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
        
        // Don't auto-scroll when keyboard shows for coffee name input
        // Let the user manually scroll if needed
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      console.log('Component unmounting - cleaning up');
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (focusTimer) {
        cancelAnimationFrame(focusTimer);
      }
    };
  }, [route.params?.isModalVisible, coffeeData.coffeeId]);

  useEffect(() => {
    // Check if we should save (triggered by the Save button in the modal)
    if (route.params?.shouldSave) {
      // Call handleSave directly
      handleSave();
    } else if (route.params?.isModalVisible === true) {
      // Modal is opening - initialize data
      console.log('Modal opened - initializing data');
      
      // Set initial suggestions to popular coffees
      if (coffeeSuggestions.length === 0) {
        setCoffeeSuggestions((mockCoffees?.coffees || []).slice(0, 5));
      }
      
      // Set initial filtered locations
      setFilteredLocations(cafeLocations);
      
      // Set initial filtered users for friend tagging
      const filteredUserList = (mockUsers?.users || []).filter(user => 
        !user.businessType && 
        user.id !== currentAccount?.id
      );
      setFilteredUsers(filteredUserList);
      
      // Auto-select coffee if provided in route
      if (autoSelectCoffee) {
        setCoffeeData(prev => ({ 
          ...prev, 
          name: autoSelectCoffee.name, 
          coffeeId: autoSelectCoffee.id 
        }));
        setCoffeeSuggestions([autoSelectCoffee]);
      }
    } else if (route.params?.isModalVisible === false) {
      // Modal is closing - clean up
      console.log('Modal closing - resetting state');
      
      // Reset all state to initial values without aggressive keyboard/focus management
      setCoffeeData({
        name: '',
        coffeeId: null,
        method: '',
        amount: '',
        grindSize: 'Medium',
        waterVolume: '',
        brewTime: '',
        brewMinutes: '',
        brewSeconds: '',
        notes: '',
        grinderUsed: '',
        steps: [],
        location: 'Home',
        locationId: null,
      });
      setCoffeeSuggestions([]);
      setRecipeSuggestions([]);
      setSelectedRecipe(null);
      setCustomRecipe(null);
      setIsPrivate(false);
      setShowPreview(false);
      setShowOriginalRecipe(false);
      setRating(0);
      setTaggedFriends([]);
    }
  }, [route.params?.isModalVisible, route.params?.shouldSave, currentAccount, autoSelectCoffee]);

  // Add useEffect for handling text input updates
  useEffect(() => {
    if (nameInputRef.current && coffeeData.name) {
      nameInputRef.current.setNativeProps({ text: coffeeData.name });
    }
  }, [coffeeData.name]);

  // Auto-select coffee if provided
  useEffect(() => {
    if (autoSelectCoffee) {
      setCoffeeData({ ...coffeeData, name: autoSelectCoffee.name, coffeeId: autoSelectCoffee.id });
      setCoffeeSuggestions([autoSelectCoffee]);
    }
    
    // Handle coffee data from route params (for recipe creation from coffee detail)
    if (coffeeId && coffeeName) {
      setCoffeeData({
        ...coffeeData,
        name: coffeeName,
        coffeeId: coffeeId,
        method: 'V60', // Default method
      });
      
      // Create a coffee object for suggestions
      const coffeeObj = {
        id: coffeeId,
        name: coffeeName,
        image: coffeeImage,
        roaster: roaster
      };
      
      setCoffeeSuggestions([coffeeObj]);
    }
  }, [autoSelectCoffee, coffeeId, coffeeName, coffeeImage, roaster]);

  const searchCoffeeDatabase = async (query) => {
    if (!query.trim()) {
      // Instead of clearing, show popular coffees
      setCoffeeSuggestions((mockCoffees?.coffees || []).slice(0, 5));
      return;
    }

    setIsLoading(true);
    try {
      // Search through mock coffees
      const filteredCoffees = (mockCoffees?.coffees || []).filter(coffee =>
        coffee.name.toLowerCase().includes(query.toLowerCase())
      );
      setCoffeeSuggestions(filteredCoffees);
    } catch (error) {
      console.error('Error searching coffee database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchRecipeDatabase = async (coffeeId) => {
    setIsLoading(true);
    try {
      // Get recipes from both mock data and context
      const mockRecipesForCoffee = (mockRecipes?.recipes || []).filter(recipe => recipe.coffeeId === coffeeId);
      const contextRecipesForCoffee = getRecipesForCoffee(coffeeId);
      
      // Combine and deduplicate recipes
      const allRecipes = [...mockRecipesForCoffee, ...contextRecipesForCoffee];
      const uniqueRecipes = allRecipes.filter((recipe, index, self) => 
        index === self.findIndex(r => r.id === recipe.id)
      );
      
      // Sort by creation date (newest first)
      uniqueRecipes.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.createdAt || 0);
        const dateB = new Date(b.timestamp || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setRecipeSuggestions(uniqueRecipes);
    } catch (error) {
      console.error('Error searching recipe database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (text) => {
    setCoffeeData({ ...coffeeData, name: text });
    
    // If text is empty, show popular coffees instead of searching
    if (!text.trim()) {
      setCoffeeSuggestions((mockCoffees?.coffees || []).slice(0, 5));
      return;
    }
    
    searchCoffeeDatabase(text);
  };

  const handleCoffeeSelect = async (coffee) => {
    console.log('Coffee selected:', coffee);
    
    // Create new coffee data object
    const newCoffeeData = {
      ...coffeeData,
      name: coffee.name,
      coffeeId: coffee.id
    };
    
    // Update state
    setCoffeeData(newCoffeeData);
    
    // Set the selected coffee in suggestions
    setCoffeeSuggestions([coffee]);
    
    // Search for recipes
    searchRecipeDatabase(coffee.id);
    
    // Force update the text input
    if (nameInputRef.current) {
      nameInputRef.current.setNativeProps({ text: coffee.name });
    }
    
    // Hide keyboard
    Keyboard.dismiss();
  };

  const handleClearInput = () => {
    setCoffeeData({ 
      ...coffeeData, 
      name: '', 
      coffeeId: null 
    });
    
    // Set popular coffees instead of clearing suggestions
    setCoffeeSuggestions((mockCoffees?.coffees || []).slice(0, 5));
    setRecipeSuggestions([]);
  };



  const handleRecipePress = (recipe) => {
    // Only use ActionSheetIOS if we're on iOS and the module is available
    if (Platform.OS === 'ios' && ActionSheetIOS?.showActionSheetWithOptions) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Use as is', 'Remix'],
          cancelButtonIndex: 0,
          userInterfaceStyle: isDarkMode ? 'dark' : 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Use as is - show selected recipe card
            setSelectedRecipe(recipe);
            setCustomRecipe(null);
          } else if (buttonIndex === 2) {
            // Show create recipe modal for remixing
            setRemixRecipe(recipe);
            setShowCreateRecipe(true);
          }
        }
      );
    } else {
      Alert.alert(
        'Recipe Options',
        'What would you like to do with this recipe?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Use as is',
            onPress: () => {
              // Use as is - show selected recipe card
              setSelectedRecipe(recipe);
              setCustomRecipe(null);
            },
          },
          {
            text: 'Remix',
            onPress: () => {
              // Show create recipe modal for remixing
              setRemixRecipe(recipe);
              setShowCreateRecipe(true);
            },
          },
        ]
      );
    }
  };



  const handleSave = async () => {
    try {
      // Blur any active input and dismiss keyboard immediately
      if (nameInputRef.current) {
        nameInputRef.current.blur();
      }
      if (notesInputRef.current) {
        notesInputRef.current.blur();
      }
      Keyboard.dismiss();
      
      // Add a small delay to ensure keyboard is fully dismissed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create a mock event ID for local storage
      const mockEventId = `local-${Date.now()}`;
      
      // Get the recipe to use (custom or selected)
      const recipeToUse = customRecipe || selectedRecipe;
      
      // Get location info for café locations
      const selectedLocation = cafeLocations.find(loc => loc.id === coffeeData.locationId);
      
      const eventData = {
        id: mockEventId,
        coffeeName: coffeeData.name,
        coffeeId: coffeeData.coffeeId,
        imageUrl: coffeeSuggestions[0]?.imageUrl || coffeeSuggestions[0]?.image,
        roaster: coffeeSuggestions[0]?.roaster,
        roasterName: coffeeSuggestions[0]?.roaster,
        timestamp: new Date().toISOString(),
        rating: rating > 0 ? rating : null,
        notes: coffeeData.notes,
        location: coffeeData.location,
        locationId: coffeeData.locationId,
        locationAvatar: selectedLocation?.logo,
        friends: taggedFriends.map(friend => ({
          id: friend.id,
          name: friend.name,
          userName: friend.userName
        })),
        // Only include recipe data if there's actually a recipe selected
        ...(recipeToUse ? {
          brewingMethod: recipeToUse.method,
          method: recipeToUse.method,
          amount: recipeToUse.amount,
          grindSize: recipeToUse.grindSize,
          waterVolume: recipeToUse.waterVolume,
          brewTime: recipeToUse.brewTime,
          grinderUsed: recipeToUse.grinderUsed,
          steps: recipeToUse.steps || [],
          hasRecipe: true, // Add a flag to indicate this log has recipe data
        } : {
          hasRecipe: false, // Explicitly mark that this log has no recipe
        }),
        originalRecipe: selectedRecipe && !customRecipe ? {
          id: selectedRecipe.id,
          method: selectedRecipe.method,
          amount: selectedRecipe.amount,
          grindSize: selectedRecipe.grindSize,
          waterVolume: selectedRecipe.waterVolume,
          brewTime: selectedRecipe.brewTime,
          userName: selectedRecipe.userName || selectedRecipe.creatorName || 'Ivo Vilches',
        } : null,
      };
      
      // Add the event to the context
      const savedEvent = await addCoffeeEvent(eventData);
      
      // If there's a rating and we have a recipe, update the recipe rating
      if (rating > 0 && recipeToUse && recipeToUse.id) {
        try {
          // In a real app, this would update the recipe rating in the database
          // For now, we'll just log it
          console.log(`Rating ${rating} saved for recipe ${recipeToUse.id}`);
          // TODO: Implement recipe rating update in context/database
        } catch (error) {
          console.error('Error saving recipe rating:', error);
        }
      }
      
      // Reset form
      setCoffeeData({
        name: '',
        coffeeId: null,
        method: '',
        amount: '',
        grindSize: 'Medium',
        waterVolume: '',
        brewTime: '',
        brewMinutes: '',
        brewSeconds: '',
        notes: '',
        grinderUsed: '',
        steps: [],
        location: 'Home',
        locationId: null,
      });
      setTaggedFriends([]);
      setSelectedRecipe(null);
      setCustomRecipe(null);
      setRating(0);
      
      // Add another small delay before navigation to prevent focus issues
      setTimeout(() => {
        navigation.goBack();
      }, 50);
    } catch (error) {
      console.error('Error saving coffee:', error);
      Alert.alert('Error', 'Failed to save coffee event. Please try again.');
    }
  };

  const handleCreateRecipe = () => {
    console.log('handleCreateRecipe called');
    console.log('coffeeData:', coffeeData);
    
    if (!coffeeData.coffeeId || !coffeeData.name) {
      console.log('Missing coffee data, showing alert');
      Alert.alert('Error', 'Please select a coffee first before creating a recipe.');
      return;
    }
    
    console.log('Showing create recipe modal');
    setShowCreateRecipe(true);
  };

  const handleClearCustomRecipe = () => {
    setCustomRecipe(null);
    setSelectedRecipe(null);
  };

  // Handle add coffee modal options
  const handleAddCoffeeOption = async (option) => {
    setShowAddCoffeeModal(false);
    
    switch (option) {
      case 'url':
        handleURLInput();
        break;
      case 'camera':
        await handleTakePhoto();
        break;
      case 'gallery':
        await handleSelectFromGallery();
        break;
      case 'manual':
        navigation.navigate('AddCoffeeManually');
        break;
    }
  };

  // Handle URL input with alert
  const handleURLInput = () => {
    Alert.prompt(
      'Enter Coffee URL',
      'Paste the URL of a coffee product page to extract details automatically',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Parse URL',
          onPress: (url) => {
            if (url && url.trim()) {
              navigation.navigate('AddCoffeeFromURL', { url: url.trim() });
            } else {
              Alert.alert('Error', 'Please enter a valid URL');
            }
          }
        }
      ],
      'plain-text',
      '',
      'url'
    );
  };

  // Handle camera capture
  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('AddCoffeeFromCamera', { 
          capturedImage: result.assets[0].uri 
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Handle gallery selection
  const handleSelectFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'You need to grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        navigation.navigate('AddCoffeeFromGallery', { 
          selectedImage: result.assets[0].uri 
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };



    const renderRecipeHeader = () => (
    <View style={styles.recipeHeaderContainer}>
      <Text style={styles.labelLarge}>Recipe</Text>
      <TouchableOpacity
        style={styles.createRecipeButton}
        onPress={() => {
          console.log('Create button pressed');
          handleCreateRecipe();
        }}
      >
        {/* <Ionicons name="add" size={20} color="#007AFF" /> */}
        <Text style={styles.createRecipeButtonText}>Create</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCustomRecipeCard = () => (
    <View style={styles.customRecipeCard}>
      <View style={styles.customRecipeHeader}>
        <View style={styles.customRecipeInfo}>
          <Text style={styles.customRecipeMethod}>{customRecipe.method}</Text>
          <Text style={styles.customRecipeAuthor}>by {customRecipe.creatorName}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleClearCustomRecipe}
          style={styles.clearCustomRecipeButton}
        >
          <Ionicons name="close-circle" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
      <View style={styles.recipeDetails}>
        <View style={styles.recipeDetail}>
          <Text style={styles.detailLabel}>Coffee</Text>
          <Text style={styles.detailValue}>{customRecipe.amount}g</Text>
        </View>
        <View style={styles.recipeDetail}>
          <Text style={styles.detailLabel}>Grind Size</Text>
          <Text style={styles.detailValue}>{customRecipe.grindSize}</Text>
        </View>
        <View style={styles.recipeDetail}>
          <Text style={styles.detailLabel}>Water</Text>
          <Text style={styles.detailValue}>{customRecipe.waterVolume}ml</Text>
        </View>
        <View style={styles.recipeDetail}>
          <Text style={styles.detailLabel}>Brew Time</Text>
          <Text style={styles.detailValue}>{customRecipe.brewTime}</Text>
        </View>
      </View>
    </View>
  );

  const renderSelectedRecipeCard = () => (
    <View style={styles.recipesContainer}>
      <View style={styles.selectedRecipeCardContainer}>
        <RecipeCard
          recipe={selectedRecipe}
          onPress={() => handleRecipePress(selectedRecipe)}
          showCoffeeInfo={false}
        />
        <TouchableOpacity 
          onPress={() => setSelectedRecipe(null)}
          style={styles.selectedRecipeClearButton}
        >
          <Ionicons name="close-circle" size={20} color="#666666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuggestedRecipes = () => (
    <View style={styles.recipesContainer}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="small" color={theme.primaryText} />
      ) : recipeSuggestions.length > 0 ? (
        <View>
          <Text style={styles.recipesSubheader}>Suggested</Text>
          <View style={styles.verticalRecipesList}>
            {recipeSuggestions.map((item, index) => (
              <RecipeCard
                key={`recipe-${item.id || index}`}
                recipe={item}
                onPress={() => handleRecipePress(item)}
                showCoffeeInfo={false}
              />
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyRecipesContainer}>
          <Text style={styles.emptyText}>Create the first recipe for this coffee</Text>
          <TouchableOpacity 
            style={styles.createFirstRecipeButton}
            onPress={() => {
              console.log('Create first recipe button pressed');
              handleCreateRecipe();
            }}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.createFirstRecipeButtonText}>Create Recipe</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );



  const renderPreview = () => (
    <Modal
      visible={showPreview}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowPreview(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Preview</Text>
            <TouchableOpacity 
              onPress={() => setShowPreview(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.previewContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <Text style={styles.previewCoffeeName}>
              {coffeeData.locationId && coffeeData.locationId !== 'home' ? 'Ordered' : 'Brewed'} {coffeeData.name}
            </Text>
            
            {coffeeData.locationId && (
              <View style={styles.previewLocation}>
                <Ionicons name="location" size={16} color="#666666" />
                <Text style={styles.previewLocationText}>{coffeeData.location}</Text>
              </View>
            )}

            {taggedFriends.length > 0 && (
              <View style={styles.previewFriends}>
                <Ionicons name="people" size={16} color="#666666" />
                <Text style={styles.previewFriendsText}>
                  With {taggedFriends.map(friend => friend.name || friend.userName).join(', ')}
                </Text>
              </View>
            )}
            
            {(customRecipe || selectedRecipe) && (
              <View style={styles.recipePreview}>
                <Text style={styles.recipeTitle}>
                  Recipe {(customRecipe?.creatorName || selectedRecipe?.userName || selectedRecipe?.creatorName) ? 
                    `by ${customRecipe?.creatorName || selectedRecipe?.userName || selectedRecipe?.creatorName}` : ''}
                </Text>
                <View style={styles.recipeDetails}>
                  <View style={styles.recipeDetail}>
                    <Text style={styles.detailLabel}>Method</Text>
                    <Text style={styles.detailValue}>{customRecipe?.method || selectedRecipe?.method}</Text>
                  </View>
                  <View style={styles.recipeDetail}>
                    <Text style={styles.detailLabel}>Coffee</Text>
                    <Text style={styles.detailValue}>{customRecipe?.amount || selectedRecipe?.amount}g</Text>
                  </View>
                  <View style={styles.recipeDetail}>
                    <Text style={styles.detailLabel}>Grind Size</Text>
                    <Text style={styles.detailValue}>{customRecipe?.grindSize || selectedRecipe?.grindSize}</Text>
                  </View>
                  {(customRecipe?.grinderUsed || selectedRecipe?.grinderUsed) && (
                    <View style={styles.recipeDetail}>
                      <Text style={styles.detailLabel}>Grinder</Text>
                      <Text style={styles.detailValue}>{customRecipe?.grinderUsed || selectedRecipe?.grinderUsed}</Text>
                    </View>
                  )}
                  <View style={styles.recipeDetail}>
                    <Text style={styles.detailLabel}>Water</Text>
                    <Text style={styles.detailValue}>{customRecipe?.waterVolume || selectedRecipe?.waterVolume}ml</Text>
                  </View>
                  <View style={styles.recipeDetail}>
                    <Text style={styles.detailLabel}>Brew Time</Text>
                    <Text style={styles.detailValue}>
                      {customRecipe?.brewTime || selectedRecipe?.brewTime}
                    </Text>
                  </View>
                </View>
                
                {/* Display brewing steps if available */}
                {(customRecipe?.steps || selectedRecipe?.steps) && (customRecipe?.steps || selectedRecipe?.steps).length > 0 && (
                  <View style={styles.previewStepsContainer}>
                    <Text style={styles.previewStepsTitle}>Brewing Steps</Text>
                    {(customRecipe?.steps || selectedRecipe?.steps).map((step, index) => (
                      <View key={index} style={styles.previewStepItem}>
                        <Text style={styles.previewStepNumber}>{index + 1}.</Text>
                        <View style={styles.previewStepContent}>
                          <Text style={styles.previewStepText}>
                            {typeof step === 'string' 
                              ? step 
                              : `${step.time || '--'} - ${step.water || '--'}g - ${step.description || 'Step'}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Rating (optional)</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={28}
                      color={star <= rating ? "#FFD700" : "#CCCCCC"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Comment (optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={coffeeData.notes}
                onChangeText={(text) => setCoffeeData({ ...coffeeData, notes: text })}
                placeholder="Add any comments about this brew..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              />
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const renderOriginalRecipeModal = () => (
    <Modal
      visible={showOriginalRecipe}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowOriginalRecipe(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Original Recipe</Text>
            <TouchableOpacity 
              onPress={() => setShowOriginalRecipe(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.originalRecipeContent}>
            <View style={styles.originalRecipeHeader}>
              <Text style={styles.originalRecipeTitle}>
                {selectedRecipe?.userName || selectedRecipe?.creatorName || 'Ivo Vilches'}'s Recipe
              </Text>
              <Text style={styles.originalRecipeSubtitle}>
                Original recipe for {coffeeData.name}
              </Text>
            </View>
            <View style={styles.recipeDetails}>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Method</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.method}</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Coffee</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.amount || selectedRecipe?.coffeeAmount}g</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Grind Size</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.grindSize}</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Water</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.waterVolume || selectedRecipe?.waterAmount}ml</Text>
              </View>
              <View style={styles.recipeDetail}>
                <Text style={styles.detailLabel}>Brew Time</Text>
                <Text style={styles.detailValue}>{selectedRecipe?.brewTime}</Text>
              </View>
            </View>
            
            {/* Display brewing steps if available */}
            {selectedRecipe?.steps && selectedRecipe.steps.length > 0 && (
              <View style={styles.previewStepsContainer}>
                <Text style={styles.previewStepsTitle}>Brewing Steps</Text>
                {selectedRecipe.steps.map((step, index) => (
                  <View key={index} style={styles.previewStepItem}>
                    <Text style={styles.previewStepNumber}>{index + 1}.</Text>
                    <View style={styles.previewStepContent}>
                      <Text style={styles.previewStepText}>
                        {typeof step === 'string' 
                          ? step 
                          : `${step.time || '--'} - ${step.water || '--'}g - ${step.description || 'Step'}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLocationSelector = () => (
    <Modal
      visible={showLocationSelector}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowLocationSelector(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.selectorModalContent, { paddingBottom: insets.bottom + (keyboardVisible ? keyboardHeight : 0) }]}>
          <View style={styles.selectorModalHeader}>
            <Text style={styles.selectorModalTitle}>Select Location</Text>
            <TouchableOpacity 
              style={styles.selectorModalCloseButton}
              onPress={() => setShowLocationSelector(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          {/* Near me toggle */}
          <View style={styles.nearMeToggleContainer}>
            <View style={styles.nearMeToggleContent}>
              <Ionicons name="locate" size={20} color="#666" style={styles.nearMeIcon} />
              <Text style={styles.nearMeText}>Near Me</Text>
            </View>
            <Switch
              value={nearMeEnabled}
              onValueChange={toggleNearMe}
              trackColor={{ false: isDarkMode ? '#38383A' : '#E0E0E0', true: isDarkMode ? '#48484A' : '#CCCCCC' }}
              thumbColor={nearMeEnabled ? (isDarkMode ? '#FFFFFF' : '#000000') : (isDarkMode ? '#8E8E93' : '#FFFFFF')}
            />
          </View>
          
          {/* Search field */}
          <View style={styles.locationSearchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.locationSearchIcon} />
            <TextInput
              style={styles.locationSearchInput}
              placeholder="Search cafés"
              value={locationSearchText}
              onChangeText={handleLocationSearch}
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              clearButtonMode="while-editing"
            />
            {locationSearchText ? (
              <TouchableOpacity
                onPress={() => handleLocationSearch('')}
                style={styles.locationSearchClear}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <FlatList
            data={filteredLocations}
            keyExtractor={(item) => item.id}
            style={styles.locationList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectorModalItem}
                onPress={() => {
                  setCoffeeData({
                    ...coffeeData,
                    location: item.name,
                    locationId: item.id
                  });
                  setShowLocationSelector(false);
                }}
              >
                <View style={styles.locationItem}>
                  {item.isDefault ? (
                    <Ionicons name="home" size={20} color={theme.primaryText} style={styles.locationIcon} />
                  ) : item.logo ? (
                    <Image 
                      source={getImageSource(item.logo)} 
                      style={styles.locationLogo}
                    />
                  ) : (
                    <View style={styles.locationLogoPlaceholder}>
                      <Text style={styles.locationLogoPlaceholderText}>
                        {item.name.substring(0, 1)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.locationInfo}>
                    <Text style={styles.selectorModalItemText}>{item.name}</Text>
                    {item.address && (
                      <Text style={styles.locationAddress}>{item.address}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyLocationsContainer}>
                <Text style={styles.emptyText}>No locations found</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );

  const renderFriendSelector = () => (
    <Modal
      visible={showFriendSelector}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setSelectedFriendsTemp([]); // Clear temp selections on cancel
        setShowFriendSelector(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.selectorModalContent, { paddingBottom: insets.bottom + (keyboardVisible ? keyboardHeight : 0) }]}>
          <View style={styles.selectorModalHeader}>
            <Text style={styles.selectorModalTitle}>Tag Friends</Text>
            <TouchableOpacity 
              style={styles.selectorModalCloseButton}
              onPress={() => {
                setSelectedFriendsTemp([]); // Clear temp selections on cancel
                setShowFriendSelector(false);
              }}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          {/* Search field */}
          <View style={styles.friendSearchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.friendSearchIcon} />
            <TextInput
              style={styles.friendSearchInput}
              placeholder="Search friends..."
              value={friendSearchText}
              onChangeText={handleFriendSearch}
              keyboardAppearance={isDarkMode ? 'dark' : 'light'}
              clearButtonMode="while-editing"
              autoCapitalize="none"
            />
            {friendSearchText ? (
              <TouchableOpacity
                onPress={() => handleFriendSearch('')}
                style={styles.friendSearchClear}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item.id}
            style={styles.friendsList}
            renderItem={({ item }) => {
              // Check if this friend is selected (either in temp selection or already tagged)
              const isInTempSelection = selectedFriendsTemp.some(f => f.id === item.id);
              const isAlreadyTagged = taggedFriends.some(f => f.id === item.id);
              const isSelected = isInTempSelection || isAlreadyTagged;
              
              return (
                <TouchableOpacity 
                  style={[
                    styles.selectorModalItem,
                    isSelected && styles.selectorModalItemSelected
                  ]}
                  onPress={() => handleTempFriendSelection(item)}
                >
                  <View style={styles.friendItem}>
                    {item.userAvatar ? (
                      <Image 
                        source={getImageSource(item.userAvatar)}
                        style={styles.friendAvatar}
                        onError={() => console.log('Failed to load avatar for:', item.userName)}
                      />
                    ) : (
                      <View style={styles.friendAvatarPlaceholder}>
                        <Text style={styles.friendAvatarText}>
                          {item.userName.substring(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{item.userName}</Text>
                      {item.email && (
                        <Text style={styles.friendEmail}>{item.email}</Text>
                      )}
                    </View>
                    
                    {/* Show checkmark if selected - moved inside friendItem for better layout */}
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} style={styles.checkmarkIcon} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyFriendsContainer}>
                <Text style={styles.emptyText}>No friends found</Text>
              </View>
            }
          />
          
          {/* Confirm button at the bottom */}
          {selectedFriendsTemp.length > 0 && (
            <View style={styles.friendSelectorFooter}>
              <TouchableOpacity 
                style={styles.confirmFriendsButton}
                onPress={confirmFriendSelections}
              >
                <Text style={styles.confirmFriendsText}>
                  Add {selectedFriendsTemp.length} {selectedFriendsTemp.length === 1 ? 'friend' : 'friends'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderFriendTags = () => (
    <View style={styles.friendTagsContainer}>
      {taggedFriends.map(friend => (
        <View key={friend.id} style={styles.friendTag}>
          {friend.userAvatar && (
            <Image 
              source={getImageSource(friend.userAvatar)} 
              style={styles.friendTagAvatar} 
            />
          )}
          <Text style={styles.friendTagText}>{friend.userName}</Text>
          <TouchableOpacity 
            onPress={() => handleRemoveFriend(friend.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={16} color="#999" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity 
        style={styles.addFriendButton}
        onPress={() => {
          setSelectedFriendsTemp([]); // Reset temp selections when opening
          setShowFriendSelector(true);
        }}
      >
        <Ionicons name="add" size={20} color={theme.primaryText} />
        <Text style={styles.addFriendText}>Tag a friend</Text>
      </TouchableOpacity>
    </View>
  );

  // Communicate with the modal about save availability
  useEffect(() => {
    if (navigation.setParams) {
      navigation.setParams({ canSave: !!coffeeData.coffeeId });
    }
  }, [navigation, coffeeData.coffeeId]);

  // Component debug logging
  useEffect(() => {
    console.log('=== AddCoffeeScreen MOUNTED ===');
    console.log('Current coffee data:', coffeeData);
    console.log('Modal coffeeSuggestions count:', coffeeSuggestions.length);
    console.log('Is this modal visible?', route.params?.isModalVisible);
    
    return () => {
      console.log('=== AddCoffeeScreen UNMOUNTED ===');
    };
  }, []);

  // Add an effect to handle scrolling when the notes field gets focus
  const notesInputRef = useRef(null);
  
  useEffect(() => {
    // Function to handle notes input focus
    const handleNotesFocus = () => {
      // Add safety check to prevent null reference error
      if (scrollViewRef && scrollViewRef.current) {
        setTimeout(() => {
          if (scrollViewRef.current) {
            try {
              scrollViewRef.current.scrollToEnd({ animated: true });
            } catch (error) {
              console.log('Error scrolling on notes focus:', error);
            }
          }
        }, 100);
      }
    };
    
    // Add event listener to notes input ref
    if (notesInputRef.current) {
      notesInputRef.current.addEventListener?.('focus', handleNotesFocus);
    }
    
    return () => {
      // Clean up
      if (notesInputRef.current) {
        notesInputRef.current.removeEventListener?.('focus', handleNotesFocus);
      }
    };
  }, [notesInputRef.current]);



  // Add state for temporary friend selections
  const [selectedFriendsTemp, setSelectedFriendsTemp] = useState([]);
  
  // Handler for temporary friend selection
  const handleTempFriendSelection = (friend) => {
    // Check if friend is already tagged (permanently)
    const isAlreadyTagged = taggedFriends.some(f => f.id === friend.id);
    
    if (isAlreadyTagged) {
      // If already tagged, remove from tagged friends
      setTaggedFriends(taggedFriends.filter(f => f.id !== friend.id));
      // Also remove from temp selection if present
      setSelectedFriendsTemp(selectedFriendsTemp.filter(f => f.id !== friend.id));
    } else {
      // Check if friend is in temp selection
      const isInTempSelection = selectedFriendsTemp.some(f => f.id === friend.id);
      
      if (isInTempSelection) {
        // Remove friend from temp selection
        setSelectedFriendsTemp(selectedFriendsTemp.filter(f => f.id !== friend.id));
      } else {
        // Add friend to temp selection
        setSelectedFriendsTemp([...selectedFriendsTemp, friend]);
      }
    }
  };
  
  // Handler to confirm friend selections
  const confirmFriendSelections = () => {
    // Add all temporary selections to tagged friends (avoiding duplicates)
    const newTaggedFriends = [...taggedFriends];
    
    selectedFriendsTemp.forEach(friend => {
      if (!taggedFriends.some(f => f.id === friend.id)) {
        newTaggedFriends.push(friend);
      }
    });
    
    setTaggedFriends(newTaggedFriends);
    setSelectedFriendsTemp([]); // Clear temporary selections
    setShowFriendSelector(false); // Close the modal
  };

  const renderContent = () => {
    if (showOnlyRecipeForm) {
      return (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Coffee Header */}
          <View style={styles.recipeFormHeader}>
            <View style={styles.selectedCoffeeContainer}>
              <Image 
                source={{ uri: coffeeImage }} 
                style={styles.selectedCoffeeImage} 
              />
              <View style={styles.selectedCoffeeInfo}>
                <Text style={styles.selectedCoffeeName}>{coffeeName}</Text>
                <Text style={styles.selectedCoffeeRoaster}>{roaster}</Text>
              </View>
            </View>
          </View>
          
          {/* Recipe Form */}
          <View style={styles.recipeFormContainer}>
            <Text style={styles.recipeFormTitle}>Create Recipe</Text>
            {renderCustomRecipe()}
          </View>
          
          {/* Save Button */}
          <View style={[styles.recipeFormFooter, { paddingBottom: insets.bottom }]}>
            <TouchableOpacity
              style={[
                styles.bottomSaveButton,
                (!coffeeData.method || 
                !coffeeData.amount || 
                !coffeeData.grindSize || 
                !coffeeData.waterVolume || 
                (!coffeeData.brewTime && (!coffeeData.brewMinutes || !coffeeData.brewSeconds))
                ) && styles.bottomSaveButtonDisabled
              ]}
              onPress={handleSaveRecipe}
              disabled={
                !coffeeData.method || 
                !coffeeData.amount || 
                !coffeeData.grindSize || 
                !coffeeData.waterVolume || 
                (!coffeeData.brewTime && (!coffeeData.brewMinutes || !coffeeData.brewSeconds))
              }
            >
              <Text style={styles.bottomSaveButtonText}>Save Recipe</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView 
        ref={scrollViewRef}
        style={[
          styles.scrollView,
          styles.container,
          showTopBorder && {
            borderTopWidth: 1,
            borderTopColor: theme.divider,
          }
        ]}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
          <View style={styles.inputContainer}>
            {coffeeData.coffeeId ? (
              <View style={styles.selectedCoffeeContainer}>
                <Image 
                  source={{ uri: coffeeSuggestions[0]?.imageUrl || coffeeSuggestions[0]?.image }} 
                  style={styles.selectedCoffeeImage} 
                />
                <View style={styles.selectedCoffeeInfo}>
                  <Text style={styles.selectedCoffeeName}>{coffeeData.name}</Text>
                  <Text style={styles.selectedCoffeeRoaster}>{coffeeSuggestions[0]?.roaster}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.clearButton}
                  onPress={handleClearInput}
                >
                  <Ionicons name="close-circle" size={24} color="#999" />
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.inputWrapper}>
                  <TouchableOpacity 
                    activeOpacity={0.8}
                    style={{flex: 1}}
                    onPress={() => {
                      // Only focus if we don't already have a coffee selected
                      if (nameInputRef.current && !coffeeData.coffeeId) {
                        nameInputRef.current.focus();
                      }
                    }}
                  >
                    <TextInput
                      ref={nameInputRef}
                      style={[styles.input, {zIndex: 999}]}
                      value={coffeeData.name}
                      onChangeText={handleNameChange}
                      placeholder="Enter coffee name"
                      placeholderTextColor={theme.secondaryText || '#666666'}
                      keyboardType="default"
                      keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                      clearButtonMode="never"
                      editable={true}
                      contextMenuHidden={false}
                      blurOnSubmit={false}
                      onPressIn={() => {
                        console.log('Input pressed');
                        // Only focus if we don't already have a coffee selected
                        if (nameInputRef.current && !coffeeData.coffeeId) {
                          nameInputRef.current.focus();
                        }
                      }}
                      onFocus={() => {
                        console.log('Name input focused');
                        setKeyboardVisible(true);
                      }}
                      onBlur={() => {
                        console.log('Name input blurred');
                        if (nameInputRef.current) {
                          nameInputRef.current.setNativeProps({ text: coffeeData.name });
                        }
                      }}
                    />
                  </TouchableOpacity>
                  {coffeeData.name.length > 0 && (
                    <TouchableOpacity 
                      style={styles.clearButton}
                      onPress={handleClearInput}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.searchSuggestionsContainer}>
                  <ScrollView 
                    keyboardShouldPersistTaps="handled"
                    // style={{maxHeight: 300}}
                  >
                    {isLoading ? (
                      <ActivityIndicator style={styles.loader} size="small" color={theme.primaryText} />
                    ) : coffeeSuggestions.length > 0 ? (
                      coffeeSuggestions.map((item, index) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.searchSuggestionItem,
                            index === coffeeSuggestions.length - 1 && styles.searchSuggestionItemLast
                          ]}
                          onPress={() => handleCoffeeSelect(item)}
                        >
                          <Image 
                            source={{ uri: item.imageUrl || item.image }} 
                            style={styles.suggestionAvatar} 
                          />
                          <View style={styles.suggestionTextContainer}>
                            <Text style={styles.searchSuggestionText}>{item.name}</Text>
                            <Text style={styles.searchSuggestionSubtext}>{item.roaster}</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : coffeeData.name.trim() ? (
                      // Show "Add this coffee" button when user has typed something but no matches found
                      <View style={styles.addCoffeeContainer}>
                        <Text style={styles.noResultsText}>No coffees found for "{coffeeData.name}"</Text>
                        <TouchableOpacity
                          style={styles.addCoffeeButton}
                          onPress={() => setShowAddCoffeeModal(true)}
                        >
                          <Ionicons name="add-circle" size={20} color={isDarkMode ? '#000000' : '#FFFFFF'} />
                          <Text style={styles.addCoffeeButtonText}>Add this coffee</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>No coffees found</Text>
                    )}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>

          {coffeeData.coffeeId && (
            <View style={styles.inputContainer}>
              <Text style={styles.labelLarge}>Location</Text>
              <TouchableOpacity 
                style={styles.selectorButton}
                onPress={() => setShowLocationSelector(true)}
              >
                <View style={styles.locationSelectorContent}>
                  {coffeeData.locationId === 'home' ? (
                    <Ionicons name="home" size={20} color={theme.secondaryText} style={styles.locationIcon} />
                  ) : coffeeData.locationId === 'near-me' ? (
                    <Ionicons name="navigate" size={20} color={theme.secondaryText} style={styles.locationIcon} />
                  ) : coffeeData.locationId ? (
                    <Image 
                      source={getImageSource(cafeLocations.find(loc => loc.id === coffeeData.locationId)?.logo)} 
                      style={styles.locationLogo} 
                    />
                  ) : (
                    <Ionicons name="home" size={20} color={theme.secondaryText} style={styles.locationIcon} />
                  )}
                  <Text style={styles.selectorButtonText}>
                    {coffeeData.location}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          )}
          
          {coffeeData.coffeeId && (
            <View style={styles.inputContainer}>
              <Text style={styles.labelLarge}>With</Text>
              {renderFriendTags()}
            </View>
          )}

          {coffeeData.coffeeId && (
            <View style={styles.inputContainer}>
              {renderRecipeHeader()}
            </View>
          )}

          {coffeeData.coffeeId && (
            <View>
              {customRecipe ? renderCustomRecipeCard() : 
               selectedRecipe ? renderSelectedRecipeCard() : 
               renderSuggestedRecipes()}
            </View>
          )}

          {/* Rating and Notes Section - shown when coffee is selected and has a recipe */}
          {coffeeData.coffeeId && (customRecipe || selectedRecipe) && (
            <View style={styles.ratingNotesContainer}>
              <View style={styles.inputContainer}>
                <Text style={styles.labelLarge}>Rating</Text>
                <View style={styles.brewRatingContainer}>
                  <TouchableOpacity
                    style={[styles.brewRatingButton, rating === 3 && styles.brewRatingButtonSelected]}
                    onPress={() => setRating(3)}
                  >
                    <MaterialCommunityIcons name={rating === 3 ? "thumb-up" : "thumb-up-outline"} size={24} color={rating === 3 ? "#4CAF50" : theme.secondaryText} />
                    <Text style={[styles.brewRatingText, rating === 3 && styles.brewRatingTextSelected]}>Good</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.brewRatingButton, rating === 2 && styles.brewRatingButtonSelected]}
                    onPress={() => setRating(2)}
                  >
                    <MaterialCommunityIcons name={rating === 2 ? "emoticon-neutral" : "emoticon-neutral-outline"} size={24} color={rating === 2 ? "#FF9800" : theme.secondaryText} />
                    <Text style={[styles.brewRatingText, rating === 2 && styles.brewRatingTextSelected]}>Meh</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.brewRatingButton, rating === 1 && styles.brewRatingButtonSelected]}
                    onPress={() => setRating(1)}
                  >
                    <MaterialCommunityIcons name={rating === 1 ? "thumb-down" : "thumb-down-outline"} size={24} color={rating === 1 ? "#F44336" : theme.secondaryText} />
                    <Text style={[styles.brewRatingText, rating === 1 && styles.brewRatingTextSelected]}>Bad</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.labelLarge}>Notes</Text>
                <TextInput
                  ref={notesInputRef}
                  style={styles.notesTextInput}
                  value={coffeeData.notes}
                  onChangeText={(text) => setCoffeeData({ ...coffeeData, notes: text })}
                  placeholder="How was this brew? Any thoughts or tips..."
                  placeholderTextColor={theme.secondaryText || '#666666'}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  onFocus={() => {
                    // Scroll to show notes field above keyboard
                    setTimeout(() => {
                      if (scrollViewRef.current) {
                        // Use scrollToEnd which works reliably for the bottom field
                        scrollViewRef.current.scrollToEnd({ animated: true });
                      }
                    }, 150);
                  }}
                />
              </View>
            </View>
          )}
        </ScrollView>
    );
  };

  const handleSaveRecipe = async () => {
    try {
      // Calculate brew time if using step-based methods
      const calculatedBrewTime = calculateTotalBrewTime();
      
      // Create a unique ID for the recipe
      const recipeId = `recipe-${Date.now()}`;
      
      // Create the recipe object
      const recipeData = {
        id: recipeId,
        name: `${coffeeName} ${coffeeData.method}`,
        coffeeId: coffeeId,
        coffeeName: coffeeName,
        method: coffeeData.method,
        amount: coffeeData.amount,
        grindSize: coffeeData.grindSize,
        waterVolume: coffeeData.waterVolume,
        brewTime: calculatedBrewTime || coffeeData.brewTime,
        steps: coffeeData.steps,
        notes: coffeeData.notes,
        grinderUsed: coffeeData.grinderUsed,
        creatorId: currentAccount?.id || 'user-default',
        creatorName: currentAccount?.userName || 'You',
        creatorAvatar: currentAccount?.userAvatar,
        timestamp: new Date().toISOString(),
        rating: 5,
        // Add based on recipe info if this is a remix
        ...(route.params?.basedOnRecipe ? {
          originalRecipeId: route.params.basedOnRecipe.id,
          originalRecipeName: route.params.basedOnRecipe.name,
          originalCreatorId: route.params.basedOnRecipe.userId,
          originalCreatorName: route.params.basedOnRecipe.userName,
          originalUserAvatar: route.params.basedOnRecipe.userAvatar
        } : {})
      };
      
      // Add the recipe to the context
      await addRecipe(recipeData);
      
      // Create a recipe creation event for the home feed
      const recipeCreationEvent = {
        id: `recipe-creation-${Date.now()}`,
        type: 'created_recipe',
        userId: currentAccount?.id || 'user-default',
        userName: currentAccount?.userName || 'You',
        userAvatar: currentAccount?.userAvatar,
        timestamp: new Date().toISOString(),
        coffeeId: coffeeId,
        coffeeName: coffeeName,
        roaster: roaster,
        imageUrl: coffeeImage,
        recipeId: recipeData.id,
        recipeName: recipeData.name,
        method: recipeData.method,
        amount: recipeData.amount,
        grindSize: recipeData.grindSize,
        waterVolume: recipeData.waterVolume,
        brewTime: recipeData.brewTime,
        notes: recipeData.notes,
        // Add remix info if applicable
        ...(route.params?.basedOnRecipe ? {
          isRemix: true,
          basedOnRecipeId: route.params.basedOnRecipe.id,
          basedOnRecipeName: route.params.basedOnRecipe.name,
          basedOnCreatorName: route.params.basedOnRecipe.userName
        } : {})
      };
      
      // Add the recipe creation event to the feed
      await addCoffeeEvent(recipeCreationEvent);
      
      // Show a success message
      const successMessage = route.params?.basedOnRecipe ? 
        'Recipe remixed successfully!' : 
        'Recipe created successfully!';
      
      Alert.alert(
        'Success',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to the recipe detail screen or previous screen
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    }
  };



  const renderCreateRecipeModal = () => {
    const [recipeData, setRecipeData] = useState({
      method: '',
      amount: '',
      grindSize: 'Medium',
      waterVolume: '',
      brewTime: '',
      notes: '',
      orientation: 'Regular', // NEW – AeroPress orientation (Regular / Inverted)
    });

    // Initialize recipe data when remix recipe changes or when creating new recipe
    useEffect(() => {
      if (isRemixing && recipeToRemix) {
        setRecipeData({
          method: recipeToRemix.method || recipeToRemix.brewingMethod || '',
          amount: recipeToRemix.amount || recipeToRemix.coffeeAmount || '',
          grindSize: recipeToRemix.grindSize || 'Medium',
          waterVolume: recipeToRemix.waterVolume || recipeToRemix.waterAmount || '',
          brewTime: recipeToRemix.brewTime || '',
          notes: '', // Keep notes empty by default for remixes
          orientation: recipeToRemix.orientation || 'Regular',
        });
      } else {
        setRecipeData({
          method: '',
          amount: '',
          grindSize: 'Medium',
          waterVolume: '',
          brewTime: '',
          notes: '',
          orientation: 'Regular',
        });
      }
    }, [isRemixing, recipeToRemix]);

    const handleSaveRecipe = async () => {
      if (!recipeData.method || !recipeData.amount || !recipeData.waterVolume) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }

      try {
        const recipeId = `recipe-${Date.now()}`;
        const newRecipe = {
          id: recipeId,
          name: `${coffeeData.name} ${recipeData.method}`,
          coffeeId: coffeeData.coffeeId,
          coffeeName: coffeeData.name,
          method: recipeData.method,
          amount: recipeData.amount,
          grindSize: recipeData.grindSize,
          waterVolume: recipeData.waterVolume,
          brewTime: recipeData.brewTime,
          notes: recipeData.notes,
          orientation: recipeData.orientation, // NEW
          creatorId: currentAccount?.id || 'user-default',
          creatorName: currentAccount?.userName || 'You',
          creatorAvatar: currentAccount?.userAvatar,
          timestamp: new Date().toISOString(),
          rating: 5,
          // Add remix info if this is based on another recipe
          ...(isRemixing && recipeToRemix ? {
            originalRecipeId: recipeToRemix.id,
            originalRecipeName: recipeToRemix.name,
            originalCreatorId: recipeToRemix.userId,
            originalCreatorName: recipeToRemix.userName
          } : {})
        };

        await addRecipe(newRecipe);
        
        // Create a recipe creation event
        const recipeCreationEvent = {
          id: `recipe-creation-${Date.now()}`,
          type: 'created_recipe',
          userId: currentAccount?.id || 'user-default',
          userName: currentAccount?.userName || 'You',
          userAvatar: currentAccount?.userAvatar,
          timestamp: new Date().toISOString(),
          coffeeId: coffeeData.coffeeId,
          coffeeName: coffeeData.name,
          roaster: coffeeSuggestions[0]?.roaster,
          imageUrl: coffeeSuggestions[0]?.imageUrl || coffeeSuggestions[0]?.image,
          recipeId: newRecipe.id,
          recipeName: newRecipe.name,
          method: newRecipe.method,
          amount: newRecipe.amount,
          grindSize: newRecipe.grindSize,
          waterVolume: newRecipe.waterVolume,
          brewTime: newRecipe.brewTime,
          notes: newRecipe.notes,
          orientation: newRecipe.orientation, // NEW
          // Add remix info if applicable
          ...(isRemixing && recipeToRemix ? {
            isRemix: true,
            basedOnRecipeId: recipeToRemix.id,
            basedOnRecipeName: recipeToRemix.name,
            basedOnCreatorName: recipeToRemix.userName
          } : {})
        };
        
        await addCoffeeEvent(recipeCreationEvent);
        
        setCustomRecipe(newRecipe);
        setSelectedRecipe(null);
        setShowCreateRecipe(false);
        setRemixRecipe(null);
        
        // Refresh recipes
        searchRecipeDatabase(coffeeData.coffeeId);
        
        // Show success message
        const successMessage = isRemixing ? 'Recipe remixed successfully!' : 'Recipe created successfully!';
        Alert.alert('Success', successMessage);
      } catch (error) {
        console.error('Error saving recipe:', error);
        Alert.alert('Error', 'Failed to save recipe. Please try again.');
      }
    };

    return (
      <Modal
        visible={showCreateRecipe}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCreateRecipe(false);
          setRemixRecipe(null);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isRemixing || remixRecipe ? 'Remix Recipe' : 'Create Recipe'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowCreateRecipe(false);
                  setRemixRecipe(null);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewContent}>
              {/* Coffee Card */}
              <View style={styles.selectedCoffeeContainer}>
                <Image 
                  source={{ uri: coffeeSuggestions[0]?.imageUrl || coffeeSuggestions[0]?.image }} 
                  style={styles.selectedCoffeeImage} 
                />
                <View style={styles.selectedCoffeeInfo}>
                  <Text style={styles.selectedCoffeeName}>{coffeeData.name}</Text>
                  <Text style={styles.selectedCoffeeRoaster}>{coffeeSuggestions[0]?.roaster}</Text>
                </View>
              </View>
              
              {(isRemixing || remixRecipe) && (
                <View style={styles.remixAttribution}>
                  <Text style={styles.remixAttributionText}>
                    Based on recipe by {recipeToRemix?.userName || remixRecipe?.userName || 'Unknown'}
                  </Text>
                </View>
              )}
              
              <View style={styles.recipeFormContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Brewing Method *</Text>
                  <TouchableOpacity 
                    style={styles.selectorButton}
                    onPress={() => {
                      const methods = ['V60', 'Chemex', 'AeroPress', 'French Press', 'Espresso'];
                      Alert.alert(
                        'Select Method',
                        '',
                        methods.map(method => ({
                          text: method,
                          onPress: () => setRecipeData({...recipeData, method})
                        })).concat([{text: 'Cancel', style: 'cancel'}])
                      );
                    }}
                  >
                    <Text style={styles.selectorButtonText}>
                      {recipeData.method || 'Select brewing method'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#666666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Coffee Amount (g) *</Text>
                  <TextInput
                    style={styles.input}
                    value={recipeData.amount}
                    onChangeText={(text) => setRecipeData({...recipeData, amount: text})}
                    placeholder="20"
                    keyboardType="numeric"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Grind Size</Text>
                  <TouchableOpacity 
                    style={styles.selectorButton}
                    onPress={() => {
                      const sizes = ['Extra Fine', 'Fine', 'Medium-Fine', 'Medium', 'Medium-Coarse', 'Coarse'];
                      Alert.alert(
                        'Select Grind Size',
                        '',
                        sizes.map(size => ({
                          text: size,
                          onPress: () => setRecipeData({...recipeData, grindSize: size})
                        })).concat([{text: 'Cancel', style: 'cancel'}])
                      );
                    }}
                  >
                    <Text style={styles.selectorButtonText}>{recipeData.grindSize}</Text>
                    <Ionicons name="chevron-down" size={20} color="#666666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Water Volume (ml) *</Text>
                  <TextInput
                    style={styles.input}
                    value={recipeData.waterVolume}
                    onChangeText={(text) => setRecipeData({...recipeData, waterVolume: text})}
                    placeholder="300"
                    keyboardType="numeric"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Brew Time</Text>
                  <TextInput
                    style={styles.input}
                    value={recipeData.brewTime}
                    onChangeText={(text) => setRecipeData({...recipeData, brewTime: text})}
                    placeholder="3:30"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, {height: 80}]}
                    value={recipeData.notes}
                    onChangeText={(text) => setRecipeData({...recipeData, notes: text})}
                    placeholder="Any brewing notes..."
                    multiline
                    textAlignVertical="top"
                    keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                    placeholderTextColor="#999"
                  />
                </View>
                 
                 {/* Save Button */}
                 <TouchableOpacity
                   style={[
                     styles.createRecipeSaveButton,
                     (!recipeData.method || !recipeData.amount || !recipeData.waterVolume) && styles.createRecipeSaveButtonDisabled
                   ]}
                   onPress={handleSaveRecipe}
                   disabled={!recipeData.method || !recipeData.amount || !recipeData.waterVolume}
                 >
                   <Text style={styles.createRecipeSaveButtonText}>
                     {isRemixing || remixRecipe ? 'Save Remix' : 'Save Recipe'}
                   </Text>
                 </TouchableOpacity>
               </View>
             </ScrollView>
           </View>
         </View>
       </Modal>
     );
   };

  const renderAddCoffeeModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showAddCoffeeModal}
      onRequestClose={() => setShowAddCoffeeModal(false)}
    >
      <View style={styles.addCoffeeModalContainer}>
        <View style={[
          styles.addCoffeeModalContent,
          { 
            paddingBottom: insets.bottom, 
            backgroundColor: isDarkMode ? theme.altBackground : '#f4f4f4' 
          }
        ]}>
          <View style={[styles.addCoffeeModalHeader, { borderBottomColor: theme.divider }]}>
            <Text style={[styles.addCoffeeModalTitle, { color: theme.primaryText }]}>Add Coffee</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowAddCoffeeModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.addCoffeeOptionsContainer}>
            <TouchableOpacity
              style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
              onPress={() => handleAddCoffeeOption('url')}
            >
              <Ionicons name="link-outline" size={24} color={theme.primaryText} />
              <View style={styles.addCoffeeOptionTextContainer}>
                <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Paste URL</Text>
                <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Add coffee from a website URL</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
              onPress={() => handleAddCoffeeOption('camera')}
            >
              <Ionicons name="camera-outline" size={24} color={theme.primaryText} />
              <View style={styles.addCoffeeOptionTextContainer}>
                <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Take Picture</Text>
                <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Scan coffee bag with camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
              onPress={() => handleAddCoffeeOption('gallery')}
            >
              <Ionicons name="image-outline" size={24} color={theme.primaryText} />
              <View style={styles.addCoffeeOptionTextContainer}>
                <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Select Picture</Text>
                <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Choose from photo library</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addCoffeeOption, { backgroundColor: isDarkMode ? theme.cardBackground : theme.background, borderColor: theme.border }]}
              onPress={() => handleAddCoffeeOption('manual')}
            >
              <Ionicons name="create-outline" size={24} color={theme.primaryText} />
              <View style={styles.addCoffeeOptionTextContainer}>
                <Text style={[styles.addCoffeeOptionTitle, { color: theme.primaryText }]}>Enter Manually</Text>
                <Text style={[styles.addCoffeeOptionSubtitle, { color: theme.secondaryText }]}>Fill out coffee details by hand</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

      return (
      <View style={styles.container}>
        {renderContent()}
        {renderOriginalRecipeModal()}
        {renderLocationSelector()}
        {renderFriendSelector()}
        {renderCreateRecipeModal()}
        {renderAddCoffeeModal()}
      </View>
    );
}

const createStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  inputContainer: {
    padding: 16,
    // paddingTop: 8,
    paddingBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
    marginBottom: 8,
  },
  labelLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
    padding: 12,
    paddingRight: 40, // Make room for the clear button
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  suggestionCarouselContainer: {
    paddingHorizontal: 16,
  },
  selectedCoffeeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
    padding: 12,
  },
  selectedCoffeeImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
  },
  selectedCoffeeInfo: {
    flex: 1,
  },
  selectedCoffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 4,
  },
  selectedCoffeeRoaster: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  popularCoffeeCard: {
    width: 250,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  popularCoffeeImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E5EA',
  },
  popularCoffeeContent: {
    flex: 1,
    justifyContent: 'center',
  },
  popularCoffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 3,
  },
  popularCoffeeRoaster: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  popularCoffeeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularCoffeeOriginContainer: {
    flex: 1,
  },
  popularCoffeeOrigin: {
    fontSize: 14,
    color: '#666666',
  },
  popularCoffeePrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  loader: {
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: 0,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  segmentTextActive: {
    color: '#000000',
  },
  recipesContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 0,
  },
  recipeCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  recipeAuthor: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  recipeRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  recipeRatingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 2,
  },
  recipeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 2,
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recipeDetail: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.secondaryText,
    fontSize: 16,
    marginTop: 24,
  },
  customRecipeContainer: {
    paddingHorizontal: 16,
    paddingBottom: 0, // Add padding at the bottom
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.cardBackground || (isDarkMode ? '#2C2C2E' : '#FFFFFF'),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  previewContent: {
    padding: 16,
  },
  previewCoffeeName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  recipePreview: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#000000',
  },
  fixedBottomButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    padding: 16,
    zIndex: 1000,
  },
  bottomSaveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomSaveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  bottomSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSaveButtonTextDisabled: {
    color: '#999999',
  },
  saveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customSaveButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  customSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  basedOnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: '#F2F2F7',
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
  },
  basedOnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16, // Add margin to prevent overlap with clear button
  },
  remixIcon: {
    marginRight: 6,
  },
  basedOnText: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '500',
    marginRight: 4,
  },
  basedOnAuthor: {
    // fontSize: 14,
    color: '#444444',
    fontWeight: '600',
    marginLeft: 6,
    flex: 1, // Allow the text to expand but truncate if needed
  },
  basedOnAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 4,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 4,
    justifyContent: 'space-between',
  },
  stepperButton: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  selectorButton: {
    padding: 12,
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButtonText: {
    fontSize: 16,
    color: theme.primaryText,
  },
  selectorModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  selectorModalContent: {
    backgroundColor: theme.cardBackground || (isDarkMode ? '#2C2C2E' : '#FFFFFF'),
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
  },
  selectorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5EA',
  },
  selectorModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  selectorModalCloseButton: {
    padding: 4,
  },
  selectorModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider || '#E5E5EA',
  },
  selectorModalItemSelected: {
    backgroundColor: isDarkMode ? theme.altBackground : '#F0F7FF',
  },
  selectorModalItemText: {
    fontSize: 16,
    color: theme.primaryText,
  },
  selectorModalItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  recipeHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    // paddingHorizontal: 12,
    // backgroundColor: '#F0F7FF',
    borderRadius: 16,
  },
      createRecipeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.primaryText,
      marginLeft: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.primaryText,
    },
  customRecipeCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  customRecipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customRecipeInfo: {
    flex: 1,
  },
  customRecipeMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  customRecipeAuthor: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  clearCustomRecipeButton: {
    padding: 4,
  },
  searchSuggestionsContainer: {
    backgroundColor: theme.background || (isDarkMode ? '#2C2C2E' : '#FFFFFF'),
    // borderWidth: 1,
    // borderColor: theme.border || '#E5E5EA',
    // borderRadius: 8,
    marginTop: 4,
    // maxHeight: 300,
    // shadowColor: isDarkMode ? '#000000' : '#000000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: isDarkMode ? 0.3 : 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    zIndex: 1000,
    marginBottom: 16,
  },
  searchSuggestionItem: {
    padding: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider || '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchSuggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#F2F2F7',
  },
  suggestionTextContainer: {
    flex: 1,
  },
  searchSuggestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
  },
  searchSuggestionSubtext: {
    fontSize: 14,
    color: theme.secondaryText,
    marginTop: 2,
  },
  sharingContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  sharingOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sharingTextContainer: {
    flex: 1,
  },
  sharingLabel: {
    fontSize: 16,
    color: '#000000',
  },
  sharingDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  originalRecipeContent: {
    padding: 16,
  },
  originalRecipeHeader: {
    marginBottom: 16,
  },
  originalRecipeTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  originalRecipeSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  closeButton: {
    borderRadius: 8,
    alignItems: 'center',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  recipeAttribution: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  brewingStepsContainer: {
    borderRadius: 8,
    padding: 16,
  },
  brewingStepsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  brewingStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  brewingStepInputGroup: {
    marginRight: 12,
  },
  brewingStepLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  brewingStepInput: {
    fontSize: 14,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 4,
    width: 80,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  addStepButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  removeStepButton: {
    padding: 4,
  },
  totalContainer: {
    marginTop: 16,
    // backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  previewStepsContainer: {
    marginTop: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 12,
  },
  previewStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  previewStepItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  previewStepNumber: {
    width: 20,
    fontSize: 14,
    fontWeight: '600',
  },
  previewStepContent: {
    flex: 1,
  },
  previewStepText: {
    fontSize: 14,
  },
  emptyRecipesContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  recipesSubheader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
    marginLeft: 4,
  },
  createFirstRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  createFirstRecipeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 4,
  },
  createOwnButton: {
    backgroundColor: '#000000',
    marginTop: 12,
    padding: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    alignItems: 'center',
    display: 'none',
  },
  createOwnButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  timeInput: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
    color: '#000000',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '500',
    color: '#000000',
    marginHorizontal: 8,
  },
  locationSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationLogo: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginRight: 10,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationInfo: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  locationSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
  },
  locationSearchIcon: {
    marginRight: 10,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
  },
  locationSearchClear: {
    padding: 4,
  },
  emptyLocationsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  locationLogoPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  nearMeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.cardBackground || (isDarkMode ? '#2C2C2E' : '#FFFFFF'),
    borderTopWidth: 1,
    borderTopColor: theme.divider || '#E5E5EA',
    // borderBottomWidth: 1,
    // borderBottomColor: theme.divider || '#E5E5EA',
  },
  nearMeToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearMeIcon: {
    marginRight: 10,
  },
  nearMeText: {
    fontSize: 16,
    color: theme.secondaryText,
  },
  friendTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendTag: {
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendTagText: {
    fontSize: 14,
    color: theme.primaryText,
    marginRight: 4,
    fontWeight: '500',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  addFriendText: {
    fontSize: 14,
    color: theme.primaryText,
    marginLeft: 4,
    fontWeight: '500',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  friendAvatarText: {
    fontSize: 14,
    color: theme.primaryText,
    fontWeight: '600',
  },
  locationPreview: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  locationPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationPreviewHeader: {
    marginBottom: 8,
  },
  locationPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationPreviewIcon: {
    marginRight: 10,
  },
  locationPreviewLogo: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  locationPreviewText: {
    fontSize: 14,
    color: '#666666',
  },
  friendsPreview: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  friendsPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  friendsPreviewHeader: {
    marginBottom: 8,
  },
  friendsPreviewContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  friendsPreviewText: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
    marginBottom: 8,
  },
  friendTagAvatar: {
    width: 20, 
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  friendSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  friendSearchIcon: {
    marginRight: 10,
  },
  friendSearchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
  },
  friendSearchClear: {
    padding: 4,
  },
  emptyFriendsContainer: {
    padding: 16,
    alignItems: 'center',
  },
  friendAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primaryText,
  },
  friendEmail: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  locationList: {
    maxHeight: 400,
  },
  friendsList: {
    maxHeight: 400,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.primaryText,
    padding: 12,
    paddingRight: 40, // Make room for the clear button
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
  },
  friendSelectorFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.border || '#E5E5EA',
    padding: 16,
    alignItems: 'center',
  },
  confirmFriendsButton: {
    backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  confirmFriendsText: {
    color: isDarkMode ? '#000000' : '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  checkmarkIcon: {
    marginLeft: 12,
  },
  saveHeaderButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveHeaderButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  remixAttribution: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  remixAttributionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerSaveButton: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  headerSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingNotesContainer: {
    backgroundColor: theme.background,
    marginTop: 0,
  },
  brewRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  brewRatingButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  brewRatingButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F7FF',
  },
  brewRatingText: {
    fontSize: 12,
    color: theme.secondaryText,
    marginTop: 4,
    fontWeight: '500',
  },
  brewRatingTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  notesTextInput: {
    backgroundColor: theme.altBackground || '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
    fontSize: 16,
    color: theme.primaryText,
  },
  createRecipeSaveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  createRecipeSaveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createRecipeSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recipeFormContainer: {
    marginTop: 16,
  },
  recipeFormNote: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  fullRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  fullRecipeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginRight: 8,
  },
  previewLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLocationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  previewFriends: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewFriendsText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  recipeFormHeader: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  recipeFormContainer: {
    padding: 16,
  },
  recipeFormTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  recipeFormFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
  horizontalRecipeCard: {
    width: 280,
    marginRight: 12,
  },
  horizontalRecipesList: {
    paddingHorizontal: 0,
    // paddingLeft: 16,
  },
  verticalRecipesList: {
    paddingVertical: 8,
  },
  selectedRecipeCardContainer: {
    position: 'relative',
  },
  selectedRecipeClearButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    zIndex: 1,
  },
  addCoffeeContainer: {
    padding: 16,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    color: theme.secondaryText,
    marginBottom: 12,
    textAlign: 'center',
  },
  addCoffeeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
  },
  addCoffeeButtonText: {
    color: isDarkMode ? '#000000' : '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  addCoffeeModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  addCoffeeModalContent: {
    backgroundColor: theme.cardBackground || (isDarkMode ? '#2C2C2E' : '#FFFFFF'),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
    maxHeight: '90%',
  },
  addCoffeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
  },
  addCoffeeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  addCoffeeOptionsContainer: {
    padding: 16,
  },
  addCoffeeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderRadius: 8,
    marginBottom: 12,
  },
  addCoffeeOptionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  addCoffeeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  addCoffeeOptionSubtitle: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  chipContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: theme.altBackground || '#F2F2F7',
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border || '#E5E5EA',
  },
  chipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: theme.primaryText,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});
