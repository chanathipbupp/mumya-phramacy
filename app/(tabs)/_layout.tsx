import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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
          title: 'ข่าวสาร',
        }}
      />
      <Tabs.Screen
        name="article"
        options={{
          title: 'บทความ',
        }}
      />
      <Tabs.Screen
        name="pointReward"
        options={{
          title: 'สะสมแต้ม',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'โปรไฟล์',
        }}
      />
    </Tabs>
  );
}
