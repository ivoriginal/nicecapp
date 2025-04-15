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

export default function CoffeeDetailScreen() {
  const { 
    coffeeEvents = [], 
    coffeeCollection = [], 
    coffeeWishlist = [], 
    favorites = [], 
    addToCollection = () => {}, 
    removeFromCollection = () => {}, 
    addToWishlist = () => {},
    removeFromWishlist = () => {},
    toggleFavorite = () => {}
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

  useEffect(() => {
    // Always use mock data for development
    const fetchCoffee = () => {
      setLoading(true);
      try {
        // First try to find the coffee in the coffeeEvents
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
        } else {
          // Otherwise find in mock data
          const foundCoffee = mockData.coffees.find(c => c.id === coffeeId) || mockData.coffees[0];
          if (foundCoffee) {
            setCoffee(foundCoffee);
          }
        }
      } catch (error) {
        console.error('Error fetching coffee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoffee();
  }, [coffeeId, coffeeEvents]);

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
      handleToggleFavorite
    });
  }, [isFavorite, navigation]);

  const navigateToRecipeDetail = (recipeId) => {
    navigation.navigate('RecipeDetail', { recipeId, skipAuth: true });
  };

  const navigateToUserProfile = (userId) => {
    navigation.navigate('Profile', { userId, skipAuth: true });
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

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={() => navigateToRecipeDetail(item.id)}
    >
      <View style={styles.recipeHeader}>
        <View style={styles.methodContainer}>
          <Ionicons name="cafe" size={20} color="#000000" />
          <Text style={styles.methodText}>{item.method}</Text>
        </View>
        {item.rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#000000" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.recipeDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Coffee</Text>
          <Text style={styles.detailValue}>{item.amount}g</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Grind Size</Text>
          <Text style={styles.detailValue}>{item.grindSize}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Water</Text>
          <Text style={styles.detailValue}>{item.waterVolume}ml</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brew Time</Text>
          <Text style={styles.detailValue}>{item.brewTime}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.userContainer}
        onPress={() => navigateToUserProfile(item.userId)}
      >
        <Image 
          source={{ uri: item.userAvatar || 'https://via.placeholder.com/32' }} 
          style={styles.userAvatar} 
        />
        <Text style={styles.userName}>{item.userName}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {item.notes && (
        <Text style={styles.notesText} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

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
                <Text style={styles.statText}>{coffee.stats.rating}</Text>
                <Text style={styles.statLabel}>({coffee.stats.reviews})</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="cafe" size={16} color="#000000" />
                <Text style={styles.statText}>{coffee.stats.brews}</Text>
                <Text style={styles.statLabel}>brews</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color="#000000" />
                <Text style={styles.statText}>{coffee.stats.wishlist}</Text>
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
                  name={isInWishlist ? "heart" : "heart-outline"} 
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

        {/* Related Recipes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related Recipes</Text>
          <FlatList
            data={relatedRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
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
  descriptionText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
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
}); 