import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@shopping_cart';

// Get all cart items
export const getCartItems = async () => {
  try {
    const cartData = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error getting cart items:', error);
    return [];
  }
};

// Add an item to the cart
export const addToCart = async (product, quantity = 1) => {
  try {
    const cartItems = await getCartItems();
    
    // Check if the product is already in the cart
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Update quantity if product already exists
      cartItems[existingItemIndex].quantity += quantity;
    } else {
      // Add new product to cart
      cartItems.push({
        ...product,
        quantity
      });
    }
    
    // Save updated cart
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    return cartItems;
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (productId, quantity) => {
  try {
    const cartItems = await getCartItems();
    const itemIndex = cartItems.findIndex(item => item.id === productId);
    
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cartItems.splice(itemIndex, 1);
      } else {
        // Update quantity
        cartItems[itemIndex].quantity = quantity;
      }
      
      // Save updated cart
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
    
    return cartItems;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    throw error;
  }
};

// Remove item from cart
export const removeFromCart = async (productId) => {
  try {
    const cartItems = await getCartItems();
    const updatedCart = cartItems.filter(item => item.id !== productId);
    
    // Save updated cart
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    return updatedCart;
  } catch (error) {
    console.error('Error removing from cart:', error);
    throw error;
  }
};

// Clear the entire cart
export const clearCart = async () => {
  try {
    await AsyncStorage.removeItem(CART_STORAGE_KEY);
    return [];
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Get cart total price
export const getCartTotal = async () => {
  try {
    const cartItems = await getCartItems();
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return 0;
  }
}; 