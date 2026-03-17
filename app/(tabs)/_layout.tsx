import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native'; // เพิ่ม View, StyleSheet
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import NewsTabIcon from '../components/NewsTabIcon';
import ArticleTabIcon from '../components/ArticleTabIcon';
import { LinearGradient } from 'expo-linear-gradient';

import RewardTabIcon from '../components/RewardTabIcon';
import ProfileTabIcon from '../components/ProfileTabIcon';
import { useRouter } from 'expo-router';
import { UserProvider, useUser } from '../../components/UserProvider';
import DailyRewardPopup from '../../components/DailyRewardPopup';
import { getDailyLoginStatus, dailyLogin, getUserProfile } from '../../composables/fetchAPI';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import MedicineTabIcon from '../components/MedicineTabIcon';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [user, setUser] = useState();
  const [showReward, setShowReward] = useState(false);
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  // ... (useEffect ส่วนเดิมของคุณคงไว้เหมือนเดิม) ...
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await getUserProfile();
        setUser(u);
      } catch (e) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('accessToken');
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
        if (statusResponse.status === "available" && user?.role !== "admin") {
          setShowReward(true);
        }
      } catch (error) {
        console.error('Failed to fetch daily login status:', error);
      }
    };
    checkDailyRewardStatus();
  }, [user]);

  const handleClaimReward = async () => {
    try {
      await dailyLogin();
      setShowReward(false);
      if (Platform.OS === 'web') {
        Toast.show({ text1: 'Reward Claimed!' });
      } else {
        Alert.alert('Reward Claimed!', 'You have successfully claimed your daily reward.');
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
          tabBarStyle: {
            backgroundColor: 'white',
            height: 75, // เพิ่มความสูงเล็กน้อย
            paddingBottom: 10,
            borderTopWidth: 0,
            elevation: 10, // เงาสำหรับ Android
            shadowColor: '#000', // เงาสำหรับ iOS
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            fontFamily: 'Prompt-Regular',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color, size }) => <NewsTabIcon color={color} size={size} />,
           tabBarActiveTintColor: '#2f95dc', 
            tabBarInactiveTintColor: '#8e8e93', // สีตอนไม่ได้กด
            tabBarLabel: 'ข่าวสาร',
          }}
        />
        <Tabs.Screen
          name="article"
          options={{
            tabBarIcon: ({ color, size }) => <ArticleTabIcon color={color} size={size} />,
            tabBarActiveTintColor: '#2f95dc', 
            tabBarInactiveTintColor: '#8e8e93', // สีตอนไม่ได้กด
            tabBarLabel: 'บทความ',
          }}
        />

        {/* --- ส่วนที่แก้ไข: ปุ่มจ่ายยาตรงกลาง --- */}
        <Tabs.Screen
          name="medicine"
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => (
              <View style={styles.customButtonContainer}>
                <LinearGradient
                  colors={
                    focused
                      ? ['#1e88e5', '#0a65ae', '#084b8a'] // สีตอนถูกกด (เข้ม)
                      : ['#9de5ff', '#5ccbffff']         // สีปกติ (สว่าง)
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  // แก้ไขตรงนี้: ส่ง focused ไปยัง style เพื่อเปลี่ยนเงา
                  style={[
                    styles.circleGradient,
                    focused ? styles.circleGradientFocused : null
                  ]}
                >
                  <MedicineTabIcon color="white" size={40} />
                </LinearGradient>
              </View>
            ),
          }}
        />
        {/* ------------------------------- */}

        <Tabs.Screen
          name="pointReward"
          options={{
            tabBarIcon: ({ color, size }) => <RewardTabIcon color={color} size={size} />,
            tabBarActiveTintColor: '#2f95dc', 
            tabBarInactiveTintColor: '#8e8e93', // สีตอนไม่ได้กด
            tabBarLabel: 'สะสมแต้ม',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarIcon: ({ color, size }) => <ProfileTabIcon color={color} size={size} />,
            tabBarActiveTintColor: '#2f95dc', 
            tabBarInactiveTintColor: '#8e8e93', // สีตอนไม่ได้กด
            tabBarLabel: 'โปรไฟล์',
          }}
        />
      </Tabs>
      <Toast />
    </UserProvider>
  );
}

// เพิ่ม StyleSheet ด้านล่าง
const styles = StyleSheet.create({

  circleButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    // ทำเงาให้ปุ่มดูนูน
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#fff', // ขอบขาวช่วยให้ดูเด่นขึ้น
  },

  customButtonContainer: {
    top: -20, // ปรับระดับความลอยให้พอดีกับสายตา
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleGradient: {
    width: 100,
    height: 100,
    borderRadius: 64, // ทำให้เป็นวงกลมเป๊ะๆ
    justifyContent: 'center',
    alignItems: 'center',

    // --- ส่วนที่ทำให้เหมือนรูปตัวอย่าง ---
    borderWidth: 4,
    borderColor: '#fff', // ขอบขาวหนาๆ ตามรูป

    // ทำเงา (Shadow) ให้ดูนูนและฟุ้งสีฟ้า
    shadowColor: '#5ccbffff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10, // สำหรับ Android
  },
  circleGradientFocused: {
    // เปลี่ยนเงาเป็นสีน้ำเงินเข้มฟุ้งๆ ตามที่คุณต้องการ
    shadowColor: '#1e88e5', 
    shadowOffset: { width: 0, height: 8 }, // ดันเงาลงมาหน่อยให้ดูนูนขึ้น
    shadowOpacity: 0.6, // เพิ่มความเข้มของเงา
    shadowRadius: 12, // เพิ่มความฟุ้งของเงา
    elevation: 15, // สำหรับ Android ให้ดูลอยสูงขึ้น
  },
});