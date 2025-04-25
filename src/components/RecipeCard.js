import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecipeCard = ({ 
  recipe, 
  onPress, 
  onUserPress,
  style,
  showCoffeeInfo = false
}) => {
  const {
    id,
    name,
    method,
    amount,
    grindSize,
    waterVolume,
    brewTime,
    steps,
    tips,
    notes,
    rating,
    userId,
    userName,
    userAvatar,
    timestamp,
    coffeeName,
    coffeeId,
    coffeeImage,
    roaster
  } = recipe;

  return (
    <TouchableOpacity 
      style={[styles.recipeCard, style]}
      onPress={() => onPress && onPress(id)}
    >
      {showCoffeeInfo && coffeeName && (
        <TouchableOpacity 
          style={styles.coffeeContainer}
          onPress={() => onPress && onPress(coffeeId)}
        >
          <View style={styles.coffeeInfo}>
            {coffeeImage && (
              <Image 
                source={{ uri: coffeeImage }} 
                style={styles.coffeeImage} 
              />
            )}
            <View style={styles.coffeeDetails}>
              <Text style={styles.coffeeName}>{coffeeName}</Text>
              {roaster && (
                <Text style={styles.coffeeRoaster}>{roaster}</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.recipeHeader}>
        <View style={styles.methodContainer}>
          <Ionicons name="cafe" size={20} color="#000000" />
          <Text style={styles.methodText}>{method}</Text>
        </View>
        {rating && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#000000" />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.recipeDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Coffee</Text>
          <Text style={styles.detailValue}>{amount}g</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Grind Size</Text>
          <Text style={styles.detailValue}>{grindSize}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Water</Text>
          <Text style={styles.detailValue}>{waterVolume}ml</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Brew Time</Text>
          <Text style={styles.detailValue}>{brewTime}</Text>
        </View>
      </View>

      {steps && steps.length > 0 && (
        <View style={styles.stepsContainer}>
          <Text style={styles.stepsTitle}>Brewing Steps</Text>
          {steps.slice(0, 2).map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step.action}</Text>
              <Text style={styles.stepTime}>{step.time}</Text>
            </View>
          ))}
          {steps.length > 2 && (
            <Text style={styles.moreStepsText}>+{steps.length - 2} more steps</Text>
          )}
        </View>
      )}

      {userId && userName && (
        <TouchableOpacity 
          style={styles.userContainer}
          onPress={() => onUserPress && onUserPress(userId)}
        >
          <Image 
            source={{ uri: userAvatar || 'https://via.placeholder.com/32' }} 
            style={styles.userAvatar} 
          />
          <Text style={styles.userName}>{userName}</Text>
          {timestamp && (
            <Text style={styles.timestamp}>
              {new Date(timestamp).toLocaleDateString()}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {notes && (
        <Text style={styles.notesText} numberOfLines={2}>
          {notes}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  recipeCard: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 300,
  },
  coffeeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  coffeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  coffeeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  coffeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coffeeImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  coffeeDetails: {
    flex: 1,
  },
  coffeeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  coffeeRoaster: {
    fontSize: 12,
    color: '#666666',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  methodText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  recipeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailRow: {
    width: '50%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  stepsContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  stepTime: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  moreStepsText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    marginRight: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666666',
  },
  notesText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
});

export default RecipeCard; 