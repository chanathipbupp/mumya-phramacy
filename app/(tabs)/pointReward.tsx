import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text } from 'react-native';

import history from '../../composables/history.json';
import profile from '../../composables/profile.json';

export default function TabTwoScreen() {
  return (

    <View style={styles.container}>
      <Text style={styles.header}>แต้มของฉัน</Text>
      <View style={styles.pointBox}>
        <Text style={styles.pointText}>{profile.points} P</Text>
      </View>
      <Text style={styles.historyHeader}>ประวัติ</Text>
      <View style={styles.historyList}>
        {history.map(item => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.historyDesc}>{item.desc}</Text>
            <Text
              style={[
                styles.historyPoints,
                item.points.startsWith('-') && { color: '#D32F2F' }
              ]}
            >
              {item.points}
            </Text>
            <Text style={styles.historyDate}>{item.date}</Text>
          </View>
        ))}
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pointBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
  },
  pointText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00796B',
  },
  historyHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 4,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    marginBottom: 8,
  },
  historyDesc: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyPoints: {
    fontSize: 14,
    color: '#00796B',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
});