import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchProductById } from '../services/api';
import { addToCart } from '../services/cartService';
import LoadingScreen from '../components/common/LoadingScreen';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const getProductDetails = async () => {
      try {
        const data = await fetchProductById(productId);
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product details:', error);
        Alert.alert('Error', 'Failed to load product details');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    getProductDetails();
  }, [productId, navigation]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
      Alert.alert(
        'Success', 
        `${product.name} added to cart!`,
        [{ text: 'OK' }]
      );
    }
  };

  const increaseQuantity = () => setQuantity(prev => prev + 1);
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Product not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={{ uri: product.imageUrl }} 
          style={styles.productImage}
        />
        
        <View style={styles.contentContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>€{product.price.toFixed(2)}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.quantityContainer}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={decreaseQuantity}
                disabled={quantity <= 1}
              >
                <Icon name="remove" size={24} color={quantity <= 1 ? "#CCCCCC" : "#333"} />
              </TouchableOpacity>
              
              <Text style={styles.quantityValue}>{quantity}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={increaseQuantity}
              >
                <Icon name="add" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
          
          {product.inStock ? (
            <View style={styles.inStockContainer}>
              <Icon name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.inStockText}>In Stock</Text>
            </View>
          ) : (
            <View style={styles.outOfStockContainer}>
              <Icon name="cancel" size={18} color="#F44336" />
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.addToCartButton, 
              !product.inStock && styles.disabledButton
            ]}
            onPress={handleAddToCart}
            disabled={!product.inStock}
          >
            <Text style={styles.addToCartButtonText}>
              Add to Cart
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  productImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 22,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 15,
    minWidth: 40,
    textAlign: 'center',
  },
  inStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inStockText: {
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8,
  },
  outOfStockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  outOfStockText: {
    fontSize: 16,
    color: '#F44336',
    marginLeft: 8,
  },
  addToCartButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  addToCartButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProductDetailScreen; 