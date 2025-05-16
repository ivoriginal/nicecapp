import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppImage from './common/AppImage';

const RecipeCard2 = ({ item, onPress }) => {
  // Ensure all text values are strings
  const name = item.name || '';
  const userName = item.creatorName || item.userName || '';
  const coffeeName = item.coffeeName || '';
  const roaster = item.roaster || '';
  const method = item.brewingMethod || '';
  const rating = item.rating ? item.rating.toFixed(1) : '0.0';
  
  const getImageSource = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) {
      return { uri: url };
    }
    return { uri: url };
  };
  
  return (
    <TouchableOpacity 
      style={styles.recipeCard}
      onPress={onPress}
    >
      <AppImage 
        source={item.imageUrl || item.image} 
        style={styles.recipeImage} 
        placeholder="coffee"
      />
      <View style={styles.recipeContent}>
        <Text style={styles.recipeName}>{name}</Text>
        <Text style={styles.recipeCoffeeName}>{coffeeName}</Text>
        <View style={styles.recipeCreatorContainer}>
          <AppImage 
            source={item.creatorAvatar || item.userAvatar} 
            style={styles.recipeCreatorAvatar} 
            placeholder="person"
          />
          <Text style={styles.recipeCreatorName}>{userName}</Text>
        </View>
        <View style={styles.recipeStatsContainer}>
          <View style={styles.recipeStat}>
            <Ionicons name="heart" size={14} color="#666666" />
            <Text style={styles.recipeStatText}>{item.likes || 0}</Text>
          </View>
          <View style={styles.recipeStat}>
            <Ionicons name="bookmark" size={14} color="#666666" />
            <Text style={styles.recipeStatText}>{item.saves || 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 12,
    width: 300,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  recipeImage: {
    width: '100%',
    height: 180,
  },
  recipeContent: {
    padding: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipeCoffeeName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  recipeCreatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipeCreatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  recipeCreatorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  recipeStatsContainer: {
    flexDirection: 'row',
  },
  recipeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  recipeStatText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});

export default RecipeCard2; 