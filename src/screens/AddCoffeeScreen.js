import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { CoffeeContext } from '../context/CoffeeContext';
import { supabase } from '../lib/supabase';
import { useCoffee } from '../context/CoffeeContext';
import { Ionicons } from '@expo/vector-icons';

export default function AddCoffeeScreen({ navigation, route }) {
  const { addCoffeeEvent } = useCoffee();
  const [coffeeData, setCoffeeData] = useState({
    name: '',
    method: '',
    amount: '',
    grindSize: '',
    waterVolume: '',
    brewTime: '',
    rating: '',
    notes: '',
    bloomTime: '',
    bloomWater: '',
    pour2Time: '',
    pour2Water: '',
    pour3Time: '',
    pour3Water: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    // Auto-focus the coffee name input when the screen mounts
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
      }
    }, 100);
  }, []);

  useEffect(() => {
    // Check if we should save (triggered by the Save button in the modal)
    if (route.params?.shouldSave) {
      handleSave();
    }
  }, [route.params?.shouldSave]);

  const searchCoffeeDatabase = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('coffee_events')
        .select('coffeename, method, amount, grindsize, watervolume, brewtime, rating, notes, bloomtime, bloomwater, pour2time, pour2water, pour3time, pour3water')
        .ilike('coffeename', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error searching coffee database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (text) => {
    setCoffeeData({ ...coffeeData, name: text });
    searchCoffeeDatabase(text);
  };

  const handleSuggestionPress = (suggestion) => {
    setCoffeeData({
      ...coffeeData,
      name: suggestion.coffeename,
      method: suggestion.method || '',
      amount: suggestion.amount || '',
      grindSize: suggestion.grindsize || '',
      waterVolume: suggestion.watervolume || '',
      brewTime: suggestion.brewtime || '',
      rating: suggestion.rating || '',
      notes: suggestion.notes || '',
      bloomTime: suggestion.bloomtime || '',
      bloomWater: suggestion.bloomwater || '',
      pour2Time: suggestion.pour2time || '',
      pour2Water: suggestion.pour2water || '',
      pour3Time: suggestion.pour3time || '',
      pour3Water: suggestion.pour3water || '',
    });
    setSuggestions([]);
  };

  const handleSave = async () => {
    try {
      await addCoffeeEvent({
        coffeeName: coffeeData.name,
        method: coffeeData.method,
        amount: coffeeData.amount,
        grindSize: coffeeData.grindSize,
        waterVolume: coffeeData.waterVolume,
        brewTime: coffeeData.brewTime,
        rating: coffeeData.rating,
        notes: coffeeData.notes,
        bloomTime: coffeeData.bloomTime,
        bloomWater: coffeeData.bloomWater,
        pour2Time: coffeeData.pour2Time,
        pour2Water: coffeeData.pour2Water,
        pour3Time: coffeeData.pour3Time,
        pour3Water: coffeeData.pour3Water,
        timestamp: new Date().toISOString(),
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error saving coffee:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Coffee Name</Text>
        <TextInput
          ref={nameInputRef}
          style={styles.input}
          value={coffeeData.name}
          onChangeText={handleNameChange}
          placeholder="Enter coffee name"
          placeholderTextColor="#999"
        />
        {isLoading && (
          <ActivityIndicator style={styles.loader} size="small" color="#000000" />
        )}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((suggestion, index) => (
              <Text
                key={index}
                style={styles.suggestion}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                {suggestion.coffeename}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Method</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.method}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, method: text })}
          placeholder="Enter brewing method"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Amount (g)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.amount}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, amount: text })}
          placeholder="Enter coffee amount in grams"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Grind Size</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.grindSize}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, grindSize: text })}
          placeholder="Enter grind size"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Water Volume (ml)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.waterVolume}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, waterVolume: text })}
          placeholder="Enter water volume in ml"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Brew Time</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.brewTime}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, brewTime: text })}
          placeholder="Enter brew time"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Rating (1-5)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.rating}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, rating: text })}
          placeholder="Enter rating (1-5)"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bloom Time</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.bloomTime}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, bloomTime: text })}
          placeholder="Enter bloom time"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bloom Water (ml)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.bloomWater}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, bloomWater: text })}
          placeholder="Enter bloom water volume"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pour 2 Time</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.pour2Time}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, pour2Time: text })}
          placeholder="Enter pour 2 time"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pour 2 Water (ml)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.pour2Water}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, pour2Water: text })}
          placeholder="Enter pour 2 water volume"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pour 3 Time</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.pour3Time}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, pour3Time: text })}
          placeholder="Enter pour 3 time"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pour 3 Water (ml)</Text>
        <TextInput
          style={styles.input}
          value={coffeeData.pour3Water}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, pour3Water: text })}
          placeholder="Enter pour 3 water volume"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={coffeeData.notes}
          onChangeText={(text) => setCoffeeData({ ...coffeeData, notes: text })}
          placeholder="Enter tasting notes"
          multiline
          numberOfLines={4}
          placeholderTextColor="#999"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#000000',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    zIndex: 1000,
    marginTop: 4,
  },
  suggestion: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    color: '#000000',
  },
  loader: {
    position: 'absolute',
    right: 12,
    top: 40,
  },
}); 