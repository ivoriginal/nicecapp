import React from 'react';
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme, Button, Modal, View, Text, StyleSheet, Alert, Keyboard, TouchableOpacity, Platform, Image, FlatList, SafeAreaView } from "react-native";
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
  const { unreadCount, markAllAsRead } = useNotifications();
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

  // Update the customNavigation object to ensure it fully implements needed methods
  const customNavigation = {
    goBack: handleSaveComplete,
    navigate: (screen, params) => {
      console.log('Custom navigation navigate to:', screen, params);
      handleSaveComplete();
      if (screen === 'Home') {
        // If navigating to Home, just close the modal
        setIsModalVisible(false);
      }
    },
    setParams: (params) => {
      console.log('Custom navigation setParams:', params);
      if (params.shouldSave !== undefined) {
        setShouldSave(params.shouldSave);
      }
      if (params.selectedCoffee) {
        setSelectedCoffee(params.selectedCoffee);
      }
      if (params.shouldSave === true) {
        handleSaveComplete();
      }
    },
    addListener: () => { return { remove: () => {} }; },
    setOptions: (options) => {
      console.log('Custom navigation setOptions:', options);
      // This implementation doesn't need to do anything
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
            minHeight: 56,
            paddingHorizontal: 4,
            paddingBottom: insets.bottom,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
          },
          tabBarItemStyle: {
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarIconStyle: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          },
        })}
      >
        <BottomTab.Screen
          name="Home"
          component={HomeScreen}
          options={({ navigation }) => ({
            headerShown: true,
            headerStyle: {
              height: 104,
              backgroundColor: '#FFFFFF',
            },
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
                <Text style={{ fontSize: 24, fontWeight: '600', color: '#000000' }}>NiceCup</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('PeopleList')}
                    style={{ marginRight: 16 }}
                  >
                    <Ionicons name="person-add-outline" size={24} color="#000000" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Notifications')}
                    style={{ marginRight: 14 }}
                  >
                    <View>
                      <Ionicons name="notifications-outline" size={24} color="#000000" />
                      {unreadCount > 0 && (
                        <View style={{
                          position: 'absolute',
                          top: -2,
                          right: -4,
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#FF3B30',
                        }} />
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setIsModalVisible(true)}
                  >
                    <Ionicons name="add-circle" size={28} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
            ),
            headerTitleAlign: 'left',
          })}
        />
        <BottomTab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
          }}
        />
        <BottomTab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 0
            }
          }}
          initialParams={{ skipAuth: true }}
          listeners={{
            tabLongPress: handleProfileLongPress,
          }}
        />
      </BottomTab.Navigator>

      <Modal
        transparent={true}
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Log Coffee</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={{ flex: 1 }}>
              <AddCoffeeScreen
                key={`add-coffee-${isModalVisible ? 'visible' : 'hidden'}`}
                navigation={customNavigation}
                route={{ params: { isModalVisible, shouldSave, selectedCoffee } }}
              />
            </View>
          </View>
        </SafeAreaView>
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
  modalContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  headerLeft: {
    width: 24,
  },
  headerRight: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    height: 48,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 6,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
});

// Empty component for the Log tab since we're using Modal
function EmptyComponent() {
  return null;
} 