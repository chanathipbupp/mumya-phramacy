import React from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import ArticleItem from '../../components/ArticleItem';
import { getArticles } from '../../composables/fetchAPI';
import { useUser } from '../../components/UserProvider'
import ProfileBar from '../../components/ProfileBar';

export default function ArticleScreen() {
  const router = useRouter();
  const [articles, setArticles] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const user = useUser();

  //console.log("user in article ", user)

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await getArticles({ page: '1', limit: '10' });
      setArticles(res.items || res.data || []);
    } catch {
      setArticles([]);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    fetchArticles();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchArticles();
    }, [])
  );

  const handleCreateArticles = () => {
    router.push({
      pathname: '/AddEditArticle',
      params: { mode: 'add' },
    });
  };

  // Optional: filter articles by search
  const filteredArticles = articles.filter(article =>
    article.title?.toLowerCase().includes(search.toLowerCase())
  );

  const userProfile = user?.user || {};

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: '#F5F5F5' }}>


      {/* Top Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        borderRadius: 16,
        padding: 12,
      }}>

        <View style={{ flex: 1 }}>
          <ProfileBar
            avatarUrl={userProfile.avatarUrl || userProfile.picture}
            name={userProfile.name || userProfile.displayName || 'Nancy'}
          />
        </View>
        <TouchableOpacity style={{ marginLeft: 8 }}>
          {/* <Ionicons name="notifications-outline" size={28} color="#FFC107" />
          <View style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#FF5252',
            borderWidth: 1,
            borderColor: '#fff',
          }} /> */}

          {user?.user.role?.toLowerCase() === 'admin' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={handleCreateArticles}
                style={{
                  backgroundColor: '#5ccbffff',
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Create Article</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 12,
        marginHorizontal: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      }}>
        <Ionicons name="search" size={20} color="#bbb" style={{ marginLeft: 4 }} />
        <TextInput
          style={{ flex: 1, fontSize: 15, color: '#222', marginLeft: 8 }}
          placeholder="Search Article"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#aaa"
        />
        {/* <Ionicons name="filter-outline" size={22} color="#bbb" style={{ marginRight: 4, marginLeft: 8 }} /> */}
      </View>

      {/* Articles List */}
      <ScrollView
        style={{ flex: 1, marginTop: 8 }}
        showsVerticalScrollIndicator={false}
        
      >
        {filteredArticles.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
          ไม่พบข้อมูลข่าวสาร
        </Text>
      ) : (
        filteredArticles.map(article => (
          <ArticleItem
            slug={article.slug}
            key={article.id}
            id={article.id}
            title={article.title}
            content={
              Array.isArray(article.content?.content)
                ? article.content.content
                  .map((node: any) =>
                    Array.isArray(node.content)
                      ? node.content.map((c: any) => c.text).join('')
                      : (typeof node.text === 'string' ? node.text : '')
                  )
                  .join('\n')
                : typeof article.content?.content === 'string'
                  ? article.content.content
                  : ''
            }
            coverImage={article.coverImage}
            date={article.publishDate}
            tags={article.tags}
            onDeleted={fetchArticles}
            role={user?.user?.role}
            
          />
        ))
      )}
        {loading && <Text>Loading...</Text>}
      </ScrollView>
    </View>
  );
}


