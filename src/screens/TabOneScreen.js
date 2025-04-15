import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import { useCoffee } from '../context/CoffeeContext';
import CoffeeCard from '../components/CoffeeCard';
import { useNavigation } from '@react-navigation/native';

// Temporary mock data - replace with your actual data source
const mockCoffees = [
  {
    name: 'Ethiopian Yirgacheffe',
    imageUrl: 'https://example.com/ethiopian.jpg',
  },
  {
    name: 'Colombian Supremo',
    imageUrl: 'https://example.com/colombian.jpg',
  },
];

export default function TabOneScreen() {
  const { coffeeEvents } = useCoffee();
  const navigation = useNavigation();

  const handleCoffeePress = (coffeeName) => {
    const coffee = coffeeEvents.find(event => event.coffeeName === coffeeName);
    if (coffee) {
      navigation.navigate('CoffeeDetails', {
        coffee: {
          title: coffee.coffeeName,
          description: coffee.notes || '',
          username: coffee.username,
          method: coffee.method,
          amount: coffee.amount,
          grindSize: coffee.grindSize,
          waterVolume: coffee.waterVolume,
          brewTime: coffee.brewTime,
          isPublic: coffee.isPublic,
          rating: coffee.rating || 3,
          notes: coffee.notes
        }
      });
    }
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
        renderItem={({ item }) => {
          let description = '';
          if (item.amount) {
            description += `${item.amount} grams`;
          }
          if (item.grindSize) {
            description += description ? `, Grind Size: ${item.grindSize}` : `Grind Size: ${item.grindSize}`;
          }

          const coffeeData = mockCoffees.find(c => c.name.trim() === (item.coffeeName ? item.coffeeName.trim() : ''));
          const imageUrl = coffeeData?.imageUrl;

          return (
            <CoffeeCard
              title={item.coffeeName}
              description={description}
              imageUrl={imageUrl}
              username={item.username}
              method={item.method}
              rating={item.rating || 3}
              onPress={() => handleCoffeePress(item.coffeeName)}
            />
          );
        }}
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