import React from 'react';
import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme, Button, Modal, View, Text, StyleSheet, Alert, Keyboard, TouchableOpacity, Platform } from "react-native";
import { useState, useContext, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AddCoffeeScreen from '../screens/AddCoffeeScreen';
import { useNotifications } from '../context/NotificationsContext';

const BottomTab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [previousTab, setPreviousTab] = useState('Home');
  const insets = useSafeAreaInsets();
  const [shouldSave, setShouldSave] = useState(false);
  const [selectedCoffee, setSelectedCoffee] = useState(null);
  const { unreadCount } = useNotifications();

  const handleCancel = () => {
    setIsModalVisible(false);
    setShouldSave(false);
    setSelectedCoffee(null);
  };

  const handleLogPress = (e) => {
    // Prevent default tab press behavior
    e.preventDefault();
    setPreviousTab('Home'); // Default to Home if we can't determine the current tab
    setIsModalVisible(true);
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
    navigate: () => {}, // Add empty navigate function to prevent errors
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
            height: 48 + insets.bottom,
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
  }
});

// Empty component for the Log tab since we're using Modal
function EmptyComponent() {
  return null;
} 