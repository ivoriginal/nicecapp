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
  ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import eventEmitter from '../utils/EventEmitter';
import mockCoffees from '../data/mockCoffees.json';
import mockCafes from '../data/mockCafes.json';
import { useNavigation, useRoute } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';
import AppImage from '../components/common/AppImage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
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
    toggleFavorite
  } = useCoffee();
  
  const navigation = useNavigation();
  const route = useRoute();
  const { coffeeId, skipAuth } = route.params || { coffeeId: null, skipAuth: false };
  const insets = useSafeAreaInsets();
  
  const [coffee, setCoffee] = useState(null);
  const [relatedRecipes, setRelatedRecipes] = useState([]);
  const [filteredRelatedRecipes, setFilteredRelatedRecipes] = useState([]);
  const [ratingFilter, setRatingFilter] = useState('all');
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
            setFilteredRelatedRecipes(routeCoffee.recipes);
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
              price: '$18.00',
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
        setFilteredRelatedRecipes(matchingRecipes);
      } else {
        // Otherwise fall back to context recipes
        const contextRecipes = getRecipesForCoffee(coffee.id);
        console.log(`Found ${contextRecipes.length} recipes for coffee ${coffee.id} in context`);
        setRelatedRecipes(contextRecipes);
        setFilteredRelatedRecipes(contextRecipes);
      }
    }
  // Only run this effect when coffee object changes, not on every render
  }, [coffee?.id, getRecipesForCoffee]);

  // Effect to filter recipes when ratingFilter changes
  useEffect(() => {
    if (relatedRecipes.length === 0) return;
    
    if (ratingFilter === 'all') {
      setFilteredRelatedRecipes(relatedRecipes);
      return;
    }
    
    // Filter recipes based on rating
    const ratingValue = parseInt(ratingFilter, 10);
    const filtered = relatedRecipes.filter(recipe => {
      const recipeRating = recipe.averageRating || recipe.rating || 0;
      return recipeRating >= ratingValue && recipeRating < ratingValue + 1;
    });
    
    setFilteredRelatedRecipes(filtered);
  }, [ratingFilter, relatedRecipes]);

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

  // Set up navigation options
  useLayoutEffect(() => {
    if (coffee) {
      navigation.setOptions({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTintColor: theme.primaryText, // Set back button color
      });
    }
  }, [navigation, coffee, theme]);

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
      showToast('Removed from saved');
    } else {
      addToCollection(coffee);
      setIsInCollection(true);
      showToast('Saved');
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
    navigation.navigate('CreateRecipe', { 
      coffeeId: coffee.id,
      coffeeName: coffee.name,
      coffeeImage: coffee.image,
      roaster: coffee.roaster,
      skipAuth: true 
    });
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

  // Add a renderRatingFilter function to render the rating filter chips
  const renderRatingFilter = () => {
    return (
      <View style={styles.ratingFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.ratingFilterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.ratingFilterChip,
              ratingFilter === 'all' && styles.activeRatingFilterChip
            ]}
            onPress={() => setRatingFilter('all')}
          >
            <Text style={[
              styles.ratingFilterText,
              ratingFilter === 'all' && styles.activeRatingFilterText
            ]}>All</Text>
          </TouchableOpacity>
          
          {[5, 4, 3, 2, 1].map(rating => (
            <TouchableOpacity
              key={`rating-${rating}`}
              style={[
                styles.ratingFilterChip,
                ratingFilter === rating.toString() && styles.activeRatingFilterChip
              ]}
              onPress={() => setRatingFilter(rating.toString())}
            >
              <View style={styles.ratingFilterStars}>
                <Text style={[
                  styles.ratingFilterText,
                  ratingFilter === rating.toString() && styles.activeRatingFilterText
                ]}>{rating}</Text>
                <Ionicons
                  name="star"
                  size={14}
                  color={ratingFilter === rating.toString() ? '#FFFFFF' : '#FFD700'}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
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
      
      <ScrollView>
        {/* Coffee Header */}
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          {/* Coffee Image */}
          <AppImage 
            source={coffee.image} 
            style={styles.coffeeImage}
            resizeMode="cover"
          />
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
              {roasterInfo && roasterInfo.id && (
                <Ionicons name="chevron-forward" size={16} color={theme.secondaryText} />
              )}
            </TouchableOpacity>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color={theme.primaryText} />
                <Text style={[styles.statText, { color: theme.primaryText }]}>{coffee.stats?.rating || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>({coffee.stats?.reviews || 0})</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cafe" size={16} color={theme.primaryText} />
                <Text style={[styles.statText, { color: theme.primaryText }]}>{coffee.stats?.brews || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>brews</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color={theme.primaryText} />
                <Text style={[styles.statText, { color: theme.primaryText }]}>{coffee.stats?.wishlist || 0}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}>saved</Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  { backgroundColor: theme.secondaryBack },
                  isInCollection ? [styles.actionButtonActive, { backgroundColor: theme.accent }] : null
                ]}
                onPress={handleAddToCollection}
              >
                <Ionicons 
                  name={isInCollection ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={20} 
                  color={isInCollection ? "#FFFFFF" : theme.primaryText} 
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
                  { backgroundColor: theme.secondaryBack },
                  isSaved ? [styles.actionButtonActive, { backgroundColor: theme.accent }] : null
                ]}
                onPress={handleSave}
              >
                <Ionicons 
                  name={isSaved ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={isSaved ? "#FFFFFF" : theme.primaryText} 
                />
                <Text style={[
                  styles.actionButtonText,
                  { color: theme.primaryText },
                  isSaved ? styles.actionButtonTextActive : null
                ]}>
                  {isSaved ? "Saved" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Coffee Details */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Origin</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.origin}</Text>
            </View>
            {coffee.region && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Region</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.region}</Text>
              </View>
            )}
            {coffee.producer && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Producer</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.producer}</Text>
              </View>
            )}
            {coffee.altitude && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Altitude</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.altitude}</Text>
              </View>
            )}
            {coffee.varietal && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Varietal</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.varietal}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Process</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.process}</Text>
            </View>
            {coffee.profile && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Profile</Text>
                <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.profile}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Roast Level</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{coffee.roastLevel || 'Medium'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Price</Text>
              <Text style={[styles.detailValue, { color: theme.primaryText }]}>{typeof coffee.price === 'number' ? `€${coffee.price.toFixed(2)}` : coffee.price}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: theme.primaryText }]} numberOfLines={descriptionExpanded ? undefined : 4}>{coffee.description}</Text>
          {coffee.description && coffee.description.length > 150 && (
            <TouchableOpacity 
              style={styles.viewMoreButton} 
              onPress={() => setDescriptionExpanded(!descriptionExpanded)}
            >
              <Text style={[styles.viewMoreText, { color: theme.accent }]}>
                {descriptionExpanded ? 'View less' : 'View more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sold By Section */}
        {sellers.length > 0 && (
          <View style={[styles.sellersContainer, { backgroundColor: theme.cardBackground }]}>
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
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>Brewing Recipes</Text>
            <TouchableOpacity 
              style={[styles.createRecipeButton, { borderBottomColor: theme.accent }]}
              onPress={navigateToCreateRecipe}
            >
              <Text style={[styles.createRecipeText, { color: theme.accent }]}>Create Recipe</Text>
            </TouchableOpacity>
          </View>
          
          {/* Rating filter */}
          {relatedRecipes.length > 0 && (
            <View style={styles.ratingFilterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ratingFilterScrollContent}
              >
                <TouchableOpacity
                  style={[
                    styles.ratingFilterChip,
                    { backgroundColor: theme.secondaryBack, borderColor: theme.border },
                    ratingFilter === 'all' && [styles.activeRatingFilterChip, { backgroundColor: theme.accent, borderColor: theme.accent }]
                  ]}
                  onPress={() => setRatingFilter('all')}
                >
                  <Text style={[
                    styles.ratingFilterText,
                    { color: theme.primaryText },
                    ratingFilter === 'all' && styles.activeRatingFilterText
                  ]}>All</Text>
                </TouchableOpacity>
                
                {[5, 4, 3, 2, 1].map(rating => (
                  <TouchableOpacity
                    key={`rating-${rating}`}
                    style={[
                      styles.ratingFilterChip,
                      { backgroundColor: theme.secondaryBack, borderColor: theme.border },
                      ratingFilter === rating.toString() && [styles.activeRatingFilterChip, { backgroundColor: theme.accent, borderColor: theme.accent }]
                    ]}
                    onPress={() => setRatingFilter(rating.toString())}
                  >
                    <View style={styles.ratingFilterStars}>
                      <Text style={[
                        styles.ratingFilterText,
                        { color: theme.primaryText },
                        ratingFilter === rating.toString() && styles.activeRatingFilterText
                      ]}>{rating}</Text>
                      <Ionicons
                        name="star"
                        size={14}
                        color={ratingFilter === rating.toString() ? '#FFFFFF' : '#FFD700'}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          
          {filteredRelatedRecipes.length > 0 ? (
            <FlatList
              data={filteredRelatedRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.recipeList}
            />
          ) : (
            <View style={styles.emptyRecipesContainer}>
              {relatedRecipes.length > 0 ? (
                <>
                  <Ionicons name="filter" size={24} color={theme.secondaryText} />
                  <Text style={[styles.emptyRecipesText, { color: theme.secondaryText }]}>No recipes match this rating filter</Text>
                  <TouchableOpacity 
                    style={[styles.resetFilterButton, { backgroundColor: theme.secondaryBack }]}
                    onPress={() => setRatingFilter('all')}
                  >
                    <Text style={[styles.resetFilterText, { color: theme.primaryText }]}>Show All Recipes</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="cafe" size={24} color={theme.secondaryText} />
                  <Text style={[styles.emptyRecipesText, { color: theme.secondaryText }]}>No recipes yet for this coffee</Text>
                  <TouchableOpacity 
                    style={[styles.createFirstRecipeButton, { backgroundColor: theme.accent }]}
                    onPress={navigateToCreateRecipe}
                  >
                    <Text style={[styles.createFirstRecipeText, { color: "#FFFFFF" }]}>Create Your First Recipe</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
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
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  coffeeImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    // marginBottom: 16,
  },
  headerContent: {
    marginVertical: 16,
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
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  roasterUserAvatar: {
    borderRadius: 12,
  },
  roasterBusinessAvatar: {
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 4,
    marginRight: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  section: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 8,
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
    fontSize: 18,
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
  descriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
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
    marginTop: 8,
  },
  sellersContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
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
    borderWidth: 1,
    borderColor: '#F0F0F0',
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
  },
  viewMoreText: {
    color: '#000000',
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  ratingFilterContainer: {
    // marginVertical: 12,
    marginBottom: 12,
  },
  ratingFilterScrollContent: {
    // paddingHorizontal: 8,
  },
  ratingFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeRatingFilterChip: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  ratingFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  activeRatingFilterText: {
    color: '#FFFFFF',
  },
  ratingFilterStars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  resetFilterButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  resetFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
}); 