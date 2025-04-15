import React, { useState, useContext, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import { supabase } from '../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import eventEmitter from '../utils/EventEmitter';
import CoffeeLogCard from '../components/CoffeeLogCard';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen({ route }) {
  const { skipAuth } = route.params || { skipAuth: false };
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { 
    coffeeCollection, 
    coffeeWishlist, 
    favorites,
    coffeeEvents,
    recipes,
    loadData,
    addToCollection,
    removeFromCollection,
    addToWishlist,
    removeFromWishlist,
    toggleFavorite,
    setCoffeeCollection,
    setCoffeeWishlist
  } = useCoffee();
  
  // Mock user data
  const [user] = useState({
    email: 'coffee.lover@example.com',
    username: 'Coffee Lover',
    user_metadata: {
      avatar_url: null,
      gear: [
        'Hario V60',
        'Comandante C40',
        'Fellow Stagg EKG',
        'Acaia Pearl Scale'
      ]
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newGear, setNewGear] = useState('');
  const [userGear, setUserGear] = useState(user.user_metadata.gear);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize user gear from metadata
    if (user?.user_metadata?.gear) {
      setUserGear(user.user_metadata.gear);
    }
    
    // Listen for the switchToCollectionTab event
    const handleSwitchToCollectionTab = () => {
      setActiveTab('collection');
    };
    
    // Add event listener
    eventEmitter.on('switchToCollectionTab', handleSwitchToCollectionTab);
    
    // Clean up event listener on unmount
    return () => {
      eventEmitter.off('switchToCollectionTab', handleSwitchToCollectionTab);
    };
  }, []);

  const addGear = () => {
    if (newGear.trim() === '') return;
    
    const updatedGear = [...userGear, newGear.trim()];
    setUserGear(updatedGear);
    setNewGear('');
    
    // Update local user state
    user.user_metadata.gear = updatedGear;
  };

  const removeGear = (index) => {
    const updatedGear = [...userGear];
    updatedGear.splice(index, 1);
    setUserGear(updatedGear);
    
    // Update local user state
    user.user_metadata.gear = updatedGear;
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleCoffeePress = (event) => {
    // Navigate to coffee detail screen with mock data
    navigation.navigate('CoffeeDetail', { 
      coffeeId: event.coffeeId,
      skipAuth: true // Add flag to skip authentication
    });
  };

  const handleRecipePress = (event) => {
    // Navigate to recipe detail screen with mock data
    navigation.navigate('RecipeDetail', { 
      recipeId: event.recipeId,
      skipAuth: true // Add flag to skip authentication
    });
  };

  const handleUserPress = (event) => {
    // Navigate to user profile with mock data
    navigation.navigate('Profile', { 
      userId: event.userId,
      skipAuth: true // Add flag to skip authentication
    });
  };

  const renderCoffeeItem = ({ item }) => {
    // Determine if the item is in favorites
    const isFavorite = favorites.includes(item.name);
    
    // Determine if this item is in the collection (not wishlist)
    const isInCollection = coffeeCollection.some(coffee => coffee.id === item.id);
    
    return (
      <TouchableOpacity 
        style={styles.coffeeItem}
        onPress={() => handleCoffeePress({ coffeeId: item.id })}
      >
        <View style={styles.coffeeImageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: item.image }} 
              style={styles.coffeeImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="cafe" size={24} color="#000000" />
            </View>
          )}
        </View>
        <View style={styles.coffeeInfo}>
          <Text style={styles.coffeeName}>{item.name}</Text>
          <Text style={styles.coffeeRoaster}>{item.roaster}</Text>
        </View>
        {isInCollection && (
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.name)}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#FF3B30" : "#000000"} 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <FlatList
            data={coffeeEvents.filter(event => event.userId === 'currentUser')}
            renderItem={({ item }) => (
              <CoffeeLogCard 
                event={item}
                onCoffeePress={handleCoffeePress}
                onRecipePress={handleRecipePress}
                onUserPress={handleUserPress}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent('No activity yet', 'journal')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
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
            renderItem={renderCoffeeItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent('Your collection is empty', 'cafe')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
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
            renderItem={renderCoffeeItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent('Your wishlist is empty', 'heart')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#000000']}
                tintColor="#000000"
              />
            }
          />
        );
      case 'recipes':
        return (
          <FlatList
            data={recipes.filter(recipe => recipe.userId !== 'currentUser')}
            renderItem={renderRecipeItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmptyComponent('No saved recipes yet', 'book')}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
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

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.coffeeItem}
      onPress={() => handleRecipePress({ recipeId: item.id })}
    >
      <View style={styles.coffeeImageContainer}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.coffeeImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="cafe" size={24} color="#000000" />
          </View>
        )}
      </View>
      <View style={styles.coffeeInfo}>
        <Text style={styles.coffeeName}>{item.name}</Text>
        <Text style={styles.coffeeRoaster}>{item.method}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          {user?.user_metadata?.avatar_url ? (
            <Image 
              source={{ uri: user.user_metadata.avatar_url }} 
              style={styles.profileImage} 
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#000000" />
            </View>
          )}
        </View>
        <Text style={styles.username}>{user?.username || 'Coffee Lover'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
        </TouchableOpacity>
        
        {showMenu && (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="#000000" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                // Implement sign out logic
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#000000" />
              <Text style={styles.menuItemText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.gearContainer}>
        <Text style={styles.gearTitle}>My Coffee Gear</Text>
        {userGear.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gearList}
          >
            {userGear.map((gear, index) => (
              <View key={index} style={styles.gearItem}>
                <Ionicons name="cafe" size={16} color="#000000" />
                <Text style={styles.gearText}>{gear}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyGearText}>Edit your profile to add gear.</Text>
        )}
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'collection' && styles.activeTab]}
          onPress={() => setActiveTab('collection')}
        >
          <Text style={[styles.tabText, activeTab === 'collection' && styles.activeTabText]}>
            Collection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'wishlist' && styles.activeTab]}
          onPress={() => setActiveTab('wishlist')}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
            Wishlist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
          onPress={() => setActiveTab('recipes')}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
            Recipes
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderEmptyComponent = (message, icon) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon} size={50} color="#000000" style={styles.emptyIcon} />
      <Text style={styles.emptyText}>{message}</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'collection' 
          ? 'Add coffees to your collection to see them here. Logged coffees will appear here too.'
          : activeTab === 'wishlist'
            ? 'Add coffees to your wishlist to see them here'
            : activeTab === 'recipes'
              ? 'Save recipes from other users to see them here'
              : 'Log your coffee brewing sessions to see them here'
        }
      </Text>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSectionTitle}>Coffee Gear</Text>
          <Text style={styles.modalSectionSubtitle}>Add your coffee brewing equipment</Text>
          
          <View style={styles.addGearContainer}>
            <TextInput
              style={styles.gearInput}
              placeholder="Add gear (e.g., V60, AeroPress)"
              value={newGear}
              onChangeText={setNewGear}
            />
            <TouchableOpacity 
              style={styles.addGearButton}
              onPress={addGear}
            >
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.gearListContainer}>
            {userGear.map((gear, index) => (
              <View key={index} style={styles.gearListItem}>
                <Ionicons name="cafe" size={20} color="#000000" />
                <Text style={styles.gearListItemText}>{gear}</Text>
                <TouchableOpacity 
                  style={styles.removeGearButton}
                  onPress={() => removeGear(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => setShowEditModal(false)}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {renderTabContent()}
      {renderEditModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0,
    position: 'relative',
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  menuButton: {
    position: 'absolute',
    top: 0,
    right: 20,
    padding: 8,
    zIndex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  gearContainer: {
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderBottomWidth: 0,
  },
  gearTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  gearList: {
    paddingRight: 16,
  },
  gearItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  gearText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 4,
  },
  emptyGearText: {
    fontSize: 14,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    minHeight: 300,
  },
  coffeeItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  coffeeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coffeeInfo: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  coffeeRoaster: {
    fontSize: 14,
    color: '#666',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
  },
  authButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchAuthButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
  },
  switchAuthText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  modalSectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  addGearContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  gearInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
  },
  addGearButton: {
    width: 40,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearListContainer: {
    maxHeight: 200,
    marginBottom: 20,
  },
  gearListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gearListItemText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
  },
  removeGearButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 