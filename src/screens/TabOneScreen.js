import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import mockCoffees from '../data/mockCoffees.json';
import mockRecipes from '../data/mockRecipes.json';
import mockUsers from '../data/mockUsers.json';
import mockEvents from '../data/mockEvents.json';
import { useCoffee } from '../context/CoffeeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppImage from '../components/common/AppImage';
import CoffeeCard from '../components/CoffeeCard';
import EventCard from '../components/EventCard';
import RecipeCard from '../components/RecipeCard';
import ThemeCoffeeLogCard from '../components/ThemeCoffeeLogCard';
import { COLORS, FONTS } from '../constants';

export default function TabOneScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const { user } = useCoffee();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trendingCoffees, setTrendingCoffees] = useState([]);
  const [trendingRecipes, setTrendingRecipes] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [suggestedProfiles, setSuggestedProfiles] = useState([]);
  
  // Load data on component mount
  useEffect(() => {
    loadHomeData();
  }, []);
  
  const loadHomeData = () => {
    // Simulate network request
    setTimeout(() => {
      try {
        // Get trending coffees from mockCoffees
        const coffees = mockCoffees.coffees
          .filter(coffee => coffee.isTrending)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5);
        setTrendingCoffees(coffees);
        
        // Get trending recipes from mockRecipes
        const recipes = mockRecipes
          .filter(recipe => recipe.isTrending)
          .sort((a, b) => b.likes - a.likes)
          .slice(0, 5);
        setTrendingRecipes(recipes);
        
        // Get upcoming events from mockEvents
        const today = new Date();
        const events = mockEvents.events
          .filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today;
          })
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 3);
        setUpcomingEvents(events);
        
        // Get suggested profiles from mockUsers
        const profiles = mockUsers.users
          .filter(user => user.id !== 'currentUser' && !user.isBusinessAccount)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setSuggestedProfiles(profiles);
        
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Error loading home data:', error);
        setLoading(false);
        setRefreshing(false);
      }
    }, 1000);
  };
  
  const handleCoffeePress = (coffee) => {
    navigation.navigate('CoffeeDetailScreen', { coffeeId: coffee.id });
  };
  
  const handleRecipePress = (recipe) => {
    navigation.navigate('RecipeDetailScreen', { recipeId: recipe.id });
  };
  
  const handleEventPress = (event) => {
    navigation.navigate('EventDetailScreen', { eventId: event.id });
  };
  
  const handleUserPress = (user) => {
    navigation.navigate('ProfileScreen', { userId: user.id });
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadHomeData();
  };

  const renderItem = ({ item }) => {
    // Find the coffee image from mockCoffees.coffees
    const coffeeData = mockCoffees.coffees.find(c => c.id === item.coffeeId || c.name === item.coffeeName);
    const imageUrl = coffeeData?.imageUrl || 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd';
    
    return (
      <CoffeeCard
        coffee={item}
        imageSource={{ uri: imageUrl }}
        username={item.username}
        method={item.method}
        rating={item.rating || 3}
        onPress={() => handleCoffeePress(item)}
      />
    );
  };

  if (coffeeEvents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Here you'll see all your coffee logs. Follow your friends to see what they're drinking.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...coffeeEvents].reverse()}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20,
  },
  emptyText: { 
    fontSize: 18, 
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 25
  },
  separator: {
    height: 8,
  }
}); 