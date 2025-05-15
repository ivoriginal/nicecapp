// Mock followers data for user profiles
// This is a more complete structure with followers and following relationships

// userId: The user who has followers and follows others
// followers: Array of user IDs who follow this user
// following: Array of user IDs who this user follows
// These reference user IDs in mockUsers.json

export const mockFollowersData = {
  // Ivo Vilches (user1)
  "user1": {
    followers: ['user2', 'user3', 'user5', 'user6', 'user7', 'user9', 'user10', 'user11'],
    following: ['user2', 'user3', 'user5', 'user7', 'user9', 'user11']
  },
  
  // Vértigo y Calambre (user2)
  "user2": {
    followers: ['user1', 'user3', 'user5', 'user7', 'user8', 'user9', 'user10', 'user11'],
    following: ['user1', 'user3', 'user11']
  },
  
  // Carlos Hernández (user3)
  "user3": {
    followers: ['user1', 'user2', 'user5', 'user6', 'user7', 'user9'],
    following: ['user1', 'user2', 'user5', 'user6', 'user7', 'user9', 'user10', 'user11']
  },
  
  // Emma Garcia (user5)
  "user5": {
    followers: ['user1', 'user2', 'user3', 'user7', 'user8', 'user10'],
    following: ['user1', 'user3', 'user7', 'user9']
  },
  
  // David Kim (user6)
  "user6": {
    followers: ['user1', 'user3', 'user7', 'user9'],
    following: ['user1', 'user3', 'user5', 'user7', 'user8', 'user9', 'user10']
  },
  
  // Sophia Miller (user7)
  "user7": {
    followers: ['user1', 'user3', 'user5', 'user6', 'user9', 'user10'],
    following: ['user1', 'user2', 'user3', 'user5', 'user6', 'user9', 'user10', 'user11']
  },
  
  // Other users...
  "user8": {
    followers: ['user6', 'user7'],
    following: ['user2', 'user5', 'user9', 'user10', 'user11']
  },
  
  "user9": {
    followers: ['user1', 'user3', 'user5', 'user6', 'user7', 'user8'],
    following: ['user1', 'user2', 'user3', 'user6', 'user7', 'user10']
  },
  
  "user10": {
    followers: ['user3', 'user6', 'user7', 'user8', 'user9'],
    following: ['user1', 'user2', 'user7']
  },
  
  "user11": {
    followers: ['user1', 'user2', 'user3', 'user7', 'user8'],
    following: ['user1', 'user2']
  }
};

// Legacy format for compatibility
export const mockFollowers = [
  {
    userId: 'user3',
    isFollowing: true
  },
  {
    userId: 'user5',
    isFollowing: true
  },
  {
    userId: 'user7',
    isFollowing: false
  },
  {
    userId: 'user9', 
    isFollowing: true
  },
  {
    userId: 'user10',
    isFollowing: false
  }
]; 