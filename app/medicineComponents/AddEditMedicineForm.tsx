import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { uploadFile } from '../../composables/fetchAPI'; // Import ฟังก์ชัน uploadFile

export default function AddEditMedicineForm({ onCancel, onSubmit, stage, initialData }) {
  const [formData, setFormData] = useState({
    productCode: '',
    medicineName: '',
    genericName: '',
    category: '',
    content: { strength: '', unit: '' },
    type: '',
    usageTemplate: {
      route: '',
      frequency: '',
      mealRelation: [],
      timing: [],
      caution: [],
    },
    dosageForm: '',
    imageUrl: '',
    price: 0,
    note: '',
    isActive: true,
  });

  // หากเป็นโหมด Edit ให้เติมข้อมูลเริ่มต้น
 useEffect(() => {
  if (stage === 'edit' && initialData) {
    setFormData(initialData); // ตั้งค่า formData ด้วยข้อมูลที่ส่งมาในโหมด Edit
  } else if (stage === 'add') {
    setFormData({
      productCode: '',
      medicineName: '',
      genericName: '',
      category: '',
      content: { strength: '', unit: '' },
      type: '',
      usageTemplate: {
        route: '',
        frequency: '',
        mealRelation: [],
        timing: [],
        caution: [],
      },
      dosageForm: '',
      imageUrl: '',
      price: 0,
      note: '',
      isActive: true,
    }); // รีเซ็ต formData เป็นค่าเริ่มต้นในโหมด Add
  }
}, [stage, initialData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === 'price' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      const res = await uploadFile(file); // ใช้ฟังก์ชัน uploadFile จาก fetchAPI.ts
      const imageUrl = res.url || res.data?.url || '';
      handleInputChange('imageUrl', imageUrl); // อัปเดตฟิลด์ imageUrl
    } catch (err) {
      alert('อัปโหลดไฟล์ไม่สำเร็จ');
    }
  };
  
const handleSubmit = async () => {
  // กรองฟิลด์ที่มีค่าว่างออก
  const filteredFormData = Object.keys(formData).reduce((acc, key) => {
    const value = formData[key];
    if (
      key !== 'usageTemplate' && // ไม่ส่ง usageTemplate
      key !== 'content' && // ไม่ส่ง content
      key !== 'category' && // ไม่ส่ง category
      key !== 'dosageForm' && // ไม่ส่ง dosageForm
      value !== '' && // ไม่ใช่ค่าว่าง
      value !== null && // ไม่ใช่ค่า null
      !(Array.isArray(value) && value.length === 0) // ไม่ใช่อาร์เรย์ว่าง
    ) {
      acc[key] = value; // เก็บฟิลด์ที่มีค่า
    }
    return acc;
  }, {});

  // ตั้งค่า default value สำหรับ genericName หากไม่มีการป้อนค่า
  if (!filteredFormData.genericName) {
    filteredFormData.genericName = 'Generic Default Name';
  }
  filteredFormData.productCode = Date.now().toString();

  onSubmit(filteredFormData); // ส่งข้อมูลที่กรองแล้วไปยังฟังก์ชัน onSubmit
};
  return (
    <View style={styles.formContainer}>
      <Text style={styles.title}>
        {stage === 'add' ? 'เพิ่มยาใหม่' : 'แก้ไขข้อมูลยา'}
      </Text>
      <View style={styles.formRow}>
        {/* ส่วนแสดงตัวอย่างรูปภาพ */}
        <View style={styles.imagePreviewContainer}>
          {formData.imageUrl ? (
            <Image source={{ uri: formData.imageUrl }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>เลือกรูปภาพ</Text>
            </View>
          )}
          {/* ส่วนอัปโหลดรูปภาพ */}
          <View style={styles.uploadContainer}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
          </View>
        </View>

        {/* ฟอร์มกรอกข้อมูล */}
        <View style={styles.formFields}>
          <Text>ชื่อยา (Medicine Name) <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.medicineName}
            onChangeText={(text) => handleInputChange('medicineName', text)}
            placeholder="กรอกชื่อยา"
            placeholderTextColor="#888"
          />


          <Text>ชื่อสามัญ (Generic Name)</Text>
          <TextInput
            style={styles.input}
            value={formData.genericName}
            onChangeText={(text) => handleInputChange('genericName', text)}
            placeholder="กรอกชื่อสามัญ"
            placeholderTextColor="#888"
          />


          <Text>ประเภทของยา (Type)<Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.type}
            onChangeText={(text) => handleInputChange('type', text)}
            placeholder="เช่น ยาเม็ด, ยาน้ำ, ยาแผนปัจจุบัน"
            placeholderTextColor="#888"
          />
          <Text>หมายเหตุ (Note)</Text>
          <TextInput
            style={styles.input}
            value={formData.note}
            onChangeText={(text) => handleInputChange('note', text)}
            placeholder="กรอกหมายเหตุ"
            placeholderTextColor="#888"
          />
          <Text>ราคา (Price) <Text style={{ color: 'red' }}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={formData.price.toString()} // แปลงเป็น string เพื่อแสดงใน TextInput
            onChangeText={(text) => handleInputChange('price', text.replace(/[^0-9.]/g, ''))} // กรองเฉพาะตัวเลขและจุดทศนิยม
            placeholder="กรอกราคา (หากไม่ใส่ ราคาจะเป็น 0 ฿)"
            placeholderTextColor="#888"
            keyboardType="numeric" // กำหนดให้เป็นตัวเลข
          />
        </View>
      </View>
      <View style={styles.BtnRow}>
        {/* ปุ่มบันทึกและยกเลิก */}
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>ยกเลิก</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>
            {stage === 'add' ? 'บันทึก' : 'อัปเดต'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    width: '80%',
  },
  toggleButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',

  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imagePreviewContainer: {
    flex: 1,
    alignItems: 'flex-start', // จัดให้อยู่ทางซ้าย
    justifyContent: 'flex-start', // จัดให้อยู่ด้านบน
  },
  imagePreview: {
    width: 250,
    height: 250,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imagePlaceholder: {
    width: 250,
    height: 250,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'left',
  },
  uploadContainer: {
    marginTop: 16,
    alignItems: 'flex-start', // จัดให้อยู่ทางซ้าย
  },
  fileInput: {
    marginTop: 8,
    marginBottom: 8,
  },
  imageUrlText: {
    fontSize: 14,
    color: '#555',
    marginTop: 8,
    textAlign: 'center',
  },
  formFields: {
    flex: 2,
    margin: 10,
  },
  BtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  inForm: {
    flex: 1,
    marginRight: 8,
  },
});