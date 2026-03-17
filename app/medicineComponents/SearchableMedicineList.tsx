import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MedicineItem from './MedicineItem';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // ใช้สำหรับแสดงหน้ารอโหลดฟอนต์
interface Medicine {
  id: string;
  productCode: string;
  medicineName: string;
  genericName: string;
  category: string[];
  type: string;
  dosageForm: string;
  imageUrl: string;
  price: number;
  note: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  expiryDate: string;
  usageTemplate: {
    route: string | null;
    frequency: string | null;
    timing: string[];
    caution: string[];
    mealRelation: string[];
  };
}

interface SearchableMedicineListProps {
  medicines: Medicine[];
  onSelectMedicine: (medicine: Medicine) => void;
  onAddMedicine?: (medicine: Medicine) => void; // เพิ่มฟังก์ชันสำหรับเพิ่มยา
  isTab?: string;
  fetchMedicines: (query: string) => void; // เพิ่ม prop สำหรับเรียก API

}

const SearchableMedicineList: React.FC<SearchableMedicineListProps> = ({ medicines, onSelectMedicine, onAddMedicine, isTab, fetchMedicines }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMedicines(searchQuery); // เรียก API เมื่อ searchQuery เปลี่ยนแปลง
    }, 300); // เพิ่ม debounce 300ms เพื่อลดการเรียก API บ่อยเกินไป

    return () => clearTimeout(delayDebounce); // ล้าง timeout เมื่อ searchQuery เปลี่ยน
  }, [searchQuery]);



  const handleAddMedicine = (medicine: Medicine) => {
  if (onAddMedicine) {
    const existingMedicine = medicines.find((m) => m.id === medicine.id);
    if (existingMedicine) {
      // ถ้ามียาอยู่แล้ว ให้เพิ่ม quantity
      const updatedMedicine = {
        ...existingMedicine,
        quantity: (existingMedicine.quantity || 0) + 1,
      };
      onAddMedicine(updatedMedicine); // ส่งยาอัปเดตกลับไปยัง parent
    } else {
      // ถ้ายังไม่มียาในลิสต์ ให้เพิ่มยาใหม่พร้อม quantity = 1
      onAddMedicine({ ...medicine, quantity: 1 });
    }
  }
};

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="ค้นหายา..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
        <View style={styles.flatListContainer}>

      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.medicineItemContainer}>
            <TouchableOpacity onPress={() => onSelectMedicine(item)}>

              <MedicineItem
                name={item.medicineName || ''} // ใช้ medicineName แทน name
                dosage={item.dosageForm || ''} // ใช้ dosageForm แทน dosage
                timesPerDay={item.usageTemplate?.frequency || ''} // ตรวจสอบว่า usageTemplate มีค่าหรือไม่
                timeOfDay={item.usageTemplate?.timing || []} // ตรวจสอบว่า usageTemplate มีค่าหรือไม่
                beforeMeal={item.usageTemplate?.mealRelation?.includes('beforeMeal') || false}
                afterMeal={item.usageTemplate?.mealRelation?.includes('afterMeal') || false}
                note={item.note || 'ไม่มีหมายเหตุ'} // เพิ่ม default value
                expiryDate={item.lots?.[0]?.expiryDate || 'ไม่ระบุวันหมดอายุ'} // ตรวจสอบว่า lots มีค่าหรือไม่และไม่ว่าง
                imageUrl={item.imageUrl || 'https://independent-amethyst-f5zmr8qcbx.edgeone.dev/medicine.png'} // URL รูปภาพเริ่มต้น
                type={item.type || ''} // ส่ง type
                stage="for_dashboard" // หรือ "for_order" ตามที่ต้องการ
              />
            </TouchableOpacity>

            {/* ปุ่ม + */}
            {isTab === 'dispense' && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddMedicine(item)}
              >
                <Text style={styles.addButtonText}>+ เพิ่ม</Text>
              </TouchableOpacity>
            )}

          </View>
        )}
      />    
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
   flatListContainer: {
    height: 350, // กำหนดความสูงคงที่
    overflow: 'hidden', // ป้องกันไม่ให้เนื้อหาเกินออกมา
  },
  searchBar: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontFamily: 'Prompt-Regular',

  },
  medicineItemContainer: {
    position: 'relative', // ใช้ position เพื่อให้ปุ่มลอย
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  addButton: {
    position: 'absolute', // ทำให้ปุ่มลอย
    top: 12, // ระยะห่างจากด้านบน
    right: 12, // ระยะห่างจากด้านขวา
    backgroundColor: '#E91E63',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Prompt-Bold',
  },
});

export default SearchableMedicineList;