import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useCoffee } from '../context/CoffeeContext';
import AppImage from '../components/common/AppImage';
import FollowButton from '../components/FollowButton';
import { supabase } from '../lib/supabase';

export default function FollowersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { isFollowing, currentAccount } = useCoffee();
  const { userId, userName, type = 'followers', skipAuth } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: type === 'followers' ? 'Followers' : 'Following',
      headerStyle: {
        backgroundColor: theme.background,
      },
      headerTintColor: theme.primaryText,
      headerTitleStyle: {
        color: theme.primaryText,
      },
    });
  }, [navigation, type, theme]);

  // Load followers/following data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!userId) {
        setUsers([]);
        return;
      }

      let userIds = [];

      if (type === 'followers') {
        // Get users who follow this user
        const { data: followersData, error: followersError } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);

        if (followersError) {
          console.error('Error loading followers:', followersError);
          setError('Failed to load followers');
          return;
        }

        userIds = (followersData || []).map(f => f.follower_id);
      } else {
        // Get users that this user follows
        const { data: followingData, error: followingError } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);

        if (followingError) {
          console.error('Error loading following:', followingError);
          setError('Failed to load following');
          return;
        }

        userIds = (followingData || []).map(f => f.following_id);
      }

      if (userIds.length === 0) {
        setUsers([]);
        return;
      }

      // Get profile data for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        setError('Failed to load user profiles');
        return;
      }

      // Map profiles to user objects with follow status
      const userObjects = (profilesData || []).map(profile => {
        return {
          id: profile.id,
          userName: profile.full_name || profile.username || profile.email?.split('@')[0] || 'User',
          userAvatar: profile.avatar_url,
          handle: profile.username ? `@${profile.username}` : null,
          location: profile.location,
          isBusinessAccount: profile.account_type === 'business' || profile.account_type === 'cafe',
          isFollowing: currentAccount ? isFollowing(profile.id) : false
        };
      });

      setUsers(userObjects);
    } catch (err) {
      console.error('Error loading followers/following:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, type, currentAccount, isFollowing]);

  // Refresh data when screen comes into focus (after navigating back from profile)
  useFocusEffect(
    React.useCallback(() => {
      if (userId) {
        console.log('FollowersScreen focused - refreshing data to show updated counts');
        loadData();
      }
    }, [userId, type, currentAccount])
  );

  const handleUserPress = (user) => {
    console.log('FollowersScreen: handleUserPress called with user:', user.id, user.userName);
    console.log('FollowersScreen: currentAccount:', currentAccount);
    console.log('FollowersScreen: user.id === currentAccount:', user.id === currentAccount);
    console.log('FollowersScreen: typeof user.id:', typeof user.id);
    console.log('FollowersScreen: typeof currentAccount:', typeof currentAccount);
    
    // If this is the current user, navigate to their own profile screen
    if (user.id === currentAccount) {
      console.log('FollowersScreen: Navigating to own Profile tab via MainTabs');
      try {
        // Navigate to the main tabs and then to the Profile tab
        navigation.navigate('MainTabs', { screen: 'Profile' });
        console.log('FollowersScreen: Navigation to MainTabs succeeded');
      } catch (error) {
        console.error('FollowersScreen: Navigation to MainTabs failed:', error);
        // Fallback: try to go back to the main tabs
        navigation.goBack();
      }
      return;
    }
    
    // Otherwise, navigate to the user's profile screen
    console.log('FollowersScreen: Navigating to UserProfileScreen for other user');
    navigation.navigate('UserProfileScreen', {
      userId: user.id,
      userName: user.userName,
      skipAuth: true
    });
  };

  const handleFollowChange = (userId, isFollowing) => {
    // Update the local state
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isFollowing } : user
      )
    );
    
    // In a real app, you would also call an API to update the follow status
    console.log(`User ${userId} follow status changed to ${isFollowing}`);
  };

  const renderUser = ({ item }) => (
    <View style={[styles.userItem, { backgroundColor: theme.background, borderBottomColor: theme.divider }]}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => handleUserPress(item)}
        activeOpacity={0.7}
      >
        <AppImage
          source={item.userAvatar}
          style={[
            styles.avatar,
            item.isBusinessAccount ? styles.businessAvatar : styles.userAvatar
          ]}
          placeholder="person"
        />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: theme.primaryText }]}>
            {item.userName}
          </Text>
          <Text style={[styles.userHandle, { color: theme.secondaryText }]}>
            {item.handle || `@${item.userName?.toLowerCase().replace(/\s+/g, '')}`}
          </Text>
          {/* {item.location && (
            <Text style={[styles.userLocation, { color: theme.secondaryText }]}>
              {item.location}
            </Text>
          )} */}
        </View>
      </TouchableOpacity>
      
      {/* Don't show follow button for current user */}
      {item.id !== currentAccount && (
        <FollowButton
          userId={item.id}
          isFollowing={item.isFollowing}
          onFollowChanged={handleFollowChange}
          style={styles.followButton}
        />
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={type === 'followers' ? 'people-outline' : 'person-add-outline'} 
        size={50} 
        color={theme.secondaryText} 
      />
      <Text style={[styles.emptyText, { color: theme.primaryText }]}>
        {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.secondaryText }]}>
        {type === 'followers' 
          ? 'When people follow this user, they\'ll appear here'
          : 'When this user follows people, they\'ll appear here'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primaryText} />
        <Text style={[styles.loadingText, { color: theme.primaryText }]}>
          Loading {type}...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.primaryText }]}>
          {error}
        </Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: theme.primaryText }]}
          onPress={() => {
            setError(null);
            // Trigger reload
          }}
        >
          <Text style={[styles.retryButtonText, { color: theme.background }]}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light" : "dark"} />
      
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          users.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 0,
    paddingTop: 8,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 8,
    // borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    marginRight: 12,
    // borderWidth: 1,
    // borderColor: '#E5E5E5',
  },
  userAvatar: {
    borderRadius: 25,
  },
  businessAvatar: {
    borderRadius: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 14,
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 13,
  },
  followButton: {
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  });