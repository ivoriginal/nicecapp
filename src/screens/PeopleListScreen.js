import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';
import { useCoffee } from '../context/CoffeeContext';
import AppImage from '../components/common/AppImage';

const PeopleListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useCoffee();
  
  // Filter out business accounts and the "You" user
  const filteredUsers = mockData.users.filter(user => {
    // Skip business accounts (user2 is Vértigo y Calambre)
    if (user.id === 'user2' || user.businessAccount || user.isBusinessAccount || user.id.startsWith('business-') || user.id.startsWith('cafe')) {
      console.log(`Filtering out business account: ${user.userName || user.name}`);
      return false;
    }
    
    // Skip the "You" user when current user is Ivo Vilches
    if (user.id === 'currentUser') {
      console.log('Filtering out "You" user since we are using real accounts');
      return false;
    }
    
    return true;
  });
  
  // Filter business accounts from suggested users too
  const filteredSuggestedUsers = mockData.suggestedUsers.filter(user => {
    return !(user.id === 'user2' || user.businessAccount || user.isBusinessAccount || 
             user.id.startsWith('business-') || user.id.startsWith('cafe'));
  });
  
  // Combine suggested users with filtered users
  const users = [...filteredSuggestedUsers, ...filteredUsers.filter(user => 
    !filteredSuggestedUsers.some(suggestedUser => suggestedUser.id === user.id)
  )];
  
  const renderUserItem = ({ item }) => (
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>People</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for balance */}
      </View>

      <FlatList
        data={users}
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
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    padding: 12,
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