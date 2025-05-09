import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';
import mockCoffeesData from '../data/mockCoffees.json';

const RecipeCard = ({ 
  recipe, 
  onPress, 
  onUserPress, 
  showCoffeeInfo = false, 
  style,
  compact = false
}) => {
  // Find the coffee if we have a coffeeId
  const coffee = recipe.coffeeId ? 
    mockCoffeesData.coffees.find(c => c.id === recipe.coffeeId) : 
    null;

  // Default creator info if not provided
  const creatorName = recipe.creatorName || 'Unknown';
  const creatorAvatar = recipe.creatorAvatar || undefined;
  
  // Determine if it's a business account
  const isBusinessAccount = 
    creatorName === 'Vértigo y Calambre' || 
    creatorName === 'Toma Café' || 
    creatorName === 'CaféLab' ||
    (recipe.creatorId && recipe.creatorId.startsWith('business-'));

  return (
    <TouchableOpacity 
      style={[styles.container, compact ? styles.compactContainer : {}, style]} 
      onPress={onPress}
    >
      <View style={styles.recipeHeader}>
        <TouchableOpacity 
          style={styles.userChip}
          onPress={onUserPress}
        >
          <View style={[
            styles.avatar, 
            isBusinessAccount ? styles.businessAvatar : {}
          ]}>
            {creatorAvatar ? (
              <AppImage 
                source={creatorAvatar} 
                style={isBusinessAccount ? styles.businessAvatarImage : styles.avatarImage}
                placeholder="person"
              />
            ) : (
              <Ionicons name="person-circle" size={24} color="#CCCCCC" />
            )}
          </View>
          <Text style={styles.username}>{creatorName}</Text>
        </TouchableOpacity>
        
        <Text style={styles.recipeTime}>
          {recipe.brewTime ? `${recipe.brewTime}` : '3:00'}
        </Text>
      </View>
      
      <View style={styles.recipeContent}>
        <View style={styles.recipeImageContainer}>
          <AppImage 
            source={recipe.image || (coffee?.image || coffee?.images?.[0])} 
            style={styles.recipeImage} 
            placeholder="coffee"
          />
        </View>
        
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          
          {showCoffeeInfo && coffee && (
            <Text style={styles.coffeeName}>{coffee.name} • {coffee.roaster}</Text>
          )}
          
          <View style={styles.recipeDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="water-outline" size={16} color="#666666" />
              <Text style={styles.detailText}>{recipe.method || 'V60'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="timer-outline" size={16} color="#666666" />
              <Text style={styles.detailText}>{recipe.brewTime || '3:00'}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Ionicons name="speedometer-outline" size={16} color="#666666" />
              <Text style={styles.detailText}>{recipe.grindSize || 'Medium'}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    marginBottom: 16,
    width: '100%'
  },
  compactContainer: {
    padding: 12,
    marginRight: 12,
    width: 280,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessAvatar: {
    borderRadius: 8,
  },
  avatarImage: {
    width: '100%', 
    height: '100%',
    borderRadius: 16,
  },
  businessAvatarImage: {
    width: '100%', 
    height: '100%',
    borderRadius: 8,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
  },
  recipeTime: {
    fontSize: 12,
    color: '#666666',
  },
  recipeContent: {
    flexDirection: 'row',
  },
  recipeImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  recipeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coffeeName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  recipeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});

export default RecipeCard; 