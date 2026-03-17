import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import MedicineItem from './MedicineItem';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // ใช้สำหรับแสดงหน้ารอโหลดฟอนต์

interface Medicine {
  id: string;
  medicineName: string;
  dosageForm: string;
  usageTemplate: {
    frequency: string | null;
    timing: string[];
    caution?: string;
    mealRelation: string[];
    dosePerTime?: string;
  };
  expiryDate: string;
  note: string;
  imageUrl: string;
  type: string;
  quantity: number; // เพิ่ม quantity
}

interface AdminDispenseListProps {
  selectedMedicines: Medicine[]; // รับรายการยาที่ถูกเลือก
  setSelectedMedicines: React.Dispatch<React.SetStateAction<Medicine[]>>; // ฟังก์ชันสำหรับอัปเดตรายการยา
  onQuantityChange: (id: string, newQuantity: number) => void; // ฟังก์ชันสำหรับอัปเดต quantity
  onExpiryDateChange: (id: string, newExpiryDate: string) => void; // เพิ่มฟังก์ชันนี้
  onFrequencyChange: (id: string, newFrequency: string) => void; // เพิ่มฟังก์ชันนี้
  onDosePerTimeChange: (id: string, newDosePerTime: string) => void; // เพิ่มฟังก์ชันนี้
  onCautionChange: (id: string, newCaution: string) => void; // เพิ่มฟังก์ชันนี้
  onTimingChange: (id: string, newTiming: string[]) => void; // เพิ่มฟังก์ชันนี้
  onMealRelationChange: (id: string, newMealRelation: string[]) => void; // เพิ่มฟังก์ชันนี้

}

const AdminDispenseList: React.FC<AdminDispenseListProps> = ({ selectedMedicines, setSelectedMedicines, onQuantityChange, onExpiryDateChange, onFrequencyChange, onDosePerTimeChange, onCautionChange, onTimingChange, onMealRelationChange }) => {
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }

  // ฟังก์ชันสำหรับลบยาออกจากรายการ
  const handleDelete = (id: string) => {
    setSelectedMedicines((prev) => prev.filter((medicine) => medicine.id !== id));
  };


  const handleUpdate = (updatedMedicine: Medicine) => {
    setSelectedMedicines((prev) => {
      const updatedList = prev.map((medicine) =>
        medicine.id === updatedMedicine.id
          ? {
            ...medicine,
            ...updatedMedicine, // อัปเดตข้อมูลทั้งหมดของยา
            usageTemplate: {
              ...updatedMedicine.usageTemplate, // ใช้ข้อมูลใหม่จาก updatedMedicine
            },
            expiryDate: updatedMedicine.expiryDate, // อัปเดต expiryDate
          }
          : medicine
      );
      console.log('Updated selectedMedicines:', updatedList); // ตรวจสอบว่ามีการอัปเดต expiryDate หรือไม่
      return updatedList;
    });
  };
  // const handleUpdateMedicine = (updatedData: any) => {
  //   setSelectedMedicines((prevMedicines) =>
  //     prevMedicines.map((medicine) =>
  //       medicine.name === updatedData.id
  //         ? { ...medicine, ...updatedData }
  //         : medicine
  //     )
  //   );
  // };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>รายการยาที่จะจ่าย</Text>
      {/* <View>
        <Text style={{ fontSize: 12, color: 'black' }}>
          {JSON.stringify(selectedMedicines, null, 2)}
        </Text>
      </View> */}
      <View style={styles.list}>
        <FlatList
          data={selectedMedicines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MedicineItem
              name={item.medicineName}
              dosage={item.dosageForm}
              timesPerDay={item.usageTemplate?.frequency || ''}
              timeOfDay={item.usageTemplate?.timing || []}
              mealRelation={item.usageTemplate?.mealRelation || []}
              caution={item.note || 'ไม่มีหมายเหตุ'}
              imageUrl={item.imageUrl || ''}
              type={item.type || ''}
              quantity={item.quantity}
              stage="for_dispense"
              onDelete={() => handleDelete(item.id)}
              onUpdate={(updatedData) => {
                if (updatedData.quantity !== undefined) {
                  onQuantityChange(item.id, updatedData.quantity); // อัปเดต quantity
                }
                if (updatedData.expiryDate) {
                  handleUpdate({ ...item, expiryDate: updatedData.expiryDate }); // อัปเดต expiryDate
                }
                if (updatedData.usage?.frequency) {
                  onFrequencyChange(item.id, updatedData.usage.frequency); // อัปเดต frequency
                }
                if (updatedData.usage?.dosePerTime) {
                  onDosePerTimeChange(item.id, updatedData.usage.dosePerTime); // อัปเดต dosePerTime
                }
                if (updatedData.usage?.caution) {
                  onCautionChange(item.id, updatedData.usage.caution); // อัปเดต caution
                }
                if (updatedData.usage?.timing) {
                  onTimingChange(item.id, updatedData.usage.timing); // อัปเดต timing
                }
                if (updatedData.usage?.mealRelation) {
                  onMealRelationChange(item.id, updatedData.usage.mealRelation); // อัปเดต mealRelation
                }
              }} />
          )}
        />
      </View>
    </View>
  );
};

export default AdminDispenseList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Prompt-Bold',
  },
  list: {
    width: '70%',
    height: 400, // กำหนดความสูงคงที่
    overflow: 'hidden', // ป้องกันไม่ให้เนื้อหาเกินออกมา
  },

});