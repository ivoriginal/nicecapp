import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';
import mockCoffeesData from '../data/mockCoffees.json';
import { useTheme } from '../context/ThemeContext';

const RecipeCard = ({ 
  recipe, 
  onPress, 
  onUserPress,
  showCoffeeInfo = false, 
  style,
  compact = false,
  isRecipeCreationEvent = false
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Find the coffee if we have a coffeeId
  const coffee = recipe.coffeeId ? 
    mockCoffeesData.coffees.find(c => c.id === recipe.coffeeId) : 
    null;

  // Get creator info
  const creatorName = recipe.creatorName || recipe.userName || 'Unknown';
  const creatorId = recipe.creatorId || recipe.userId;
  
  // Get remix info
  const isRemix = recipe.originalRecipeId || recipe.originalRecipeName || 
                  recipe.originalRecipeCreator || recipe.originalCreatorName;
  const originalCreator = recipe.originalRecipeCreator || recipe.originalCreatorName || 
                         recipe.targetUserName || "another user";
  
  const handleUserPress = () => {
    if (onUserPress && creatorId) {
      onUserPress(creatorId, creatorName);
    }
  };
  
  const handleRecipePress = () => {
    if (onPress && recipe.id) {
      onPress(recipe.id);
    }
  };

  const handleOriginalRecipePress = () => {
    if (onPress && recipe.originalRecipeId) {
      onPress(recipe.originalRecipeId);
    }
  };

  const method = recipe.method || recipe.brewingMethod || 'V60';
  // Use the new percentage-based rating system
  const rating = recipe.ratingStats ? 
    (recipe.ratingStats.goodPercentage / 100 * 5) : // Convert percentage to 5-star scale
    (recipe.rating || recipe.averageRating || 0);
  const coffeeName = coffee ? coffee.name : 'Coffee';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        compact ? styles.compactContainer : {}, 
        { 
          backgroundColor: isRecipeCreationEvent && !isDarkMode ? 'transparent' : theme.cardBackground,
          borderColor: theme.divider 
        },
        style
      ]} 
      onPress={handleRecipePress}
    >
      <View style={styles.recipeContent}>
        <View style={styles.topSection}>
          {/* Remix info if this is a remixed recipe */}
          {isRemix && (
            <TouchableOpacity 
              style={styles.remixInfoContainer}
              onPress={handleOriginalRecipePress}
            >
              <Ionicons name="git-branch" size={14} color={theme.secondaryText} />
              <Text style={[styles.remixInfoText, { color: theme.secondaryText }]}>
                Remixed from a recipe by {originalCreator}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Rating (moved before title) */}
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: theme.primaryText }]}>{rating.toFixed(1)}</Text>
            </View>
          )}
          
          {/* Recipe Title showing Coffee + Method */}
          <View style={styles.recipeTitleContainer}>
            <Text style={[styles.recipeTitle, { color: theme.primaryText }]}>
              {coffeeName} recipe for {method}
            </Text>
          </View>
          
          {/* Author Header */}
          <View style={styles.recipeHeader}>
            <TouchableOpacity 
              style={styles.authorContainer}
              onPress={handleUserPress}
            >
              <Text style={[styles.authorName, { color: theme.secondaryText }]}>by {creatorName}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recipe Stats - Always at bottom */}
        <View style={[styles.recipeStats, { borderTopColor: theme.divider }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Time</Text>
            <Text style={[styles.statValue, { color: theme.primaryText }]}>{recipe.brewTime || '3:00'}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Grind</Text>
            <Text style={[styles.statValue, { color: theme.primaryText }]}>{recipe.grindSize || 'Medium'}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Dose</Text>
            <Text style={[styles.statValue, { color: theme.primaryText }]}>
              {recipe.coffeeAmount ? `${recipe.coffeeAmount}g` : (recipe.dose || '18g')}
            </Text>
          </View>
          
          <View style={[styles.statItem, styles.lastStatItem]}>
            <Text style={[styles.statLabel, { color: theme.secondaryText }]}>Water</Text>
            <Text style={[styles.statValue, { color: theme.primaryText }]}>
              {recipe.waterAmount ? `${recipe.waterAmount}g` : '300g'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    marginBottom: 16,
    width: '100%'
  },
  compactContainer: {
    // padding: 12,
    marginRight: 12,
    width: 280,
  },
  recipeContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  topSection: {
    flex: 1, // Take up available space to push the stats to the bottom
  },
  remixInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 8,
    paddingBottom: 8,
    // borderBottomWidth: 1,
    // borderBottomColor: '#F0F0F0',
  },
  remixInfoText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  recipeTitleContainer: {
    marginBottom: 4,
    paddingBottom: 0,
    // borderBottomWidth: 1,
    // borderBottomColor: '#F0F0F0',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 0,
    // Remove border bottom from here
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  lastStatItem: {
    marginRight: 0,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
});

export default RecipeCard; 