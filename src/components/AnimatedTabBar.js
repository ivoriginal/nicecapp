import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
} from 'react-native';
import { COLORS, FONTS, SIZES } from '../constants';

const AnimatedTabBar = ({ tabs, initialTabIndex = 0, onTabChange, containerStyle }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(initialTabIndex);
  const [indicatorPosition] = useState(new Animated.Value(initialTabIndex));

  const handleTabPress = (index) => {
    Animated.spring(indicatorPosition, {
      toValue: index,
      useNativeDriver: false,
      tension: 100,
      friction: 10,
    }).start();

    setActiveTabIndex(index);
    
    if (onTabChange) {
      onTabChange(index, tabs[index]);
    }
  };

  const indicatorWidth = 100 / tabs.length;
  const translateX = indicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${indicatorWidth}%`],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.tab,
              { width: `${100 / tabs.length}%` },
            ]}
            onPress={() => handleTabPress(index)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTabIndex === index && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${indicatorWidth}%`,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.base,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  tab: {
    paddingVertical: SIZES.base,
    alignItems: 'center',
  },
  tabText: {
    ...FONTS.body3,
    color: COLORS.gray,
  },
  activeTabText: {
    ...FONTS.h4,
    color: COLORS.primary,
  },
  indicator: {
    height: 3,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
});

export default AnimatedTabBar; 