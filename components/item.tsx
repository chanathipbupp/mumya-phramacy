import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { useRouter } from 'expo-router';

type ItemProps = {
  slug: string;
  title: string;
  summary: string;
  image: string;
  date: string;
  content?: string; // Add content prop
};

export default function Item({ slug, title, summary, image, date, content }: ItemProps) {
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

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.container}>
        <View style={styles.imageWrapper}>
          {loading && <View style={styles.imagePlaceholder} />}
          <Image
            source={{ uri: image }}
            style={styles.image}
            onLoadEnd={() => setLoading(false)}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.summary}>{summary}</Text>
          <Text style={styles.date}>{date}</Text>
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
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  summary: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  editButtonWrapper: {
    padding: 10,
  },
});