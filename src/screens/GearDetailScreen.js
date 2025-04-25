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

// Mock gear data
const gearData = {
  'Hario V60': {
    id: 'gear-v60',
    name: 'Hario V60 Ceramic Dripper',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
    description: 'The Hario V60 is a cone-shaped dripper with spiral ridges along the inner wall and a large single hole at the bottom, designed to produce a clean, flavorful cup of coffee.',
    price: 22.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Blue Bottle Coffee', url: 'https://bluebottlecoffee.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ]
  },
  'AeroPress': {
    id: 'gear-aeropress',
    name: 'AeroPress Coffee Maker',
    image: 'https://images.unsplash.com/photo-1612095317136-36510eef4db5',
    description: 'The AeroPress is a versatile coffee maker that uses pressure to extract rich, smooth coffee quickly with low acidity and bitterness.',
    price: 29.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Stumptown Coffee', url: 'https://stumptowncoffee.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ],
    wantedBy: [
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  },
  'Comandante C40': {
    id: 'gear-comandante',
    name: 'Comandante C40 MK3 Grinder',
    image: 'https://images.unsplash.com/photo-1596822531007-90042301c391',
    description: 'The Comandante C40 is a high-precision hand grinder with stainless steel burrs, known for its consistency and build quality.',
    price: 249.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' }
    ],
    usedBy: [
      { id: 'user2', name: 'Vértigo y Calambre', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { id: 'user8', name: 'James Wilson', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' }
    ],
    wantedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ]
  },
  'Fellow Stagg EKG': {
    id: 'gear-stagg',
    name: 'Fellow Stagg EKG Electric Kettle',
    image: 'https://images.unsplash.com/photo-1584589167171-541ce45f1eea',
    description: 'The Fellow Stagg EKG is a precision electric pour-over kettle with variable temperature control and a sleek design.',
    price: 149.99,
    whereToBuy: [
      { name: 'Fellow Products', url: 'https://fellowproducts.com', location: 'Online' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ],
    wantedBy: [
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  },
  'Baratza Encore': {
    id: 'gear-encore',
    name: 'Baratza Encore Coffee Grinder',
    image: 'https://images.unsplash.com/photo-1575413033883-a477b531ca4c',
    description: 'The Baratza Encore is an entry-level burr grinder that provides consistent grounds for a variety of brewing methods.',
    price: 169.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Baratza', url: 'https://baratza.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
      { id: 'user10', name: 'Lucas Brown', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' }
    ]
  },
};

export default function GearDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { gearName } = route.params || {};
  const [inWishlist, setInWishlist] = useState(false);
  const { coffeeWishlist, addToWishlist, removeFromWishlist } = useCoffee();
  
  // Get gear data
  const gear = gearData[gearName] || {
    id: 'unknown',
    name: gearName || 'Unknown Gear',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e',
    description: 'No information available for this item.',
    price: 0,
    whereToBuy: [],
    usedBy: [],
    wantedBy: []
  };
  
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
              name={inWishlist ? "heart" : "heart-outline"} 
              size={28} 
              color={inWishlist ? "#FF3B30" : "#FFFFFF"} 
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
                  <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
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
                  <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
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
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
}); 