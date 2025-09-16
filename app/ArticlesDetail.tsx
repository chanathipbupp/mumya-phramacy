import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getArticleBySlug } from '../composables/fetchAPI';
import { Ionicons } from '@expo/vector-icons';

function formatThaiDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const thMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hour = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year} ${hour}:${min} น.`;
}

export default function ArticlesDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug as string)
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    console.log(article);
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.loadingContainer}>
        <Text>ไม่พบข้อมูลบทความนี้</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Start date */}
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={18} color="#888" style={{ marginRight: 6 }} />
          <Text style={styles.labelRow}>{formatThaiDate(article.publishDate)}</Text>
        </View>
      </View>
      <View style={styles.divider} />

      {/* Title */}
      <Text style={styles.title}>{article.title}</Text>

      {article.tags && article.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {article.tags.map((tag: string) => (
            <View
              key={tag}
              style={{
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 4,
                backgroundColor: '#1da1f2',
              }}
            >
              <Text style={{ fontSize: 16, color: '#fff' }}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
      {/* Cover Image */}
      <Image source={{ uri: article.coverImage }} style={styles.image} />
      <View style={styles.divider} />

      {/* Content */}
      <Text style={styles.label}>Content</Text>
      <Text style={styles.content}>
        {Array.isArray(article.content?.content)
          ? article.content.content
            .map((node: any) =>
              Array.isArray(node.content)
                ? node.content.map((c: any) => c.text).join('')
                : (typeof node.text === 'string' ? node.text : '')
            )
            .join('\n')
          : typeof article.content?.content === 'string'
            ? article.content.content
            : ''}
      </Text>
      <View style={styles.divider} />
      <Text style={{ color: '#888', fontSize: 14, marginTop: 8 }}>
        อัปเดตเมื่อ: {formatThaiDate(article.updatedAt)}
      </Text>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labelRow: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#222',
    marginBottom: 2,
    marginTop: 2,
  },
  label: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
    marginTop: 10,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    color: '#222',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  content: {
    fontSize: 16,
    color: '#444',
    textAlign: 'left',
    marginBottom: 16,
    minHeight: 80,
  },
});