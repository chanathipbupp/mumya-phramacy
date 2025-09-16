import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Button, TouchableOpacity, Alert } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'expo-router';
import { deleteNews } from '../composables/fetchAPI';

type ItemProps = {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  coverImage: string;
  date?: string;
  message?: string;
  content?: string;
  startAt?: string;
  endAt?: string;
  type?: string;
  onDeleted?: () => void; // <-- add this
};

export default function Item({
  id,
  slug,
  title,
  summary,
  coverImage,
  content,
  startAt,
  endAt,
  type: newsType,
  onDeleted, // <-- add this
}: ItemProps) {
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const router = useRouter();

  const handleEdit = () => {
    router.push({
      pathname: '/AddEditNews',
      params: { slug, mode: 'edit' },
    });
  };

  const handlePress = () => {
    router.push({
      pathname: '/NewsDetail',
      params: { slug },
    });
  };

  // Format dates
  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Soft delete handler
  const handleDelete = async (e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้")) return;
    try {
      await deleteNews(id);
      window.alert("ลบสำเร็จ ข่าวถูกลบแล้ว");
      if (onDeleted) onDeleted(); // <-- call reload
    } catch (e: any) {
      window.alert(e.message || "ไม่สามารถลบข่าวได้");
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.container}>
        {/* Red X button for admin */}
        {user.role === 'admin' && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        )}
        <View style={styles.imageWrapper}>
          {loading && <View style={styles.imagePlaceholder} />}
          <Image
            source={{ uri: coverImage }}
            style={styles.image}
            onLoadEnd={() => setLoading(false)}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text
            style={styles.contentPreview}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {content}
          </Text>
          <Text style={styles.dateType}>
            {formatDate(startAt)}
          </Text>
          <Text style={styles.typeText}>{newsType}</Text>
          {user.role === 'admin' && (
            <View style={styles.editButtonWrapper}>
              <Button title="แก้ไข" onPress={handleEdit} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    padding: 12,
    alignItems: 'flex-start',
    // Shadow for iOS/web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Shadow for Android
    elevation: 6,
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 1,
    // borderColor: '#f44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deleteBtnText: {
    color: '#f44',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  imageWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#f3f3f3',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  imagePlaceholder: {
    position: 'absolute',
    width: 120,
    height: 120,
    backgroundColor: '#ddd',
    borderRadius: 24,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    minHeight: 120,
    justifyContent: 'flex-start',
    paddingVertical: 4,
    position: 'relative',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 6,
  },
  contentPreview: {
    fontSize: 12,
    color: '#444',
    marginBottom: 2,
    minHeight: 28,
  },
  dateType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  typeText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  editButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 0,
    margin: 0,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#51c0f4ff',
  },
});