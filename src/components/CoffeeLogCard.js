import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CoffeeLogCard = ({ event, onCoffeePress, onRecipePress, onUserPress }) => {
  // Ensure we have a valid event object
  if (!event) return null;

  // Format the date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with user info and timestamp */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.userInfoContainer}
          onPress={() => onUserPress && onUserPress(event)}
        >
          <Image 
            source={{ uri: event.userAvatar || 'https://via.placeholder.com/40' }} 
            style={styles.userAvatar} 
          />
          <Text style={styles.userName}>{event.userName}</Text>
        </TouchableOpacity>
        <Text style={styles.timestamp}>
          {formatDate(event.timestamp || event.date)}
        </Text>
      </View>

      {/* Coffee image and details */}
      <TouchableOpacity 
        style={styles.coffeeContainer}
        onPress={() => onCoffeePress && onCoffeePress(event)}
        activeOpacity={0.7}
      >
        <View style={styles.coffeeImageContainer}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.coffeeImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="cafe" size={24} color="#666" />
            </View>
          )}
        </View>
        <View style={styles.coffeeInfo}>
          <Text style={styles.coffeeName}>{event.coffeeName}</Text>
          <Text style={styles.roasterName}>{event.roaster || event.roasterName}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, i) => (
              <Ionicons 
                key={i} 
                name={i < (event.rating || 0) ? "star" : "star-outline"} 
                size={16} 
                color="#FFD700" 
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {/* Recipe details */}
      <TouchableOpacity 
        style={styles.recipeContainer}
        onPress={() => onRecipePress && onRecipePress(event)}
        activeOpacity={0.7}
      >
        <View style={styles.recipeHeader}>
          <View style={styles.methodContainer}>
            <Ionicons name="cafe" size={20} color="#000000" />
            <Text style={styles.methodText}>{event.method || event.brewingMethod}</Text>
          </View>
        </View>
        <View style={styles.recipeDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Coffee</Text>
            <Text style={styles.detailValue}>{event.amount || '18'}g</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grind Size</Text>
            <Text style={styles.detailValue}>{event.grindSize || 'Medium'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Water</Text>
            <Text style={styles.detailValue}>{event.waterVolume || '300'}ml</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Brew Time</Text>
            <Text style={styles.detailValue}>{event.brewTime || '3:30'}</Text>
          </View>
        </View>
        {event.notes && (
          <Text style={styles.notesText} numberOfLines={2}>
            {event.notes}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginVertical: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  timestamp: {
    fontSize: 12,
    color: '#666666',
  },
  coffeeContainer: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  coffeeImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  coffeeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    justifyContent: 'center',
  },
  coffeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  roasterName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  recipeContainer: {
    padding: 12,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  detailRow: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default CoffeeLogCard; 