import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import mockUsers from '../data/mockUsers.json';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PeopleCard from '../components/PeopleCard';
import { COLORS, FONTS } from '../constants';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';

const PeopleListScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Simulate fetching people data
  useEffect(() => {
    const fetchPeople = () => {
      // Get users from mockUsers and filter out business accounts
      const usersData = (mockUsers.users || []).filter(user => 
        !user.isBusinessAccount && 
        user.userName !== 'Vértigo y Calambre' && 
        user.userName !== 'You' &&
        !user.id.includes('business')
      );
      setPeople(usersData);
      setFilteredPeople(usersData);
      setLoading(false);
    };
    
    fetchPeople();
  }, []);
  
  // Filter people based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = people.filter(person => 
        person.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPeople(filtered);
    } else {
      setFilteredPeople(people);
    }
  }, [searchQuery, people]);
  
  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const renderUserItem = ({ item }) => {
    // Handle avatar source based on user
    let avatar;
    
    if (item.id === 'user11') {
      // Use the AppImage component with the string path which it knows how to handle
      return (
        <TouchableOpacity 
          style={[styles.userCard, { backgroundColor: 'transparent' }]}
          onPress={() => navigation.navigate('UserProfileBridge', { 
            userId: item.id, 
            userName: item.userName || item.name,
            skipAuth: true 
          })}
        >
          <AppImage 
            source="assets/users/elias-veris.jpg" 
            style={styles.userAvatar}
            placeholder="person"
          />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.primaryText }]}>{item.userName || item.name}</Text>
            <Text style={[styles.userHandle, { color: theme.secondaryText }]} numberOfLines={1}>{item.handle}</Text>
          </View>
          <TouchableOpacity style={[styles.followButton, { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            <Text style={[styles.followButtonText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Follow</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[styles.userCard, { backgroundColor: 'transparent' }]}
        onPress={() => navigation.navigate('UserProfileBridge', { 
          userId: item.id, 
          userName: item.userName || item.name,
          skipAuth: true 
        })}
      >
        <AppImage 
          source={item.userAvatar || item.avatar} 
          style={styles.userAvatar}
          placeholder="person"
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.primaryText }]}>{item.userName || item.name}</Text>
          <Text style={[styles.userHandle, { color: theme.secondaryText }]} numberOfLines={1}>{item.handle}</Text>
        </View>
        <TouchableOpacity style={[styles.followButton, { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          <Text style={[styles.followButtonText, { color: isDarkMode ? '#000000' : '#FFFFFF' }]}>Follow</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredPeople}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.usersList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Will be overridden by inline style
  },
  usersList: {
    padding: 0,
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Will be overridden by inline style
    padding: 12,
    paddingVertical: 8,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 50,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  followButton: {
    backgroundColor: '#000000', // Will be overridden by inline style
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PeopleListScreen; 