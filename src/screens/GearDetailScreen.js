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
    image: 'https://www.hario-europe.com/cdn/shop/files/VDC-01R_web.png?v=1683548122&width=1400',
    description: 'The Hario V60 is a cone-shaped dripper with spiral ridges along the inner wall and a large single hole at the bottom, designed to produce a clean, flavorful cup of coffee.',
    price: 22.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Blue Bottle Coffee', url: 'https://bluebottlecoffee.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ]
  },
  'AeroPress': {
    id: 'gear-aeropress',
    name: 'AeroPress Coffee Maker',
    image: 'https://aeropress.com/cdn/shop/files/Hero_Original_87a4958c-7df9-43b6-af92-0edc12c126cf_900x.png?v=1744683381',
    description: 'The AeroPress is a versatile coffee maker that uses pressure to extract rich, smooth coffee quickly with low acidity and bitterness.',
    price: 29.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Stumptown Coffee', url: 'https://stumptowncoffee.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ],
    wantedBy: [
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  },
  'Chemex': {
    id: 'gear-chemex',
    name: 'Chemex 6-Cup Coffee Maker',
    image: 'https://images.unsplash.com/photo-1544233726-9f1d2b27be8b',
    description: 'The Chemex is an elegant, hourglass-shaped pour-over brewer that produces clean, bright coffee through its special bonded filters.',
    price: 46.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Chemex', url: 'https://www.chemexcoffeemaker.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ]
  },
  'Hario Ceramic Slim': {
    id: 'gear-hario-slim',
    name: 'Hario Ceramic Coffee Mill Slim',
    image: 'https://images.unsplash.com/photo-1544713300-6b5a2817d25f',
    description: 'The Hario Ceramic Slim is a compact hand grinder with ceramic burrs for consistent grinding, perfect for travel or small kitchens.',
    price: 34.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Hario', url: 'https://www.hario.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') }
    ],
    wantedBy: [
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'user10', name: 'Lucas Brown', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' }
    ]
  },
  'Hario Range Server': {
    id: 'gear-hario-server',
    name: 'Hario Range Server 600ml',
    image: 'https://images.unsplash.com/photo-1544713297-9acff35e418e',
    description: 'The Hario Range Server is a heat-resistant glass server perfect for pour-over coffee, designed to complement the V60 dripper.',
    price: 19.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Hario', url: 'https://www.hario.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  },
  'Comandante C40': {
    id: 'gear-comandante',
    name: 'Comandante C40 MK3 Grinder',
    image: 'https://images.unsplash.com/photo-1575441347544-11725ca18b26',
    description: 'The Comandante C40 is a high-precision hand grinder with stainless steel burrs, known for its consistency and build quality.',
    price: 249.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' }
    ],
    usedBy: [
      { id: 'user2', name: 'Vértigo y Calambre', avatar: require('../../assets/businesses/vertigo-logo.jpg') },
      { id: 'user8', name: 'James Wilson', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' }
    ],
    wantedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ]
  },
  'Fellow Stagg EKG': {
    id: 'gear-stagg',
    name: 'Fellow Stagg EKG Electric Kettle',
    image: 'https://hola.coffee/cdn/shop/files/FELLOW-STAGG_1024x1024@2x.jpg?v=1732719228',
    description: 'The Fellow Stagg EKG is a precision electric pour-over kettle with variable temperature control and a sleek design.',
    price: 149.99,
    whereToBuy: [
      { name: 'Fellow Products', url: 'https://fellowproducts.com', location: 'Online' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ],
    wantedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' }
    ]
  },
  'Baratza Encore': {
    id: 'gear-encore',
    name: 'Baratza Encore Coffee Grinder',
    image: 'https://images.unsplash.com/photo-1606855637090-c6b478ca2635',
    description: 'The Baratza Encore is an entry-level burr grinder that provides consistent grounds for a variety of brewing methods.',
    price: 169.99,
    whereToBuy: [
      { name: 'Vértigo y Calambre', url: 'https://vertigoycalambre.com', location: 'Murcia, Spain' },
      { name: 'Baratza', url: 'https://baratza.com', location: 'Online' },
      { name: 'Amazon', url: 'https://amazon.com', location: 'Online' },
    ],
    usedBy: [
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ],
    wantedBy: [
      { id: 'user3', name: 'Carlos Hernández', avatar: require('../../assets/users/carlos-hernandez.jpg') },
      { id: 'user10', name: 'Lucas Brown', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' }
    ]
  },
  '9Barista': {
    id: 'gear-9barista',
    name: '9Barista Espresso Maker',
    image: 'https://9barista.com/wp-content/uploads/2022/10/9Barista-espresso-machine-front-800x800.jpg',
    description: 'The 9Barista is a revolutionary stovetop espresso machine that delivers true 9 bar pressure for authentic espresso at home.',
    price: 349.99,
    whereToBuy: [
      { name: '9Barista', url: 'https://9barista.com', location: 'Online' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' }
    ],
    usedBy: [
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'user6', name: 'David Kim', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
    ],
    wantedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user2', name: 'Vértigo y Calambre', avatar: require('../../assets/businesses/vertigo-logo.jpg') }
    ]
  },
  'Fellow Opus': {
    id: 'gear-fellow-opus',
    name: 'Fellow Opus Conical Burr Grinder',
    image: 'https://fellowproducts.com/cdn/shop/products/FellowProducts_OpusConicalBurrGrinder_MatteBlack_01.png',
    description: 'The Fellow Opus is a premium electric burr grinder with precision grinding capabilities for consistent and flavorful coffee.',
    price: 195.00,
    whereToBuy: [
      { name: 'Fellow Products', url: 'https://fellowproducts.com', location: 'Online' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' }
    ],
    usedBy: [
      { id: 'user9', name: 'Olivia Taylor', avatar: 'https://randomuser.me/api/portraits/women/12.jpg' },
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' }
    ],
    wantedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
    ]
  },
  'Acaia Pearl': {
    id: 'gear-acaia-pearl',
    name: 'Acaia Pearl Scale',
    image: 'https://images.unsplash.com/photo-1575441347548-0e745b37a5b8',
    description: 'The Acaia Pearl is a high-precision coffee scale with Bluetooth connectivity and brewing features for consistent coffee every time.',
    price: 149.99,
    whereToBuy: [
      { name: 'Acaia', url: 'https://acaia.co', location: 'Online' },
      { name: 'Specialty Coffee Shops', url: '', location: 'Various Locations' }
    ],
    usedBy: [
      { id: 'user7', name: 'Sophia Miller', avatar: 'https://randomuser.me/api/portraits/women/68.jpg' },
      { id: 'user2', name: 'Vértigo y Calambre', avatar: require('../../assets/businesses/vertigo-logo.jpg') }
    ],
    wantedBy: [
      { id: 'user1', name: 'Ivo Vilches', avatar: require('../../assets/users/ivo-vilches.jpg') },
      { id: 'user5', name: 'Emma Garcia', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' }
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
              name={inWishlist ? "bookmark" : "bookmark-outline"} 
              size={28} 
              color={inWishlist ? "#007AFF" : "#FFFFFF"} 
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