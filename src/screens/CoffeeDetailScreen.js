import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
  ImageBackground,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import eventEmitter from '../utils/EventEmitter';
import mockCoffees from '../data/mockCoffees.json';
import mockCafes from '../data/mockCafes.json';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';
import AppImage from '../components/common/AppImage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import Heart from '../components/Heart';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import CoffeeInfo from '../components/CoffeeInfo';
import CoffeeStat from '../components/CoffeeStat';
import UserAvatar from '../components/UserAvatar';
import TasteProfile from '../components/TasteProfile';
import ReviewStars from '../components/ReviewStars';
import mockRecipes from '../data/mockRecipes.json';
import { useTheme } from '../context/ThemeContext';

export default function CoffeeDetailScreen() {
  const { theme, isDarkMode } = useTheme();
  const { 
    coffeeEvents, 
    coffeeCollection, 
    coffeeWishlist, 
    favorites,
    getRecipesForCoffee,
    addToCollection, 
    removeFromCollection,
    addToWishlist, 
    removeFromWishlist,
    toggleFavorite,
    addRecipe,
    addCoffeeEvent,
    currentAccount
  } = useCoffee();
  
  const navigation = useNavigation();
  const route = useRoute();
  const { coffeeId, skipAuth } = route.params || { coffeeId: null, skipAuth: false };
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  
  const [coffee, setCoffee] = useState(null);
  const [relatedRecipes, setRelatedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInCollection, setIsInCollection] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastActionText, setToastActionText] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removalTimeout, setRemovalTimeout] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [roasterInfo, setRoasterInfo] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [showCoffeeNameInHeader, setShowCoffeeNameInHeader] = useState(false);
  const headerOpacity = useSharedValue(0);

  // Recipe creation modal states
  const [showCreateRecipeModal, setShowCreateRecipeModal] = useState(false);
  const [recipeData, setRecipeData] = useState({
    method: '',
    amount: '',
    grindSize: 'Medium',
    waterVolume: '',
    brewTime: '',
    notes: ''
  });

  useEffect(() => {
    // Always use mock data for development
    const fetchCoffee = () => {
      setLoading(true);
      try {
        // First check if coffee was passed through route params
        const routeCoffee = route.params?.coffee;
        if (routeCoffee) {
          console.log('Using coffee object from route params:', routeCoffee.name);
          
          // Create a complete coffee object with all required fields
          const enhancedCoffee = {
            ...routeCoffee,
            // Ensure all needed properties exist
            id: routeCoffee.id || routeCoffee.coffeeId || coffeeId,
            name: routeCoffee.name || routeCoffee.coffeeName || 'Unknown Coffee',
            roaster: routeCoffee.roaster || 'Unknown Roaster',
            // Use the first available image source
            image: routeCoffee.image || routeCoffee.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
            // Add defaults for missing properties
            origin: routeCoffee.origin || 'Unknown',
            process: routeCoffee.process || 'Unknown',
            roastLevel: routeCoffee.roastLevel || 'Medium',
            price: routeCoffee.price || '$--',
            description: routeCoffee.description || 'No description available',
            // Ensure stats object exists
            stats: routeCoffee.stats || {
              rating: routeCoffee.rating || 0,
              reviews: routeCoffee.reviews || 0,
              brews: routeCoffee.brews || 0,
              wishlist: routeCoffee.wishlist || 0
            }
          };
          
          setCoffee(enhancedCoffee);
          setIsInCollection(routeCoffee.isInCollection || false);
          setIsSaved(routeCoffee.isInWishlist || false);
          
          if (routeCoffee.recipes) {
            setRelatedRecipes(routeCoffee.recipes);
          }
          
          // Set sellers for this coffee from mockCoffees
          const sellersList = mockCoffees.sellers[enhancedCoffee.id] || [];
          
          // Enhance seller info with additional business data if available
          const enhancedSellers = sellersList.map(seller => {
            // Check if this is a business that has a corresponding entry in businesses
            const businessData = mockCafes.roasters.find(b => b.id === seller.id);
            if (businessData) {
              return {
                ...seller,
                // Use avatar from business if available, otherwise use existing seller avatar
                avatar: businessData.avatar || businessData.logo || seller.avatar
              };
            }
            return seller;
          });
          
          setSellers(enhancedSellers);
          setLoading(false);
          return;
        }

        console.log('Looking for coffee with ID:', coffeeId);
        // Check if we can find the exact coffee in the mock data by ID
        const exactCoffeeMatch = mockCoffees.coffees.find(c => 
          c.id === coffeeId || 
          `coffee-${c.id}` === coffeeId || 
          c.id === coffeeId.replace('coffee-', '')
        );
        
        if (exactCoffeeMatch) {
          console.log('Found exact coffee match:', exactCoffeeMatch.name);
          setCoffee(exactCoffeeMatch);
          
          // Set sellers
          const sellersList = mockCoffees.sellers[exactCoffeeMatch.id] || [];
          const enhancedSellers = sellersList.map(seller => {
            const businessData = mockCafes.roasters.find(b => b.id === seller.id);
            if (businessData) {
              return {
                ...seller,
                avatar: businessData.avatar || businessData.logo || seller.avatar
              };
            }
            return seller;
          });
          
          setSellers(enhancedSellers);
          setLoading(false);
          return;
        }
        
        // If no exact match, try to find a coffee by name
        const coffeeByName = mockCoffees.coffees.find(c => 
          c.name.toLowerCase() === coffeeId.toLowerCase() ||
          c.name.toLowerCase().includes(coffeeId.toLowerCase())
        );
        
        if (coffeeByName) {
          console.log('Found coffee by name:', coffeeByName.name);
          setCoffee(coffeeByName);
          
          // Set sellers
          const sellersList = mockCoffees.sellers[coffeeByName.id] || [];
          const enhancedSellers = sellersList.map(seller => {
            const businessData = mockCafes.roasters.find(b => b.id === seller.id);
            if (businessData) {
              return {
                ...seller,
                avatar: businessData.avatar || businessData.logo || seller.avatar
              };
            }
            return seller;
          });
          
          setSellers(enhancedSellers);
          setLoading(false);
          return;
        }

        // Otherwise try to find the coffee in the coffeeEvents
        const eventCoffee = coffeeEvents.find(event => event.coffeeId === coffeeId);
        
        if (eventCoffee) {
          // Create a mapping for legacy coffee IDs to their proper entry in the mockCoffees.coffees array
          const coffeeIdMap = {
            // Map legacy coffee IDs directly to their corresponding entries in mockCoffees.coffees
            'coffee-0': mockCoffees.coffees[0].id,
            'coffee-1': mockCoffees.coffees[1].id, 
            'coffee-2': mockCoffees.coffees[2].id,
            'coffee-3': mockCoffees.coffees[3].id,
            'coffee-4': mockCoffees.coffees[4].id
          };
          
          // Check if this is a legacy coffee ID (from events) and map it to a real coffee
          const mappedCoffeeId = coffeeIdMap[eventCoffee.coffeeId] || eventCoffee.coffeeId;
          const matchedCoffee = mockCoffees.coffees.find(c => c.id === mappedCoffeeId);
          
          if (matchedCoffee) {
            // If we found a matching coffee in the mockCoffees, use that
            console.log('Found coffee from events:', matchedCoffee.name);
            setCoffee(matchedCoffee);
            
            // Set sellers for this coffee from mockCoffees with enhanced info
            const sellersList = mockCoffees.sellers[matchedCoffee.id] || [];
            
            // Enhance seller info with additional business data if available
            const enhancedSellers = sellersList.map(seller => {
              // Check if this is a business that has a corresponding entry in businesses
              const businessData = mockCafes.roasters.find(b => b.id === seller.id);
              if (businessData) {
                return {
                  ...seller,
                  // Use avatar from business if available, otherwise use existing seller avatar
                  avatar: businessData.avatar || businessData.logo || seller.avatar
                };
              }
              return seller;
            });
            
            setSellers(enhancedSellers);
            setLoading(false);
            return;
          } else {
            // Otherwise use the event data
            console.log('Creating coffee object from event data:', eventCoffee.coffeeName);
            setCoffee({
              id: eventCoffee.coffeeId,
              name: eventCoffee.coffeeName,
              roaster: eventCoffee.roaster,
              image: eventCoffee.imageUrl,
              description: eventCoffee.notes || 'No description available',
              origin: 'Unknown',
              process: 'Unknown',
              roastLevel: 'Medium',
              price: '€18.00',
              stats: {
                rating: eventCoffee.rating,
                reviews: Math.floor(Math.random() * 100) + 10,
                brews: Math.floor(Math.random() * 50) + 5,
                wishlist: Math.floor(Math.random() * 30) + 3
              }
            });
            
            // Set sellers for this coffee from mockCoffees with enhanced info
            const sellersList = mockCoffees.sellers[eventCoffee.coffeeId] || [];
            
            // Enhance seller info with additional business data if available
            const enhancedSellers = sellersList.map(seller => {
              // Check if this is a business that has a corresponding entry in businesses
              const businessData = mockCafes.roasters.find(b => b.id === seller.id);
              if (businessData) {
                return {
                  ...seller,
                  // Use avatar from business if available, otherwise use existing seller avatar
                  avatar: businessData.avatar || businessData.logo || seller.avatar
                };
              }
              return seller;
            });
            
            setSellers(enhancedSellers);
            setLoading(false);
            return;
          }
        } else {
          // As a last resort, use the first coffee in the mock data
          // But log a warning to help with debugging
          console.warn(`Coffee ID ${coffeeId} not found - defaulting to first coffee in mockCoffees`);
          const foundCoffee = mockCoffees.coffees[0];
          setCoffee(foundCoffee);
          
          // Set sellers for this coffee from mockCoffees with enhanced info
          const sellersList = mockCoffees.sellers[foundCoffee.id] || [];
          
          // Enhance seller info with additional business data if available
          const enhancedSellers = sellersList.map(seller => {
            // Check if this is a business that has a corresponding entry in businesses
            const businessData = mockCafes.roasters.find(b => b.id === seller.id);
            if (businessData) {
              return {
                ...seller,
                // Use avatar from business if available, otherwise use existing seller avatar
                avatar: businessData.avatar || businessData.logo || seller.avatar
              };
            }
            return seller;
          });
          
          setSellers(enhancedSellers);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching coffee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoffee();
    // Only run this effect when coffeeId or coffeeEvents change, NOT when route.params changes
  }, [coffeeId, coffeeEvents]);

  // Fetch related recipes when coffee is loaded (only if recipes weren't passed in route params)
  useEffect(() => {
    if (coffee && !route.params?.coffee?.recipes) {
      // First try to get recipes from mockRecipes.json that match this coffee's ID
      const matchingRecipes = mockRecipes.recipes.filter(r => 
        r.coffeeId === coffee.id || 
        r.coffeeId === (coffee.id?.replace('coffee-', '') || '')
      );
      
      // If we found matching recipes in mockRecipes, use those
      if (matchingRecipes.length > 0) {
        console.log(`Found ${matchingRecipes.length} recipes for coffee ${coffee.id} in mockRecipes`);
        setRelatedRecipes(matchingRecipes);
      } else {
        // Otherwise fall back to context recipes
        const contextRecipes = getRecipesForCoffee(coffee.id);
        console.log(`Found ${contextRecipes.length} recipes for coffee ${coffee.id} in context`);
        setRelatedRecipes(contextRecipes);
      }
    }
  // Only run this effect when coffee object changes, not on every render
  }, [coffee?.id, getRecipesForCoffee]);



  // Update favorite state whenever coffee or favorites change
  useEffect(() => {
    if (coffee) {
      setIsFavorite(favorites.includes(coffee.name));
    }
  }, [coffee, favorites]);

  // Update collection state whenever coffee or collection changes
  useEffect(() => {
    if (coffee) {
      const collectionArray = Array.isArray(coffeeCollection) ? coffeeCollection : [];
      setIsInCollection(collectionArray.some(c => c.id === coffee.id));
    }
  }, [coffee, coffeeCollection]);

  // Update saved state whenever coffee or wishlist changes
  useEffect(() => {
    if (coffee) {
      const wishlistArray = Array.isArray(coffeeWishlist) ? coffeeWishlist : [];
      setIsSaved(wishlistArray.some(c => c.id === coffee.id));
    }
  }, [coffee, coffeeWishlist]);

  // Animated header title styles
  const animatedDefaultTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showCoffeeNameInHeader ? 0 : 1, { duration: 150 }),
      transform: [
        {
          translateY: withTiming(showCoffeeNameInHeader ? -10 : 0, { duration: 150 })
        }
      ]
    };
  });

  const animatedCoffeeTitleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showCoffeeNameInHeader ? 1 : 0, { duration: 150 }),
      transform: [
        {
          translateY: withTiming(showCoffeeNameInHeader ? 0 : 10, { duration: 150 })
        }
      ]
    };
  });

  // Set up navigation options
  useLayoutEffect(() => {
    if (coffee) {
      navigation.setOptions({
        headerShown: true,
        headerTitle: () => (
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', height: 44 }}>
            <Animated.Text 
              style={[
                animatedDefaultTitleStyle,
                {
                  position: 'absolute',
                  color: theme.primaryText,
                  fontSize: 17,
                  fontWeight: '600',
                }
              ]}
            >
              Coffee Details
            </Animated.Text>
            <Animated.Text 
              style={[
                animatedCoffeeTitleStyle,
                {
                  position: 'absolute',
                  color: theme.primaryText,
                  fontSize: 17,
                  fontWeight: '600',
                  textAlign: 'center',
                  maxWidth: 200,
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {coffee.name}
            </Animated.Text>
          </View>
        ),
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
          borderBottomWidth: isDarkMode ? 1 : (scrollY > 0 ? 1 : 0),
          borderBottomColor: theme.divider,
        },
        headerTintColor: theme.primaryText, // Set back button color
      });
    }
  }, [navigation, coffee, theme, isDarkMode, scrollY, showCoffeeNameInHeader, animatedDefaultTitleStyle, animatedCoffeeTitleStyle]);

  // Reset header when screen comes into focus (fixes header disappearing issue when navigating back)
  useEffect(() => {
    if (isFocused && coffee) {
      // Force header to be shown and reset any conflicting options
      navigation.setOptions({
        headerShown: true,
        headerTransparent: false,
        headerTitle: () => (
          <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center', height: 44 }}>
            <Animated.Text 
              style={[
                animatedDefaultTitleStyle,
                {
                  position: 'absolute',
                  color: theme.primaryText,
                  fontSize: 17,
                  fontWeight: '600',
                }
              ]}
            >
              Coffee Details
            </Animated.Text>
            <Animated.Text 
              style={[
                animatedCoffeeTitleStyle,
                {
                  position: 'absolute',
                  color: theme.primaryText,
                  fontSize: 17,
                  fontWeight: '600',
                  textAlign: 'center',
                  maxWidth: 200,
                }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {coffee.name}
            </Animated.Text>
          </View>
        ),
        headerStyle: {
          backgroundColor: theme.background,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
          borderBottomWidth: isDarkMode ? 1 : (scrollY > 0 ? 1 : 0),
          borderBottomColor: theme.divider,
        },
        headerTintColor: theme.primaryText,
        headerRight: undefined, // Clear any right buttons from previous screens
      });
    }
  }, [isFocused, coffee, theme, isDarkMode, scrollY, showCoffeeNameInHeader, animatedDefaultTitleStyle, animatedCoffeeTitleStyle]);

  // Find and set roaster info when coffee or sellers change
  useEffect(() => {
    if (coffee && coffee.roaster) {
              // First, check if the coffee has a roasterId
        if (coffee.roasterId) {
          // Find the roaster with matching ID
          const businessRoaster = mockCafes.roasters.find(b => b.id === coffee.roasterId);
          if (businessRoaster) {
            setRoasterInfo({
              id: businessRoaster.id,
              name: businessRoaster.name,
              avatar: businessRoaster.avatar || businessRoaster.logo,
              isBusinessAccount: true
            });
            return;
          }
        }
      
      // Otherwise, check if any sellers match the roaster name
      const roasterSeller = sellers.find(s => 
        s.name === coffee.roaster || 
        (s.isRoaster && s.businessAccount)
      );
      
      if (roasterSeller) {
        setRoasterInfo({
          id: roasterSeller.id,
          name: roasterSeller.name,
          avatar: roasterSeller.avatar,
          isBusinessAccount: roasterSeller.businessAccount
        });
      } else {
        // If we couldn't find the roaster, set just the name
        setRoasterInfo({
          name: coffee.roaster,
          isBusinessAccount: true // Assume it's a business
        });
      }
    }
  }, [coffee, sellers]);

  const navigateToRecipeDetail = (recipeId) => {
    // Find the recipe in the related recipes
    const recipe = relatedRecipes.find(r => r.id === recipeId);
    if (recipe) {
      console.log(`Navigating to recipe detail for: ${recipe.name}`);
      navigation.navigate('RecipeDetail', {
        recipeId: recipe.id,
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        recipeName: recipe.name,
        coffeeImage: coffee.image,
        roaster: coffee.roaster,
        recipe: recipe // Pass the full recipe for immediate rendering
      });
    } else {
      console.warn(`Recipe with ID ${recipeId} not found`);
    }
  };

  const navigateToUserProfile = (userId, userName) => {
    // Check if this is a business account (like Vértigo y Calambre or Kima Coffee) by checking the businessAccount flag in sellers
    const isBusinessAccount = sellers.some(seller => seller.id === userId && seller.businessAccount);
    
    // Special handling for Toma Café locations
    if (userName && userName.includes('Toma Café') && userName !== 'Toma Café') {
      // For Toma Café locations (like Toma Café 1), navigate to the specific location
      navigation.navigate('UserProfileBridge', { 
        userId, 
        userName,
        skipAuth: true,
        isLocation: true,
        parentBusinessId: 'business-toma' // 'business-toma' is the parent business ID for all Toma Café locations
      });
    } else {
      // For all other users/businesses, use standard navigation
      navigation.navigate('UserProfileBridge', { 
        userId, 
        userName,
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

  const showToast = (message, actionText = '') => {
    setToastMessage(message);
    setToastActionText(actionText);
    setToastVisible(true);
  };

  const handleAddToCollection = () => {
    if (isInCollection) {
      removeFromCollection(coffee.id);
      setIsInCollection(false);
      showToast('Removed from collection');
    } else {
      addToCollection(coffee);
      setIsInCollection(true);
      showToast('Added to collection');
    }
  };

  const handleSave = () => {
    if (isSaved) {
      removeFromWishlist(coffee.id);
      setIsSaved(false);
      showToast('Removed from saved');
    } else {
      addToWishlist(coffee);
      setIsSaved(true);
      showToast('Saved', 'View Saved');
    }
  };

  const handleToggleFavorite = () => {
    toggleFavorite(coffee.name);
    setIsFavorite(!isFavorite);
    showToast(
      isFavorite ? 'Removed from favorites' : 'Added to favorites',
      isFavorite ? '' : 'View Collection'
    );
  };

  const navigateToCreateRecipe = () => {
    // Reset recipe data
    setRecipeData({
      method: '',
      amount: '',
      grindSize: 'Medium',
      waterVolume: '',
      brewTime: '',
      notes: ''
    });
    // Show the modal
    setShowCreateRecipeModal(true);
  };

  const handleSubmitRecipe = async () => {
    if (!recipeData.method || !recipeData.amount || !recipeData.waterVolume) {
      Alert.alert('Error', 'Please fill in all required fields (Method, Coffee Amount, and Water Volume).');
      return;
    }

    try {
      // Create a unique ID for the recipe
      const recipeId = `recipe-${Date.now()}`;
      
      // Create the recipe object
      const newRecipe = {
        id: recipeId,
        name: `${coffee.name} ${recipeData.method}`,
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        method: recipeData.method,
        amount: recipeData.amount,
        grindSize: recipeData.grindSize,
        waterVolume: recipeData.waterVolume,
        brewTime: recipeData.brewTime,
        notes: recipeData.notes,
        creatorId: currentAccount?.id || 'user-default',
        creatorName: currentAccount?.userName || 'You',
        creatorAvatar: currentAccount?.userAvatar,
        timestamp: new Date().toISOString(),
        rating: 5
      };

      // Add the recipe to the context
      await addRecipe(newRecipe);
      
      // Create a recipe creation event for the home feed
      const recipeCreationEvent = {
        id: `recipe-creation-${Date.now()}`,
        type: 'created_recipe',
        userId: currentAccount?.id || 'user-default',
        userName: currentAccount?.userName || 'You',
        userAvatar: currentAccount?.userAvatar,
        timestamp: new Date().toISOString(),
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        roaster: coffee.roaster,
        imageUrl: coffee.image,
        recipeId: newRecipe.id,
        recipeName: newRecipe.name,
        method: newRecipe.method,
        amount: newRecipe.amount,
        grindSize: newRecipe.grindSize,
        waterVolume: newRecipe.waterVolume,
        brewTime: newRecipe.brewTime,
        notes: newRecipe.notes
      };
      
      // Add the recipe creation event to the feed
      await addCoffeeEvent(recipeCreationEvent);
      
      // Close the modal and reset form
      setShowCreateRecipeModal(false);
      setRecipeData({
        method: '',
        amount: '',
        grindSize: 'Medium',
        waterVolume: '',
        brewTime: '',
        notes: ''
      });
      
      // Refresh related recipes to show the new one
      setRelatedRecipes(prev => [newRecipe, ...prev]);
      
      // Show success message
      Alert.alert('Success', 'Recipe created successfully!');
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert('Error', 'Failed to save recipe. Please try again.');
    }
  };

  const navigateToRoasterProfile = () => {
    if (roasterInfo && roasterInfo.id) {
      console.log('Navigating to roaster profile:', roasterInfo);
      // Navigate to UserProfileBridge instead of directly to UserProfile
      navigation.navigate('UserProfileBridge', { 
        userId: roasterInfo.id, 
        userName: roasterInfo.name,
        skipAuth: true,
        isBusinessAccount: roasterInfo.isBusinessAccount,
        isRoaster: true
      });
    }
  };

  const navigateToSaved = () => {
    navigation.navigate('Saved', {
      type: 'coffee'
    });
  };

  // Function to get country flag emoji
  const getCountryFlag = (countryName) => {
    const flagMap = {
      'bolivia': '🇧🇴',
      'colombia': '🇨🇴',
      'guatemala': '🇬🇹',
      'brazil': '🇧🇷',
      'ethiopia': '🇪🇹',
      'kenya': '🇰🇪',
      'costa rica': '🇨🇷',
      'peru': '🇵🇪',
      'rwanda': '🇷🇼',
      'indonesia': '🇮🇩',
      'mexico': '🇲🇽',
      'panama': '🇵🇦',
      'honduras': '🇭🇳',
      'nicaragua': '🇳🇮',
      'el salvador': '🇸🇻',
      'ecuador': '🇪🇨',
      'jamaica': '🇯🇲',
      'yemen': '🇾🇪',
      'uganda': '🇺🇬',
      'burundi': '🇧🇮',
      'tanzania': '🇹🇿',
      'malawi': '🇲🇼',
      'zambia': '🇿🇲',
      'papua new guinea': '🇵🇬',
      'hawaii': '🇺🇸',
      'india': '🇮🇳',
      'vietnam': '🇻🇳',
      'thailand': '🇹🇭',
      'china': '🇨🇳'
    };
    
    const normalized = countryName?.toLowerCase().trim();
    return flagMap[normalized] || '';
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard 
      recipe={item}
      onPress={navigateToRecipeDetail}
      onUserPress={navigateToUserProfile}
    />
  );

  const renderSellerItem = ({ item, index }) => {
    // Check if this is the only seller or the last one in the list
    const isLastOrOnlySeller = index === sellers.length - 1;
    
    return (
      <TouchableOpacity 
        style={[
          styles.sellerItem,
          isLastOrOnlySeller ? styles.sellerItemNoBorder : null
        ]}
        onPress={() => {
          // Special handling for Toma Café locations
          if (item.name && item.name.includes('Toma Café') && item.name !== 'Toma Café') {
            // For Toma Café locations (like Toma Café 1), find the right ID from trendingCafes
            const locationId = item.name.replace(/\s+/g, '-').toLowerCase();
            navigation.navigate('UserProfileBridge', { 
              userId: locationId, // This should match the ID in trendingCafes (e.g., "toma-cafe-1")
              userName: item.name,
              skipAuth: true,
              isLocation: true,
              parentBusinessId: 'business-toma'
            });
          } else {
            // For other sellers, use standard navigation
            navigateToUserProfile(item.id, item.name);
          }
        }}
      >
        <AppImage 
          source={item.avatar}
          style={[
            styles.sellerAvatar,
            item.businessAccount ? styles.businessAvatar : styles.userAvatar
          ]}
          resizeMode="cover"
        />
        <View style={styles.sellerInfo}>
          <View style={styles.sellerNameContainer}>
            <Text style={styles.sellerName}>{item.name}</Text>
            {item.isRoaster && (
              <View style={styles.roasterBadge}>
                <Text style={styles.roasterBadgeText}>Roaster</Text>
              </View>
            )}
          </View>
          <Text style={styles.sellerLocation}>{item.location}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#000000" />
      </TouchableOpacity>
    );
  };



  // Navigate to CoffeeDiscoveryScreen with specific filter
  const navigateWithFilter = (filterType, filterValue, filterLabel) => {
    let categoryId = null;
    let optionId = null;
    
    switch(filterType) {
      case 'origin':
        categoryId = 'origin';
        optionId = filterValue.toLowerCase().replace(/\s+/g, '_');
        break;
      case 'region':
        categoryId = 'region';
        optionId = filterValue.toLowerCase().replace(/\s+/g, '_');
        break;
      case 'process':
        categoryId = 'process';
        optionId = filterValue.toLowerCase().replace(/\s+/g, '_');
        break;
      case 'roastLevel':
        categoryId = 'roastLevel';
        optionId = filterValue.toLowerCase();
        break;
      case 'profile':
        categoryId = 'notes';
        optionId = filterValue.toLowerCase().replace(/\s+/g, '_');
        break;
      case 'varietal':
        categoryId = 'varietal';
        optionId = filterValue.toLowerCase().replace(/\s+/g, '_');
        break;
      case 'producer':
        categoryId = 'producer';
        optionId = filterValue.toLowerCase().replace(/\s+/g, '_');
        break;
      default:
        return;
    }
    
    navigation.navigate('CoffeeDiscovery', { 
      preselectedFilter: { categoryId, optionId }
    });
  };



  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading coffee details...</Text>
        </View>
      </View>
    );
  }

  if (!coffee) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#CCCCCC" />
          <Text style={styles.errorText}>Coffee not found</Text>
          <Text style={styles.errorSubtext}>The coffee you're looking for doesn't exist or has been removed.</Text>
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
        onAction={toastActionText === 'View Collection' ? navigateToCollection : toastActionText === 'View Saved' ? navigateToSaved : null}
        onDismiss={() => setToastVisible(false)}
        duration={3000}
      />
      
      <ScrollView
        onScroll={(event) => {
          const currentScrollY = event.nativeEvent.contentOffset.y;
          setScrollY(currentScrollY);
          
          // Show coffee name in header when scrolled past the coffee name section
          // The coffee name section ends around 150-180px depending on content
          const coffeeNameThreshold = 350;
          setShowCoffeeNameInHeader(currentScrollY > coffeeNameThreshold);
        }}
        scrollEventThrottle={16}
      >
        {/* Coffee Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          {/* Coffee Image */}
          <View style={[styles.imageContainer, { backgroundColor: isDarkMode ? theme.altBackground : theme.altBackground }]}>
            <AppImage 
              source={coffee.image} 
              style={styles.coffeeImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.coffeeName, { color: theme.primaryText }]}>{coffee.name}</Text>
            
            {/* Roaster with avatar (tappable) */}
            <TouchableOpacity 
              style={styles.roasterContainer}
              onPress={navigateToRoasterProfile}
              disabled={!roasterInfo || !roasterInfo.id}
            >
              {roasterInfo && roasterInfo.avatar && (
                <AppImage 
                  source={roasterInfo.avatar} 
                  style={[
                    styles.roasterAvatar,
                    roasterInfo.isBusinessAccount ? styles.roasterBusinessAvatar : styles.roasterUserAvatar
                  ]} 
                  resizeMode="cover"
                />
              )}
              <Text style={[styles.roasterName, { color: theme.secondaryText }]}>{coffee.roaster}</Text>
            </TouchableOpacity>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: isDarkMode ? theme.background : theme.background, 
                    borderColor: theme.border
                  },
                  isInCollection ? { 
                      backgroundColor: isDarkMode ? theme.background : theme.background, 
                      borderColor: isDarkMode ? theme.border : theme.border
                    } : { borderColor: isDarkMode ? theme.border : theme.border }
                ]}
                onPress={handleAddToCollection}
              >
                <Ionicons 
                  name={isInCollection ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={20} 
                  color={isInCollection ? theme.primaryText : theme.primaryText} 
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: theme.primaryText },
                  isInCollection ? styles.actionButtonTextActive : null
                ]}>
                  {isInCollection ? "Tried" : "Mark as Tried"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { 
                    backgroundColor: isDarkMode ? theme.background : theme.background, 
                    borderColor: theme.border
                  },
                  isSaved ? { 
                      backgroundColor: isDarkMode ? theme.background : theme.background, 
                      borderColor: isDarkMode ? theme.border : theme.border
                    } : { borderColor: isDarkMode ? theme.border : theme.border }
                ]}
                onPress={handleSave}
              >
                <Ionicons 
                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={isSaved ? theme.primaryText : theme.primaryText} 
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: isSaved ? theme.primaryText : theme.primaryText },
                ]}>
                  {isSaved ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Coffee Details */}
        <View style={[styles.section, { backgroundColor: theme.background, borderTopColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Details</Text>
          <View style={styles.detailsGrid}>
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={() => navigateWithFilter('origin', coffee.origin, coffee.origin)}
            >
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Origin</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>
                {getCountryFlag(coffee.origin)} {coffee.origin}
              </Text>
            </TouchableOpacity>
            {coffee.region && (
              <TouchableOpacity 
                style={styles.detailItem}
                onPress={() => navigateWithFilter('region', coffee.region, coffee.region)}
              >
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Region</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.region}</Text>
              </TouchableOpacity>
            )}
            {coffee.producer && (
              <TouchableOpacity 
                style={styles.detailItem}
                onPress={() => navigateWithFilter('producer', coffee.producer, coffee.producer)}
              >
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Producer</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.producer}</Text>
              </TouchableOpacity>
            )}
            {coffee.altitude && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Altitude</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.altitude}</Text>
              </View>
            )}
            {coffee.varietal && (
              <TouchableOpacity 
                style={styles.detailItem}
                onPress={() => navigateWithFilter('varietal', coffee.varietal, coffee.varietal)}
              >
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Varietal</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.varietal}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={() => navigateWithFilter('process', coffee.process, coffee.process)}
            >
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Process</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.process}</Text>
            </TouchableOpacity>
            {coffee.profile && (
              <TouchableOpacity 
                style={styles.detailItem}
                onPress={() => navigateWithFilter('profile', coffee.profile, coffee.profile)}
              >
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Profile</Text>
                <Text style={[styles.detailValue, styles.detailValueWithPadding, { color: theme.primaryText }]}>{coffee.profile}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.detailItem}
              onPress={() => navigateWithFilter('roastLevel', coffee.roastLevel || 'Medium', coffee.roastLevel || 'Medium')}
            >
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Roast Level</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.roastLevel || 'Medium'}</Text>
            </TouchableOpacity>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Price</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{typeof coffee.price === 'number' ? `€${coffee.price.toFixed(2)}` : coffee.price}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: theme.background, borderTopColor: theme.divider }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: theme.secondaryText }]} numberOfLines={descriptionExpanded ? undefined : 4}>{coffee.description}</Text>
          {coffee.description && coffee.description.length > 150 && (
            <TouchableOpacity 
              style={styles.viewMoreButton} 
              onPress={() => setDescriptionExpanded(!descriptionExpanded)}
            >
              <Text style={[styles.viewMoreText, { color: theme.accent, borderBottomColor: theme.accent }]}>
                {descriptionExpanded ? 'View less' : 'View more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sold By Section */}
        {sellers.length > 0 && (
          <View style={[styles.sellersContainer, { backgroundColor: theme.background, borderTopColor: theme.divider }]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Sold By</Text>
            <FlatList
              data={sellers}
              renderItem={({ item, index }) => {
                // Check if this is the only seller or the last one in the list
                const isLastOrOnlySeller = index === sellers.length - 1;
                
                return (
                  <TouchableOpacity 
                    style={[
                      styles.sellerItem,
                      { borderBottomColor: theme.divider },
                      isLastOrOnlySeller ? styles.sellerItemNoBorder : null
                    ]}
                    onPress={() => {
                      // Special handling for Toma Café locations
                      if (item.name && item.name.includes('Toma Café') && item.name !== 'Toma Café') {
                        // For Toma Café locations (like Toma Café 1), find the right ID from trendingCafes
                        const locationId = item.name.replace(/\s+/g, '-').toLowerCase();
                        navigation.navigate('UserProfileBridge', { 
                          userId: locationId, // This should match the ID in trendingCafes (e.g., "toma-cafe-1")
                          userName: item.name,
                          skipAuth: true,
                          isLocation: true,
                          parentBusinessId: 'business-toma'
                        });
                      } else {
                        // For other sellers, use standard navigation
                        navigateToUserProfile(item.id, item.name);
                      }
                    }}
                  >
                    <AppImage 
                      source={item.avatar}
                      style={[
                        styles.sellerAvatar,
                        item.businessAccount ? styles.businessAvatar : styles.userAvatar
                      ]}
                      resizeMode="cover"
                    />
                    <View style={styles.sellerInfo}>
                      <View style={styles.sellerNameContainer}>
                        <Text style={[styles.sellerName, { color: theme.primaryText }]}>{item.name}</Text>
                        {item.isRoaster && (
                          <View style={styles.roasterBadge}>
                            <Text style={styles.roasterBadgeText}>Roaster</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.sellerLocation, { color: theme.secondaryText }]}>{item.location}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Related Recipes */}
        <View style={[styles.section, { backgroundColor: theme.background, borderTopColor: theme.divider }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Brewing Recipes</Text>
            <TouchableOpacity 
              style={[styles.createRecipeButton, { borderBottomColor: theme.accent }]}
              onPress={navigateToCreateRecipe}
            >
              <Text style={[styles.createRecipeText, { color: theme.accent }]}>Create Recipe</Text>
            </TouchableOpacity>
          </View>
          
          {relatedRecipes.length > 0 ? (
            <FlatList
              data={relatedRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.recipeList}
            />
          ) : (
            <View style={styles.emptyRecipesContainer}>
              <Ionicons name="cafe" size={24} color={theme.secondaryText} />
              <Text style={[styles.emptyRecipesText, { color: theme.secondaryText }]}>No recipes yet for this coffee</Text>
              <TouchableOpacity 
                style={[styles.createFirstRecipeButton, { backgroundColor: theme.accent }]}
                onPress={navigateToCreateRecipe}
              >
                <Text style={[styles.createFirstRecipeText, { color: "#FFFFFF" }]}>Create Your First Recipe</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Recipe Modal */}
      <Modal
        visible={showCreateRecipeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateRecipeModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={[styles.recipeModalContainer, { backgroundColor: theme.background }]}
        >
          <View style={[styles.recipeModalHeader, { borderBottomColor: theme.divider }]}>
            <TouchableOpacity onPress={() => setShowCreateRecipeModal(false)}>
              <Text style={[styles.recipeModalCancel, { color: theme.primaryText }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.recipeModalTitle, { color: theme.primaryText }]}>Create Recipe</Text>
            <TouchableOpacity 
              onPress={handleSubmitRecipe}
              disabled={!recipeData.method || !recipeData.amount || !recipeData.waterVolume}
            >
              <Text style={[
                styles.recipeModalSubmit, 
                { 
                  color: (!recipeData.method || !recipeData.amount || !recipeData.waterVolume) 
                    ? theme.secondaryText 
                    : theme.primaryText,
                  opacity: (!recipeData.method || !recipeData.amount || !recipeData.waterVolume) ? 0.5 : 1
                }
              ]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.recipeModalContent}>
            {/* Coffee Info */}
            <View style={[styles.coffeeInfoContainer, { backgroundColor: theme.altBackground }]}>
              <AppImage 
                source={coffee.image} 
                style={styles.coffeeInfoImage}
                resizeMode="cover"
              />
              <View style={styles.coffeeInfoText}>
                <Text style={[styles.coffeeInfoName, { color: theme.primaryText }]}>{coffee.name}</Text>
                <Text style={[styles.coffeeInfoRoaster, { color: theme.secondaryText }]}>{coffee.roaster}</Text>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Brewing Method */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Brewing Method *</Text>
                <TouchableOpacity 
                  style={[styles.selectorButton, { backgroundColor: theme.altBackground, borderColor: theme.border }]}
                  onPress={() => {
                    const methods = ['V60', 'Chemex', 'AeroPress', 'French Press', 'Espresso', 'Cold Brew', 'Pour Over'];
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
                  <Text style={[styles.selectorButtonText, { color: theme.primaryText }]}>
                    {recipeData.method || 'Select brewing method'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              </View>

              {/* Coffee Amount */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Coffee Amount (g) *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
                  value={recipeData.amount}
                  onChangeText={(text) => setRecipeData({...recipeData, amount: text})}
                  placeholder="20"
                  keyboardType="numeric"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  placeholderTextColor={theme.secondaryText}
                />
              </View>

              {/* Grind Size */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Grind Size</Text>
                <TouchableOpacity 
                  style={[styles.selectorButton, { backgroundColor: theme.altBackground, borderColor: theme.border }]}
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
                  <Text style={[styles.selectorButtonText, { color: theme.primaryText }]}>{recipeData.grindSize}</Text>
                  <Ionicons name="chevron-down" size={20} color={theme.secondaryText} />
                </TouchableOpacity>
              </View>

              {/* Water Volume */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Water Volume (ml) *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
                  value={recipeData.waterVolume}
                  onChangeText={(text) => setRecipeData({...recipeData, waterVolume: text})}
                  placeholder="300"
                  keyboardType="numeric"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  placeholderTextColor={theme.secondaryText}
                />
              </View>

              {/* Brew Time */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Brew Time</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
                  value={recipeData.brewTime}
                  onChangeText={(text) => setRecipeData({...recipeData, brewTime: text})}
                  placeholder="3:30"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  placeholderTextColor={theme.secondaryText}
                />
              </View>

              {/* Notes */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: theme.primaryText }]}>Notes</Text>
                <TextInput
                  style={[styles.textAreaInput, { backgroundColor: theme.altBackground, color: theme.primaryText, borderColor: theme.border }]}
                  value={recipeData.notes}
                  onChangeText={(text) => setRecipeData({...recipeData, notes: text})}
                  placeholder="Any brewing notes or tips..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  keyboardAppearance={isDarkMode ? 'dark' : 'light'}
                  placeholderTextColor={theme.secondaryText}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  coffeeImage: {
    width: '100%',
    aspectRatio: 5/4,
    backgroundColor: 'transparent',
  },
  headerContent: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  coffeeName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  roasterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  roasterName: {
    fontSize: 18,
    color: '#666666',
  },
  roasterAvatar: {
    width: 24,
    height: 24,
    marginRight: 8,
    // borderWidth: 1,
    // borderColor: '#F0F0F0',
  },
  roasterUserAvatar: {
    borderRadius: 12,
  },
  roasterBusinessAvatar: {
    borderRadius: 4,
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    borderWidth: 1,
    // borderColor: '#E5E5EA',
  },
  actionButtonActive: {
    // backgroundColor: '#000000',
    // borderColor: '#000000',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#E5E5EA',
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  createRecipeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  createFirstRecipeButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    display: 'none',
  },
  createFirstRecipeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
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
  detailValueWithPadding: {
    paddingRight: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22.4,
    // lineHeight: 19.2,
  },
  recipeCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 300,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailRow: {
    width: '50%',
    marginBottom: 8,
  },
  stepsContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  stepTime: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  moreStepsText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666666',
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  emptyRecipesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyRecipesText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  recipeList: {
    paddingVertical: 8,
  },
  recipeCarousel: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  recipeSection: {
    marginTop: 24,
  },
  recipeSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000',
  },
  recipeList: {
    // marginTop: 8,
  },
  sellersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
  },
  sellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sellerItemNoBorder: {
    borderBottomWidth: 0,
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 4,
    // borderWidth: 1,
    // borderColor: '#F0F0F0',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sellerLocation: {
    fontSize: 14,
    color: '#666666',
  },
  roasterBadge: {
    // make theme sensitive
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  roasterBadgeText: {
    color: '#555555',
    fontSize: 10,
    fontWeight: '600',
  },
  userAvatar: {
    borderRadius: 0,
  },
  businessAvatar: {
    borderRadius: 0,
  },
  viewMoreButton: {
    marginTop: 12,
    marginBottom: 4,
    alignSelf: 'flex-start',
    textDecorationLine: 'underline',
  },
  viewMoreText: {
    fontWeight: '500',
    borderBottomWidth: 1,
  },

  // Recipe Modal Styles
  recipeModalContainer: {
    flex: 1,
  },
  recipeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recipeModalCancel: {
    fontSize: 16,
    fontWeight: '400',
  },
  recipeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  recipeModalSubmit: {
    fontSize: 16,
    fontWeight: '600',
  },
  recipeModalContent: {
    flex: 1,
    padding: 16,
  },
  coffeeInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  coffeeInfoImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  coffeeInfoText: {
    flex: 1,
  },
  coffeeInfoName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  coffeeInfoRoaster: {
    fontSize: 14,
  },
  formContainer: {
    flex: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectorButtonText: {
    fontSize: 16,
  },
  textInput: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  textAreaInput: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },


}); 