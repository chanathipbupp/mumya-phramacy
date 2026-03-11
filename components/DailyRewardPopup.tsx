import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // Import AppLoading
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type DailyRewardPopupProps = {
  visible: boolean;
  onClaim: () => void;
};

const DailyRewardPopup: React.FC<DailyRewardPopupProps> = ({ visible, onClaim }) => {
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.popup}>
          {/* Reward Icon */}
          <Text style={styles.icon}>🎁</Text>
          <Text style={styles.title}>Daily Reward!</Text>
          <Text style={styles.message}>Claim your rewards for today!</Text>
          <TouchableOpacity style={styles.button} onPress={onClaim}>
            <Text style={styles.buttonText}>Claim Reward</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    minWidth: 280,
  },
  icon: {
    fontSize: 64, // Adjust size to resemble the previous image
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Prompt-Bold', // ใช้ฟอนต์ Prompt-Bold
    marginBottom: 12,
    color: '#333',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Prompt-Regular', // ใช้ฟอนต์ Prompt-Regular
    marginBottom: 24,
    textAlign: 'center',
    color: '#555',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Prompt-Bold', // ใช้ฟอนต์ Prompt-Bold
    fontSize: 16,
  },
});
export default DailyRewardPopup;