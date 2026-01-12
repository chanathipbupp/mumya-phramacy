import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteUser } from '../composables/fetchAPI';

export default function DeleteUserPage() {
  const router = useRouter();

  const handleDeleteAccount = async () => {
    // console.log('Delete account initiated');
    try {
      const confirmation = window.confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      );

      if (confirmation) {
        await deleteUser();
        window.alert('Your account has been successfully deleted.');
        router.replace('/login'); // Redirect to login page
      }
    } catch (error) {
      window.alert(error.message || 'Failed to delete account.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delete Account</Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Confirm Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deleteBtn: {
    backgroundColor: '#D32F2F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});