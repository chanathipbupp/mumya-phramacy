import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const GiftButton = ({ onPress, disabled }: { onPress: () => void, disabled?: boolean }) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled}
      style={[styles.btnContainer, disabled && { opacity: 0.5 }]}
    >
      <View style={styles.circle}>
        {/* ส่วนริบบิ้นด้านบน (โบว์) */}
        <View style={styles.ribbonLeft} />
        <View style={styles.ribbonRight} />
        
        {/* ฝากล่องของขวัญ */}
        <LinearGradient
          colors={['#fbb54f', '#f9b14a', '#fbb54f']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0.3, 0.5, 0.7]}
          style={styles.giftLid}
        />

        {/* ตัวกล่องของขวัญ */}
        <LinearGradient
          colors={['#fcbe64', '#f9b14a', '#fcbe64']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0.42, 0.5, 0.6]}
          style={styles.giftBody}
        >
          {/* เงาใต้ฝากล่อง */}
          <View style={styles.giftShadow} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 50,
    height: 50,
    backgroundColor: '#da587f',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,               // เงาสำหรับ Android
    shadowColor: '#000',        // เงาสำหรับ iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
  },
  giftBody: {
    width: 28,
    height: 20,
    borderRadius: 2,
    position: 'relative',
    marginTop: -2, // ให้ชิดกับฝา
  },
  giftLid: {
    width: 36,
    height: 6,
    borderRadius: 1,
    zIndex: 10,
  },
  giftShadow: {
    width: 6,
    height: 2,
    backgroundColor: '#fba152',
    position: 'absolute',
    top: 0,
    left: 13, // กึ่งกลาง
  },
  ribbonLeft: {
    width: 10,
    height: 6,
    borderWidth: 2.5,
    borderColor: 'white',
    borderRadius: 10,
    position: 'absolute',
    top: 8,
    left: 18,
    transform: [{ rotate: '-130deg' }],
  },
  ribbonRight: {
    width: 6,
    height: 10,
    borderWidth: 2.5,
    borderColor: 'white',
    borderRadius: 10,
    position: 'absolute',
    top: 8,
    right: 18,
    transform: [{ rotate: '40deg' }],
  },
  btnText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E91E63',
  }
});

export default GiftButton;