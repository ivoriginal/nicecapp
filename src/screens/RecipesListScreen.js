import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockRecipes from '../data/mockRecipes.json';
import mockUsers from '../data/mockUsers.json';
import mockCoffees from '../data/mockCoffees.json';
import AppImage from '../components/common/AppImage';
import { useCoffee } from '../context/CoffeeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import RecipeCard from '../components/RecipeCard';

const RecipesListScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { coffeeCollection } = useCoffee();
  
  // Use recipes from mockRecipes.json instead of hard-coded recipes
  const [allRecipes] = useState(mockRecipes.recipes || []);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [screenTitle, setScreenTitle] = useState('Recipes for you');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Effect to set up the navigation options and title
  useEffect(() => {
    // Set the screen title based on route params
    const { title, type, recipeId } = route.params || {};
    
    // Update navigation options
    navigation.setOptions({
      title: title || 'Recipes for you'
    });
    
    // Update the local title state
    if (title) {
      setScreenTitle(title);
    } else if (type === 'remixes' && recipeId) {
      const originalRecipe = allRecipes.find(r => r.id === recipeId);
      if (originalRecipe) {
        const newTitle = `Remixes of ${originalRecipe.name}`;
        setScreenTitle(newTitle);
        navigation.setOptions({ title: newTitle });
      }
    }
  }, [route.params, allRecipes, navigation]);

  // Effect to filter recipes based on route params, user's collection, and rating filter
  useEffect(() => {
    const { type, recipeId } = route.params || {};
    
    // Collection IDs for filtering
    const collectionIds = coffeeCollection.map(coffee => coffee.id);
    
    // Handle different types of recipe lists
    if (type === 'remixes' && recipeId) {
      // Create mock remix recipes based on the original recipe
      const originalRecipe = allRecipes.find(r => r.id === recipeId);
      
      if (originalRecipe) {
        // Generate mock remixes for the original recipe
        const remixes = [
          {
            id: `remix-${recipeId}-1`,
            name: "Stronger V60 Method",
            coffeeId: originalRecipe.coffeeId,
            coffeeName: originalRecipe.coffeeName,
            roaster: originalRecipe.roaster,
            creatorId: "user10",
            creatorName: "Lucas Brown",
            creatorAvatar: "https://randomuser.me/api/portraits/men/55.jpg",
            brewingMethod: originalRecipe.brewingMethod || "Pour Over",
            grindSize: "Medium-Fine",
            coffeeAmount: Number(originalRecipe.coffeeAmount || 22) + 3,
            waterAmount: originalRecipe.waterAmount,
            waterTemperature: originalRecipe.waterTemperature,
            brewTime: originalRecipe.brewTime,
            imageUrl: originalRecipe.imageUrl,
            rating: 4.5,
            likes: 27,
            saves: 8,
            modifications: "+3g coffee, finer grind",
            date: "3 days ago"
          },
          {
            id: `remix-${recipeId}-2`,
            name: "Lighter V60 Recipe",
            coffeeId: originalRecipe.coffeeId,
            coffeeName: originalRecipe.coffeeName,
            roaster: originalRecipe.roaster,
            creatorId: "user5",
            creatorName: "Emma Garcia",
            creatorAvatar: "https://randomuser.me/api/portraits/women/33.jpg",
            brewingMethod: originalRecipe.brewingMethod || "Pour Over",
            grindSize: originalRecipe.grindSize,
            coffeeAmount: originalRecipe.coffeeAmount,
            waterAmount: Number(originalRecipe.waterAmount || 350) - 30,
            waterTemperature: 88,
            brewTime: originalRecipe.brewTime,
            imageUrl: originalRecipe.imageUrl,
            rating: 3.8,
            likes: 34,
            saves: 12,
            modifications: "-30ml water, 88°C temperature",
            date: "1 week ago"
          },
          {
            id: `remix-${recipeId}-3`,
            name: "Longer Brew Time Method",
            coffeeId: originalRecipe.coffeeId,
            coffeeName: originalRecipe.coffeeName,
            roaster: originalRecipe.roaster,
            creatorId: "user9",
            creatorName: "Olivia Taylor",
            creatorAvatar: "https://randomuser.me/api/portraits/women/12.jpg",
            brewingMethod: originalRecipe.brewingMethod || "Pour Over",
            grindSize: "Medium-Coarse",
            coffeeAmount: originalRecipe.coffeeAmount,
            waterAmount: originalRecipe.waterAmount,
            waterTemperature: originalRecipe.waterTemperature,
            brewTime: "4:00",
            imageUrl: originalRecipe.imageUrl,
            rating: 5.0,
            likes: 18,
            saves: 5,
            modifications: "Coarser grind, longer brew time",
            date: "2 weeks ago"
          }
        ];
        
        // Apply rating filter to remixes
        const recipesToFilter = remixes;
        applyRatingFilter(recipesToFilter);
        
        return;
      }
    }
    
    // For regular recipe list, filter recipes for coffees in the user's collection
    const recipesForCollection = allRecipes.filter(recipe => 
      collectionIds.includes(recipe.coffeeId)
    );
    
    // Apply rating filter to recipes
    applyRatingFilter(recipesForCollection);
    
  }, [allRecipes, route.params, coffeeCollection, ratingFilter]);

  // Function to apply rating filter
  const applyRatingFilter = (recipes) => {
    if (ratingFilter === 'all') {
      setFilteredRecipes(recipes);
      return;
    }
    
    // Filter recipes based on rating
    const ratingValue = parseInt(ratingFilter, 10);
    const filtered = recipes.filter(recipe => {
      // Use the new percentage-based rating system
    const recipeRating = recipe.ratingStats ? 
      (recipe.ratingStats.goodPercentage / 100 * 5) : // Convert percentage to 5-star scale
      (recipe.rating || recipe.averageRating || 0);
      return recipeRating >= ratingValue && recipeRating < ratingValue + 1;
    });
    
    setFilteredRecipes(filtered);
  };

  // Function to render the rating filter chips
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

  // Function to render recipe items
  const renderRecipeItem = ({ item }) => {
    // Determine if this is a remix
    const isRemix = route.params?.type === 'remixes';
    
    return (
      <RecipeCard
        recipe={item}
        onPress={() => navigation.navigate('RecipeDetail', { 
          recipeId: item.id || '',
          coffeeName: item.coffeeName,
          roaster: item.roaster,
          imageUrl: item.imageUrl || item.image || null,
          userId: item.creatorId || item.userId || '',
          userName: item.userName || item.creatorName,
          userAvatar: item.creatorAvatar || item.userAvatar || null,
          recipe: item,
          ...(isRemix && route.params?.recipeId ? {
            basedOnRecipe: {
              id: route.params.recipeId,
              name: allRecipes.find(r => r.id === route.params.recipeId)?.name || 'Original Recipe'
            }
          } : {}),
          skipAuth: true
        })}
        onUserPress={() => navigation.navigate('UserProfileScreen', { 
          userId: item.creatorId || item.userId, 
          userName: item.userName || item.creatorName,
          userAvatar: item.creatorAvatar || item.userAvatar,
          skipAuth: true 
        })}
        showCoffeeInfo={true}
        style={{ marginBottom: 16 }}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* Rating filter */}
      {allRecipes.length > 0 && renderRatingFilter()}

      {coffeeCollection.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cafe-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>No coffees in collection</Text>
          <Text style={styles.emptyText}>Add coffees to your collection to see recipes</Text>
        </View>
      ) : filteredRecipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          {ratingFilter === 'all' ? (
            <>
              <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No recipes found</Text>
              <Text style={styles.emptyText}>There are no recipes for coffees in your collection</Text>
            </>
          ) : (
            <>
              <Ionicons name="filter-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>No recipes match this filter</Text>
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => setRatingFilter('all')}
              >
                <Text style={styles.resetFilterText}>Show All Recipes</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipeItem}
          keyExtractor={item => item.id || Math.random().toString()}
          contentContainerStyle={styles.recipesList}
          horizontal={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  recipesList: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  recipeContent: {
    padding: 16,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  recipeDate: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coffeeInfo: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  roasterName: {
    fontSize: 12,
    color: '#666666',
  },
  methodContainer: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  method: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
    marginBottom: 16,
  },
  modifications: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
  },
  modificationsLabel: {
    fontWeight: '500',
  },
  modificationsHighlight: {
    fontWeight: '600',
  },
  remixStats: {
    flexDirection: 'row',
    marginTop: 12,
  },
  remixStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  remixStatText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  ratingFilterContainer: {
    marginVertical: 12,
    paddingHorizontal: 16,
  },
  ratingFilterScrollContent: {
    paddingVertical: 8,
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

export default RecipesListScreen; 