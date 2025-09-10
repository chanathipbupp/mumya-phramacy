import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Item from '../../components/item';
import ProfileBar from '../../components/ProfileBar';
import { getNewsAdmin } from '../../composables/fetchAPI';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleCreateNews = () => {
    router.push({
      pathname: '/AddEditNews',
      params: { mode: 'add' },
    });
  };
  useFocusEffect(
    React.useCallback(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await getNewsAdmin({ page: '1', limit: '20' });
        const fetched = res.data || res;
        setArticles(Array.isArray(fetched) ? fetched : fetched.items || []);
      } catch (e) {
        setArticles([]);
      }
      setLoading(false);
    };
    fetchNews();
    }, [])
  );

  return (
    <>
      <ProfileBar />

      <View style={styles.outer}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>ข่าวสาร</Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
              <Text style={styles.createButtonText}>Create News</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={articles}
              keyExtractor={(item) => item.id || item._id}
              renderItem={({ item }) => (
                <Item
                  slug={item.slug || item._slug}
                  title={item.title}
                  message={item.message}
                  summary={item.summary}
                  coverImage={item.coverImage}
                  updatedAt={item.updatedAt}
                />
              )}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
                  ไม่พบข้อมูลข่าวสาร
                </Text>
              }
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 900, // Responsive max width for PC
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  banner: {
    width: '100%',
    height: 120,
    marginBottom: 16,
    maxWidth: 900,
    alignSelf: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
