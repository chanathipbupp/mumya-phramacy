import React, { useEffect, useState } from 'react';
import { Animated,View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getNewsBySlug } from '../composables/fetchAPI';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // ใช้สำหรับแสดงหน้ารอโหลดฟอนต์

const NewsDetailSkeleton = () => {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Top Row Skeleton (Date & Priority) */}
      <View style={[styles.row, { marginBottom: 15 }]}>
        <View style={[styles.skeletonBase, { width: 120, height: 20 }]} />
        <View style={[styles.skeletonBase, { width: 80, height: 25, borderRadius: 16 }]} />
      </View>
      <View style={[styles.divider, { backgroundColor: '#eee' }]} />

      {/* Title Skeleton */}
      <View style={[styles.skeletonBase, { width: '90%', height: 30, marginVertical: 15 }]} />

      {/* Image Skeleton */}
      <View style={[styles.skeletonBase, { width: '100%', height: 200, borderRadius: 12, marginBottom: 20 }]} />
      <View style={[styles.divider, { backgroundColor: '#eee' }]} />

      {/* Content Skeleton */}
      <View style={[styles.skeletonBase, { width: 60, height: 15, marginTop: 15, marginBottom: 10 }]} />
      <View style={[styles.skeletonBase, { width: '100%', height: 15, marginBottom: 8 }]} />
      <View style={[styles.skeletonBase, { width: '100%', height: 15, marginBottom: 8 }]} />
      <View style={[styles.skeletonBase, { width: '80%', height: 15, marginBottom: 8 }]} />
      <View style={[styles.skeletonBase, { width: '100%', height: 15, marginBottom: 8 }]} />
      <View style={[styles.skeletonBase, { width: '60%', height: 15, marginBottom: 8 }]} />
    </Animated.View>
  );
};

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

function getPriorityStyle(priority: string) {
  switch (priority) {
    case 'critical':
      return { label: 'Critical', color: '#e53935', bg: '#fdecea' };
    case 'high':
      return { label: 'High', color: '#ff9800', bg: '#fff3e0' };
    case 'normal':
      return { label: 'Normal', color: '#fbc02d', bg: '#fffde7' };
    case 'low':
      return { label: 'Low', color: '#43a047', bg: '#e8f5e9' };
    default:
      return { label: '-', color: '#888', bg: '#eee' };
  }
}

export default function NewsDetail() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }
  //console.log(news);
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    getNewsBySlug(slug as string)
      .then(data => {
        setNews(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <NewsDetailSkeleton />; // เปลี่ยนตรงนี้
  }

if (!news) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#ccc" />
        <Text style={{ marginTop: 10, color: '#888' }}>ไม่พบข้อมูลข่าวนี้</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Back Button */}
      {/* <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#222" />
      </TouchableOpacity> */}

      {/* Start date and priority */}
      <View style={styles.row}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={18} color="#888" style={{ marginRight: 6 }} />
          <Text style={styles.labelRow}>{formatThaiDate(news.startAt)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* <Text style={[styles.labelRow, { marginRight: 2 }]}>ความสำคัญ:</Text> */}
          <View
            style={[
              styles.priorityCapsule,
              {
                backgroundColor: getPriorityStyle(news.priority).bg,
                borderColor: getPriorityStyle(news.priority).color,
              },
            ]}
          >
            <Text style={{ color: getPriorityStyle(news.priority).color, fontWeight: 'bold' }}>
              {getPriorityStyle(news.priority).label}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.divider} />

      {/* Title */}
      {/* <Text style={styles.label}>Title</Text> */}
      <Text style={styles.title}>{news.title}</Text>

      {/* Cover Image */}
      <Image source={{ uri: news.coverImage }} style={styles.image} />
      <View style={styles.divider} />

      {/* Content */}
      <Text style={styles.label}>Content</Text>
      <Text style={styles.content}>
        {typeof news.content === 'string'
          ? news.content
          : news.content?.content // <-- use this for your case
            ? news.content.content
            : news.content?.ops
              ? news.content.ops.map((op: any) => op.insert).join('')
              : ''}
      </Text>
      <View style={styles.divider} />

      {/* Link section (optional) */}
      {news.linkUrl && (
        <View style={{ marginTop: 4 }}>
          <Text style={styles.label}>Link เพิ่มเติม</Text>
          <TouchableOpacity onPress={() => Linking.openURL(news.linkUrl)}>
            <Text style={styles.link}>{news.linkUrl}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  backBtn: {
    marginBottom: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
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
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
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
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'left',
    color: '#222',
    fontFamily: 'Prompt-Bold', // เพิ่มฟอนต์
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
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
  },
  link: {
    color: '#007AFF',
    fontSize: 15,
    marginTop: 4,
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
  },
  priorityCapsule: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: 'flex-start',
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  skeletonBase: {
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  // ปรับปรุง container เล็กน้อยเพื่อให้ดูสะอาดขึ้น
 
});