import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';
import AppImage from '../components/common/AppImage';

const RecipesListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  // Use recipes from mockData.json instead of hard-coded recipes
  const [allRecipes] = useState(mockData.recipes || []);
  
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  // Mock user's gear and coffee collection - could also get from mockData
  const userGear = mockData.users.find(u => u.id === 'currentUser')?.gear || ['V60', 'AeroPress'];
  const userCoffeeCollection = mockData.coffees.slice(0, 2).map(c => c.name);

  // Filter recipes based on user's gear and coffee collection
  useEffect(() => {
    // Filter recipes that match user's gear AND coffee collection
    const personalizedRecipes = allRecipes.filter(recipe => 
      userGear.includes(recipe.brewingMethod) && 
      userCoffeeCollection.includes(recipe.coffeeName)
    );
    
    // If no matching recipes, use all recipes
    setFilteredRecipes(personalizedRecipes.length > 0 ? personalizedRecipes : allRecipes);
  }, [allRecipes]);

  const renderRecipeItem = ({ item }) => {
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
            </View>
            <View style={styles.ratingContainer}>
              <Text>
                <Ionicons name="star" size={16} color="#FFD700" />
              </Text>
              <Text style={styles.rating}>{rating}</Text>
            </View>
          </View>
          
          <Text style={styles.recipeName}>{name}</Text>
          
          <View style={styles.recipeDetails}>
            <View style={styles.coffeeInfo}>
              <Text style={styles.coffeeName}>{coffeeName}</Text>
              <Text style={styles.roasterName}>{roaster}</Text>
            </View>
            <View style={styles.methodContainer}>
              <Text style={styles.method}>{method}</Text>
            </View>
          </View>
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
        <Text style={styles.headerTitle}>Recipes for you</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <FlatList
        data={filteredRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={item => item.id || Math.random().toString()}
        contentContainerStyle={styles.recipesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found for your gear and coffee collection</Text>
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
    fontSize: 14,
    color: '#666666',
  },
  methodContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  method: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});

export default RecipesListScreen; 