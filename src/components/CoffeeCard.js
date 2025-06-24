import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import AppImage from './common/AppImage';

export default function CoffeeCard({
  title,
  description,
  imageUrl,
  username,
  method,
  rating = 3,
  onPress,
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={styles.imageContainer}>
        <AppImage 
          source={imageUrl}
          style={styles.image}
          placeholder="cafe"
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.footer}>
          <Text style={styles.username}>by {username}</Text>
          <View style={styles.ratingContainer}>
            {[...Array(5)].map((_, index) => (
              <FontAwesome
                key={index}
                name={index < rating ? "star" : "star-o"}
                size={12}
                color="#FFD700"
                style={styles.star}
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 12,
    color: '#999',
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  star: {
    marginLeft: 2,
  },
}); 