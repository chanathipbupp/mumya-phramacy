import { Image } from 'expo-image';
import { StyleSheet, View, Text } from 'react-native';
import profile from '../../composables/profile.json';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>บัญชีของฉัน</Text>
      <View style={styles.profileBox}>
        <Image source={profile.avatar} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <Text style={styles.phone}>{profile.phone}</Text>
          <Text style={styles.points}>คะแนนสะสม: {profile.points}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  profileBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  phone: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  points: {
    fontSize: 15,
    color: '#00796B',
    marginTop: 8,
    fontWeight: 'bold',
  },
});


