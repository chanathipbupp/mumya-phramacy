import DateTimePicker from '@react-native-community/datetimepicker';
import { addMonths, addYears, format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { CheckBox, Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface MedicineItemProps {
  name: string;
  dosage: string;
  timesPerDay: string;
  timeOfDay: string[];
  mealRelation: string[];
  note: string;
  expiryDate: string;
  imageUrl: string;
  type: string; // เพิ่ม type
  quantity: number; // เพิ่ม quantity
  caution: string;
  stage: 'for_order' | 'for_dashboard' | 'for_dispense'; // เพิ่ม stage "for_dispense"
  onDelete?: () => void; // ฟังก์ชันสำหรับปุ่มลบ
  onUpdate?: (updatedData: any) => void; // ฟังก์ชันสำหรับอัปเดตข้อมูล

}

const MedicineItem: React.FC<MedicineItemProps> = ({
  name,
  dosage,
  timesPerDay,
  timeOfDay,
  mealRelation,
  note,
  caution,
  expiryDate,
  imageUrl,
  type,
  quantity,
  stage,
  onDelete,
  onUpdate,
}) => {
  const [editableDosage, setEditableDosage] = useState(dosage);
  const [editableTimesPerDay, setEditableTimesPerDay] = useState(timesPerDay);
  const [editableTimeOfDay, setEditableTimeOfDay] = useState(timeOfDay);
  const [editableNote, setEditableNote] = useState(caution);
  const [editableexpiryDate, setEditableexpiryDate] = useState(expiryDate);
  const [editableMealRelation, setEditableMealRelation] = useState(mealRelation || []);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(quantity); // สร้าง state ใหม่สำหรับ quantity
  const [isConfirmModalVisible, setConfirmModalVisible] = useState(false);
  const [editableCaution, setEditableCaution] = useState(note);
  const [editableQuantity, setEditableQuantity] = useState(quantity);

  useEffect(() => {
    setLocalQuantity(quantity); // อัปเดต localQuantity เมื่อ quantity เปลี่ยน
  }, [quantity]);



  // const handleCautionChange = (text: string) => {
  //   setEditableCaution(text);
  //   if (onUpdate) {
  //     onUpdate({ id: name, caution: text }); // ส่งค่า caution ที่อัปเดตกลับไป
  //   }
  // };


  // const handleQuantityChange = (newQuantity: number) => {
  //   if (newQuantity <= 0) {
  //     setConfirmModalVisible(true); // แสดง Modal ยืนยัน
  //   } else {
  //     setLocalQuantity(newQuantity); // อัปเดตค่าใน local state
  //     onUpdate?.({ id: name, quantity: newQuantity }); // ส่งค่าที่อัปเดตไปยัง parent component
  //   }
  // };
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) {
      return; // ป้องกันไม่ให้ quantity ติดลบ
    }

    if (newQuantity === 0) {
      setConfirmModalVisible(true); // แสดง Modal ยืนยันการลบ
      return;
    }

    setLocalQuantity(newQuantity); // อัปเดตค่าใน local state
    if (onUpdate) {
      onUpdate({ id: name, quantity: newQuantity }); // ส่งค่า quantity ที่อัปเดตกลับไป
    }
  };

  const handleDeleteConfirm = () => {
    setConfirmModalVisible(false); // ปิด Modal
    onDelete?.(); // เรียก onDelete
  };

  const handleDeleteCancel = () => {
    setConfirmModalVisible(false); // ปิด Modal
  };

  const handleCheckboxChange = (value: string) => {
    const updatedMealRelation = editableMealRelation.includes(value)
      ? editableMealRelation.filter((item) => item !== value)
      : [...editableMealRelation, value];
    const updatedTimeOfDay = editableTimeOfDay.includes(value)
      ? editableTimeOfDay.filter((item) => item !== value)
      : [...editableTimeOfDay, value];

    setEditableMealRelation(updatedMealRelation);
    onUpdate?.({
      id: name,
      usageTemplate: {
        frequency: editableTimesPerDay,
        timing: updatedTimeOfDay, // อัปเดต timing แทน mealRelation
        mealRelation: updatedMealRelation,
        caution: editableNote,
      },
      quantity: localQuantity,
      expiryDate: editableexpiryDate,
      dosageForm: editableDosage,
    });
  };

  const handleUpdate = () => {
    const updatedData = {
      id: name, // ใช้ id หรือ key ที่เหมาะสม
      dosage: editableDosage,
      timesPerDay: editableTimesPerDay,
      timeOfDay: editableTimeOfDay,
      mealRelation: editableMealRelation,
      note: editableNote,
      expiryDate: editableexpiryDate,
      caution: editableCaution,
      quantity: editableQuantity,
      usageTemplate: {
        frequency: editableTimesPerDay,
        timing: editableTimeOfDay,
        caution: editableCaution,
        mealRelation: editableMealRelation,
      },
    };
    onUpdate?.(updatedData); // ส่งข้อมูลที่อัปเดตไปยัง parent component
  };


  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setEditableexpiryDate(formattedDate);
      if (onUpdate) {
        onUpdate({ id: name, expiryDate: formattedDate }); // ส่งค่า expiryDate ที่อัปเดตกลับไป
      }
    }
  };

  const handleFrequencyChange = (newFrequency: string) => {
    setEditableTimesPerDay(newFrequency); // อัปเดตค่าใน local state
    if (onUpdate) {
      onUpdate({
        id: name,
        usage: {
          frequency: newFrequency, // ส่งค่า frequency ที่อัปเดตกลับไป
        },
      });
    }
  };

  const handleDosePerTimeChange = (text: string) => {
    setEditableDosage(text);
    onUpdate?.({
      id: name,
      usage: {
        dosePerTime: text,
      },
    });
  };
  const handleCautionChange = (text: string) => {
    setEditableCaution(text);
    if (onUpdate) {
      onUpdate({
        id: name,
        usage: {
          caution: text, // ส่งค่า caution ที่อัปเดตกลับไป
        },
      });
    }
  };

  const handleTimingChange = (time: string) => {
    const updatedTiming = editableTimeOfDay.includes(time)
      ? editableTimeOfDay.filter((item) => item !== time) // เอาออกถ้ามีอยู่แล้ว
      : [...editableTimeOfDay, time]; // เพิ่มถ้ายังไม่มี

    setEditableTimeOfDay(updatedTiming); // อัปเดต local state
    if (onUpdate) {
      onUpdate({
        id: name,
        usage: {
          timing: updatedTiming, // ส่ง timing ที่อัปเดตกลับไป
        },
      });
    }
  };

  const handleMealRelationChange = (relation: string) => {
    const updatedMealRelation = editableMealRelation.includes(relation)
      ? editableMealRelation.filter((item) => item !== relation) // เอาออกถ้ามีอยู่แล้ว
      : [...editableMealRelation, relation]; // เพิ่มถ้ายังไม่มี

    setEditableMealRelation(updatedMealRelation); // อัปเดต local state
    if (onUpdate) {
      onUpdate({
        id: name,
        usage: {
          mealRelation: updatedMealRelation, // ส่ง mealRelation ที่อัปเดตกลับไป
        },
      });
    }
  };


  return (
    <View style={styles.container}>
      {stage === 'for_dispense' && (
        <>
          {/* ปุ่มลบ */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setConfirmModalVisible(true)} // แสดง Modal ยืนยัน
          >
            <Text style={styles.deleteButtonText}>ลบ</Text>
          </TouchableOpacity>

          {/* ชื่อยา */}
          <Text style={styles.medicineName}>{name}</Text>

          <View style={styles.contentContainer}>
            {/* รูปภาพยา */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>

            {/* รายละเอียดยา */}
            <View style={styles.detailsContainer}>
              <View style={styles.row}>
                <Text>รับประทานครั้งละ:</Text>
                <TextInput
                  style={styles.input}
                  value={editableDosage}
                  onChangeText={handleDosePerTimeChange}
                  onBlur={handleUpdate}
                  keyboardType="numeric"
                  placeholder="0"
                />
                <Text>เม็ด</Text>
                <View style={{ marginLeft: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <Text>วันละ:</Text>
                  <TextInput
                    style={styles.input}
                    value={editableTimesPerDay}
                    onChangeText={handleFrequencyChange} // อัปเดต frequency
                    onBlur={handleUpdate}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text>ครั้ง</Text>
                </View>

              </View>

              {/* เวลา */}
              <View style={styles.timeOfDayContainer}>
                {['เช้า', 'กลางวัน', 'เย็น', 'ก่อนนอน'].map((time) => (
                  <View key={time} style={styles.timeOfDayItem}>
                    <CheckBox
                      value={editableTimeOfDay.includes(time)} // ตรวจสอบว่าเวลานั้นอยู่ใน array หรือไม่
                      onValueChange={() => handleTimingChange(time)} // เรียกใช้ฟังก์ชัน toggle
                    />
                    <Text style={styles.timeOfDayText}>{time}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.mealContainer}>
                <View style={styles.row}>
                  <CheckBox
                    value={editableMealRelation.includes('beforeMeal')} // ตรวจสอบว่า "ก่อนอาหาร" อยู่ใน array หรือไม่
                    onValueChange={() => handleMealRelationChange('beforeMeal')} // เรียกใช้ฟังก์ชัน toggle
                  />
                  <Text style={styles.mealText}>ก่อนอาหาร</Text>

                  <CheckBox
                    value={editableMealRelation.includes('afterMeal')} // ตรวจสอบว่า "หลังอาหาร" อยู่ใน array หรือไม่
                    onValueChange={() => handleMealRelationChange('afterMeal')} // เรียกใช้ฟังก์ชัน toggle
                  />
                  <Text style={styles.mealText}>หลังอาหาร</Text>
                </View>
              </View>


              <View style={[styles.row, styles.inputColumn]}>
                <Text style={styles.labelText}>หมายเหตุ:</Text>
                <TextInput
                  style={[styles.multiLineInput]}
                  value={editableCaution}
                  onChangeText={handleCautionChange}
                  placeholder="ระบุหมายเหตุ"
                  multiline={true} // เปิดใช้งานการพิมพ์หลายบรรทัด
                  numberOfLines={3} // กำหนดให้แสดง 3 บรรทัด
                  textAlignVertical="top" // จัดข้อความให้อยู่ด้านบน
                />
              </View>
              <View style={[styles.row, styles.expiryDateRow]}>
                <Text style={styles.labelText}>วันหมดอายุ: </Text>
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    style={{ ...styles.input, width: '30%' }}
                    value={editableexpiryDate ? editableexpiryDate : ''} // ใช้ค่า editableexpiryDate โดยตรง
                    onChange={(e) => {
                      const newDate = e.target.value; // รับค่าในรูปแบบ YYYY-MM-DD
                      handleDateChange(null, new Date(newDate)); // เรียกใช้ handleDateChange
                    }}
                  />
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.input, styles.textInputWithBorder]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text>{editableexpiryDate || "วันหมดอายุ (Default วันนี้)"}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={editableexpiryDate ? new Date(editableexpiryDate) : new Date()}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => {
                          setShowDatePicker(false);
                          if (selectedDate) {
                            const formattedDate = selectedDate.toISOString().split('T')[0]; // แปลงเป็น YYYY-MM-DD
                            setEditableexpiryDate(formattedDate); // อัปเดต editableexpiryDate
                            onUpdate?.({ expiryDate: formattedDate }); // ส่งค่าใหม่ไปยัง parent component
                          }
                        }}
                      />
                    )}
                  </>
                )}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.expiryButton, styles.oneMonthButton]}
                    onPress={() => {
                      const newDate = format(addMonths(new Date(), 1), 'yyyy-MM-dd'); // แปลงเป็น YYYY-MM-DD
                      setEditableexpiryDate(newDate);
                      onUpdate?.({ expiryDate: newDate });
                    }}
                  >
                    <Text style={styles.buttonText}>1 เดือน</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.expiryButton, styles.oneYearButton]}
                    onPress={() => {
                      const newDate = format(addYears(new Date(), 1), 'yyyy-MM-dd'); // แปลงเป็น YYYY-MM-DD
                      setEditableexpiryDate(newDate);
                      onUpdate?.({ expiryDate: newDate });
                    }}
                  >
                    <Text style={styles.buttonText}>1 ปี</Text>
                  </TouchableOpacity>
                  {/* <TouchableOpacity
                    style={[styles.expiryButton, styles.twoYearsButton]}
                    onPress={() => {
                      const newDate = format(addYears(new Date(), 2), 'yyyy-MM-dd'); // แปลงเป็น YYYY-MM-DD
                      setEditableexpiryDate(newDate);
                      onUpdate?.({ expiryDate: newDate });
                    }}
                  >
                    <Text style={styles.buttonText}>2 ปี</Text>
                  </TouchableOpacity> */}
                </View>
              </View>

            </View>
            {/* ปุ่มเพิ่ม/ลดจำนวน */}
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(localQuantity - 1)} // ลดจำนวน
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{localQuantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(localQuantity + 1)} // เพิ่มจำนวน
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      {stage === 'for_order' && (
        <>
          <Text style={styles.medicineName}>{name}</Text>
          <View style={styles.contentContainer}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUrl }} style={styles.image} />
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.medicineInfo}>
                รับประทานครั้งละ: {dosage} เม็ด วันละ: {timesPerDay} ครั้ง
              </Text>
              <View style={styles.timeOfDayContainer}>
                {['เช้า', 'กลางวัน', 'เย็น', 'ก่อนนอน'].map((time) => (
                  <View key={time} style={styles.timeOfDayItem}>
                    <CheckBox
                      value={editableTimeOfDay.includes(time)} // ตรวจสอบว่าเวลานั้นอยู่ใน array หรือไม่
                      onValueChange={() => handleTimingChange(time)} // เรียกใช้ฟังก์ชัน toggle
                    />
                    <Text
                      style={[
                        styles.timeOfDayText,
                        !editableTimeOfDay.includes(time) && styles.inactiveText, // เพิ่มสีเทาหากไม่ได้ติ๊ก
                      ]}
                    >
                      {time}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.mealContainer}>
                <CheckBox value={mealRelation.includes('beforeMeal')} />
                <Text style={[styles.mealText, !mealRelation.includes('beforeMeal') && styles.inactiveText]}>ก่อนอาหาร</Text>
                <CheckBox value={mealRelation.includes('afterMeal')} />
                <Text style={[styles.mealText, !mealRelation.includes('afterMeal') && styles.inactiveText]}>หลังอาหาร</Text>
              </View>
              <Text style={styles.noteText}>หมายเหตุ: {caution}</Text>
              <Text style={styles.expiryText}>
                หมดอายุ: {expiryDate ? expiryDate.split('T')[0] : 'ไม่ระบุวันหมดอายุ'}
              </Text>            </View>
          </View>
        </>
      )}
      {stage === 'for_dashboard' && (
        <>
          <Text style={styles.medicineName}>{name}</Text>
          <View style={styles.dashboardContent}>
            <Image source={{ uri: imageUrl }} style={styles.dashboardImage} />
            <View style={styles.dashboardDetails}>
              <Text style={styles.typeText}>ประเภท: {type}</Text>
              <Text style={styles.noteText}>หมายเหตุ: {note || 'ไม่มีหมายเหตุ'}</Text>
            </View>
          </View>
        </>
      )
      }



      {/* Modal ยืนยันการลบ */}
      <Modal
        visible={isConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>คุณต้องการลบรายการนี้ใช่หรือไม่?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={handleDeleteCancel}>
                <Text style={styles.modalButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleDeleteConfirm}>
                <Text style={styles.modalButtonText}>ใช่</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imageContainer: {
    marginRight: 12,
  },
  image: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  detailsContainer: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'left',
    color: '#333',
  },
  medicineInfo: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  timeOfDayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  timeOfDayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  timeOfDayText: {
    fontSize: 14,
    marginLeft: 4,
  },
  mealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealText: {
    fontSize: 14,
    marginLeft: 4,
    marginRight: 16,
  },
  noteText: {
    fontSize: 14,
    fontStyle: 'italic',

    color: '#333',
  },
  expiryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  inactiveText: {
    color: '#B0B0B0', // สีเทา
  },
  typeText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  dashboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginRight: 16,
  },
  dashboardDetails: {
    flex: 1,
  },
  deleteButton: {
    position: 'absolute',
    top: 0, // ปรับตำแหน่งให้ชิดขอบบน
    right: 0, // ปรับตำแหน่งให้ชิดขอบขวา
    backgroundColor: '#E91E63',
    paddingVertical: 10, // เพิ่ม padding แนวตั้ง
    paddingHorizontal: 15, // เพิ่ม padding แนวนอน
    borderRadius: 8,
    justifyContent: 'center', // จัดข้อความให้อยู่ตรงกลาง
    alignItems: 'center', // จัดข้อความให้อยู่ตรงกลาง
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 4,
    marginHorizontal: 8,
    width: 50,
    textAlign: 'center',
  },
  textInputWithBorder: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginLeft: 8,
    flex: 1,
    backgroundColor: '#fff',
    width: '80%',
  },
  labelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  inputColumn: {
    flexDirection: 'column', // จัดให้อยู่ในแนวตั้ง
    alignItems: 'flex-start', // จัดให้อยู่ชิดซ้าย
    marginBottom: 8,
  },
  multiLineInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 8,
    height: 60, // กำหนดความสูงให้รองรับ 3 บรรทัด
    width: '90%',
  },
  expiryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  expiryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  oneMonthButton: {
    backgroundColor: '#d4edda', // สีเขียวอ่อน
  },
  oneYearButton: {
    backgroundColor: '#fff3cd', // สีเหลืองอ่อน
  },
  twoYearsButton: {
    backgroundColor: '#f8d7da', // สีแดงอ่อน
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },

  quantityButton: {
    backgroundColor: '#E91E63', // สีพื้นหลังของปุ่ม
    paddingVertical: 6, // ระยะห่างแนวตั้ง
    paddingHorizontal: 12, // ระยะห่างแนวนอน
    borderRadius: 8, // ขอบมน
    marginHorizontal: 4, // ระยะห่างระหว่างปุ่ม
  },
  quantityButtonText: {
    color: '#FFFFFF', // สีตัวอักษร
    fontWeight: 'bold', // ตัวหนา
    fontSize: 16, // ขนาดตัวอักษร
    textAlign: 'center', // จัดข้อความให้อยู่ตรงกลาง
  },
  quantityText: {
    fontSize: 18, // ขนาดตัวอักษร
    fontWeight: 'bold', // ตัวหนา
    color: '#333', // สีตัวอักษร
    marginHorizontal: 8, // ระยะห่างระหว่างตัวเลขกับปุ่ม
    textAlign: 'center', // จัดข้อความให้อยู่ตรงกลาง
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '40%',
    alignItems: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    backgroundColor: '#E91E63',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MedicineItem;