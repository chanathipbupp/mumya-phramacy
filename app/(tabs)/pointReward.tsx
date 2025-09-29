import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, View, Text, TouchableOpacity, TextInput, Picker, FlatList, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
// import history from '../../composables/history.json';
import { getMyPointBalance, getMyPointLedger, getUserList, adjustUserPointAdmin, getLatestPointLedger, getUserPointBalanceByUid } from '../../composables/fetchAPI';
import { useUser } from '../../components/UserProvider';

const mockUsers = [
  { id: '1', name: 'สมชาย ใจดี', phone: '0812345678' },
  { id: '2', name: 'สมหญิง รักเรียน', phone: '0898765432' },
  { id: '3', name: 'John Doe', phone: '0999999999' },
];

const historyDashboard = [
  {
    id: 'h1',
    action: 'credit',
    amount: 50,
    user: { name: 'สมชาย ใจดี', phone: '0812345678' },
    description: 'ได้รับแต้มจากการซื้อสินค้า',
    refType: 'purchase',
  },
  {
    id: 'h2',
    action: 'debit',
    amount: 20,
    user: { name: 'สมหญิง รักเรียน', phone: '0898765432' },
    description: 'แลกของรางวัล',
    refType: 'redeem',
  },
  {
    id: 'h3',
    action: 'credit',
    amount: 100,
    user: { name: 'John Doe', phone: '0999999999' },
    description: 'โปรโมชันพิเศษ',
    refType: 'promotion',
  },
  {
    id: 'h4',
    action: 'debit',
    amount: 10,
    user: { name: 'John Doe', phone: '0999999999' },
    description: 'ค่าธรรมเนียม',
    refType: 'fee',
  },
  {
    id: 'h5',
    action: 'credit',
    amount: 1050,
    user: { name: 'John Doe', phone: '0999999999' },
    description: 'โปรโมชันพิเศษ',
    refType: 'promotion',
  },
  {
    id: 'h6',
    action: 'debit',
    amount: 100,
    user: { name: 'John Doe', phone: '0999999999' },
    description: 'ค่าธรรมเนียม',
    refType: 'fee',
  },
];

export default function TabTwoScreen() {
  const [point, setPoint] = useState<any>(null); // <-- change to any for full object
  const [note, setNote] = useState<any>(null); // <-- change to any for full object
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'history'>('history');
  const [userList, setUserList] = useState<any[]>([]);
  const [userListLoading, setUserListLoading] = useState(false);
  const [adminHistory, setAdminHistory] = useState<any[]>([]);
  const [adminHistoryLoading, setAdminHistoryLoading] = useState(false);
  const user = useUser();
  const [toggleEyes, setToggleEyes] = useState<{ [key: string]: boolean }>({}); // Track toggle state for each user
  const [userBalances, setUserBalances] = useState<{ [key: string]: number }>({}); // Store balances for each user

  //console.log('user in pointReward', user);
  // Admin action states
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [phone, setPhone] = useState('');
  //console.log('point history', history);
  //console.log('point balance', point);


  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyPointBalance(),
      getMyPointLedger({ limit: '10' })
    ])
      .then(([balanceData, ledgerData]) => {
        setPoint(balanceData); // <-- set full data object
        setHistory(ledgerData?.items ?? []);
      })
      .catch(() => {
        setPoint({ balance: 0 }); // <-- fallback to object with balance
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, []);
  // Fetch user list when adminTab is 'dashboard' and adminMode is true
  useEffect(() => {
    if (adminMode && adminTab === 'dashboard') {
      setUserListLoading(true);
      getUserList({
        search: '',
        page: '1',
        limit: '20',
        sortBy: 'createdAt',
        sortDir: 'desc'
      })
        .then(data => setUserList(data?.items ?? []))
        .catch(() => setUserList([]))
        .finally(() => setUserListLoading(false));
    }
  }, [adminMode, adminTab]);
  //console.log('userList', userList);

  useEffect(() => {
    if (adminMode && adminTab === 'history') {
      setAdminHistoryLoading(true);
      getLatestPointLedger({ limit: '20' })
        .then(data => setAdminHistory(Array.isArray(data) ? data : [])) // <-- FIX HERE
        .catch(() => setAdminHistory([]))
        .finally(() => setAdminHistoryLoading(false));
    }
  }, [adminMode, adminTab]);
  //console.log('adminHistory', adminHistory);
  // New function for confirm button
  const handleConfirmAdjustPoint = async () => {
    const selectedUser = userList.find(u => u.phone?.trim() === phone.trim());
    if (!selectedUser) {
      alert('ไม่พบผู้ใช้ที่มีเบอร์นี้');
      return;
    }
    if (!note?.amount) {
      alert('กรุณากรอกจำนวนแต้ม');
      return;
    }
    try {
      await adjustUserPointAdmin({
        userId: selectedUser.id,
        action: actionType,
        amount: Number(note.amount),
        idempotencyKey: `${selectedUser.id}-${Date.now()}`,
        expiresAt: new Date(Date.now() + 60000).toISOString().slice(0, 10),
        note: note?.remark || '',
      });
      alert('ปรับแต้มสำเร็จ');
      setNote(null);
      setPhone('');
    } catch (err: any) {
      const errorMessage = err.message || '';
      if (errorMessage.includes('Insufficient points')) {
        alert('แต้มไม่เพียงพอ'); // Show the message in Thai
      } else {
        alert('เกิดข้อผิดพลาด: ' + errorMessage);
      }
    }
  };
  const handleUserClick = (selectedPhone: string) => {
    setPhone(selectedPhone); // Set the phone number field
  };
  const handleToggleEyes = async (userId: string) => {
    setToggleEyes(prev => ({
      ...prev,
      [userId]: !prev[userId], // Toggle the state
    }));

    if (!toggleEyes[userId]) {
      // If toggling on, fetch the balance
      try {
        const balance = await getUserPointBalanceByUid(userId);
        setUserBalances(prev => ({
          ...prev,
          [userId]: balance?.balance || 0, // Store the balance
        }));
      } catch (error) {
        console.error('Failed to fetch user balance:', error);
      }
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>

      <View style={styles.container}>
        {/* Header with AdminMode button */}
        <View style={styles.headerRow}>
          {/* <Text style={styles.header}>แต้มของฉัน</Text> */}
          {user?.user?.role === "admin" && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => setAdminMode(m => !m)}
            >
              <Text style={styles.adminBtnText}>{adminMode ? 'User Mode' : 'Admin Mode'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!adminMode ? (
          <>
            <View style={styles.pointBox}>
              <Text style={styles.pointText}>
                {point && typeof point.balance !== 'undefined' ? `${point.balance} P` : '...'}
              </Text>
              <View style={styles.phoneContainer}>
                <Text style={styles.phoneText}>
                  Phone Number: {point && point.user ? point.user.phone : ''}
                </Text>
              </View>
            </View>
            <Text style={styles.historyHeader}>ประวัติ</Text>
            <View style={styles.historyList}>
              {loading ? (
                <Text>Loading...</Text>
              ) : history.length === 0 ? (
                <Text>ไม่มีประวัติ</Text>
              ) : (
                history.map(item => {
                  const isDebit = item.action === 'debit';
                  return (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyDesc}>{item.description || item.refType}</Text>
                      <Text
                        style={[
                          styles.historyPoints,
                          isDebit && { color: '#D32F2F' }
                        ]}
                      >
                        {isDebit
                          ? `-${Math.abs(item.amount)}`
                          : `+${item.amount}`}
                      </Text>
                      <Text style={styles.historyDate}>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleString('th-TH')
                          : ''}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <>
            {/* Admin Action Section */}
            <View style={styles.adminSection}>
              <Text style={styles.adminSectionTitle}>Actions</Text>
              <View style={styles.actionRow}>
                <View style={{ flex: 1, marginRight: 24 }}>
                  <Text style={styles.actionLabel}>เลือกประเภท:</Text>
                  <Picker
                    selectedValue={actionType}
                    style={styles.picker}
                    onValueChange={v => setActionType(v)}
                  >
                    <Picker.Item label="เพิ่มแต้ม (Credit)" value="credit" />
                    <Picker.Item label="ลดแต้ม (Debit)" value="debit" />
                  </Picker>
                </View>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.actionLabel}>เบอร์โทร:</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={val => {
                      setPhone(val);
                      setAdminTab('dashboard'); // Switch to dashboard tab
                    }}
                    placeholder="กรอกเบอร์โทร"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View style={styles.actionRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.actionLabel}>จำนวน(P):</Text>
                  <TextInput
                    style={styles.input}
                    value={note?.amount || ''}
                    onChangeText={val => setNote({ ...note, amount: val })}
                    placeholder="กรอกจำนวนแต้ม"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.actionLabel}>หมายเหตุ:</Text>
                  <TextInput
                    style={styles.input}
                    value={note?.remark || ''}
                    onChangeText={val => setNote({ ...note, remark: val })}
                    placeholder="กรอกหมายเหตุ"
                    keyboardType="default"
                  />
                </View>
              </View>
              <View style={styles.actionBtnRow}>
                <TouchableOpacity style={styles.confirmBtn}>
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirmAdjustPoint}
                  >
                    <Text style={styles.confirmBtnText}>ยืนยัน</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setActionType('credit');
                    setPhone('');
                    setAdminTab('history'); // Switch to history tab
                    setNote(null);
                  }}
                >                <Text style={styles.clearBtnText}>เคลียร์</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Admin Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  adminTab === 'dashboard' && styles.tabBtnActive
                ]}
                onPress={() => setAdminTab('dashboard')}
              >
                <Text style={[
                  styles.tabBtnText,
                  adminTab === 'dashboard' && styles.tabBtnTextActive
                ]}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabBtn,
                  adminTab === 'history' && styles.tabBtnActive
                ]}
                onPress={() => setAdminTab('history')}
              >
                <Text style={[
                  styles.tabBtnText,
                  adminTab === 'history' && styles.tabBtnTextActive
                ]}>History of Action</Text>
              </TouchableOpacity>
            </View>
            {/* Tab Content */}
            {adminTab === 'dashboard' ? (
              <View style={styles.adminSection}>
                <Text style={styles.adminSectionTitle}>User List Dashboard</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>ชื่อ</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>เบอร์โทร</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>อีเมล</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>แต้มคงเหลือ</Text>

                </View>
                {userListLoading ? (
                  <Text style={{ padding: 8 }}>Loading...</Text>
                ) : userList.length === 0 ? (
                  <Text style={{ padding: 8, color: '#999' }}>ไม่มีข้อมูลผู้ใช้</Text>
                ) : (
                  // Filter userList by phone number
                  userList
                    .filter(user =>
                      phone.trim() === '' ? true : user.phone?.includes(phone.trim())
                    )
                    .map(user => (
                      <TouchableOpacity
                        key={user.id}
                        onPress={() => handleUserClick(user.phone)} // Set phone number on click
                      >
                        <View key={user.id} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2 }]}>{user.name || '-'}</Text>
                          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>

                            {user.phone && (
                              <TouchableOpacity
                                onPress={() => Clipboard.setStringAsync(user.phone)}
                                style={{ marginLeft: 8, padding: 2 }}
                              >
                                <Text style={{ color: '#0a65aeff', fontSize: 14 }}>📋</Text>
                              </TouchableOpacity>
                            )}
                            <Text style={styles.tableCell}>{user.phone || '-'}</Text>
                          </View>
                          <Text style={[styles.tableCell, { flex: 2 }]}>{user.email || '-'}</Text>
                          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                              onPress={() => handleToggleEyes(user.id)} // Toggle eyes
                              style={{ marginLeft: 8, padding: 2 }}
                            >
                              <Image
                                source={
                                  toggleEyes[user.id]
                                    ? require('../../assets/images/eye.png') // Correct relative path
                                    : require('../../assets/images/visible.png') // Correct relative path
                                }
                                style={{ width: 24, height: 24 }} // Adjust size as needed
                              />
                            </TouchableOpacity>
                            {toggleEyes[user.id] && (
                              <View>
                              <Text style={[styles.tableCell, { flex: 1 }]}>
                                {userBalances[user.id] !== undefined ? `${userBalances[user.id]} P` : 'Loading...'}
                              </Text>
                              </View>
                            )}
                          </View>                        </View>
                      </TouchableOpacity>

                    ))
                )}
              </View>
            ) : (
              <View style={styles.adminSection}>
                <Text style={styles.adminSectionTitle}>History of Action</Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>ประเภท</Text>
                  <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold' }]}>แต้ม(P)</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>เบอร์โทร</Text>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: 'bold' }]}>ชื่อ</Text>
                  <Text style={[styles.tableCell, { flex: 3, fontWeight: 'bold' }]}>เหตุผล</Text>
                </View>
                {historyDashboard.length === 0 ? (
                  <Text style={{ padding: 8, color: '#999' }}>ไม่มีประวัติ</Text>
                ) : (
                  adminHistory.map(item => (
                    <View key={item.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1, color: item.action === 'debit' ? '#D32F2F' : '#00796B' }]}>
                        {item.action === 'debit' ? 'ลดแต้ม' : 'เพิ่มแต้ม'}
                      </Text>
                      <Text style={[styles.tableCell, { flex: 1 }]}>{item.amount}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.user?.phone || '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.user?.name || '-'}</Text>
                      <Text style={[styles.tableCell, { flex: 3 }]}>{item.reason || '-'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>

  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 12,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  adminBtn: {
    backgroundColor: '#E91E63',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  adminBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pointBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative', // <-- add this
  },
  pointText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0a65aeff',
  },
  historyHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 4,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyDesc: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  historyPoints: {
    fontSize: 14,
    color: '#00796B',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  adminSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    elevation: 1,
  },
  adminSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    height: 20,
    width: 80,
    fontSize: 14,
  },
  picker: {
    flex: 1,
    height: 40,
    padding: 4,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fafafa',
    marginBottom: 4,
  },
  actionBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
    marginTop: 8,
  },
  confirmBtn: {
    backgroundColor: '#E91E63',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 24,
  },
  confirmBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#fff',
  },
  clearBtn: {
    borderWidth: 2,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 24,
    backgroundColor: '#bbb',
  },
  clearBtnText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#ffffffff',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#f3f3f3',
  },
  tableCell: {
    fontSize: 14,
    paddingHorizontal: 4,
  },
  phoneContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  phoneText: {
    fontSize: 10,
    color: '#807f7fff',
    marginTop: 4,
    textAlign: 'right',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#E91E63',
  },
  tabBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
});