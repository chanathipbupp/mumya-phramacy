import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import Item from '../../components/item';

// Mock data import
import articles from '../../composables/article.json';

export default function ArticleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.header} >บทความ</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Item
            id={item.id}
            title={item.title}
            summary={item.summary}
            image={item.image}
            date={item.date}
          />
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});


