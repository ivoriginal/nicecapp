import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import mockUsers from '../data/mockUsers.json';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PeopleCard from '../components/PeopleCard';
import { COLORS, FONTS } from '../constants';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';
import * as Contacts from 'expo-contacts';

const ContactsBanner = ({ onConnect, theme, isDarkMode }) => (
  <TouchableOpacity 
    style={[
      styles.bannerContainer, 
      { 
        backgroundColor: isDarkMode ? theme.cardBackground : '#F5F5F5',
        borderColor: theme.divider
      }
    ]}
    onPress={onConnect}
    activeOpacity={0.8}
  >
    <View style={styles.bannerIconContainer}>
      <Ionicons name="people-circle-outline" size={24} color={theme.primaryText} />
    </View>
    <View style={styles.bannerContent}>
      <Text style={[styles.bannerTitle, { color: theme.primaryText }]}>
        Connect your contacts
      </Text>
      <Text style={[styles.bannerSubtitle, { color: theme.secondaryText }]}>
        Find people you know
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
  </TouchableOpacity>
);

const PeopleListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showContactsBanner, setShowContactsBanner] = useState(true);
  
  // Configure navigation header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleInvite}
          style={{ marginRight: 16 }}
        >
          <Text style={[
            styles.inviteButton,
            { color: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}>Invite</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDarkMode]);
  
  // Hide banner in followers/followees views
  useEffect(() => {
    if (route.params?.type === 'followers' || route.params?.type === 'following') {
      setShowContactsBanner(false);
    }
  }, [route.params?.type]);
  
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

  const handleConnectContacts = async () => {
    try {
      // Request permission to access contacts
      const { status } = await Contacts.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Permission granted, fetch contacts
        const { data } = await Contacts.getContactsAsync({
          fields: [
            Contacts.Fields.Name,
            Contacts.Fields.PhoneNumbers,
            Contacts.Fields.Emails,
          ],
        });

        if (data.length > 0) {
          // Here you would typically:
          // 1. Send these contacts to your backend
          // 2. Match them against your user database
          // 3. Show matching results to the user
          
          // For now, we'll just show a success message
          Alert.alert(
            "Contacts Found",
            `Found ${data.length} contacts. We'll look for matches and notify you.`,
            [{ text: "OK" }]
          );
          
          // Hide the banner after successful connection
          setShowContactsBanner(false);
        } else {
          Alert.alert(
            "No Contacts",
            "No contacts found on your device.",
            [{ text: "OK" }]
          );
        }
      } else {
        Alert.alert(
          "Permission Required",
          "Please allow access to your contacts to find people you know.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "There was an error accessing your contacts. Please try again.",
        [{ text: "OK" }]
      );
      console.error('Error accessing contacts:', error);
    }
  };

  const handleInvite = () => {
    // Show coming soon alert for invitations
    Alert.alert(
      'Invitations Coming Soon',
      'Currently in private beta.',
      [
        {
          text: 'OK',
          style: 'default',
        },
      ],
      {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light',
      }
    );
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

  const ListHeader = () => (
    showContactsBanner ? (
      <ContactsBanner 
        onConnect={handleConnectContacts}
        theme={theme}
        isDarkMode={isDarkMode}
      />
    ) : null
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredPeople}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.usersList}
        ListHeaderComponent={ListHeader}
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
  // New styles for the contacts banner
  // aka contacts banner styles
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerIconContainer: {
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
  },
  inviteButton: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PeopleListScreen; 