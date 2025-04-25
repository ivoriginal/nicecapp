import React from 'react';
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme, Button, Modal, View, Text, StyleSheet, Alert, Keyboard, TouchableOpacity, Platform, Image, FlatList } from "react-native";
import { useState, useContext, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddCoffeeScreen from '../screens/AddCoffeeScreen';
import { useNotifications } from '../context/NotificationsContext';
import { useCoffee } from '../context/CoffeeContext';
import eventEmitter from '../utils/EventEmitter';

const BottomTab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previousTab, setPreviousTab] = useState('Home');
  const insets = useSafeAreaInsets();
  const [shouldSave, setShouldSave] = useState(false);
  const [selectedCoffee, setSelectedCoffee] = useState(null);
  const { unreadCount } = useNotifications();
  const { accounts, currentAccount, switchAccount } = useCoffee();

  // Remove the bottom sheet ref and snap points
  const [showAccountModal, setShowAccountModal] = useState(false);

  // Handle account switching
  const handleAccountSwitch = (account) => {
    // Switch account in context
    switchAccount(account);

    // Close the modal
    setShowAccountModal(false);
  };

  // Open account switching modal
  const openAccountModal = () => {
    setShowAccountModal(true);
  };

  // Render account item in the modal
  const renderAccountItem = ({ item }) => (
    <TouchableOpacity
      style={styles.accountItem}
      onPress={() => handleAccountSwitch(item)}
    >
      <View style={styles.accountAvatarContainer}>
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={styles.accountAvatar}
          />
        ) : (
          <View style={styles.accountAvatarPlaceholder}>
            <Ionicons name="person" size={24} color="#000000" />
          </View>
        )}
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{item.username}</Text>
        <Text style={styles.accountEmail}>{item.email}</Text>
      </View>
      {currentAccount.id === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const handleCancel = () => {
    setIsModalVisible(false);
    setShouldSave(false);
    setSelectedCoffee(null);
  };

  const handleLogPress = (e) => {
    e.preventDefault();
    setPreviousTab('Home');
    setIsModalVisible(true);
  };

  const handleProfileLongPress = (e) => {
    console.log('Profile tab long press detected');
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    // Emit an event to notify the ProfileScreen that profile tab was long pressed
    eventEmitter.emit('profileTabLongPress');
  };

  const handleSave = () => {
    // Set shouldSave to true to trigger the save action in AddCoffeeScreen
    setShouldSave(true);
    // Dismiss keyboard if it's open
    Keyboard.dismiss();
  };

  const handleSaveComplete = () => {
    setIsModalVisible(false);
    setShouldSave(false);
    setSelectedCoffee(null);
  };

  // Create a custom navigation object for the AddCoffeeScreen
  const customNavigation = {
    goBack: handleSaveComplete,
    navigate: () => { }, // Add empty navigate function to prevent errors
    setParams: (params) => {
      if (params.shouldSave !== undefined) {
        setShouldSave(params.shouldSave);
      }
      if (params.selectedCoffee) {
        setSelectedCoffee(params.selectedCoffee);
      }
      if (params.shouldSave === true) {
        handleSaveComplete();
      }
    }
  };

  // Create a custom route object for the AddCoffeeScreen
  const customRoute = {
    params: { shouldSave, selectedCoffee }
  };

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <BottomTab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Search') {
              iconName = focused ? 'search' : 'search-outline';
            } else if (route.name === 'Log') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Notifications') {
              iconName = focused ? 'notifications' : 'notifications-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: 'gray',
          tabBarShowLabel: true,
          headerShown: true,
          headerTitleStyle: {
            color: '#000000',
            fontWeight: '600',
          },
          headerTintColor: '#000000',
          tabBarStyle: {
            paddingTop: 4,
            paddingHorizontal: 5,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
          },
        })}
      >
        <BottomTab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: true,
            headerTitle: "Home",
          }}
        />
        <BottomTab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
          }}
        />
        <BottomTab.Screen
          name="Log"
          component={EmptyComponent}
          options={{
            headerShown: false,
          }}
          listeners={{
            tabPress: handleLogPress,
          }}
        />
        <BottomTab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            headerShown: true,
            headerTitle: "Notifications",
            tabBarBadge: unreadCount > 0 ? unreadCount : null,
            tabBarBadgeStyle: {
              backgroundColor: '#000000',
              marginRight: 8,
            },
          }}
        />
        <BottomTab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: false,
          }}
          initialParams={{ skipAuth: true }}
          listeners={{
            tabLongPress: handleProfileLongPress,
          }}
        />
      </BottomTab.Navigator>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isModalVisible}
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top : 0 }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft} />
              <Text style={styles.headerTitle}>Log Coffee</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.content}>
            <AddCoffeeScreen
              navigation={customNavigation}
              route={customRoute}
            />
          </View>
        </View>
      </Modal>

      {/* Account Switching Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Account</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={accounts}
              renderItem={renderAccountItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.accountsList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
  },
  headerLeft: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountsList: {
    paddingBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  accountAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  accountAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountEmail: {
    fontSize: 14,
    color: '#8E8E93',
  }
});

// Empty component for the Log tab since we're using Modal
function EmptyComponent() {
  return null;
} 