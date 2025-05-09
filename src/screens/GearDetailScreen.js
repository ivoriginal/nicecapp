import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { useCoffee } from '../context/CoffeeContext';
import mockGearData from '../data/mockGear.json';

// Transform mockGear.json data to the format expected by the component
const gearData = mockGearData.gear.reduce((acc, item) => {
  // Create a simple entry for the gear item
  acc[item.name] = {
    id: item.id,
    name: item.name,
    image: item.imageUrl,
    description: item.description,
    price: item.price,
    brand: item.brand,
    type: item.type,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: item.brand, url: `https://${item.brand.toLowerCase()}.com`, location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    // Default usedBy and wantedBy if needed
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  };
  return acc;
}, {});

// Export gearData so it can be imported by other components
export { gearData };

export default function GearDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { gearName, gearId } = route.params || {};
  const [inWishlist, setInWishlist] = useState(false);
  const { coffeeWishlist, addToWishlist, removeFromWishlist } = useCoffee();
  
  // Get gear data - try to match by ID first, then by name
  let gear;
  
  if (gearId) {
    // Try to find gear by ID first
    gear = Object.values(gearData).find(item => item.id === gearId);
  }
  
  if (!gear && gearName) {
    // If not found by ID, try to find by name
    gear = gearData[gearName];
  }
  
  // Fallback to default if still not found
  if (!gear) {
    gear = {
      id: gearId || 'unknown',
      name: gearName || 'Unknown Gear',
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
      description: 'No information available for this item.',
      price: 0,
      whereToBuy: [],
      usedBy: [],
      wantedBy: []
    };
  }
  
  // Set screen title
  useEffect(() => {
    navigation.setOptions({
      title: gear.name,
    });
  }, [navigation, gear.name]);
  
  // Check if item is in wishlist
  useEffect(() => {
    if (coffeeWishlist && gear) {
      const isInWishlist = coffeeWishlist.some(item => item.id === gear.id);
      setInWishlist(isInWishlist);
    }
  }, [coffeeWishlist, gear]);
  
  // Toggle wishlist
  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(gear.id);
      setInWishlist(false);
      Alert.alert('Removed', `${gear.name} removed from your wishlist`);
    } else {
      const wishlistItem = {
        id: gear.id,
        name: gear.name,
        image: gear.image,
        roaster: 'Gear',
        type: 'gear'
      };
      addToWishlist(wishlistItem);
      setInWishlist(true);
      Alert.alert('Added', `${gear.name} added to your wishlist`);
    }
  };
  
  // Handle user profile press
  const handleUserPress = (userId, userName) => {
    navigation.navigate('UserProfileBridge', {
      userId,
      userName,
      skipAuth: true
    });
  };
  
  // Handle shop press
  const handleShopPress = (shop) => {
    Alert.alert('Coming Soon', `You'll be able to visit ${shop.name} soon.`);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: gear.image }} 
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={toggleWishlist}
          >
            <Ionicons 
              name={inWishlist ? "gift" : "gift-outline"} 
              size={28} 
              color={inWishlist ? "#FFFFFF" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{gear.name}</Text>
          <Text style={styles.price}>${gear.price.toFixed(2)}</Text>
          <Text style={styles.description}>{gear.description}</Text>
          
          {/* Where to Buy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where to Buy</Text>
            {gear.whereToBuy.map((shop, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.shopItem}
                onPress={() => handleShopPress(shop)}
              >
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <Text style={styles.shopLocation}>{shop.location}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#000000" />
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Used By */}
          {gear.usedBy && gear.usedBy.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Used By</Text>
              {gear.usedBy.map((user, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.userItem}
                  onPress={() => handleUserPress(user.id, user.name)}
                >
                  <Image 
                    source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar} 
                    style={styles.userAvatar} 
                  />
                  <Text style={styles.userName}>{user.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#000000" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Wanted By */}
          {gear.wantedBy && gear.wantedBy.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wanted By</Text>
              {gear.wantedBy.map((user, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.userItem}
                  onPress={() => handleUserPress(user.id, user.name)}
                >
                  <Image 
                    source={typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar} 
                    style={styles.userAvatar} 
                  />
                  <Text style={styles.userName}>{user.name}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#000000" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageContainer: {
    position: 'relative',
    height: 300,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  shopItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    width: '100%',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  shopLocation: {
    fontSize: 14,
    color: '#666666',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    width: '100%',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#E5E5EA',
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
}); 