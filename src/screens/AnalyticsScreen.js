import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoffee } from '../context/CoffeeContext';
import { useTheme } from '../context/ThemeContext';
import mockEvents from '../data/mockEvents.json';
import mockCoffeesData from '../data/mockCoffees.json';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen({ navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { currentAccount, coffeeEvents } = useCoffee();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [brewingMethodStats, setBrewingMethodStats] = useState({});
  const [originStats, setOriginStats] = useState({});

  useEffect(() => {
    calculateAnalytics();
  }, [coffeeEvents, currentAccount]);

  const calculateAnalytics = () => {
    setLoading(true);
    
    // Get user's coffee events
    const userEvents = coffeeEvents.filter(event => 
      event.userId === currentAccount && event.brewingMethod
    );

    // Calculate brewing method frequency
    const brewingMethods = {};
    userEvents.forEach(event => {
      const method = event.brewingMethod;
      brewingMethods[method] = (brewingMethods[method] || 0) + 1;
    });

    // Calculate origin frequency
    const origins = {};
    userEvents.forEach(event => {
      // Find the coffee in mockCoffeesData to get origin
      const coffee = mockCoffeesData.coffees.find(c => c.id === event.coffeeId);
      if (coffee && coffee.origin) {
        origins[coffee.origin] = (origins[coffee.origin] || 0) + 1;
      }
    });

    setBrewingMethodStats(brewingMethods);
    setOriginStats(origins);
    setLoading(false);
  };

  const renderBrewingMethodChart = () => {
    const totalBrews = Object.values(brewingMethodStats).reduce((sum, count) => sum + count, 0);
    
    if (totalBrews === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="cafe-outline" size={48} color={theme.secondaryText} />
          <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
            No brewing data yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.secondaryText }]}>
            Start logging your coffee to see analytics
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: theme.primaryText }]}>
          Brewing Methods
        </Text>
        {Object.entries(brewingMethodStats)
          .sort(([,a], [,b]) => b - a)
          .map(([method, count]) => {
            const percentage = ((count / totalBrews) * 100).toFixed(1);
            const barWidth = (count / totalBrews) * (width - 80);
            
            return (
              <View key={method} style={styles.chartRow}>
                <View style={styles.chartLabelContainer}>
                  <Text style={[styles.chartLabel, { color: theme.primaryText }]}>
                    {method}
                  </Text>
                  <Text style={[styles.chartCount, { color: theme.secondaryText }]}>
                    {count} brews
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        width: barWidth,
                        backgroundColor: theme.primary
                      }
                    ]} 
                  />
                  <Text style={[styles.percentage, { color: theme.secondaryText }]}>
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
    );
  };

  const renderOriginChart = () => {
    const totalOrigins = Object.values(originStats).reduce((sum, count) => sum + count, 0);
    
    if (totalOrigins === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="globe-outline" size={48} color={theme.secondaryText} />
          <Text style={[styles.emptyStateText, { color: theme.secondaryText }]}>
            No origin data yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.secondaryText }]}>
            Log coffees to see origin analytics
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.chartTitle, { color: theme.primaryText }]}>
          Coffee Origins
        </Text>
        {Object.entries(originStats)
          .sort(([,a], [,b]) => b - a)
          .map(([origin, count]) => {
            const percentage = ((count / totalOrigins) * 100).toFixed(1);
            const barWidth = (count / totalOrigins) * (width - 80);
            
            return (
              <View key={origin} style={styles.chartRow}>
                <View style={styles.chartLabelContainer}>
                  <Text style={[styles.chartLabel, { color: theme.primaryText }]}>
                    {origin}
                  </Text>
                  <Text style={[styles.chartCount, { color: theme.secondaryText }]}>
                    {count} coffees
                  </Text>
                </View>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        width: barWidth,
                        backgroundColor: theme.primary
                      }
                    ]} 
                  />
                  <Text style={[styles.percentage, { color: theme.secondaryText }]}>
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.primaryText }]}>
            Loading analytics...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primaryText }]}>
            Analytics
          </Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Your coffee brewing insights
          </Text>
        </View>

        <View style={styles.chartsContainer}>
          {renderBrewingMethodChart()}
          {renderOriginChart()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  chartsContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  chartContainer: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  chartLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  chartCount: {
    fontSize: 14,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  percentage: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyState: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});