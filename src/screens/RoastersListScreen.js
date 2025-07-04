import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import mockCafes from '../data/mockCafes.json';
import AppImage from '../components/common/AppImage';
import { useTheme } from '../context/ThemeContext';

const RoastersListScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();

  // Configure header on mount
  useEffect(() => {
    navigation.setOptions({
      title: 'Roasters',
      headerBackTitle: 'Back'
    });
  }, [navigation]);

  const roasters = mockCafes.roasters || [];

  const renderRoasterItem = ({ item }) => {
    const logoSource = item.avatar || item.logo;
    const coverSource = item.coverImage || item.imageUrl;

    return (
      <TouchableOpacity
        style={[
          styles.roasterCard,
          isDarkMode
            ? { backgroundColor: theme.cardBackground }
            : { backgroundColor: 'transparent', borderColor: theme.border }
        ]}
        onPress={() =>
          navigation.navigate('UserProfileBridge', {
            userId: item.id,
            userName: item.name,
            isBusinessAccount: true,
            isRoaster: true,
            skipAuth: true
          })
        }
      >
        <AppImage source={coverSource} style={styles.roasterImage} resizeMode="cover" />
        <View style={styles.roasterContent}>
          <View style={styles.roasterHeader}>
            <AppImage
              source={logoSource}
              style={[styles.roasterLogo, { borderColor: theme.border }]}
              resizeMode="cover"
            />
            <View style={styles.roasterTitleContainer}>
              <Text style={[styles.roasterName, { color: theme.primaryText }]}>{item.name}</Text>
              {item.location && (
                <Text style={[styles.roasterLocation, { color: theme.secondaryText }]}> {item.location}</Text>
              )}
            </View>
          </View>
          {item.description && (
            <Text
              style={[styles.roasterDescription, { color: theme.secondaryText }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: theme.background }]}>
      <FlatList
        data={roasters}
        renderItem={renderRoasterItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.roastersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.secondaryText }]}>No roasters found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  roastersList: {
    padding: 16
  },
  roasterCard: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1
  },
  roasterImage: {
    width: '100%',
    height: 120
  },
  roasterContent: {
    padding: 12
  },
  roasterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  roasterLogo: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1
  },
  roasterTitleContainer: {
    flex: 1
  },
  roasterName: {
    fontSize: 16,
    fontWeight: '600'
  },
  roasterLocation: {
    fontSize: 13,
    marginTop: 2
  },
  roasterDescription: {
    fontSize: 13
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  emptyText: {
    fontSize: 16
  }
});

export default RoastersListScreen;