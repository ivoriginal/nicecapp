import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, SectionList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import mockUsers from '../data/mockUsers.json';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PeopleCard from '../components/PeopleCard';
import { COLORS, FONTS } from '../constants';
import AppImage from '../components/common/AppImage';
import FollowButton from '../components/FollowButton';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import { supabase } from '../lib/supabase';
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

const NewUserBadge = ({ theme }) => (
  <View style={[styles.newUserBadge, { backgroundColor: theme.accent || '#007AFF' }]}>
    <Text style={styles.newUserBadgeText}>New</Text>
  </View>
);

const SectionHeader = ({ title, theme }) => (
  <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
    <Text style={[styles.sectionHeaderText, { color: theme.primaryText }]}>{title}</Text>
  </View>
);

const PeopleListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { following, isFollowing, user: currentUser } = useCoffee();
  const [searchQuery, setSearchQuery] = useState('');
  const [showContactsBanner, setShowContactsBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [newUsers, setNewUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [allUnfollowedUsers, setAllUnfollowedUsers] = useState([]);
  const [supabaseProfiles, setSupabaseProfiles] = useState([]);
  
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

  // Load Supabase profiles to get updated avatar and profile data
  const loadSupabaseProfiles = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, location, created_at');
        
      if (error) {
        console.error('Error loading Supabase profiles:', error);
        return [];
      }
      
      console.log('Loaded Supabase profiles:', profiles);
      return profiles || [];
    } catch (error) {
      console.error('Error fetching Supabase profiles:', error);
      return [];
    }
  };

  // Enhanced user merging function
  const mergeUserData = (mockUser, supabaseProfile) => {
    if (!supabaseProfile) return mockUser;
    
    return {
      ...mockUser,
      // Prefer Supabase data for these fields if available
      userName: supabaseProfile.full_name || mockUser.userName,
      userHandle: supabaseProfile.username || mockUser.userHandle || mockUser.handle,
      handle: supabaseProfile.username || mockUser.handle || mockUser.userHandle,
      userAvatar: supabaseProfile.avatar_url || mockUser.userAvatar,
      location: supabaseProfile.location || mockUser.location,
      created_at: supabaseProfile.created_at || mockUser.joinedDate || mockUser.created_at,
      // Keep the original mock data as fallback
      ...mockUser
    };
  };
  
  // Fetch people data
  const fetchPeople = async () => {
    try {
      // Load Supabase profiles for updated data
      const profiles = await loadSupabaseProfiles();
      setSupabaseProfiles(profiles);
      
      // Create a map for quick lookup
      const profilesMap = {};
      profiles.forEach(profile => {
        profilesMap[profile.id] = profile;
      });

      // If we have suggestedUsers from SearchScreen, use those
      if (route.params?.suggestedUsers) {
        const suggestedUsers = route.params.suggestedUsers.map(user => {
          const supabaseProfile = profilesMap[user.id];
          return mergeUserData(user, supabaseProfile);
        });
        
        // Split into new and other users based on join date
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const newUsersList = suggestedUsers.filter(user => {
          const joinDate = new Date(user.created_at || user.joinedDate || '2024-01-01');
          return joinDate > oneWeekAgo;
        });
        
        const otherUsersList = suggestedUsers.filter(user => {
          const joinDate = new Date(user.created_at || user.joinedDate || '2024-01-01');
          return joinDate <= oneWeekAgo;
        });

        setNewUsers(newUsersList);
        setOtherUsers(otherUsersList);
        setAllUnfollowedUsers(suggestedUsers);
      } else {
        // Get all users from mockUsers and merge with Supabase data
        const allUsers = mockUsers.users.map(user => {
          const supabaseProfile = profilesMap[user.id];
          return mergeUserData(user, supabaseProfile);
        });
        
        // Filter out users we already follow
        const unfollowedUsers = allUsers.filter(user => !isFollowing(user.id));
        
        // Store all unfollowed users for filtering
        setAllUnfollowedUsers(unfollowedUsers);
        
        // Split into new and other users
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const newUsersList = unfollowedUsers.filter(user => {
          const joinDate = new Date(user.created_at || user.joinedDate || user.joinDate || '2024-01-01');
          return joinDate > oneWeekAgo;
        });
        
        const otherUsersList = unfollowedUsers.filter(user => {
          const joinDate = new Date(user.created_at || user.joinedDate || user.joinDate || '2024-01-01');
          return joinDate <= oneWeekAgo;
        });

        setNewUsers(newUsersList);
        setOtherUsers(otherUsersList);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or following list changes
  useEffect(() => {
    fetchPeople();
  }, [following, route.params?.suggestedUsers]);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('PeopleListScreen focused - refreshing data to show updated avatars');
      // Refresh data when screen comes into focus to show updated avatars
      fetchPeople();
    }, [following, route.params?.suggestedUsers])
  );
  
  // Filter people based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = allUnfollowedUsers.filter(person => 
        person.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.userHandle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setNewUsers([]);
      setOtherUsers(filtered);
    } else {
      // Reset to original data when search is cleared
      fetchPeople();
    }
  }, [searchQuery]);

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
    // Share app invitation
    Alert.alert(
      'Invite Friends',
      'Share the app with your friends',
      [
        {
          text: 'Share',
          onPress: () => {
            // Here you would implement actual sharing functionality
            Alert.alert('Share', 'Sharing app invitation...');
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      }
    );
  };

  const handleUserPress = (user) => {
    console.log('PeopleListScreen - handleUserPress called with user:', user);
    
    // Navigate to UserProfileBridge for proper user resolution
    navigation.navigate('UserProfileBridge', {
      userId: user.id,
      userName: user.userName || user.name || user.full_name,
      userAvatar: user.userAvatar || user.avatar_url,
      location: user.location,
      isCurrentUser: false,
      skipAuth: true
    });
  };

  const renderUserItem = ({ item, section }) => {
    // Generate a fallback handle if none exists
    const displayHandle = item.handle || 
                         item.userHandle || 
                         item.username || 
                         `@${(item.userName || item.name || item.full_name || 'user').toLowerCase().replace(/\s+/g, '')}`;
    
    return (
      <TouchableOpacity 
        style={[styles.userCard, { backgroundColor: 'transparent' }]}
        onPress={() => handleUserPress(item)}
      >
        <AppImage 
          source={item.userAvatar || item.avatar_url || item.avatar} 
          style={styles.userAvatar}
          placeholder="person"
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={[styles.userName, { color: theme.primaryText }]}>
              {item.userName || item.name || item.full_name || 'User'}
            </Text>
            {item.isNew && <NewUserBadge theme={theme} />}
          </View>
          <Text style={[styles.userHandle, { color: theme.secondaryText }]} numberOfLines={1}>
            {displayHandle}
          </Text>
        </View>
        <FollowButton 
          userId={item.id}
          style={[styles.followButton, { backgroundColor: isDarkMode ? '#FFFFFF' : '#000000' }]}
        />
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => {
    if (!section.data.length || !section.title) return null;
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
        <Text style={[styles.sectionHeaderText, { color: theme.primaryText }]}>
          {section.title}
        </Text>
      </View>
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

  const sections = [
    {
      title: '', // Remove the "New Users" title
      data: newUsers
    },
    {
      title: searchQuery ? 'Search Results' : '',
      data: otherUsers
    }
  ].filter(section => section.data.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          renderItem={renderUserItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeader}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          style={styles.sectionList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.secondaryText }]}>
            {loading ? 'Loading people...' : 'No people found'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Will be overridden by inline style
  },
  sectionList: {
    flex: 1,
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
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  // New user badge styles
  newUserBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  newUserBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Section header styles
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },

});

export default PeopleListScreen; 