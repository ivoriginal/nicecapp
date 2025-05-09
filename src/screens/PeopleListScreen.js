import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import mockUsers from '../data/mockUsers.json';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PeopleCard from '../components/PeopleCard';
import { COLORS, FONTS } from '../constants';
import AppImage from '../components/common/AppImage';

const PeopleListScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Simulate fetching people data
  useEffect(() => {
    const fetchPeople = () => {
      // Simulate API call delay
      setTimeout(() => {
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
      }, 1000);
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
          style={styles.userCard}
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
            <Text style={styles.userName}>{item.userName || item.name}</Text>
            <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    
    return (
      <TouchableOpacity 
        style={styles.userCard}
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
          <Text style={styles.userName}>{item.userName || item.name}</Text>
          <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>
        </View>
        <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followButtonText}>Follow</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text>
            <Ionicons name="arrow-back" size={24} color="#000000" />
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>People</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  usersList: {
    padding: 0,
    paddingVertical: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    // borderBottomWidth: 1,
    // borderBottomColor: '#E0E0E0',
    padding: 12,
    paddingVertical: 8,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: '#D0D0D0',
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
  userBio: {
    fontSize: 14,
    color: '#666666',
  },
  followButton: {
    backgroundColor: '#000000',
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