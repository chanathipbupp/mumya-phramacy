import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getArticleBySlug } from '../composables/fetchAPI';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../assets/fonts/Prompt-Bold.ttf'),
  });
  if (!fontsLoaded) return <AppLoading />;

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getArticleBySlug(slug as string)
      .then(data => {
        setArticle(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // console.log(article);
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
        <View style={styles.tagsContainer}>
          {article.tags.map((tag: string) => (
            // 2. เปลี่ยนจาก <View> เป็น <LinearGradient> ครับ
            <LinearGradient
              key={tag}
              // 3. กำหนดสี Gradient ที่ต้องการ (ตัวอย่างนี้ใช้โทนฟ้า-น้ำเงิน)
              colors={['#9de5ff', '#5ccbffff']}
              // 4. กำหนดจุดเริ่มและจุดจบของ Gradient (เริ่มบนซ้าย ไปจบ ล่างขวา)
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              // 5. ใช้ Style สำหรับ Tag ที่เตรียมไว้
              style={styles.tagGradient}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </LinearGradient>
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
      <Text style={{ color: '#888', fontSize: 14, marginTop: 8, fontFamily: 'Prompt-Regular' }}>
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
    fontFamily: 'Prompt-Regular',
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
    fontFamily: 'Prompt-Regular',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    color: '#222',
    fontFamily: 'Prompt-Bold',
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
    fontFamily: 'Prompt-Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  tagGradient: {
    borderRadius: 16, // ขอบมน
    paddingHorizontal: 16,
    paddingVertical: 6, // เพิ่ม padding vertical เล็กน้อย
    // shadow เพื่อให้ Tag ดูลอยขึ้นมา
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // shadow สำหรับ Android
  },
  tagText: {
    fontSize: 14, // ปรับขนาดฟอนต์ Tag ลงเล็กน้อยเพื่อให้ดู compact
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Prompt-Regular',
  },
});