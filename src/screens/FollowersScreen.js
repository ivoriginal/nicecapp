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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import AppImage from '../components/common/AppImage';
import FollowButton from '../components/FollowButton';
import { mockFollowersData } from '../data/mockFollowers';
import mockUsers from '../data/mockUsers.json';

export default function FollowersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { userId, userName, type = 'followers', skipAuth } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  // Set header title
  useEffect(() => {
    navigation.setOptions({
      title: type === 'followers' ? 'Followers' : 'Following',
      headerStyle: {
        backgroundColor: theme.cardBackground,
      },
      headerTintColor: theme.primaryText,
      headerTitleStyle: {
        color: theme.primaryText,
      },
    });
  }, [navigation, type, theme]);

  // Load followers/following data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the user's follower data
        const userFollowerData = mockFollowersData[userId];
        
        if (!userFollowerData) {
          setUsers([]);
          return;
        }

        // Get the list of user IDs based on type
        const userIds = type === 'followers' 
          ? userFollowerData.followers || []
          : userFollowerData.following || [];

        // Map user IDs to full user objects
        const userObjects = userIds
          .map(id => mockUsers.users.find(user => user.id === id))
          .filter(Boolean) // Remove any null/undefined users
          .map(user => ({
            ...user,
            isFollowing: type === 'followers' ? false : true, // For now, assume we're not following followers, but we are following people we follow
            // Ensure business account identification is consistent
            isBusinessAccount: user.isBusinessAccount || 
                             user.userName === 'Vértigo y Calambre' || 
                             user.userName === 'Kima Coffee' ||
                             (user.userName && user.userName.includes('Café')) ||
                             user.id?.startsWith('business-')
          }));

        setUsers(userObjects);
      } catch (err) {
        console.error('Error loading followers/following:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId, type]);

  const handleUserPress = (user) => {
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
    <View style={[styles.userItem, { backgroundColor: theme.cardBackground, borderBottomColor: theme.divider }]}>
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
          {item.location && (
            <Text style={[styles.userLocation, { color: theme.secondaryText }]}>
              {item.location}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <FollowButton
        userId={item.id}
        isFollowing={item.isFollowing}
        onFollowChanged={handleFollowChange}
        style={styles.followButton}
      />
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
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    borderWidth: 1,
    borderColor: '#E5E5E5',
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