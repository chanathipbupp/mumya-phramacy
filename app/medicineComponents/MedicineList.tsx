import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import MedicineItem from './MedicineItem';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  timesPerDay: string;
  timeOfDay: string[];
  beforeMeal: boolean;
  afterMeal: boolean;
  note: string;
  expiryDate: string;
  imageUrl: string;
}

interface MedicineListProps {
  medicines: Medicine[];
}

const MedicineList: React.FC<MedicineListProps> = ({ medicines }) => {
  return (
    <FlatList
      data={medicines}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <MedicineItem
          name={item.name}
          dosage={item.dosage}
          timesPerDay={item.timesPerDay}
          timeOfDay={item.timeOfDay}
          beforeMeal={item.beforeMeal}
          afterMeal={item.afterMeal}
          note={item.note}
          expiryDate={item.expiryDate}
          imageUrl={item.imageUrl}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    marginVertical: 8,
  },
});

export default MedicineList;