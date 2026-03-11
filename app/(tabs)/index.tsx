import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Item from '../../components/item';
import ProfileBar from '../../components/ProfileBar';
import { getNews } from '../../composables/fetchAPI';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '../../components/UserProvider';
import AnnounceIcon from '../components/AnnounuceIcon';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // ใช้สำหรับแสดงหน้ารอโหลดฟอนต์

const CATEGORIES = [
  { label: 'All', value: '', name: 'ทั้งหมด' },
  { label: 'Announcement', value: 'announcement', name: 'ประกาศ' },
  { label: 'Promotion', value: 'promo', name: 'โปรโมชั่น' },
  { label: 'Maintenance', value: 'maintenance', name: 'การบำรุงรักษา' },
  { label: 'System', value: 'system', name: 'ระบบ' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = React.useRef<FlatList>(null);
  const user = useUser();
  const userProfile = user?.user || {};


  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }

  const handleCreateNews = () => {
    router.push({
      pathname: '/AddEditNews',
      params: { mode: 'add' },
    });
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await getNews({ page: '1', limit: '10' });
      const fetched = res.data || res;
      const items = Array.isArray(fetched) ? fetched : fetched.items || [];
      setNews(items);
      setHasMore((fetched.total || items.length) > items.length);
      setPage(1);
    } catch (e) {
      setNews([]);
      setHasMore(false);
    }
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNews();
    }, [])
  );

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const title = item.title || '';
      const matchTitle = title.toLowerCase().includes(search.toLowerCase());
      const matchCategory = selectedCategory ? item.type === selectedCategory : true;
      return matchTitle && matchCategory;
    });
  }, [news, search, selectedCategory]);

  const loadMore = async () => {
    if (loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getNews({ page: nextPage.toString(), limit: '10' });
      const fetched = res.data || res;
      const newItems = Array.isArray(fetched) ? fetched : fetched.items || [];
      setNews(prev => [...prev, ...newItems]);
      const totalLoaded = news.length + newItems.length;
      setHasMore(totalLoaded < (fetched.total || 0));
      setPage(nextPage);
    } catch (e) {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  return (
    <View style={styles.outer}>
      {/* 1. ใส่ Gradient พื้นหลัง */}
      <LinearGradient
        colors={['#eef9ff', '#f0faff', '#c1ced2']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.container}>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileContainer}>
            <ProfileBar
              avatarUrl={userProfile.avatarUrl || userProfile.picture}
              name={userProfile.name || userProfile.displayName || 'Guest'}
            />
          </View>
          {user?.user?.role?.toLowerCase() === 'admin' && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createButtonText}>New Post</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={20} color="#999" style={{ marginLeft: 15 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search latest updates..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ marginRight: 12 }}>
                <Ionicons name="close-circle" size={18} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoryWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryTile,
                    isActive && styles.categoryTileActive,
                  ]}
                  onPress={() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                    setSelectedCategory(cat.value);
                  }}
                >
                  <AnnounceIcon />

                  <Text
                    style={[
                      styles.tileText,
                      isActive && styles.tileTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* News List */}
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color="#0097a7" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredNews}
            keyExtractor={(item) => item.id || item._id}
            renderItem={({ item }) => (
              <View style={styles.itemWrapper}>
                <Item
                  id={item.id || item._id}
                  slug={item.slug || item._slug}
                  title={item.title}
                  coverImage={item.coverImage}
                  content={item.content?.content || item.message || ''}
                  startAt={item.startAt}
                  endAt={item.endAt}
                  type={item.type}
                  onDeleted={fetchNews}
                  role={user?.user?.role}
                />
              </View>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={60} color="#ddd" />
                <Text style={styles.emptyText}>ไม่พบข้อมูลข่าวสารในขณะนี้</Text>
              </View>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator size="small" color="#0097a7" style={{ marginVertical: 20 }} />
              ) : <View style={{ height: 40 }} />
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    // backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },

  container: {
    flex: 1,
    width: '100%',
    maxWidth: 900, // Responsive max width for PC
    padding: 12,
    // backgroundColor: '#F5F5F5',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  profileContainer: {
    flex: 1,
  },
  createButton: {
    backgroundColor: '#0097a7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    // Shadow สำหรับปุ่มให้ดูลอยออกมา
    ...Platform.select({
      ios: { shadowColor: '#0097a7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 5 },
    }),
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Prompt-Bold', // ใช้ฟอนต์ที่โหลด
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    height: 50,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    color: '#333',
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipActive: {
    backgroundColor: '#0097a7',
    borderColor: '#0097a7',
  },
  chipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Prompt-Bold', // เพิ่มฟอนต์
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemWrapper: {
    marginBottom: 16, // ระยะห่างระหว่างการ์ดข่าว
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    marginTop: 15,
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Prompt-Regular', // เพิ่มฟอนต์
  },
  categoryWrapper: {
    marginVertical: 15,
  },
  chipRow: {
    paddingHorizontal: 15,
    paddingBottom: 10, // เผื่อพื้นที่ให้เงาด้านล่าง
  },
  categoryTile: {
    width: 90,
    height: 90,
    backgroundColor: '#eef9ff', // สีฟ้าอ่อนมากแบบในรูป
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    // เงาบางๆ สำหรับใบที่ไม่ได้เลือก
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryTileActive: {
    backgroundColor: '#00adef', // สีฟ้าสดตามรูป
    borderColor: '#00adef',
    // เอฟเฟกต์ Glow สีฟ้า
    shadowColor: "#00adef",
    shadowOffset: { width: 6, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  tileText: {
    fontSize: 13,
    color: '#00adef',
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'Prompt-Regular', // ใช้ฟอนต์ที่โหลด
  },
  tileTextActive: {
    color: '#fff',
    fontWeight: '700',
    fontFamily: 'Prompt-Regular'
  },
  bgIcon1: {
    position: 'absolute',
    top: -40,
    right: -50,
    opacity: 0.05, // จางมากๆ เพื่อให้ดูแพง
    transform: [{ rotate: '15deg' }],
  },
  bgIcon2: {
    position: 'absolute',
    bottom: '20%',
    left: -40,
    opacity: 0.04,
    transform: [{ rotate: '-20deg' }],
  },
  bgIcon3: {
    position: 'absolute',
    bottom: -30,
    right: -20,
    opacity: 0.05,
  },
  circleDecor: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 40,
    borderColor: '#0097a7',
    top: '30%',
    right: -150,
    opacity: 0.02, // ให้เห็นแค่ลางๆ เป็น Layer
  },
});