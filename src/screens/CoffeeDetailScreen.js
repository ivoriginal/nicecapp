import React, { useState, useEffect } from 'react';
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
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import eventEmitter from '../utils/EventEmitter';
import mockData from '../data/mockData.json';
import { useNavigation, useRoute } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';

// Mock data for sellers
const mockSellers = {
  'coffee1': [
    { id: 'business3', name: 'Blue Bottle Coffee', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Oakland, CA' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' }
  ],
  'coffee2': [
    { id: 'business4', name: 'Stumptown Coffee Roasters', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Portland, OR' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' },
    { id: 'business2', name: 'The Fix', isRoaster: false, businessAccount: true, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Austin, TX' }
  ],
  'coffee3': [
    { id: 'business3', name: 'Blue Bottle Coffee', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Oakland, CA' }
  ],
  'coffee4': [
    { id: 'business4', name: 'Stumptown Coffee Roasters', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Portland, OR' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' }
  ],
  'coffee5': [
    { id: 'business2', name: 'The Fix', isRoaster: true, businessAccount: true, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Austin, TX' }
  ],
  'coffee-0': [
    { id: 'business3', name: 'Blue Bottle Coffee', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Oakland, CA' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' }
  ],
  'coffee-1': [
    { id: 'business4', name: 'Stumptown Coffee Roasters', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Portland, OR' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' }
  ],
  'coffee-2': [
    { id: 'business1', name: 'Toma Café', isRoaster: true, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg', location: 'Madrid, Spain' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' }
  ],
  'mock1': [
    { id: 'business3', name: 'Blue Bottle Coffee', isRoaster: true, businessAccount: false, avatar: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80', location: 'Oakland, CA' },
    { id: 'user2', name: 'Vértigo y Calambre', isRoaster: false, businessAccount: true, avatar: 'https://instagram.fvlc6-1.fna.fbcdn.net/v/t51.2885-19/336824776_569041758334218_6485683640258084106_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_ht=instagram.fvlc6-1.fna.fbcdn.net&_nc_cat=106&_nc_oc=Q6cZ2QG9yijX6AYS-LyAN9vATpVAGPTj3dueZAwrz_3RB68vu_PtQKtRFxeVRSPP84eYFZw&_nc_ohc=mD1tNAu2Bp0Q7kNvwHFAMaF&_nc_gid=a2z4gQ9o-xKDwiAyIMflPA&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_AfHHhBR9AddwcSMHdDw7WSR00XBUUwYOp5v4FuY-lTj-vw&oe=680ED603&_nc_sid=8b3546', location: 'Murcia, Spain' }
  ]
};

export default function CoffeeDetailScreen() {
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
  const [loading, setLoading] = useState(true);
  const [isInCollection, setIsInCollection] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastActionText, setToastActionText] = useState('');
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [removalTimeout, setRemovalTimeout] = useState(null);
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    // Always use mock data for development
    const fetchCoffee = () => {
      setLoading(true);
      try {
        // First check if coffee was passed through route params
        if (route.params?.coffee) {
          const { coffee: routeCoffee } = route.params;
          setCoffee(routeCoffee);
          setIsInCollection(routeCoffee.isInCollection);
          setIsInWishlist(routeCoffee.isInWishlist);
          if (routeCoffee.recipes) {
            setRelatedRecipes(routeCoffee.recipes);
          }
          
          // Set sellers for this coffee
          setSellers(mockSellers[routeCoffee.id] || []);
          
          setLoading(false);
          return;
        }

        // Otherwise try to find the coffee in the coffeeEvents
        const eventCoffee = coffeeEvents.find(event => event.coffeeId === coffeeId);
        
        if (eventCoffee) {
          // If found in events, use that data
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
          
          // Set sellers for this coffee
          setSellers(mockSellers[eventCoffee.coffeeId] || []);
        } else {
          // Otherwise find in mock data
          const foundCoffee = mockData.coffees.find(c => c.id === coffeeId) || mockData.coffees[0];
          if (foundCoffee) {
            setCoffee(foundCoffee);
            // Set sellers for this coffee
            setSellers(mockSellers[foundCoffee.id] || []);
            
            // Set mock recipes for the mock coffee
            setRelatedRecipes([
              {
                id: 'recipe-1',
                name: 'Ethiopian Yirgacheffe V60',
                method: 'V60',
                userId: 'currentUser',
                userName: 'Coffee Lover',
                userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
                coffeeId: 'mock1',
                steps: [
                  { time: '0:00', action: 'Rinse filter and warm vessel', water: 0 },
                  { time: '0:00', action: 'Add 18g coffee (medium-fine grind)', water: 0 },
                  { time: '0:00', action: 'Add 36g water for bloom', water: 36 },
                  { time: '0:30', action: 'Gently stir bloom', water: 0 },
                  { time: '0:45', action: 'Add water to 120g', water: 84 },
                  { time: '1:15', action: 'Add water to 180g', water: 60 },
                  { time: '1:45', action: 'Add water to 240g', water: 60 },
                  { time: '2:15', action: 'Add water to 300g', water: 60 },
                  { time: '3:00', action: 'Drawdown complete', water: 0 }
                ],
                tips: [
                  'Use filtered water at 200°F (93°C)',
                  'Grind coffee just before brewing',
                  'Rinse paper filter thoroughly',
                  'Keep water temperature consistent',
                  'Time your pours carefully'
                ],
                notes: 'Bright, floral, with notes of bergamot and honey'
              }
            ]);
          } else {
            // If not found in events, use mock data
            const mockCoffee = {
              id: 'mock1',
              name: 'Ethiopian Yirgacheffe',
              roaster: 'Blue Bottle Coffee',
              image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
              description: 'A bright, clean coffee with notes of citrus and floral aromas. Perfect for pour-over brewing.',
              origin: 'Ethiopia',
              process: 'Washed',
              roastLevel: 'Light',
              price: '$24.00',
              stats: {
                rating: 4.5,
                reviews: 128,
                brews: 256,
                wishlist: 89
              }
            };
            setCoffee(mockCoffee);
            
            // Set sellers for this coffee
            setSellers(mockSellers['mock1'] || []);
          }
        }
      } catch (error) {
        console.error('Error fetching coffee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoffee();
  }, [coffeeId, coffeeEvents, route.params]);

  // Fetch related recipes when coffee is loaded (only if recipes weren't passed in route params)
  useEffect(() => {
    if (coffee && !route.params?.coffee?.recipes) {
      // Get recipes for this coffee
      const recipes = getRecipesForCoffee(coffee.id);
      console.log(`Found ${recipes.length} recipes for coffee ${coffee.id}`);
      setRelatedRecipes(recipes);
    }
  }, [coffee, getRecipesForCoffee, route.params?.coffee?.recipes]);

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

  // Update wishlist state whenever coffee or wishlist changes
  useEffect(() => {
    if (coffee) {
      const wishlistArray = Array.isArray(coffeeWishlist) ? coffeeWishlist : [];
      setIsInWishlist(wishlistArray.some(c => c.id === coffee.id));
    }
  }, [coffee, coffeeWishlist]);

  // Update navigation options with favorite state and toggle function
  useEffect(() => {
    navigation.setParams({
      isFavorite,
      handleToggleFavorite,
      isInCollection
    });
  }, [isFavorite, isInCollection, navigation]);

  const navigateToRecipeDetail = (recipeId) => {
    // Find the recipe in the related recipes
    const recipe = relatedRecipes.find(r => r.id === recipeId);
    if (recipe) {
      navigation.navigate('RecipeDetail', {
        recipeId: recipe.id,
        coffeeId: coffee.id,
        coffeeName: coffee.name,
        recipeName: recipe.name,
        coffeeImage: coffee.image,
        roaster: coffee.roaster,
        recipe: recipe // Pass the full recipe for immediate rendering
      });
    }
  };

  const navigateToUserProfile = (userId, userName) => {
    if (userName === 'Vértigo y Calambre') {
      navigation.navigate('UserProfileBridge', { 
        userId: 'user2', 
        userName: 'Vértigo y Calambre',
        skipAuth: true 
      });
    } else {
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
      showToast('Removed from your collection');
    } else {
      addToCollection(coffee);
      setIsInCollection(true);
      showToast('Added to your collection');
    }
  };

  const handleAddToWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(coffee.id);
      setIsInWishlist(false);
      showToast('Removed from your wishlist');
    } else {
      addToWishlist(coffee);
      setIsInWishlist(true);
      showToast('Added to your wishlist');
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
      skipAuth: true 
    });
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard 
      recipe={item}
      onPress={navigateToRecipeDetail}
      onUserPress={navigateToUserProfile}
    />
  );

  const renderSellerItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.sellerItem}
        onPress={() => navigateToUserProfile(item.id, item.name)}
      >
        <Image 
          source={{ uri: item.avatar }}
          style={[
            styles.sellerAvatar,
            item.businessAccount ? styles.businessAvatar : styles.userAvatar
          ]}
        />
        <View style={styles.sellerInfo}>
          <Text style={styles.sellerName}>{item.name}</Text>
          <Text style={styles.sellerLocation}>{item.location}</Text>
          {item.isRoaster && (
            <View style={styles.roasterBadge}>
              <Text style={styles.roasterBadgeText}>Roaster</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#000000" />
      </TouchableOpacity>
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
    <View style={styles.container}>
      <Toast 
        visible={toastVisible}
        message={toastMessage}
        actionText={toastActionText}
        onAction={toastActionText === 'View Collection' ? navigateToCollection : null}
        onDismiss={() => setToastVisible(false)}
        duration={3000}
      />
      
      <ScrollView>
        {/* Coffee Header */}
        <View style={styles.header}>
          <Image 
            source={{ uri: coffee.image }} 
            style={styles.coffeeImage} 
          />
          <View style={styles.headerContent}>
            <Text style={styles.coffeeName}>{coffee.name}</Text>
            <Text style={styles.roasterName}>{coffee.roaster}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#000000" />
                <Text style={styles.statText}>{coffee.stats?.rating || 0}</Text>
                <Text style={styles.statLabel}>({coffee.stats?.reviews || 0})</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cafe" size={16} color="#000000" />
                <Text style={styles.statText}>{coffee.stats?.brews || 0}</Text>
                <Text style={styles.statLabel}>brews</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color="#000000" />
                <Text style={styles.statText}>{coffee.stats?.wishlist || 0}</Text>
                <Text style={styles.statLabel}>saved</Text>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  isInCollection ? styles.actionButtonActive : null
                ]}
                onPress={handleAddToCollection}
              >
                <Ionicons 
                  name={isInCollection ? "checkmark-circle" : "checkmark-circle-outline"} 
                  size={20} 
                  color={isInCollection ? "#FFFFFF" : "#000000"} 
                />
                <Text style={[
                  styles.actionButtonText,
                  isInCollection ? styles.actionButtonTextActive : null
                ]}>
                  {isInCollection ? "Tried" : "Mark as Tried"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.actionButton, 
                  isInWishlist ? styles.actionButtonActive : null
                ]}
                onPress={handleAddToWishlist}
              >
                <Ionicons 
                  name={isInWishlist ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={isInWishlist ? "#FFFFFF" : "#000000"} 
                />
                <Text style={[
                  styles.actionButtonText,
                  isInWishlist ? styles.actionButtonTextActive : null
                ]}>
                  {isInWishlist ? "Wishlisted" : "Add to Wishlist"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Coffee Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Origin</Text>
              <Text style={styles.detailValue}>{coffee.origin}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Process</Text>
              <Text style={styles.detailValue}>{coffee.process}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Roast Level</Text>
              <Text style={styles.detailValue}>{coffee.roastLevel}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>{coffee.price}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{coffee.description}</Text>
        </View>

        {/* Sold By Section */}
        {sellers.length > 0 && (
          <View style={styles.sellersContainer}>
            <Text style={styles.sectionTitle}>Sold By</Text>
            <FlatList
              data={sellers}
              renderItem={renderSellerItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Related Recipes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Brewing Recipes</Text>
            <TouchableOpacity 
              style={styles.createRecipeButton}
              onPress={navigateToCreateRecipe}
            >
              <Ionicons name="add-circle-outline" size={20} color="#000000" />
              <Text style={styles.createRecipeText}>Create Recipe</Text>
            </TouchableOpacity>
          </View>
          {relatedRecipes.length > 0 ? (
            <FlatList
              data={relatedRecipes}
              renderItem={renderRecipeItem}
              keyExtractor={item => item.id}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recipeCarousel}
              snapToInterval={300}
              decelerationRate="fast"
              snapToAlignment="start"
            />
          ) : (
            <View style={styles.emptyRecipesContainer}>
              <Ionicons name="cafe" size={24} color="#CCCCCC" />
              <Text style={styles.emptyRecipesText}>No recipes yet for this coffee</Text>
              <TouchableOpacity 
                style={styles.createFirstRecipeButton}
                onPress={navigateToCreateRecipe}
              >
                <Text style={styles.createFirstRecipeText}>Create Your First Recipe</Text>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  headerContent: {
    marginBottom: 16,
  },
  coffeeName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  roasterName: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 12,
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
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  createRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createRecipeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 4,
  },
  createFirstRecipeButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
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
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
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
    marginTop: 20,
  },
  sellerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sellerAvatar: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  userAvatar: {
    borderRadius: 20,
  },
  businessAvatar: {
    borderRadius: 8,
  },
  sellerInfo: {
    flex: 1,
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
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  roasterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
}); 