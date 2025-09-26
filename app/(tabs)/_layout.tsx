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
import { getDailyLoginStatus, dailyLogin,getUserProfile } from '../../composables/fetchAPI'; // Import endpoints

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [user, setUser] = useState()
  const [showReward, setShowReward] = useState(false);
  useEffect(() => {
    // Fetch user info on mount
    console.log("fetching user in add edit article")
    const fetchUser = async () => {
      try {
        const u = await getUserProfile();
        console.log("fetched user in hp", u)
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
    console.log(user, "user in hp")
  }, []);
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
    const checkDailyRewardStatus = async () => {
      try {
        const statusResponse = await getDailyLoginStatus();
        console.log('Daily Login Status:', statusResponse, user?.role); // Debugging line
        if (statusResponse.status === "available" && user?.role !== "admin") {
          setShowReward(true);
        }
        
      } catch (error) {
        console.error('Failed to fetch daily login status:', error);
      }
    };
    checkDailyRewardStatus();
  }, [user]); // Re-run when user changes

    const handleClaimReward = async () => {
    try {
      const res = await dailyLogin(); // Call the daily login endpoint
      console.log('Daily Login Response:', res); // Debugging line
      setShowReward(false);

      // Show success message
      if (Platform.OS === 'web') {
        window.alert(`You got ${res.balance} points!`);
      } else {
        // @ts-ignore
        Alert.alert('Success', `You got ${res.balance} points!`);
      }
    } catch (error) {
      console.error('Failed to claim daily reward:', error);
    }
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
