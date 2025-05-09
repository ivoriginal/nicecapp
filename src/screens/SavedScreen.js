import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoffee } from '../context/CoffeeContext';
import RecipeCard from '../components/RecipeCard';
import { useNavigation, useRoute } from '@react-navigation/native';
import mockRecipes from '../data/mockRecipes.json';
import mockCoffees from '../data/mockCoffees.json';
import mockUsers from '../data/mockUsers.json';
import AppImage from '../components/common/AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const { coffeeCollection, coffeeWishlist, recipes, removeFromWishlist, loadSavedRecipes } = useCoffee();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Force default tab to be coffee
  const [activeTab, setActiveTab] = useState(route.params?.type || 'coffee');
  const [refreshing, setRefreshing] = useState(false);
  const [savedItems, setSavedItems] = useState([]);

  // Format wishlist items for rendering
  const savedCoffees = Array.isArray(coffeeWishlist) ? coffeeWishlist : [];
  const savedRecipes = recipes.filter(recipe => recipe.isSaved);
  
  console.log('Saved Coffees:', savedCoffees);
  console.log('Saved Recipes:', savedRecipes);

  // Remove navigation header border bottom
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
    });

    // Initial load of saved items based on the default activeTab
    if (!route.params?.savedItems) {
      console.log('Initial load with activeTab:', activeTab);
      updateSavedItemsForTab(activeTab);
    }
  }, []);

  // Use route params to determine what to display
  useEffect(() => {
    const { savedItems: routeItems, type } = route.params || {};
    
    // Set active tab if specified in route params
    if (type) {
      setActiveTab(type);
    }
    
    // Set saved items based on route params or fallback data
    if (routeItems && routeItems.length > 0) {
      console.log('Setting saved items from route params:', routeItems.length);
      setSavedItems(routeItems);
    } else {
      // Always update saved items based on whatever tab is currently active
      updateSavedItemsForTab(type || activeTab);
    }
  }, [route.params]);

  // Separate effect to update items when tab changes
  useEffect(() => {
    if (!route.params?.savedItems) {
      console.log('Tab changed to:', activeTab);
      updateSavedItemsForTab(activeTab);
    }
  }, [activeTab]);

  const updateSavedItemsForTab = (tab) => {
    if (tab === 'coffee') {
      // First check if we have coffeeWishlist from context
      if (coffeeWishlist && coffeeWishlist.length > 0) {
        console.log(`Setting ${coffeeWishlist.length} coffee items from wishlist`);
        setSavedItems(coffeeWishlist);
        return;
      }
      
      // If no wishlist, the screen should show empty state
      setSavedItems([]);
    } else if (tab === 'recipes') {
      // Always use the filtered saved recipes from mock data
      console.log(`Setting ${savedRecipes.length} saved recipe items`);
      setSavedItems(savedRecipes);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedRecipes();
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleCoffeePress = (item) => {
    navigation.navigate('CoffeeDetail', {
      coffeeId: item.coffeeId || item.id,
      skipAuth: true
    });
  };

  const handleRecipePress = (recipeId) => {
    const recipe = savedRecipes.find(r => r.id === recipeId);
    if (recipe) {
      navigation.navigate('RecipeDetail', {
        recipeId: recipe.id,
        coffeeId: recipe.coffeeId,
        coffeeName: recipe.coffeeName,
        recipe: recipe
      });
    }
  };

  const handleUserPress = (event) => {
    navigation.navigate('UserProfileBridge', {
      userId: event.userId,
      skipAuth: true
    });
  };

  const handleRemoveCoffee = (coffeeId) => {
    removeFromWishlist(coffeeId);
  };

  // Simple coffee item renderer
  const renderSavedCoffeeItem = ({ item }) => {
    // Get the full coffee data from mockCoffees if needed
    const coffeeData = item.roaster ? item : 
      mockCoffees.coffees.find(coffee => coffee.id === item.id || coffee.id === item.coffeeId);
    
    return (
      <TouchableOpacity 
        style={styles.coffeeItemContainer}
        onPress={() => handleCoffeePress(coffeeData || item)}
      >
        <View style={styles.coffeeImageContainer}>
          <AppImage 
            source={coffeeData?.image || coffeeData?.imageUrl || item.image || item.imageUrl} 
            style={styles.coffeeImage}
            placeholder="coffee"
          />
        </View>
        <View style={styles.coffeeInfo}>
          <Text style={styles.coffeeName}>{coffeeData?.name || item.name}</Text>
          <Text style={styles.coffeeRoaster}>{coffeeData?.roaster || item.roaster || "Unknown roaster"}</Text>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveCoffee(item.id)}
        >
          <Ionicons name="close-circle" size={20} color="#666666" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderRecipeItem = ({ item }) => (
    <RecipeCard 
      recipe={item}
      onPress={() => handleRecipePress(item.id)}
      onUserPress={() => handleUserPress(item)}
      showCoffeeInfo={true}
      style={styles.recipeCard}
    />
  );

  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={50} color="#CCCCCC" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'coffee' && styles.activeTab]}
          onPress={() => setActiveTab('coffee')}
        >
          <Text style={[styles.tabText, activeTab === 'coffee' && styles.activeTabText]}>
            Coffee
          </Text>
          {activeTab === 'coffee' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipes' && styles.activeTab]}
          onPress={() => setActiveTab('recipes')}
        >
          <Text style={[styles.tabText, activeTab === 'recipes' && styles.activeTabText]}>
            Recipes
          </Text>
          {activeTab === 'recipes' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'coffee' ? (
        savedCoffees.length > 0 ? (
          <FlatList
            data={savedCoffees}
            renderItem={renderSavedCoffeeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.emptyContainer}
          >
            <Ionicons 
              name="cafe-outline" 
              size={60} 
              color="#CCCCCC" 
            />
            <Text style={styles.emptyTitle}>No Saved Coffees</Text>
            <Text style={styles.emptyMessage}>
              Coffee you save will appear here. Tap the Save button on any coffee to add it to your saved list.
            </Text>
          </ScrollView>
        )
      ) : (
        savedRecipes.length > 0 ? (
          <FlatList
            data={savedRecipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            numColumns={2}
            columnWrapperStyle={styles.recipeRow}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.emptyContainer}
          >
            <Ionicons 
              name="book-outline" 
              size={60} 
              color="#CCCCCC" 
            />
            <Text style={styles.emptyTitle}>No Saved Recipes</Text>
            <Text style={styles.emptyMessage}>
              Recipes you save will appear here. Tap the Save button on any recipe to add it.
            </Text>
          </ScrollView>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 0,
  },
  tabText: {
    fontSize: 16,
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: '#000000',
  },
  sectionContainer: {
    paddingVertical: 4,
  },
  recipeSectionContainer: {
    padding: 16,
  },
  recipeListContainer: {
    width: '100%',
  },
  coffeeItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingVertical: 8,
  },
  coffeeImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
  },
  coffeeInfo: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  coffeeRoaster: {
    fontSize: 14,
    color: '#666666',
  },
  removeButton: {
    padding: 8,
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
  recipeCard: {
    width: '100%',
    marginBottom: 16,
    marginRight: 0,
  },
  listContent: {
    padding: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  recipeRow: {
    justifyContent: 'space-between',
  },
}); 