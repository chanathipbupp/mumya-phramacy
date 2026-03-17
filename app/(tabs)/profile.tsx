import React, { useState, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity, Alert, Platform, Modal, TextInput, FlatList, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout, getMyPointBalance, uploadCustomFile, updateUserProfile, getUserList, revokeAdmin, grantAdmin } from '../../composables/fetchAPI';
import { useRouter } from 'expo-router';
import { useUser } from '../../components/UserProvider';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading';
import { LinearGradient } from 'expo-linear-gradient';

// --- Component ย่อยสำหรับเมนูแต่ละแถว ---
const ProfileMenuItem = ({ icon, label, onPress, color = "#333", showChevron = true }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={icon} size={22} color={color} style={{ width: 30 }} />
      <Text style={[styles.menuLabel, { color }]}>{label}</Text>
    </View>
    {showChevron && <Ionicons name="chevron-forward" size={18} color="#ccc" />}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [point, setPoint] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  // States สำหรับ Modals
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Data States
  const [userList, setUserList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updatedUser, setUpdatedUser] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../../assets/fonts/Prompt-Bold.ttf'),
  });
  if (!fontsLoaded || loading) return <AppLoading />;
  useEffect(() => {
    if (user) {
      setUpdatedUser({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    getMyPointBalance()
      .then(balanceData => setPoint(balanceData))
      .catch(() => setPoint({ balance: 0 }));
  }, []);

  useEffect(() => {
    if (showAdminModal) {
      setLoadingUsers(true);
      getUserList({ search: '', page: '1', limit: '20', sortBy: 'createdAt', sortDir: 'desc' })
        .then(data => setUserList(data?.items ?? []))
        .catch(() => setUserList([]))
        .finally(() => setLoadingUsers(false));
    }
  }, [showAdminModal]);



  if (!user) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>ไม่พบข้อมูลผู้ใช้</Text>
        <TouchableOpacity style={styles.notFoundButton} onPress={() => router.replace('/login')}>
          <Text style={styles.notFoundButtonText}>ไปที่หน้าล็อกอิน</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Handlers ---
  const handleLogout = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) await logout(accessToken);
      await AsyncStorage.removeItem('accessToken');
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout Failed', 'กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(updatedUser);
      Toast.show({ type: 'success', text1: 'สำเร็จ', text2: 'อัปเดตข้อมูลเรียบร้อยแล้ว' });
      setShowEditModal(false);
    } catch (error: any) {
      Alert.alert('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถอัปเดตข้อมูลได้');
    }
  };

  const handleBannerFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.png')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      Alert.alert('Error', 'กรุณาเลือกไฟล์ .png เท่านั้น');
    }
  };

  const handleGrantAdmin = async (userId: string) => {
    try {
      const res = await grantAdmin(userId);
      // console.log(res);
      if (Platform.OS === 'web') {
        window.alert('Success: Admin privileges granted successfully.');
      } else {
        Alert.alert('Success', 'Admin privileges granted successfully.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to grant admin privileges.');
    }
  };


  const handleRevokeAdmin = async (userId: string) => {
    try {
      const res = await revokeAdmin(userId);
      // console.log(res);
      if (Platform.OS === 'web') {
        window.alert('Success: Admin privileges revoked successfully.');
      } else {
        Alert.alert('Success', 'Admin privileges revoked successfully.');
      }

    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to revoke admin privileges.');
    }
  };
  const handleBannerUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      await uploadCustomFile(selectedFile);
      Alert.alert('สำเร็จ', 'อัปโหลด Banner เรียบร้อยแล้ว');
      setShowBannerModal(false);
    } catch (err) {
      Alert.alert('ผิดพลาด', 'อัปโหลดไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* --- พื้นหลัง Gradient --- */}
      <LinearGradient
        colors={['#eef9ff', '#f0faff', '#c1ced2']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <ScrollView style={styles.mainContainer} showsVerticalScrollIndicator={false}>

        {/* --- Section 1: Header Profile --- */}
        <View style={styles.headerSection}>
          <View style={styles.avatarWrapper}>
            {user.avatar ? (
              <Image source={user.avatar} style={styles.profileImg} />
            ) : (
              // เปลี่ยนจาก View เป็น LinearGradient
              <LinearGradient
                colors={['#00adef', '#007eb1']} // ไล่จากฟ้าสว่างไปฟ้าเข้ม
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.defaultAvatarGradient}
              >
                <Text style={styles.defaultAvatarText}>
                  {user.name?.split(' ').map((w: any) => w[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </LinearGradient>
            )}
            <TouchableOpacity style={styles.editIconBadge} onPress={() => setShowEditModal(true)}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userNameText}>{user.name}</Text>
          <Text style={styles.userSubText}>{user.phone || user.email}</Text>
        </View>

        {/* --- Section 2: Menu List --- */}
        <View style={styles.menuGroup}>
          <ProfileMenuItem
            icon="person-outline"
            label="แก้ไขข้อมูลส่วนตัว"
            onPress={() => setShowEditModal(true)}
          />
          <ProfileMenuItem
            icon="gift-outline"
            label={`คะแนนสะสม: ${point?.balance ?? 0} แต้ม`}
            onPress={() => router.push('/pointReward')}
          />
          {user?.role?.toLowerCase() === 'admin' && (
            <ProfileMenuItem
              icon="image-outline"
              label="เปลี่ยนรูป Banner ระบบ"
              onPress={() => setShowBannerModal(true)}

            />
          )}
          {/* <ProfileMenuItem icon="notifications-outline" label="การแจ้งเตือน" onPress={() => {}} />
        <ProfileMenuItem icon="shield-checkmark-outline" label="ความเป็นส่วนตัว" onPress={() => {}} /> */}
        </View>

        {/* --- Section 3: Danger Zone --- */}
        <View style={styles.dangerZoneSection}>
          <Text style={styles.zoneTitle}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            {user.isSuperAdmin && (
              <ProfileMenuItem
                icon="people-outline"
                label="จัดการสิทธิ์ Admin"
                color="#E91E63"
                onPress={() => setShowAdminModal(true)}
              />
            )}
            <ProfileMenuItem
              icon="trash-outline"
              label="ลบบัญชีผู้ใช้งาน"
              color="#D32F2F"
              onPress={() => router.push('/deleteUser')}
            />
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#E91E63" />
              <Text style={styles.logoutRowText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- MODALS --- */}

        {/* 1. Edit Profile Modal */}
        <Modal visible={showEditModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentCard}>
              <Text style={styles.modalTitleText}>แก้ไขโปรไฟล์</Text>
              <TextInput
                style={styles.textInput}
                placeholder="ชื่อ-นามสกุล"
                value={updatedUser.name}
                onChangeText={t => setUpdatedUser({ ...updatedUser, name: t })}
              />
              <TextInput
                style={styles.textInput}
                placeholder="อีเมล"
                value={updatedUser.email}
                onChangeText={t => setUpdatedUser({ ...updatedUser, email: t })}
              />
              <TextInput
                style={styles.textInput}
                placeholder="เบอร์โทรศัพท์"
                value={updatedUser.phone}
                onChangeText={t => setUpdatedUser({ ...updatedUser, phone: t })}
              />
              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveProfile}>
                  <Text style={styles.btnTextWhite}>บันทึก</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                  <Text style={styles.btnTextDark}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 2. Admin Management Modal */}
        <Modal visible={showAdminModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContentCard, { maxHeight: '80%' }]}>
              <Text style={styles.modalTitleText}>จัดการสิทธิ์ Admin</Text>
              {loadingUsers ? <ActivityIndicator color="#0097a7" /> : (
                <FlatList
                  data={userList}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <View style={styles.adminUserRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Prompt-Bold' }}>{item.name}</Text>
                        <Text style={{ fontSize: 12, color: '#666' }}>{item.email}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleGrantAdmin(item.id)}
                        style={styles.smallGrantBtn}
                      ><Text style={styles.smallBtnText}>Grant</Text></TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRevokeAdmin(item.id)}
                        style={styles.smallRevokeBtn}
                      ><Text style={styles.smallBtnText}>Revoke</Text></TouchableOpacity>
                    </View>
                  )}
                />
              )}
              <TouchableOpacity style={styles.fullCloseBtn} onPress={() => setShowAdminModal(false)}>
                <Text style={styles.btnTextDark}>ปิดหน้าต่าง</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* 3. Banner Upload Modal (Web) */}
        {Platform.OS === 'web' && (
          <Modal visible={showBannerModal} transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContentCard}>
                <Text style={styles.modalTitleText}>อัปโหลด Banner (.png)</Text>
                <input type="file" accept="image/png" onChange={handleBannerFileChange} style={{ marginVertical: 10 }} />
                {previewUrl && <img src={previewUrl} style={{ width: '100%', height: 100, objectFit: 'contain', marginBottom: 10 }} />}
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleBannerUpload} disabled={uploading}>
                    <Text style={styles.btnTextWhite}>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowBannerModal(false)}>
                    <Text style={styles.btnTextDark}>ยกเลิก</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <Toast />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  headerSection: { alignItems: 'center', paddingVertical: 40 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  profileImg: { width: 110, height: 110, borderRadius: 55 },
  defaultAvatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4, // เพิ่มความหนาขอบขาวให้ดูเด่น
    borderColor: '#fff',
  },
  defaultAvatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#0097a7', justifyContent: 'center', alignItems: 'center' },
  defaultAvatarText: { color: '#fff', fontSize: 36, fontFamily: 'Prompt-Bold' },
  editIconBadge: { position: 'absolute', bottom: 0, right: 5, backgroundColor: '#0097a7', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  userNameText: { fontSize: 22, fontFamily: 'Prompt-Bold', color: '#333' },
  userSubText: { fontSize: 14, color: '#888', fontFamily: 'Prompt-Regular' },

  menuGroup: { 
  marginTop: 15, 
  marginHorizontal: 20, 
  backgroundColor: '#ffffff', // พื้นหลังสีขาวทึบ
  borderRadius: 20,          // ขอบโค้งมนเหมือน Danger Zone
  paddingHorizontal: 15,    // ระยะห่างจากขอบด้านใน
  paddingVertical: 5,       // ระยะห่างบน-ล่าง
  // เพิ่มเงาเพื่อให้ดูลอยขึ้นมานิดนึง
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 3,
},

// แก้ไข styles.menuItem เล็กน้อยเพื่อให้เส้นคั่นตัวสุดท้ายหายไป (Optional)
menuItem: { 
  flexDirection: 'row', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  paddingVertical: 16, 
  borderBottomWidth: 1, 
  borderBottomColor: '#f0f0f0',
},
  menuLabel: { fontSize: 15, fontFamily: 'Prompt-Regular', marginLeft: 10 },

  dangerZoneSection: { marginTop: 35, paddingHorizontal: 20, paddingBottom: 50 },
  zoneTitle: { fontSize: 13, fontFamily: 'Prompt-Bold', color: '#ff4d4d', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  dangerCard: { backgroundColor: '#fff5f5', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: '#ffebeb' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, marginTop: 5 },
  logoutRowText: { fontSize: 15, fontFamily: 'Prompt-Bold', color: '#E91E63', marginLeft: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25, width: '90%', maxWidth: 450 },
  modalTitleText: { fontSize: 18, fontFamily: 'Prompt-Bold', marginBottom: 20, textAlign: 'center' },
  textInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 15, fontFamily: 'Prompt-Regular' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  confirmBtn: { flex: 1, backgroundColor: '#0097a7', padding: 15, borderRadius: 10, alignItems: 'center' },
  cancelBtn: { flex: 1, backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, alignItems: 'center' },
  btnTextWhite: { color: '#fff', fontFamily: 'Prompt-Bold' },
  btnTextDark: { color: '#333', fontFamily: 'Prompt-Bold' },

  adminUserRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  smallGrantBtn: { backgroundColor: '#0097a7', padding: 8, borderRadius: 5, marginRight: 5 },
  smallRevokeBtn: { backgroundColor: '#ff4d4d', padding: 8, borderRadius: 5 },
  smallBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  fullCloseBtn: { marginTop: 20, padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' },

  notFoundContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontSize: 18, fontFamily: 'Prompt-Bold', color: '#666', marginBottom: 20 },
  notFoundButton: { backgroundColor: '#0097a7', padding: 15, borderRadius: 10 },
  notFoundButtonText: { color: '#fff', fontFamily: 'Prompt-Bold' },
});