import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type ProfileBarProps = {
  avatarUrl?: string;
  name?: string;
};

export default function ProfileBar({ avatarUrl, name }: ProfileBarProps) {
  const initial = name ? name.charAt(0).toUpperCase() : 'U';
  const showAvatar = !!avatarUrl;

  return (
    <View style={styles.container}>
      {showAvatar ? (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.initialCircle}>
          <Text style={styles.initialText}>{initial}</Text>
        </View>
      )}
      <View>
        <Text style={styles.greeting}>Hi, {name || 'User'}</Text>
        <Text style={styles.date}>
          Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  initialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#bdbdbd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  greeting: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  date: {
    color: '#888',
    fontSize: 13,
  },
});