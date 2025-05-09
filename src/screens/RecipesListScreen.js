import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockRecipes from '../data/mockRecipes.json';
import mockUsers from '../data/mockUsers.json';
import mockCoffees from '../data/mockCoffees.json';
import AppImage from '../components/common/AppImage';

const RecipesListScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  // Use recipes from mockRecipes.json instead of hard-coded recipes
  const [allRecipes] = useState(mockRecipes.recipes || []);
  
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [screenTitle, setScreenTitle] = useState('Recipes for you');

  // Mock user's gear and coffee collection
  const userGear = mockUsers.users.find(u => u.id === 'currentUser')?.gear || ['V60', 'AeroPress'];
  const userCoffeeCollection = mockCoffees.coffees.slice(0, 2).map(c => c.name);

  // Filter recipes based on route params and user's gear and coffee collection
  useEffect(() => {
    const { type, recipeId, title } = route.params || {};
    
    // Set screen title if provided
    if (title) {
      setScreenTitle(title);
    }
    
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
            likes: 18,
            saves: 5,
            modifications: "Coarser grind, longer brew time",
            date: "2 weeks ago"
          }
        ];
        
        // Set the remixes as the filtered recipes
        setFilteredRecipes(remixes);
        
        // Set the screen title if not already set
        if (!title) {
          setScreenTitle(`Remixes of ${originalRecipe.name}`);
        }
        
        return;
      }
    }
    
    // If no specific type or we couldn't find the original recipe,
    // Filter recipes that match user's gear AND coffee collection
    const personalizedRecipes = allRecipes.filter(recipe => 
      userGear.includes(recipe.brewingMethod) && 
      userCoffeeCollection.includes(recipe.coffeeName)
    );
    
    // If no matching recipes, use all recipes
    setFilteredRecipes(personalizedRecipes.length > 0 ? personalizedRecipes : allRecipes);
  }, [allRecipes, route.params, userGear, userCoffeeCollection]);

  const renderRecipeItem = ({ item }) => {
    // Determine if this is a remix
    const isRemix = route.params?.type === 'remixes';
    
    // Ensure all text values are strings
    const name = item.name || '';
    const userName = item.creatorName || item.userName || '';
    const coffeeName = item.coffeeName || '';
    const roaster = item.roaster || '';
    const method = item.brewingMethod || '';
    const rating = item.rating ? item.rating.toFixed(1) : '0.0';
    
    return (
      <TouchableOpacity 
        style={styles.recipeCard}
        onPress={() => navigation.navigate('RecipeDetail', { 
          recipeId: item.id || '',
          coffeeName: coffeeName,
          roaster: roaster,
          imageUrl: item.imageUrl || item.image || null,
          userId: item.creatorId || item.userId || '',
          userName: userName,
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
      >
        <AppImage 
          source={item.imageUrl || item.image} 
          style={styles.recipeImage}
          placeholder="coffee"
        />
        <View style={styles.recipeContent}>
          <View style={styles.recipeHeader}>
            <View style={styles.userInfo}>
              <AppImage 
                source={item.creatorAvatar || item.userAvatar} 
                style={styles.userAvatar}
                placeholder="person"
              />
              <Text style={styles.userName}>{userName}</Text>
              {isRemix && item.date && (
                <Text style={styles.recipeDate}>{item.date}</Text>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Text>
                <Ionicons name="star" size={16} color="#FFD700" />
              </Text>
              <Text style={styles.rating}>{rating}</Text>
            </View>
          </View>
          
          <Text style={styles.recipeName}>{name}</Text>
          
          {isRemix && item.modifications && (
            <Text style={styles.modifications}>
              <Text style={styles.modificationsLabel}>Changes: </Text>
              <Text style={styles.modificationsHighlight}>{item.modifications}</Text>
            </Text>
          )}
          
          <View style={styles.recipeDetails}>
            <View style={styles.coffeeInfo}>
              <Text style={styles.coffeeName}>{coffeeName}</Text>
              <Text style={styles.roasterName}>{roaster}</Text>
            </View>
            <View style={styles.methodContainer}>
              <Text style={styles.method}>{method}</Text>
            </View>
          </View>
          
          {isRemix && (
            <View style={styles.remixStats}>
              <View style={styles.remixStat}>
                <Ionicons name="arrow-up" size={14} color="#666666" />
                <Text style={styles.remixStatText}>{item.likes || 0}</Text>
              </View>
              <View style={styles.remixStat}>
                <Ionicons name="people-outline" size={14} color="#666666" />
                <Text style={styles.remixStatText}>{item.saves || 0}</Text>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.id || Math.random().toString()}
        contentContainerStyle={styles.recipesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found</Text>
          </View>
        }
      />
    </View>
  );
};

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
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666666',
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
});

export default RecipesListScreen; 