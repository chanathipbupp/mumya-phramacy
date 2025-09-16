import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewsTabIcon from '../components/NewsTabIcon';
import ArticleTabIcon from '../components/ArticleTabIcon';
import RewardTabIcon from '../components/RewardTabIcon';
import ProfileTabIcon from '../components/ProfileTabIcon';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: { position: 'absolute' },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <NewsTabIcon color={color} size={size} />
          ),
          tabBarLabel: 'ข่าวสาร',
        }}
      />
      <Tabs.Screen
        name="article"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ArticleTabIcon color={color} size={size} />
          ),
          tabBarLabel: 'บทความ',
        }}
      />
      <Tabs.Screen
        name="pointReward"
        options={{
          tabBarIcon: ({ color, size }) => (
            <RewardTabIcon color={color} size={size} />
          ),
          tabBarLabel: 'สะสมแต้ม',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ProfileTabIcon color={color} size={size} />
          ),
          tabBarLabel: 'โปรไฟล์',
        }}
      />

    </Tabs>
  );
}
