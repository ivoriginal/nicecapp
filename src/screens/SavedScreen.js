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
import { useTheme } from '../context/ThemeContext';
import RecipeCard from '../components/RecipeCard';
import { useNavigation, useRoute } from '@react-navigation/native';
import mockRecipes from '../data/mockRecipes.json';
import mockCoffees from '../data/mockCoffees.json';
import mockUsers from '../data/mockUsers.json';
import AppImage from '../components/common/AppImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const { coffeeCollection, coffeeWishlist, recipes, favorites, removeFromWishlist, loadSavedRecipes, currentAccount, isAuthenticated, user, toggleFavorite } = useCoffee();
  const { theme, isDarkMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Force default tab to be coffee
  const [activeTab, setActiveTab] = useState(route.params?.type || 'coffee');
  const [refreshing, setRefreshing] = useState(false);
  const [savedItems, setSavedItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Create dynamic styles based on theme
  const styles = createStyles(theme, isDarkMode);

  // Format wishlist items for rendering
  const savedCoffees = Array.isArray(coffeeWishlist) ? coffeeWishlist : [];
  // Get recipes from both sources - those with isSaved flag and those in favorites array
  const savedRecipes = recipes.filter(recipe => 
    recipe.isSaved || favorites.includes(recipe.id)
  );
  
  console.log('=== SavedScreen Debug ===');
  console.log('Current account:', currentAccount);
  console.log('Is authenticated:', isAuthenticated);
  console.log('User:', user);
  console.log('Saved Coffees:', savedCoffees);
  console.log('Saved Recipes:', savedRecipes);
  console.log('Favorites array:', favorites);
  console.log('Recipes from context:', recipes);
  console.log('Recipes with isSaved flag:', recipes.filter(r => r.isSaved));
  console.log('Active tab:', activeTab);
  console.log('Saved items state:', savedItems);

  // Remove navigation header border bottom
  useEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: theme.background,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: theme.primaryText,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={{ marginRight: 16 }}
        >
          <Text style={{ 
            color: theme.primaryText, 
            fontSize: 16, 
            fontWeight: '500' 
          }}>
            {isEditing ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      ),
    });

    // Initial load of saved items based on the default activeTab
    if (!route.params?.savedItems) {
      console.log('Initial load with activeTab:', activeTab);
      updateSavedItemsForTab(activeTab);
    }
  }, [theme.background, theme.primaryText, isEditing]);

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
      // Get all saved recipes - both from isSaved flag and from favorites array
      const allSavedRecipes = recipes.filter(recipe => recipe.isSaved || favorites.includes(recipe.id));
      
      console.log(`Setting ${allSavedRecipes.length} saved recipe items`);
      console.log('From isSaved flag:', recipes.filter(recipe => recipe.isSaved).length);
      console.log('From favorites array:', recipes.filter(recipe => favorites.includes(recipe.id)).length);
      
      setSavedItems(allSavedRecipes);
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
    navigation.getParent()?.navigate('MainTabs', {
      screen: 'CoffeeDetail',
      params: {
        coffeeId: item.coffeeId || item.id,
        skipAuth: true
      }
    });
  };

  const handleRecipePress = (recipeId) => {
    const recipe = savedRecipes.find(r => r.id === recipeId);
    if (recipe) {
      navigation.getParent()?.navigate('MainTabs', {
        screen: 'RecipeDetail',
        params: {
          recipeId: recipe.id,
          coffeeId: recipe.coffeeId,
          coffeeName: recipe.coffeeName,
          recipe: recipe
        }
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

  const handleRemoveRecipe = (recipeId) => {
    toggleFavorite(recipeId);
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
            placeholder="cafe"
          />
        </View>
        <View style={styles.coffeeInfo}>
          <Text style={styles.coffeeName}>{coffeeData?.name || item.name}</Text>
          <Text style={styles.coffeeRoaster}>{coffeeData?.roaster || item.roaster || "Unknown roaster"}</Text>
        </View>
        {isEditing && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={() => handleRemoveCoffee(item.id)}
          >
            <Ionicons name="remove-circle" size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderRecipeItem = ({ item }) => (
    <View style={styles.recipeCardContainer}>
      <RecipeCard 
        recipe={item}
        onPress={() => handleRecipePress(item.id)}
        onUserPress={() => handleUserPress(item)}
        showCoffeeInfo={true}
        style={styles.recipeCard}
      />
      {isEditing && (
        <TouchableOpacity 
          style={styles.recipeRemoveButton}
          onPress={() => handleRemoveRecipe(item.id)}
        >
          <Ionicons name="remove-circle" size={24} color="#FF3B30" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = (message) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={50} color={theme.iconColor} />
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
            key="coffee-list"
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
              color={theme.iconColor} 
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
            key="recipes-list"
            data={savedRecipes}
            renderItem={renderRecipeItem}
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
              name="book-outline" 
              size={60} 
              color={theme.iconColor} 
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

// Create styles as a function that takes theme as parameter
const createStyles = (theme, isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    backgroundColor: theme.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primaryText,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.divider,
    backgroundColor: theme.background,
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
    color: theme.secondaryText,
  },
  activeTabText: {
    color: theme.primaryText,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: theme.primaryText,
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
    paddingVertical: 8,
    backgroundColor: theme.background,
  },
  coffeeImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: theme.placeholder,
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.placeholder,
  },
  coffeeInfo: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: theme.primaryText,
  },
  coffeeRoaster: {
    fontSize: 14,
    color: theme.secondaryText,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    backgroundColor: theme.background,
  },
  emptyText: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: 'center',
    marginTop: 10,
  },
  recipeCardContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  recipeCard: {
    width: '100%',
    marginBottom: 0,
    marginRight: 0,
  },
  recipeRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  listContent: {
    padding: 16,
    backgroundColor: theme.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primaryText,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    color: theme.secondaryText,
    textAlign: 'center',
  },
}); 