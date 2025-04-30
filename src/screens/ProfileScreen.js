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
    removeFromWishlist 
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
  const handleRecipePress = (recipeId, coffeeId, coffeeName, roaster, imageUrl, userId, userName, userAvatar) => {
    navigation.navigate('RecipeDetail', {
      recipeId,
      coffeeId,
      coffeeName,
      roaster,
      imageUrl,
      userId,
      userName,
      userAvatar
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

  // Render coffee item
  const renderCoffeeItem = ({ item }) => {
    return (
      <View style={styles.coffeeLogCardContainer}>
        <CoffeeLogCard
          event={item}
          onCoffeePress={() => handleCoffeePress(item)}
          onRecipePress={() => handleRecipePress(
            `recipe-${item.id}`,
            item.coffeeId,
            item.coffeeName,
            item.roaster,
            item.imageUrl,
            item.userId,
            item.userName,
            item.userAvatar
          )}
          onUserPress={() => handleUserPress(item)}
        />
      </View>
    );
  };

  // Render collection item
  const renderCollectionItem = ({ item }) => (
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
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCollection && removeFromCollection(item.id)}
      >
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
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
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromWishlist && removeFromWishlist(item.id)}
      >
        <Ionicons name="close-circle" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render recipe item
  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.recipeItem, styles.coffeeItemContainer]}
      onPress={() => handleRecipePress(
        item.id,
        item.coffeeId,
        item.name,
        item.roaster,
        item.imageUrl,
        item.userId,
        item.userName,
        item.userAvatar
      )}
    >
      <Image
        source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1447933601403-0c6688de566e' }}
        style={styles.recipeImage}
      />
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{item.name || item.coffeeName}</Text>
        <Text style={styles.recipeMethod}>{item.method || item.brewingMethod}</Text>
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
              <FlatList
                data={coffeeCollection}
                renderItem={renderCollectionItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              renderEmptyState(`No ${isBusinessAccount ? 'products' : 'logs'} in ${isBusinessAccount ? 'shop' : 'collection'} yet`)
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
            {recipes && recipes.length > 0 ? (
              <FlatList
                data={recipes}
                renderItem={renderRecipeItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              renderEmptyState('No recipes saved yet')
            )}
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
        
        <View style={styles.gearGrid}>
          {gearToDisplay.length > 0 ? (
            gearToDisplay.map((item, index) => {
              console.log('RENDERING GEAR ITEM:', item);
              return (
                <TouchableOpacity 
                  key={index} 
                  style={styles.gearItem}
                  onPress={() => handleGearPress(item)}
                >
                  <Ionicons name="hardware-chip-outline" size={16} color="#666666" style={styles.gearIcon} />
                  <Text style={styles.gearItemText}>{item}</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyGearText}>
              No gear added yet
            </Text>
          )}
        </View>
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
  },
  gearTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gearTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  gearWishlistToggle: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '500',
    padding: 5,
  },
  gearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gearItem: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
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
}); 