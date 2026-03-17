import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
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
  onDeleted?: () => void;
  role?: string;
};

export default function Item({
  id,
  slug,
  title,
  summary,
  coverImage,
  content,
  startAt,
  type: newsType,
  onDeleted,
  role
}: ItemProps) {
  const [loading, setLoading] = useState(true);
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

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // ฟังก์ชันแปลงประเภทเป็นภาษาไทยพร้อมอิโมจิ
  const renderType = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'announcement':
        return { label: 'ประกาศ 📢', color: '#E91E63' };
      case 'promo':
        return { label: 'โปรโมชั่น 🏷️', color: '#FF9800' };
      case 'maintenance':
        return { label: 'การบำรุงรักษา 🛠️', color: '#F44336' };
      case 'system':
        return { label: 'ระบบ ⚙️', color: '#4CAF50' };
      default:
        return { label: type || 'ข่าวสาร 📰', color: '#888' };
    }
  };

  const typeInfo = renderType(newsType);

  const handleDelete = async (e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้")) return;
    try {
      await deleteNews(id);
      window.alert("ลบสำเร็จ ข่าวถูกลบแล้ว");
      if (onDeleted) onDeleted();
    } catch (e: any) {
      window.alert(e.message || "ไม่สามารถลบข่าวได้");
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.container}>
        {role?.toLowerCase() === 'admin' && (
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
          <View>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>


            <Text
              style={styles.contentPreview}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {content}
            </Text>
          </View>
          {/* ส่วนแสดงประเภทที่มีการปรับแต่งสี */}
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '15' }]}>
            <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.dateText}>
              📅 {formatDate(startAt)}
            </Text>

            {role?.toLowerCase() === 'admin' && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Text style={styles.editButtonText}>แก้ไข</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  deleteBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 0.5,
    borderColor: '#eee'
  },
  deleteBtnText: {
    color: '#f44',
    fontSize: 14,
    fontWeight: 'bold',
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
    fontFamily: 'Prompt-Regular'
  },
  imagePlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#ddd',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    height: 100,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#333',
    fontFamily: 'Prompt-Bold',
    marginBottom: 2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  contentPreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontFamily: 'Prompt-Regular',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Prompt-Regular'
  },
  editButton: {
    backgroundColor: '#0097a7',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Prompt-Regular'
  },
});