import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import AppImage from './common/AppImage';
import { useTheme } from '../context/ThemeContext';

const AccountSheet = forwardRef(({ accounts, currentAccount, onSwitchAccount }, ref) => {
  const { theme, isDarkMode } = useTheme();
  
  useImperativeHandle(ref, () => ({
    close: () => {
      // Handle closing the sheet if needed
    },
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primaryText }]}>Switch Account</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onSwitchAccount(null)}
        >
          <Ionicons name="close" size={24} color={theme.primaryText} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.accountsList}>
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            style={[
              styles.accountItem,
              account.id === currentAccount && [
                styles.selectedAccount, 
                { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7' }
              ],
            ]}
            onPress={() => onSwitchAccount(account)}
          >
            <View style={styles.accountInfo}>
              <View style={styles.avatarContainer}>
                {account.user_metadata?.avatar_url ? (
                  <AppImage
                    source={account.user_metadata.avatar_url}
                    style={styles.avatar}
                    placeholder="person"
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F2F2F7' }]}>
                    <Text style={[styles.avatarInitials, { color: theme.primaryText }]}>
                      {account.user_metadata?.full_name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.accountDetails}>
                <Text style={[styles.accountName, { color: theme.primaryText }]}>
                  {account.user_metadata?.full_name || 'User'}
                </Text>
                <Text style={[styles.accountType, { color: theme.secondaryText }]}>
                  {account.user_metadata?.isBusiness ? 'Business' : 'Personal'}
                </Text>
              </View>
            </View>
            {account.id === currentAccount && (
              <Ionicons name="checkmark" size={24} color={theme.primaryText} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  accountsList: {
    marginBottom: 20,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedAccount: {
    // backgroundColor color is set inline with theme
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountType: {
    fontSize: 14,
  },
});

export default AccountSheet; 