import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewsTabIcon from '../components/NewsTabIcon';
import ArticleTabIcon from '../components/ArticleTabIcon';
import RewardTabIcon from '../components/RewardTabIcon';
import ProfileTabIcon from '../components/ProfileTabIcon';
import { useRouter } from 'expo-router';
import { UserProvider, useUser } from '../../components/UserProvider';
import DailyRewardPopup from '../../components/DailyRewardPopup'; // Adjust path if needed

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const user = useUser(); // Get user from your hook
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('Access Token:', token); // Debugging line
      if (!token) {
        router.replace('/login');
      }
    };
    checkToken();
  }, []);

  useEffect(() => {
    const checkDailyReward = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const lastClaimed = await AsyncStorage.getItem('dailyRewardDate');
      // Only show popup if user exists and role is not admin
      if (user && user.role !== 'admin' && lastClaimed !== today) {
        setShowReward(true);
      }
    };
    checkDailyReward();
  }, [user]); // Re-run when user changes

  const handleClaimReward = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await AsyncStorage.setItem('dailyRewardDate', today);
    // TODO: Add logic to give user 10 points here
    setShowReward(false);
  };

  return (
    <UserProvider>
      <DailyRewardPopup visible={showReward} onClaim={handleClaimReward} />
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
      </UserProvider>
  );
}
