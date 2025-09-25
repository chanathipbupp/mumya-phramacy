// DailyRewardPopup.tsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type DailyRewardPopupProps = {
  visible: boolean;
  onClaim: () => void;
};

const DailyRewardPopup: React.FC<DailyRewardPopupProps> = ({ visible, onClaim }) => (
  <Modal transparent visible={visible} animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.popup}>
        <Text style={styles.title}>🎁 Daily Reward!</Text>
        <Text style={styles.message}>Claim your 10 points for today!</Text>
        <TouchableOpacity style={styles.button} onPress={onClaim}>
          <Text style={styles.buttonText}>Claim Reward</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

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
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DailyRewardPopup;