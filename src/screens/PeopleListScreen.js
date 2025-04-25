import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import mockData from '../data/mockData.json';

const PeopleListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  // Combine suggested users with all other users from mockData
  const users = [...mockData.suggestedUsers, ...mockData.users.filter(user => 
    !mockData.suggestedUsers.some(suggestedUser => suggestedUser.id === user.id)
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
      <Image 
        source={{ uri: item.userAvatar || item.avatar }} 
        style={styles.userAvatar}
        resizeMode="cover"
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