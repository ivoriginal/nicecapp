import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderConfirmationScreen = ({ route, navigation }) => {
  const { orderNumber, orderTotal } = route.params || { orderNumber: '123456', orderTotal: 0 };
  
  const handleContinueShopping = () => {
    // Navigate to the home/product screen
    navigation.navigate('Home');
  };
  
  const handleViewOrders = () => {
    // Navigate to orders history screen (if you have one)
    // navigation.navigate('OrdersHistory');
    // For now, just go back to home
    navigation.navigate('Home');
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>
        </View>
        
        <Text style={styles.title}>Order Confirmed!</Text>
        <Text style={styles.message}>
          Your order has been placed successfully. We'll process it right away!
        </Text>
        
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Order Number:</Text>
            <Text style={styles.cardValue}>#{orderNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Amount Paid:</Text>
            <Text style={styles.cardValue}>€{orderTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Payment Method:</Text>
            <Text style={styles.cardValue}>Credit Card</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Estimated Delivery:</Text>
            <Text style={styles.cardValue}>{getEstimatedDeliveryDate()}</Text>
          </View>
        </View>
        
        <Text style={styles.detailText}>
          You will receive a confirmation email with order details shortly.
        </Text>
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleContinueShopping}
        >
          <Text style={styles.primaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleViewOrders}
        >
          <Text style={styles.secondaryButtonText}>View My Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Helper function to calculate estimated delivery date (3-5 business days from now)
const getEstimatedDeliveryDate = () => {
  const today = new Date();
  // Add 3-5 days
  const daysToAdd = 3 + Math.floor(Math.random() * 3); // Random between 3-5
  const deliveryDate = new Date(today);
  deliveryDate.setDate(today.getDate() + daysToAdd);
  
  // Format date as "Month Day, Year"
  return deliveryDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2E7D32', // Green color
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cardLabel: {
    fontSize: 15,
    color: '#666',
  },
  cardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: '#4A80F0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A80F0',
  },
  secondaryButtonText: {
    color: '#4A80F0',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderConfirmationScreen; 