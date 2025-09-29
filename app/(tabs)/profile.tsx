import React, { useState, useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Platform, Modal,TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout, getMyPointBalance, uploadCustomFile,updateUserProfile } from '../../composables/fetchAPI';
import { useRouter } from 'expo-router';
import { useUser } from '../../components/UserProvider';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [point, setPoint] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // Banner upload modal state
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [showEditModal, setShowEditModal] = useState(false); // State for showing the edit modal
  const [updatedUser, setUpdatedUser] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    getMyPointBalance()
      .then(balanceData => setPoint(balanceData))
      .catch(() => setPoint({ balance: 0 }));
  }, []);

  const handleLogout = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) await logout(accessToken);
      await AsyncStorage.removeItem('accessToken');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout Failed', error.message || 'Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await updateUserProfile(updatedUser); // Call the update endpoint
      console.log('Update profile response:', res);
      if (Platform.OS === 'web') {
        window.alert('สำเร็จ: ข้อมูลผู้ใช้ถูกอัปเดตเรียบร้อยแล้ว');
      } else {
        Alert.alert('สำเร็จ', 'ข้อมูลผู้ใช้ถูกอัปเดตเรียบร้อยแล้ว');
      }
      setShowEditModal(false); // Close the modal
    } catch (error) {
      console.error('Update profile error:', error.message);
      let errorMessage = 'เกิดข้อผิดพลาด: ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้';
      if (error.message) {
        errorMessage = `เกิดข้อผิดพลาด: ${error.message}`;
      }
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('เกิดข้อผิดพลาด', errorMessage);
      }
    }
  };

  // Handle file input change for web
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.png')) {
      Alert.alert('Error', 'กรุณาเลือกไฟล์ .png เท่านั้น');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Upload banner file
  const handleBannerUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const res = await uploadCustomFile(selectedFile);
      console.log('Banner upload response:', res);
      if (Platform.OS === 'web') {
        window.alert('สำเร็จ: อัปโหลด Banner สำเร็จ');
      } else {
        Alert.alert('สำเร็จ', 'อัปโหลด Banner สำเร็จ');
      }
      setShowBannerModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('เกิดข้อผิดพลาด: อัปโหลด Banner ไม่สำเร็จ');
      } else {
        Alert.alert('เกิดข้อผิดพลาด', 'อัปโหลด Banner ไม่สำเร็จ');
      }
    }
    setUploading(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      // Use your upload function here (e.g., uploadCustomFile or uploadFile)
      const res = await uploadCustomFile(file, file.name);
      Alert.alert('สำเร็จ', 'อัปโหลดไฟล์สำเร็จ');
      // Optionally update user avatar here
    } catch (err) {
      Alert.alert('เกิดข้อผิดพลาด', 'อัปโหลดไฟล์ไม่สำเร็จ');
    }
    setUploading(false);
  };

  const handleUploadLogoMobile = async () => {
    try {
      setUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          name: asset.fileName || 'avatar.png',
          type: asset.type || 'image/png',
        } as any;
        const res = await uploadCustomFile(file, file.name);
        Alert.alert('สำเร็จ', 'อัปโหลดโลโก้เรียบร้อยแล้ว');
        // Optionally update user avatar here
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>ไม่พบข้อมูลผู้ใช้</Text>
      </View>
    );
  }
const handleOpenEditModal = () => {
  setUpdatedUser({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  setShowEditModal(true);
};
  return (
    <View style={styles.container}>
      <View style={styles.avatarBox}>
        {user.avatar ? (
          <Image source={user.avatar} style={styles.avatar} />
        ) : (
          <View style={styles.mpAvatar}>
            <Text style={styles.mpText}>
              {user.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .replace(/[^A-Za-z0-9]/g, '')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoBox}>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editProfileBtn}
        onPress={handleOpenEditModal}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#00796B', fontWeight: 'bold' }}>แก้ไขโปรไฟล์</Text>
      </TouchableOpacity>
       <TouchableOpacity
        style={styles.pointBtn}
        onPress={() => router.push('/pointReward')}
        activeOpacity={0.8}
      >
        <Text style={styles.pointText}>
          คะแนนสะสม: {point !== null ? point.balance : '...'}
        </Text>
      </TouchableOpacity>
      </View>

     

      
 {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>แก้ไขโปรไฟล์</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อ"
              value={updatedUser.name}
              onChangeText={text => setUpdatedUser({ ...updatedUser, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="อีเมล"
              value={updatedUser.email}
              onChangeText={text => setUpdatedUser({ ...updatedUser, email: text })}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="เบอร์โทร"
              value={updatedUser.phone}
              onChangeText={text => setUpdatedUser({ ...updatedUser, phone: text })}
              keyboardType="phone-pad"
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>บันทึก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={{ color: '#333', fontWeight: 'bold' }}>ยกเลิก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


      {/* Banner Upload Button */}

      {user?.role?.toLowerCase() === 'admin' && (
        <TouchableOpacity
          style={styles.bannerBtn}
          onPress={() => setShowBannerModal(true)}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#00796B', fontWeight: 'bold' }}>เปลี่ยนรูป Banner</Text>
        </TouchableOpacity>
      )}


      {/* Banner Upload Modal (Web only) */}
      {Platform.OS === 'web' && (
        <Modal
          visible={showBannerModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBannerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>อัปโหลด Banner (.png เท่านั้น)</Text>
              <input
                type="file"
                accept="image/png"
                style={{ marginBottom: 12 }}
                onChange={handleBannerFileChange}
                disabled={uploading}
              />
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: 200, height: 100, objectFit: 'contain', marginBottom: 12, borderRadius: 8, border: '1px solid #eee' }}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <button
                  style={{
                    padding: '8px 24px',
                    borderRadius: 8,
                    background: '#00796B',
                    color: '#fff',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleBannerUpload}
                  disabled={uploading || !selectedFile}
                >
                  {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                </button>
                <button
                  style={{
                    padding: '8px 24px',
                    borderRadius: 8,
                    background: '#eee',
                    color: '#333',
                    fontWeight: 'bold',
                    border: 'none',
                    marginLeft: 8,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => {
                    setShowBannerModal(false);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={uploading}
                >
                  ยกเลิก
                </button>
              </View>
            </View>
          </View>
        </Modal>
      )}
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>ออกจากระบบ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  avatarBox: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
  },
  mpAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#00796B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mpText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 40,
  },
  infoBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  email: {
    fontSize: 16,
    color: '#555',
    marginBottom: 2,
  },
  phone: {
    fontSize: 16,
    color: '#555',
    marginBottom: 2,
  },
  pointBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 24,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00796B',
  },
  pointText: {
    fontSize: 18,
    color: '#00796B',
    fontWeight: 'bold',
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: '#E91E63',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bannerBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00796B',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    minWidth: 320,
    alignItems: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
    display: 'flex',
    flexDirection: 'column',
  },
    editProfileBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 16,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00796B',
  },
    input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    width: '100%',
  },
  saveBtn: {
    backgroundColor: '#00796B',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});


