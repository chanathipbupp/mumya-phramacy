import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getNewsBySlug } from '../composables/fetchAPI';

export default function NewsDetail() {
  const { slug } = useLocalSearchParams();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getNewsBySlug(slug as string)
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
      console.log('Fetched news:', news);
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.loadingContainer}>
        <Text>ไม่พบข้อมูลข่าวนี้</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: news.coverImage }} style={styles.image} />
      <Text style={styles.title}>{news.title}</Text>
      <Text style={styles.content}>
        {typeof news.content === 'string'
          ? news.content
          : news.content?.ops
            ? news.content.ops.map((op: any, idx: number) => op.insert).join('')
            : ''}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    color: '#444',
    textAlign: 'left',
  },
});