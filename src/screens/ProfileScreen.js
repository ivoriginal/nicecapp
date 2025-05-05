import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  StatusBar,
  Modal,
  Platform,
  ActionSheetIOS,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CommonActions } from '@react-navigation/native';
import CoffeeLogCard from '../components/CoffeeLogCard';
import eventEmitter from '../utils/EventEmitter';

// Loading and error components with safe default insets
const LoadingView = ({ insets }) => {
  // Ensure insets is properly initialized
  const safeInsets = insets || { top: 0, bottom: 0, left: 0, right: 0 };
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: safeInsets.top }]}>
      <ActivityIndicator size="large" color="#000000" />
      <Text style={styles.loadingText}>Loading profile...</Text>
    </View>
  );
};

const ErrorView = ({ error, insets, onRetry }) => {
  // Ensure insets is properly initialized
  const safeInsets = insets || { top: 0, bottom: 0, left: 0, right: 0 };
  return (
    <View style={[styles.container, styles.centerContent, { paddingTop: safeInsets.top }]}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function ProfileScreen() {
  const { 
    currentAccount: contextCurrentAccount, 
    accounts, 
    switchAccount, 
    loading, 
    error: contextError, 
    user, 
    coffeeEvents, 
    coffeeCollection, 
    coffeeWishlist,
    favorites,
    recipes, 
    loadData,
    removeFromCollection,
    removeFromWishlist,
    removeCoffeeEvent
  } = useCoffee();
  
  // Track current account locally with persistence in state
  const [localCurrentAccount, setLocalCurrentAccount] = useState(() => {
    // Check if we have a saved account in AsyncStorage or similar
    // For now, use the context account or default to user1
    return contextCurrentAccount || 'user1';
  });
  
  // Use local account always to make the selection stick
  const currentAccount = localCurrentAccount;

  const safeAreaInsets = useSafeAreaInsets();
  const insets = safeAreaInsets ? {
    top: safeAreaInsets.top || 0,
    bottom: safeAreaInsets.bottom || 0,
    left: safeAreaInsets.left || 0,
    right: safeAreaInsets.right || 0
  } : { top: 0, bottom: 0, left: 0, right: 0 };
  const [refreshing, setRefreshing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [showAccountSheet, setShowAccountSheet] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('coffee');
  const [recipeFilter, setRecipeFilter] = useState('all'); // 'all', 'created', 'saved'

  // Default user data for when we don't have loaded data yet
  const defaultUsers = {
    'user1': {
      id: 'user1',
      userName: 'Ivo Vilches',
      userHandle: 'ivoriginal',
      userAvatar: require('../../assets/users/ivo-vilches.jpg'),
      email: 'ivo.vilches@example.com',
      location: 'Murcia, Spain',
      isBusinessAccount: false,
      gear: ["Hario V60", "Baratza Encore", "Fellow Stagg EKG", "Acaia Pearl Scale"],
      gearWishlist: ["La Marzocco Linea Mini", "Weber Workshops EG-1", "Comandante C40", "Decent DE1"]
    },
    'user2': {
      id: 'user2',
      userName: 'Vértigo y Calambre',
      userHandle: 'vertigoycalambre',
      userAvatar: require('../../assets/businesses/vertigo-logo.jpg'),
      email: 'contacto@vertigoycalambre.com',
      location: 'Murcia, Spain',
      isBusinessAccount: true,
      gear: ["La Marzocco Linea Mini", "Mahlkönig E65S GbW", "Acaia Lunar Scale"],
      gearWishlist: ["La Marzocco GS3", "Victoria Arduino Eagle One", "Loring S15 Falcon"]
    },
    'user3': {
      id: 'user3',
      userName: 'Carlos Hernández',
      userHandle: 'CodingCarlos',
      userAvatar: require('../../assets/users/carlos-hernandez.jpg'),
      email: 'carlos.hernandez@example.com',
      location: 'Madrid, Spain',
      isBusinessAccount: false,
      gear: ["AeroPress", "Comandante C40", "Fellow Stagg EKG"]
    }
  };
  
  // Use account-specific defaults when user data isn't available
  const defaultUser = defaultUsers[currentAccount] || defaultUsers['user1'];

  // Selected account data - prefer user data from context, fall back to defaults
  const [currentUserData, setCurrentUserData] = useState(defaultUser);
  const userData = user ? 
    // If we have user data from context, use it, but ensure gear data is present
    {...currentUserData, ...user, 
      gear: user.gear || currentUserData.gear || [],
      gearWishlist: user.gearWishlist || currentUserData.gearWishlist || []
    } : 
    // Otherwise fall back to our local state
    currentUserData;
  const displayName = userData?.userName || userData?.name || 'Guest';
  const userHandle = userData?.userHandle || displayName.toLowerCase().replace(/\s+/g, '_');
  const avatarUrl = userData?.userAvatar || userData?.avatar || require('../../assets/users/ivo-vilches.jpg');
  const location = userData?.location || defaultUser?.location || 'Unknown location';
  const isBusinessAccount = userData?.isBusinessAccount || false;
  const userGear = userData?.gear || defaultUser?.gear || [];
  console.log('USER GEAR:', userGear);
  console.log('CURRENT USER DATA:', userData);
  console.log('DEFAULT USER:', defaultUser);

  // Only initialize once on mount with the current account
  useEffect(() => {
    initializeWithAccount(currentAccount);
  }, []);
  
  // Helper function to initialize with a specific account
  const initializeWithAccount = async (accountId) => {
    try {
      console.log(`Initializing with account: ${accountId}`);
      
      // Make sure we have default data immediately
      const defaultAccountData = defaultUsers[accountId] || defaultUsers['user1'];
      setCurrentUserData(defaultAccountData);
      
      // Use loadData function from context
      if (loadData) {
        await loadData(accountId);
        console.log(`Data loaded for account: ${accountId}`);
      } else {
        console.error('loadData is undefined');
        setLocalError('Failed to initialize: context function not available');
      }
    } catch (error) {
      console.error(`Error initializing with account ${accountId}:`, error);
      setLocalError(error.message || 'Failed to load profile data');
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setLocalError(null);
      // Use loadData function from context
      if (loadData) {
        await loadData(currentAccount);
      } else {
        console.error('loadData is undefined');
        throw new Error('Context function not available');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setLocalError(error.message || 'Failed to refresh profile');
    } finally {
      setRefreshing(false);
    }
  };

  // We have an error from either context or local state
  const combinedError = contextError || localError;

  // Show loading view when loading and not refreshing
  if (loading && !refreshing && !userData) {
    return <LoadingView insets={insets} />;
  }

  // Show error view when there's an error and not refreshing
  if (combinedError && !refreshing && !userData) {
    return <ErrorView error={combinedError} insets={insets} onRetry={() => initializeWithAccount(currentAccount)} />;
  }

  // Navigation
  const navigation = useNavigation();

  // Load data on mount and when current account changes
  useEffect(() => {
    console.log('Current user updated:', user);
    console.log('Display name:', displayName);
    console.log('Avatar URL:', avatarUrl);
    console.log('Current account:', currentAccount);
    console.log('Coffee Events count:', coffeeEvents?.length);
    console.log('Coffee Collection count:', coffeeCollection?.length);
    console.log('Coffee Wishlist count:', coffeeWishlist?.length);

    // If user is undefined or null after loading, try to load data again
    if (!user && !loading && !contextError) {
      console.log('User data missing, reloading...');
      initializeWithAccount(currentAccount);
    }
  }, [user, currentAccount, loading, contextError]);

  // Handle account switching from other components
  useFocusEffect(
    useCallback(() => {
      // If we're returning to this screen, see if the account changed
      console.log('ProfileScreen focused, current account:', currentAccount);

      // This will refresh data if needed
      if (currentAccount && !refreshing && !loading) {
        handleRefresh();
      }

      return () => {
        // Cleanup when screen loses focus
      };
    }, [currentAccount])
  );

  // Attach long press handler to navigation tab
  useEffect(() => {
    // Add the long press handler to the profile tab
    navigation.setOptions({
      tabBarLongPress: () => {
        setModalVisible(true);
      }
    });
  }, [navigation]);

  // Handle account switching
  const handleSwitchAccount = (accountId) => {
    try {
      console.log('==== ACCOUNT SWITCH DEBUGGING ====');
      console.log(`Attempting to switch from ${currentAccount} to ${accountId}`);
      
      // Close modal first
      setModalVisible(false);

      // Check if we're trying to switch to the same account
      if (currentAccount === accountId) {
        console.log('Already on this account, no switch needed');
        return;
      }

      // Show loading state and prevent any other actions
      setRefreshing(true);
      
      // First update the local account ID to maintain state
      setLocalCurrentAccount(accountId);
      
      // Immediately set default user data for smoother transition
      const defaultAccountData = defaultUsers[accountId];
      if (defaultAccountData) {
        console.log('Setting default account data:', defaultAccountData);
        setCurrentUserData(defaultAccountData);
      }

      // Use the switchAccount function from CoffeeContext
      if (switchAccount) {
        switchAccount(accountId)
          .then(() => {
            console.log('Account switched successfully');
            
            // After loading, ensure we still have the gear data
            if (!user || !user.gear) {
              console.log('Gear data missing from loaded user, using default gear');
              const updatedUserData = {
                ...user || {},
                ...defaultAccountData,
                gear: defaultAccountData?.gear || []
              };
              setCurrentUserData(updatedUserData);
            }
          })
          .catch(error => {
            console.error('Error switching account:', error);
            setLocalError(error.message || 'Failed to switch account');
          })
          .finally(() => {
            setRefreshing(false);
          });
      } else {
        console.error('switchAccount function not available');
        setLocalError('Switch account functionality not available');
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Error in handleSwitchAccount:', error);
      setLocalError(error.message);
      setRefreshing(false);
    }
  };

  // Handle coffee press
  const handleCoffeePress = (item) => {
    navigation.navigate('CoffeeDetail', {
      coffeeId: item.coffeeId || item.id,
      skipAuth: true
    });
  };

  // Handle recipe press
  const handleRecipePress = (item) => {
    navigation.navigate('RecipeDetail', {
      recipeId: item.id,
      coffeeId: item.coffeeId,
      coffeeName: item.coffeeName || item.name,
      roaster: item.roaster || item.roasterName,
      imageUrl: item.imageUrl,
      recipe: item,
      userId: item.userId,
      userName: item.userName,
      userAvatar: item.userAvatar
    });
  };

  // Handle user press
  const handleUserPress = (event) => {
    navigation.navigate('UserProfileBridge', {
      userId: event.userId,
      skipAuth: true
    });
  };

  // Handle tab change
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  // Filter recipes based on the selected filter
  const getFilteredRecipes = () => {
    console.log('Current account in getFilteredRecipes:', currentAccount);
    console.log('Recipe filter:', recipeFilter);
    console.log('Recipes from context:', recipes);
    
    // If user has no recipes, use mock recipes for Ivo Vilches (user1)
    let userRecipes = recipes;
    if ((!userRecipes || userRecipes.length === 0) && currentAccount === 'user1') {
      console.log('Using mock recipes for Ivo Vilches');
      userRecipes = [
        {
          id: 'recipe1',
          userId: 'user1',
          name: 'My Perfect V60 Recipe',
          coffeeName: 'Villa Rosario',
          coffeeId: 'coffee-villa-rosario',
          roaster: 'Kima Coffee',
          brewingMethod: 'V60',
          coffeeAmount: 22,
          waterAmount: 350,
          brewTime: '3:15',
          grindSize: 'Medium',
          temperature: 93,
          imageUrl: 'https://kimacoffee.com/cdn/shop/files/CE2711AA-BBF7-4D8D-942C-F9568B66871F_1296x.png?v=1741927728',
          createdAt: '2023-06-15',
          rating: 4.5,
          notes: 'Brings out the cherry notes beautifully',
          steps: ['Add 50g water for bloom', 'Wait 30 seconds', 'Pour to 150g total', 'Pour to 250g total', 'Final pour to 350g total'],
          isSaved: true,
          isCreated: true,
          creatorName: 'Ivo Vilches',
          creatorAvatar: require('../../assets/users/ivo-vilches.jpg'),
          usageCount: 24
        },
        {
          id: 'recipe2',
          userId: 'user3',
          name: 'AeroPress Concentrate',
          coffeeName: 'Red Fruits',
          coffeeId: 'coffee-red-fruits',
          roaster: 'Kima Coffee',
          brewingMethod: 'AeroPress',
          coffeeAmount: 18,
          waterAmount: 100,
          brewTime: '1:30',
          grindSize: 'Fine',
          temperature: 85,
          imageUrl: 'https://kimacoffee.com/cdn/shop/files/IMG-5851_900x.png?v=1742796767',
          createdAt: '2023-07-20',
          rating: 4.8,
          notes: 'Concentrated method that intensifies the berry notes',
          steps: ['Add coffee to inverted AeroPress', 'Add 100g water', 'Stir vigorously', 'Press after 1:30'],
          isSaved: true,
          isCreated: false,
          creatorName: 'Carlos Hernández',
          creatorAvatar: require('../../assets/users/carlos-hernandez.jpg'),
          usageCount: 8
        },
        {
          id: 'recipe3',
          userId: 'user2',
          name: 'Espresso Blend',
          coffeeName: 'Kirunga',
          coffeeId: 'coffee-kirunga',
          roaster: 'Kima Coffee',
          brewingMethod: 'Espresso',
          coffeeAmount: 20,
          waterAmount: 40,
          brewTime: '0:25',
          grindSize: 'Fine',
          temperature: 94,
          imageUrl: 'https://kimacoffee.com/cdn/shop/files/A40D5DFF-1058-43A3-9C31-F87C8482EDD8_900x.png?v=1741929637',
          createdAt: '2023-08-05',
          rating: 4.2,
          notes: 'Rich crema, intense body',
          steps: ['Grind fine', 'Tamp evenly', 'Extract for 25 seconds', 'Aim for 40ml yield'],
          isSaved: true,
          isCreated: false,
          creatorName: 'Vértigo y Calambre',
          creatorAvatar: require('../../assets/businesses/vertigo-logo.jpg'),
          usageCount: 12
        },
        {
          id: 'recipe4',
          userId: 'user1',
          name: 'Cold Brew Concentrate',
          coffeeName: 'Kuria',
          coffeeId: 'coffee-kuria',
          roaster: 'Kima Coffee',
          brewingMethod: 'Cold Brew',
          coffeeAmount: 80,
          waterAmount: 1000,
          brewTime: '12:00',
          grindSize: 'Coarse',
          temperature: 20,
          imageUrl: 'https://kimacoffee.com/cdn/shop/files/CE2711AA-BBF7-4D8D-942C-F9568B66871F_1296x.png?v=1741927728',
          createdAt: '2023-09-10',
          rating: 4.7,
          notes: 'Smooth and refreshing, great over ice',
          steps: ['Coarse grind coffee', 'Add to container with water', 'Steep for 12 hours in refrigerator', 'Filter through paper filter'],
          isSaved: false,
          isCreated: true,
          creatorName: 'Ivo Vilches',
          creatorAvatar: require('../../assets/users/ivo-vilches.jpg'),
          usageCount: 15
        },
        {
          id: 'recipe5',
          userId: 'business-toma',
          name: "Toma's Signature V60",
          coffeeName: 'Refisa G1',
          coffeeId: 'coffee-refisa-g1',
          roaster: 'Toma Café',
          brewingMethod: 'V60',
          coffeeAmount: 15,
          waterAmount: 250,
          brewTime: '2:45',
          grindSize: 'Medium-Fine',
          temperature: 92,
          imageUrl: 'https://cdn.shopify.com/s/files/1/0561/2172/1001/files/ET_REF_G1_800x.jpg?v=1738771773',
          createdAt: '2023-10-21',
          rating: 4.9,
          notes: 'Showcases the bergamot notes perfectly',
          steps: ['30g bloom for 30s', 'Pour to 150g by 1:00', 'Pour to 250g by 1:45', 'Drawdown complete by 2:45'],
          isSaved: true,
          isCreated: false,
          creatorName: 'Toma Café',
          creatorAvatar: require('../../assets/businesses/toma-logo.jpg'),
          usageCount: 32
        }
      ];
    }
    
    if (recipeFilter === 'all') {
      return userRecipes;
    } else if (recipeFilter === 'created') {
      return userRecipes.filter(recipe => recipe.userId === currentAccount || recipe.isCreated);
    } else if (recipeFilter === 'saved') {
      return userRecipes.filter(recipe => recipe.isSaved);
    }
    
    return userRecipes;
  };

  // Render coffee item
  const renderCoffeeItem = ({ item }) => {
    return (
      <View style={styles.coffeeLogCardContainer}>
        <CoffeeLogCard
          event={item}
          onCoffeePress={() => handleCoffeePress(item)}
          onRecipePress={() => handleRecipePress(item)}
          onUserPress={() => handleUserPress(item)}
          onOptionsPress={handleCoffeeOptionsPress}
          onLikePress={handleCoffeeLikePress}
          currentUserId={currentAccount}
        />
      </View>
    );
  };

  // Render collection item
  const renderCollectionItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.collectionCard}
      onPress={() => handleCoffeePress(item)}
    >
      {item.image ? (
        <Image
          source={{ uri: item.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
          style={styles.collectionCardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.collectionCardImagePlaceholder}>
          <Ionicons name="cafe-outline" size={30} color="#666666" />
        </View>
      )}
      <View style={styles.collectionCardInfo}>
        <Text style={styles.collectionCardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.collectionCardRoaster} numberOfLines={1}>{item.roaster}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render wishlist item
  const renderWishlistItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.coffeeItem, styles.coffeeItemContainer]}
      onPress={() => handleCoffeePress(item)}
    >
      <Image
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
        style={styles.coffeeImage}
      />
      <View style={styles.coffeeInfo}>
        <Text style={styles.coffeeName}>{item.name}</Text>
        <Text style={styles.coffeeRoaster}>{item.roaster}</Text>
      </View>
    </TouchableOpacity>
  );

  // Render recipe item
  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={styles.recipeCard}
      onPress={() => handleRecipePress(item)}
    >
      <View style={styles.recipeCardHeader}>
        <View style={styles.recipeCardCreator}>
          {item.creatorAvatar ? (
            <Image 
              source={typeof item.creatorAvatar === 'string' ? { uri: item.creatorAvatar } : item.creatorAvatar} 
              style={styles.recipeCreatorAvatar} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.recipeCreatorAvatarPlaceholder}>
              <Ionicons name="person" size={14} color="#999999" />
            </View>
          )}
          <Text style={styles.recipeCreatorName} numberOfLines={1}>
            {item.creatorName || item.userName || 'Anonymous'}
          </Text>
        </View>
        <View style={styles.brewMethodTag}>
          <Text style={styles.brewMethodTagText}>{item.brewingMethod || item.method}</Text>
        </View>
      </View>
      
      <View style={styles.recipeCardInfo}>
        <Text style={styles.recipeCardName} numberOfLines={2}>{item.name || item.coffeeName}</Text>
        <Text style={styles.recipeCardCoffee} numberOfLines={1}>{item.coffeeName}</Text>
        <Text style={styles.recipeCardRoaster} numberOfLines={1}>{item.roaster}</Text>
        
        <View style={styles.recipeCardStats}>
          <View style={styles.recipeCardDetail}>
            <Text style={styles.recipeCardDetailValue}>{item.coffeeAmount || 18}g</Text>
            <Text style={styles.recipeCardDetailLabel}>Coffee</Text>
          </View>
          <View style={styles.recipeCardDetail}>
            <Text style={styles.recipeCardDetailValue}>{item.waterAmount || 300}ml</Text>
            <Text style={styles.recipeCardDetailLabel}>Water</Text>
          </View>
          <View style={styles.recipeCardDetail}>
            <Text style={styles.recipeCardDetailValue}>{item.brewTime || "3:00"}</Text>
            <Text style={styles.recipeCardDetailLabel}>Time</Text>
          </View>
        </View>
        
        <View style={styles.recipeUsageStats}>
          <Ionicons name="repeat" size={14} color="#666666" />
          <Text style={styles.recipeUsageText}>
            Used {item.usageCount || Math.floor(Math.random() * 20) + 1} times
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'coffee' && styles.activeTabButton]}
        onPress={() => handleTabChange('coffee')}
      >
        <Text style={[styles.tabText, activeTab === 'coffee' && styles.activeTabText]}>Activity</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === (isBusinessAccount ? 'shop' : 'collection') && styles.activeTabButton]}
        onPress={() => handleTabChange(isBusinessAccount ? 'shop' : 'collection')}
      >
        <Text style={[styles.tabText, activeTab === (isBusinessAccount ? 'shop' : 'collection') && styles.activeTabText]}>
          {isBusinessAccount ? 'Shop' : 'Collection'}
        </Text>
      </TouchableOpacity>
      
      {!isBusinessAccount && (
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'wishlist' && styles.activeTabButton]}
          onPress={() => handleTabChange('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>Wishlist</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'recipes' && styles.activeTabButton]}
        onPress={() => handleTabChange('recipes')}
      >
        <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cafe-outline" size={50} color="#CCCCCC" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return <LoadingView insets={insets} />;
    }

    if (combinedError) {
      return <ErrorView error={combinedError} insets={insets} onRetry={handleRefresh} />;
    }

    return (
      <ScrollView 
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Profile Header - Avatar, name, stats */}
        <View style={[styles.profileHeader]}>
          <Image 
            source={typeof avatarUrl === 'string' ? { uri: avatarUrl } : avatarUrl} 
            style={[
              styles.avatar,
              isBusinessAccount ? styles.businessAvatar : styles.userAvatar
            ]} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
        </View>
        
        {/* Gear Module - showing user's gear */}
        {renderGearModule()}
        
        {/* Tabs for collection/wishlist/recipes */}
        {renderTabs()}
        
        {/* Tab Content */}
        {activeTab === 'coffee' && (
          <View style={styles.sectionContainer}>
            {coffeeEvents && coffeeEvents.length > 0 ? (
              <FlatList
                data={coffeeEvents}
                renderItem={renderCoffeeItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              renderEmptyState('No activity yet')
            )}
          </View>
        )}
        
        {activeTab === (isBusinessAccount ? 'shop' : 'collection') && (
          <View style={styles.sectionContainer}>
            {coffeeCollection && coffeeCollection.length > 0 ? (
              <View style={styles.collectionSection}>
                <FlatList
                  data={coffeeCollection}
                  renderItem={renderCollectionItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.collectionCardRow}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16}}
                />
              </View>
            ) : (
              renderEmptyState(`No ${isBusinessAccount ? 'products' : 'coffees'} in ${isBusinessAccount ? 'shop' : 'collection'} yet`)
            )}
          </View>
        )}
        
        {activeTab === 'wishlist' && (
          <View style={styles.sectionContainer}>
            {coffeeWishlist && coffeeWishlist.length > 0 ? (
              <FlatList
                data={coffeeWishlist}
                renderItem={renderWishlistItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              renderEmptyState('No logs in wishlist yet')
            )}
          </View>
        )}
        
        {activeTab === 'recipes' && (
          <View style={styles.sectionContainer}>
            {console.log('Rendering recipes tab')}
            <View style={styles.collectionSection}>
              <View style={styles.recipeFilterContainer}>
                <View style={styles.segmentedControl}>
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      recipeFilter === 'all' && styles.segmentActive
                    ]}
                    onPress={() => setRecipeFilter('all')}
                  >
                    <Text style={[
                      styles.segmentText,
                      recipeFilter === 'all' && styles.segmentTextActive
                    ]}>All</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      recipeFilter === 'created' && styles.segmentActive
                    ]}
                    onPress={() => setRecipeFilter('created')}
                  >
                    <Text style={[
                      styles.segmentText,
                      recipeFilter === 'created' && styles.segmentTextActive
                    ]}>Mine</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.segment,
                      recipeFilter === 'saved' && styles.segmentActive
                    ]}
                    onPress={() => setRecipeFilter('saved')}
                  >
                    <Text style={[
                      styles.segmentText,
                      recipeFilter === 'saved' && styles.segmentTextActive
                    ]}>Saved</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <FlatList
                data={getFilteredRecipes()}
                renderItem={renderRecipeItem}
                keyExtractor={(item, index) => item.id || `recipe-${index}`}
                numColumns={2}
                columnWrapperStyle={styles.collectionCardRow}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                contentContainerStyle={{paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16}}
                ListEmptyComponent={() => (
                  <View style={styles.emptyFilterContainer}>
                    <Text style={styles.emptyText}>
                      No {recipeFilter === 'created' ? 'created' : recipeFilter === 'saved' ? 'saved' : ''} recipes found
                    </Text>
                  </View>
                )}
              />
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // Handle options press (3-dot menu)
  const handleOptionsPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Edit Profile', 'Settings', 'Sign Out', 'Cancel'],
          cancelButtonIndex: 3,
          userInterfaceStyle: 'light'
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Edit Profile
            // For now, just show an alert
            Alert.alert('Coming Soon', 'Edit Profile functionality will be available soon.');
          } else if (buttonIndex === 1) {
            // Settings
            Alert.alert('Coming Soon', 'Settings functionality will be available soon.');
          } else if (buttonIndex === 2) {
            // Sign Out
            Alert.alert('Coming Soon', 'Sign Out functionality will be available soon.');
          }
        }
      );
    } else {
      // For Android, we would use a custom modal or menu
      Alert.alert(
        'Options',
        'Choose an option',
        [
          { text: 'Edit Profile', onPress: () => Alert.alert('Coming Soon', 'Edit Profile functionality will be available soon.') },
          { text: 'Settings', onPress: () => Alert.alert('Coming Soon', 'Settings functionality will be available soon.') },
          { text: 'Sign Out', onPress: () => Alert.alert('Coming Soon', 'Sign Out functionality will be available soon.') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  // Handle gear item press
  const handleGearPress = (item) => {
    console.log('Navigating to GearDetailScreen with gear:', item);
    navigation.navigate('GearDetail', {
      gearName: item
    });
  };

  // Render account modal - with added "Create Account" option
  const renderAccountModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[
          styles.modalContent,
          { paddingBottom: insets.bottom + 20 }
        ]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Account</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={accounts || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.accountItem}
                onPress={() => handleSwitchAccount(item.id)}
              >
                <Image
                  source={typeof item.userAvatar === 'string' ? { uri: item.userAvatar } : item.userAvatar}
                  style={[styles.accountAvatar, defaultUsers[item.id]?.isBusinessAccount && styles.businessAvatar]}
                />
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{item.userName || item.name}</Text>
                  <Text style={styles.accountEmail}>{item.email}</Text>
                </View>
                {currentAccount === item.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                )}
              </TouchableOpacity>
            )}
            ListFooterComponent={
              <TouchableOpacity
                style={styles.createAccountItem}
                onPress={() => {
                  setModalVisible(false);
                  Alert.alert('Coming Soon', 'Create Account functionality will be available soon.');
                }}
              >
                <View style={styles.createAccountCircle}>
                  <Ionicons name="add" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.createAccountText}>Create Account</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </Modal>
  );

  // Render the gear module
  const renderGearModule = () => {
    // Make sure we always have gear data by using the default user's gear as a fallback
    const gearToDisplay = userGear && userGear.length > 0 
      ? userGear 
      : defaultUsers[currentAccount]?.gear || [];
    
    const wishlistToDisplay = currentUserData?.gearWishlist || defaultUsers[currentAccount]?.gearWishlist || [];
    const hasGear = gearToDisplay.length > 0;
    const hasWishlist = wishlistToDisplay.length > 0;
    
    const handleGearWishlistNavigate = () => {
      // Navigate to gear wishlist screen
      navigation.navigate('GearWishlist', {
        userId: currentAccount, 
        userName: displayName,
        isCurrentUser: true
      });
    };
    
    console.log('RENDERING GEAR MODULE - GEAR TO DISPLAY:', gearToDisplay);
    console.log('RENDERING GEAR MODULE - WISHLIST TO DISPLAY:', wishlistToDisplay);
    
    return (
      <View style={styles.gearContainer}>
        <View style={styles.gearTitleRow}>
          <Text style={styles.gearTitle}>My gear</Text>
          
          {/* Always show wishlist link, with different text based on content */}
          <TouchableOpacity onPress={handleGearWishlistNavigate}>
            <Text style={styles.gearWishlistToggle}>
              {hasWishlist ? 'Wishlist' : 'View Wishlist'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gearScrollContainer}
        >
          {gearToDisplay.length > 0 ? (
            gearToDisplay.map((item, index) => {
              console.log('RENDERING GEAR ITEM:', item);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.gearItem}
                  onPress={() => handleGearPress(item)}
                >
                  <Text style={styles.gearItemText}>{item}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyGearText}>
              No gear added yet
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  // Update current user data when user changes
  useEffect(() => {
    console.log('User data changed:', user);
    if (user) {
      // If user data is loaded but missing gear, merge with default user gear
      const defaultUserForAccount = defaultUsers[currentAccount];
      if (!user.gear && defaultUserForAccount && defaultUserForAccount.gear) {
        console.log('User data loaded but missing gear, using default gear');
        const mergedUserData = {
          ...user,
          ...defaultUserForAccount,
          userName: user.userName || defaultUserForAccount.userName,
          userAvatar: user.userAvatar || defaultUserForAccount.userAvatar,
          userHandle: user.userHandle || defaultUserForAccount.userHandle,
          location: user.location || defaultUserForAccount.location,
          gear: defaultUserForAccount.gear,
          gearWishlist: defaultUserForAccount.gearWishlist
        };
        setCurrentUserData(mergedUserData);
      } else {
        setCurrentUserData(user);
      }
    } else if (currentAccount && accounts && accounts.length > 0) {
      // If user is null but we have an account ID, find the account data and merge with defaults
      const accountData = accounts.find(acc => acc.id === currentAccount);
      const defaultUserForAccount = defaultUsers[currentAccount];
      
      if (accountData && defaultUserForAccount) {
        console.log('Found account data:', accountData);
        
        // Merge account data with default data, with account data taking precedence
        const mergedAccountData = {
          ...defaultUserForAccount, 
          ...accountData,
          // Ensure these critical fields are present
          gear: accountData.gear || defaultUserForAccount.gear || [],
          gearWishlist: accountData.gearWishlist || defaultUserForAccount.gearWishlist || [],
          userHandle: accountData.userHandle || defaultUserForAccount.userHandle,
          location: accountData.location || defaultUserForAccount.location
        };
        setCurrentUserData(mergedAccountData);
      } else if (defaultUserForAccount) {
        // If we only have default data, use that
        setCurrentUserData(defaultUserForAccount);
      }
    }
  }, [user, currentAccount, accounts]);

  // Handle coffee options
  const handleCoffeeOptionsPress = (event, action) => {
    console.log('Coffee options action:', action, 'for event:', event.id);
    if (action === 'delete') {
      // Use the context function to delete the coffee log
      if (removeCoffeeEvent) {
        removeCoffeeEvent(event.id);
      }
      // No need for Alert since Toast is shown by the component
    } else if (action === 'public' || action === 'private') {
      // Toggle visibility status
      console.log(`Changed visibility to ${action}`);
      // Note: Toast is handled by the CoffeeLogCard component
    } else if (action === 'edit') {
      // Navigate to edit screen
      navigation.navigate('EditCoffeeLog', { eventId: event.id });
    }
  };

  // Handle coffee like
  const handleCoffeeLikePress = (eventId, isLiked) => {
    console.log('Coffee like:', eventId, isLiked);
    // Call API to like/unlike the coffee log
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navigation Bar */}
      <View style={[styles.topNavBar, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.usernameContainer}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.usernameText}>@{userHandle}</Text>
          <Ionicons name="chevron-down" size={16} color="#000000" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={handleOptionsPress}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {renderContent()}
      {renderAccountModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 5,
  },
  optionsButton: {
    padding: 8,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userAvatar: {
    borderRadius: 40,
  },
  businessAvatar: {
    borderRadius: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
  },
  gearButton: {
    padding: 8,
  },
  contentContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 10,
  },
  coffeeItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  coffeeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  coffeeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  coffeeRoaster: {
    fontSize: 14,
    color: '#666666',
  },
  removeButton: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  recipeItem: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  recipeMethod: {
    fontSize: 14,
    color: '#666666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 5,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  accountAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  accountEmail: {
    fontSize: 14,
    color: '#666666',
  },
  createAccountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
  },
  createAccountCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  createAccountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileHeader: {
    padding: 16,
    paddingBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    height: 48,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  sectionContainer: {
    padding: 0,
  },
  gearContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 8,
    paddingRight: 0,
    paddingBottom: 12,
  },
  gearTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingRight: 16,
  },
  gearTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  gearWishlistToggle: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    padding: 0,
  },
  gearScrollContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingLeft: 0,
    paddingRight: 16,
  },
  gearItem: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearIcon: {
    marginRight: 6,
  },
  gearItemText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  emptyGearText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  collectionSection: {
    paddingBottom: 16,
  },
  collectionCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
  },
  collectionCardImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  collectionCardImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  collectionCardInfo: {
    padding: 12,
  },
  collectionCardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  collectionCardRoaster: {
    fontSize: 12,
    color: '#666666',
  },
  collectionCardRow: {
    justifyContent: 'space-between',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    // No additional styling needed
  },
  recipeFilterContainer: {
    position: 'relative',
    margin: 16,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  segmentedControl: {
    flexDirection: 'row',
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
  emptyFilterContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeDetails: {
    marginTop: 4,
  },
  recipeDetailText: {
    fontSize: 12,
    color: '#777777',
  },
  recipeCard: {
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  recipeCardCreator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recipeCreatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: '#F5F5F7',
  },
  recipeCreatorAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCreatorName: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
  },
  brewMethodTag: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  brewMethodTagText: {
    fontSize: 10,
    color: '#333333',
    fontWeight: '500',
  },
  recipeCardInfo: {
    padding: 10,
  },
  recipeCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    height: 36,
  },
  recipeCardCoffee: {
    fontSize: 12,
    color: '#333333',
    marginBottom: 2,
  },
  recipeCardRoaster: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
  },
  recipeCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F7',
  },
  recipeCardDetail: {
    alignItems: 'center',
  },
  recipeCardDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  recipeCardDetailLabel: {
    fontSize: 10,
    color: '#888888',
  },
  recipeUsageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recipeUsageText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 4,
  },
}); 