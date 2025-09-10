import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function ProfileBar() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://randomuser.me/api/portraits/women/1.jpg' }} // Replace with user avatar
        style={styles.avatar}
      />
      <View>
        <Text style={styles.greeting}>Hi, Nancy</Text>
        <Text style={styles.date}>Today, Feb 2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  greeting: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  date: {
    color: '#888',
    fontSize: 12,
  },
});