import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Item from '../../components/item';
import ProfileBar from '../../components/ProfileBar';
import { getNews } from '../../composables/fetchAPI';
import { useFocusEffect } from '@react-navigation/native';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Announcement', value: 'announcement' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Promo', value: 'promo' },
  { label: 'System', value: 'system' },
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

  const handleCreateNews = () => {
    router.push({
      pathname: '/AddEditNews',
      params: { mode: 'add' },
    });
  };

  // Move fetchNews outside useFocusEffect so you can call it anytime
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

  // Filter news by title and category
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(search.toLowerCase());
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
    <>
      {/* <ProfileBar /> */}
      <View style={styles.outer}>
        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>ข่าวสาร</Text>
            
          </View>

          {/* Top Bar */}
          <View style={styles.topBar}>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
              style={styles.avatar}
            />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.greeting}>Hi, Nancy</Text>
              <Text style={styles.dateText}>Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
            <TouchableOpacity style={styles.bellWrapper}>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateNews}>
              <Text style={styles.createButtonText}>Create News</Text>
            </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={20} color="#bbb" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search News"
              value={search}
              onChangeText={setSearch}
            />
            <Ionicons name="filter-outline" size={22} color="#bbb" style={{ marginRight: 12 }} />
          </View>

          {/* Category Chips */}
          <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            showsVerticalScrollIndicator={false}
          >
            {CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.chip,
                  selectedCategory === cat.value && styles.chipActive,
                  idx === CATEGORIES.length - 1 && { marginRight: 0 },
                ]}
                onPress={() => {
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                  setSelectedCategory(cat.value);
                }}
              >
                <Text style={[
                  styles.chipText,
                  selectedCategory === cat.value && styles.chipTextActive,
                ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#5ccbffff" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={filteredNews}
              keyExtractor={(item) => item.id || item._id}
              renderItem={({ item }) => (
                <Item
                  id={item.id || item._id}
                  slug={item.slug || item._slug}
                  title={item.title}
                  coverImage={item.coverImage}
                  content={item.content?.content || item.message || ''}
                  startAt={item.startAt}
                  endAt={item.endAt}
                  type={item.type}
                  onDeleted={fetchNews} // <-- pass reload callback
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
                  ไม่พบข้อมูลข่าวสาร
                </Text>
              }
              onEndReached={loadMore}
              onEndReachedThreshold={0.2}
              ListFooterComponent={
                loadingMore ? (
                  <ActivityIndicator size="small" color="#5ccbffff" style={{ marginVertical: 16 }} />
                ) : null
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
    backgroundColor: '#5ccbffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
  },
  greeting: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  bellWrapper: {
    marginLeft: 12,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    borderWidth: 2,
    borderColor: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 18,
    marginBottom: 10,
    height: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    color: '#bdbdbdff',
    height: 44,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 8,
    marginBottom: 12, // Add this for spacing below chips
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 14, // was 8, now 14 for more space
  },
  chipActive: {
    backgroundColor: '#222',
  },
  chipText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
});
