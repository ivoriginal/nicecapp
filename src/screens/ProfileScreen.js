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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
      userAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      email: 'ivo.vilches@example.com',
      location: 'Santiago, Chile'
    },
    'user2': {
      id: 'user2',
      userName: 'Vértigo y Calambre',
      userAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      email: 'contacto@vertigoycalambre.com',
      location: 'Buenos Aires, Argentina' 
    },
    'user3': {
      id: 'user3',
      userName: 'Carlos Hernández',
      userAvatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      email: 'carlos.hernandez@example.com',
      location: 'New York, USA'
    }
  };
  
  // Use account-specific defaults when user data isn't available
  const defaultUser = defaultUsers[currentAccount] || defaultUsers['user1'];

  // Selected account data - prefer user data from context, fall back to defaults
  const [currentUserData, setCurrentUserData] = useState(defaultUser);
  const userData = user || currentUserData;
  const displayName = userData?.userName || userData?.name || 'Guest';
  const avatarUrl = userData?.userAvatar || userData?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg';
  const location = userData?.location || 'Unknown location';

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
      
      // First update the local account ID
      setLocalCurrentAccount(accountId);
      
      // Immediately set default user data for smoother transition
      const defaultAccountData = defaultUsers[accountId];
      if (defaultAccountData) {
        setCurrentUserData(defaultAccountData);
      }

      // Find the account data directly
      const selectedAccount = accounts.find(a => a.id === accountId);
      if (!selectedAccount) {
        console.error('Account not found:', accountId);
        setLocalError(`Account ${accountId} not found`);
        setRefreshing(false);
        return;
      }

      console.log('Selected account:', selectedAccount);
      
      // Force a direct re-initialization with the new account
      (async () => {
        try {
          console.log('Direct loading data for account:', accountId);
          
          // Load the data without using switchAccount
          if (loadData) {
            await loadData(accountId);
            console.log('Data loaded for new account');
          } else {
            throw new Error('loadData function not available');
          }
        } catch (error) {
          console.error('Error loading data for new account:', error);
          setLocalError(error.message || 'Failed to load account data');
        } finally {
          setRefreshing(false);
        }
      })();
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
        style={[styles.tab, activeTab === 'coffee' && styles.activeTab]}
        onPress={() => handleTabChange('coffee')}
      >
        <Text style={[styles.tabText, activeTab === 'coffee' && styles.activeTabText]}>Coffee Logs</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'collection' && styles.activeTab]}
        onPress={() => handleTabChange('collection')}
      >
        <Text style={[styles.tabText, activeTab === 'collection' && styles.activeTabText]}>Collection</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
        onPress={() => handleTabChange('wishlist')}
      >
        <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>Wishlist</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
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
    switch (activeTab) {
      case 'coffee':
        return (
          <FlatList
            data={coffeeEvents}
            renderItem={renderCoffeeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={() => renderEmptyState('No coffee logs yet')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#000000']}
                tintColor="#000000"
              />
            }
          />
        );
      case 'collection':
        return (
          <FlatList
            data={coffeeCollection}
            renderItem={renderCollectionItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={() => renderEmptyState('No coffees in collection')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#000000']}
                tintColor="#000000"
              />
            }
          />
        );
      case 'wishlist':
        return (
          <FlatList
            data={coffeeWishlist}
            renderItem={renderWishlistItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={() => renderEmptyState('No coffees in wishlist')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#000000']}
                tintColor="#000000"
              />
            }
          />
        );
      case 'recipes':
        return (
          <FlatList
            data={recipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            ListEmptyComponent={() => renderEmptyState('No recipes yet')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#000000']}
                tintColor="#000000"
              />
            }
          />
        );
      default:
        return null;
    }
  };

  // Render account modal
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
                  source={{ uri: item.userAvatar || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                  style={styles.accountAvatar}
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
          />
        </View>
      </View>
    </Modal>
  );

  // Update current user data when user changes
  useEffect(() => {
    console.log('User data changed:', user);
    if (user) {
      setCurrentUserData(user);
    } else if (currentAccount && accounts) {
      // If user is null but we have an account ID, find the account data
      const accountData = accounts.find(acc => acc.id === currentAccount);
      if (accountData) {
        console.log('Found account data:', accountData);
        setCurrentUserData(accountData);
      }
    }
  }, [user, currentAccount, accounts]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userLocation}>{location}</Text>
          </View>

          <TouchableOpacity
            style={styles.gearButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="settings-outline" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{coffeeEvents?.length || 0}</Text>
            <Text style={styles.statLabel}>Coffee Logs</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{coffeeCollection?.length || 0}</Text>
            <Text style={styles.statLabel}>Collection</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{coffeeWishlist?.length || 0}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </View>
        </View>
      </View>

      {renderTabs()}
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    height: 48,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
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
    paddingTop: 20,
    paddingHorizontal: 15,
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
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
  coffeeLogCardContainer: {
    marginHorizontal: 15,
    marginVertical: 5,
  },
  coffeeItemContainer: {
    marginHorizontal: 15,
    marginVertical: 5,
  },
}); 