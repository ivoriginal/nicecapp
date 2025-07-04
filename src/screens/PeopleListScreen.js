import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAllUsers, getUsersByEmails, addNotificationForUser, getUser as getCurrentUser } from '../lib/supabase';
import { useNotifications } from '../context/NotificationsContext';
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
  const { addNotification } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showContactsBanner, setShowContactsBanner] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
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
  
  // Fetch users from Supabase
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        setCurrentUser(user);

        const supabaseUsers = await getAllUsers();

        let usersData = Array.isArray(supabaseUsers) ? supabaseUsers : [];

        // Filter out the current user and any business accounts if such a flag exists
        usersData = usersData.filter(u => u.id !== user?.id && !u?.isBusinessAccount);

        setPeople(usersData);
        setFilteredPeople(usersData);
      } catch (error) {
        console.error('Error fetching people from Supabase:', error);
        Alert.alert('Error', 'Unable to load users list.');
      } finally {
        setLoading(false);
      }
    };

    fetchPeople();
  }, []);
  
  // Filter people based on search query
  useEffect(() => {
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      const filtered = people.filter(person => {
        const name = person.userName || person.username || person.fullName || person.full_name || '';
        const fullName = person.fullName || person.full_name || '';
        return name.toLowerCase().includes(lower) || fullName.toLowerCase().includes(lower);
      });
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
      const { status } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your contacts to find people you know.',
          [{ text: 'OK' }]
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
      });

      if (!data?.length) {
        Alert.alert('No Contacts', 'No contacts found on your device.', [{ text: 'OK' }]);
        return;
      }

      // Extract unique email addresses
      const emailSet = new Set();
      data.forEach(contact => {
        (contact.emails || []).forEach(e => {
          if (e.email) emailSet.add(e.email.toLowerCase());
        });
      });

      const emailList = Array.from(emailSet);

      // Query Supabase for matching users
      const matchedUsers = await getUsersByEmails(emailList);

      // Ensure we have the latest currentUser info
      let activeUser = currentUser;
      if (!activeUser) {
        activeUser = await getCurrentUser();
        setCurrentUser(activeUser);
      }

      // Send notifications
      if (matchedUsers.length && activeUser) {
        // Notify matched users that current user joined
        matchedUsers.forEach(async (matchedUser) => {
          try {
            await addNotificationForUser({
              type: 'contact_joined',
              userId: activeUser.id,
              targetUserId: matchedUser.id,
              message: `${activeUser.user_metadata?.name || activeUser.email} just joined NiceCup!`,
              timestamp: new Date().toISOString(),
              read: false,
            });
          } catch (err) {
            console.error('Failed inserting remote notification:', err);
          }
        });

        // Local notification for current user
        addNotification({
          type: 'contacts_on_app',
          targetUserId: activeUser.id,
          message: `${matchedUsers.length} of your contacts are already on NiceCup!`,
        });
      }

      Alert.alert(
        'Contacts Connected',
        matchedUsers.length
          ? `We found ${matchedUsers.length} contacts already on NiceCup!`
          : `Found ${data.length} contacts. We'll notify you when they join NiceCup.`,
        [{ text: 'OK' }]
      );

      setShowContactsBanner(false);
    } catch (error) {
      console.error('Error accessing contacts:', error);
      Alert.alert('Error', 'There was an error accessing your contacts. Please try again.', [{ text: 'OK' }]);
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

  const renderUserItem = ({ item }) => {
    const displayName = item.userName || item.username || item.full_name || 'User';
    const handle = item.handle || item.email || '';
    const avatarSource = item.userAvatar || item.avatar_url || item.avatar || null;

    return (
      <TouchableOpacity 
        style={[styles.userCard, { backgroundColor: 'transparent' }]}
        onPress={() => navigation.navigate('UserProfileBridge', { 
          userId: item.id, 
          userName: displayName,
          skipAuth: true 
        })}
      >
        <AppImage 
          source={avatarSource} 
          style={styles.userAvatar}
          placeholder="person"
        />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.primaryText }]}>{displayName}</Text>
          {handle ? (
            <Text style={[styles.userHandle, { color: theme.secondaryText }]} numberOfLines={1}>{handle}</Text>
          ) : null}
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primaryText} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredPeople}
        renderItem={renderUserItem}
        keyExtractor={item => item.id?.toString()}
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