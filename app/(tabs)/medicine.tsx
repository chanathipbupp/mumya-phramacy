import React, { useEffect, useState, useRef } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../components/UserProvider';
import { addMedicine,getOrderHistoryMe, createOrder, getMedicines, getOrderHistory, getUserList, updateMedicine, getOrderDetail } from '../../composables/fetchAPI';
import AddEditMedicineForm from '../medicineComponents/AddEditMedicineForm';
import AdminDispenseList from '../medicineComponents/AdminDispenseList';
import MedicineItem from '../medicineComponents/MedicineItem';
import OrderItem from '../medicineComponents/OrderItem';
import SearchableMedicineList from '../medicineComponents/SearchableMedicineList';

interface Medicine {
  id: string;
  medicineName: string;
  dosageForm: string;
  usageTemplate: {
    frequency: string | null;
    timing: string[];
    caution?: string;
    mealRelation: string[];
    dosePerTime?: string
  };
  expiryDate: string;
  note: string;
  imageUrl: string;
  type: string;
  quantity: number;
}

export default function MedicineScreen() {
  const [adminMode, setAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<'create' | 'dispense'>('create');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null); // State สำหรับเก็บยาที่ถูกเลือก
  const [medicines, setMedicines] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const user = useUser();
  const [stage, setStage] = useState<'add' | 'edit' | null>(null); // เพิ่ม state สำหรับ stage
  const [dispenseDate, setDispenseDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [selectedDispenseMedicines, setSelectedDispenseMedicines] = useState<Medicine[]>([]); // กำหนดชนิดข้อมูลเป็น Medicine[]
  const [userList, setUserList] = useState([]); // เก็บรายการผู้ใช้ที่ดึงมาจาก API
  const [selectedUser, setSelectedUser] = useState(null); // เก็บผู้ใช้ที่เลือก
  const [currentOrderPage, setCurrentOrderPage] = useState(1); // หน้าปัจจุบัน
  const [hasMoreOrders, setHasMoreOrders] = useState(true); // ตรวจสอบว่ามีหน้าเพิ่มเติมหรือไม่
  const scrollViewRef = useRef<ScrollView>(null); // สร้าง ref สำหรับ ScrollView
  useEffect(() => {
    if (phoneNumber === '' || phoneNumber === '0') {
      setUserList([]); // ล้าง userList เมื่อ phoneNumber เป็นค่าว่างหรือ 0
    }
  }, [phoneNumber]);

  const handleSearchUser = async (query: string) => {
    setPhoneNumber(query); // อัปเดตเบอร์โทรใน state
    if (query.length >= 2 && query !== '0') { // เริ่มค้นหาหลังจากพิมพ์อย่างน้อย 2 ตัวอักษร และ query ไม่ใช่ 0
      try {
        const response = await getUserList({
          search: query,
          page: '1',
          limit: '10',
          sortBy: 'name',
          sortDir: 'asc',
        });
        setUserList(response.items); // เก็บรายการผู้ใช้ที่ดึงมา
      } catch (error) {
        console.error('Error fetching user list:', error);
      }
    } else {
      setUserList([]); // ล้างรายการผู้ใช้ถ้าคำค้นหาสั้นเกินไปหรือเป็นค่าว่าง
    }
  };
  const handleClear = () => {
    setSelectedUser(null); // รีเซ็ตผู้ใช้ที่เลือก
    setPhoneNumber(''); // รีเซ็ตเบอร์โทร
    setTotalPrice(''); // รีเซ็ตราคารวม
    setSelectedDispenseMedicines([]); // ล้างรายการยา
  };

  const handleAddMedicineToDispenseList = (medicine: Medicine) => {
    setSelectedDispenseMedicines((prev) => {
      const existingMedicine = prev.find((item) => item.id === medicine.id);
      if (existingMedicine) {
        // ถ้ามียาอยู่แล้ว ให้เพิ่ม quantity
        return prev.map((item) =>
          item.id === medicine.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // ถ้ายังไม่มียาในลิสต์ ให้เพิ่มยาใหม่พร้อม quantity = 1
        return [...prev, { ...medicine, quantity: 1 }];
      }
    });
  };

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const orderDetail = await getOrderDetail(orderId); // ดึงข้อมูลคำสั่งซื้อ
      setSelectedOrder(orderDetail); // เก็บข้อมูลคำสั่งซื้อใน state
    } catch (error) {
      console.error('Error fetching order detail:', error);
      alert('ไม่สามารถดึงข้อมูลคำสั่งซื้อได้');
    }
  };

const fetchMedicines = async (query = '') => {
  try {
    setLoading(true);
    const medicinesData = await getMedicines({ q: query, isActive: true, page: 1, limit: 10 });
    setMedicines(medicinesData.items);
  } catch (error) {
    console.error('Error fetching medicines:', error);
  } finally {
    setLoading(false);
  }
};

const fetchOrders = async (page = 1) => {
  try {
    setLoading(true);
    let ordersData;

    if (user?.user?.role === 'admin') {
      // ใช้ endpoint สำหรับ admin
      ordersData = await getOrderHistory({ page: page.toString(), limit: '10' });
    } else {
      // ใช้ endpoint สำหรับ user
      ordersData = await getOrderHistoryMe({ page: page.toString(), limit: '10' });
    }

    if (ordersData.items.length > 0) {
      setOrders((prevOrders) => [...prevOrders, ...ordersData.items]); // รวมรายการใหม่กับรายการเดิม
      setCurrentOrderPage(page); // อัปเดตหน้าปัจจุบัน
    } else {
      setHasMoreOrders(false); // ไม่มีหน้าเพิ่มเติม
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};
  // ฟังก์ชันสำหรับโหลดหน้าเพิ่มเติม
  const loadMoreOrders = () => {
    if (hasMoreOrders && !loading) {
      fetchOrders(currentOrderPage + 1); // โหลดหน้าถัดไป
    }
  };
  const goToFirstPage = () => {
    if (currentOrderPage > 1) {
      setOrders([]); // ล้างรายการคำสั่งซื้อปัจจุบัน
      fetchOrders(1); // โหลดหน้าแรก
    }
  };

  const goToLastPage = async () => {
    try {
      const ordersData = await getOrderHistory({ page: '1', limit: '10' }); // ดึงข้อมูลคำสั่งซื้อทั้งหมด
      const totalPages = Math.ceil(ordersData.total / 10); // คำนวณจำนวนหน้าทั้งหมด
      setOrders([]); // ล้างรายการคำสั่งซื้อปัจจุบัน
      fetchOrders(totalPages); // โหลดหน้าสุดท้าย
    } catch (error) {
      console.error('Error fetching last page:', error);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchOrders();
  }, []);


  // ฟังก์ชันสำหรับจัดการการกดปุ่ม (+ เพิ่ม)
  const handleAddMedicine = () => {
    setSelectedMedicine(null); // รีเซ็ต selectedMedicine
    setStage('add'); // ตั้งค่า stage เป็น add
    setIsAddingMedicine(true); // เปิดฟอร์ม AddEditMedicineForm
  };

  const handleOrderPress = async (order) => {
    setSelectedOrder(order);
    await fetchOrderDetail(order.orderId); // ดึงข้อมูลคำสั่งซื้อ
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

  const handleMedicineSelect = (medicine) => {
    setSelectedMedicine(medicine); // ตั้งค่ายาที่ถูกเลือก
    setStage('edit'); // ตั้งค่า stage เป็น edit
    setIsAddingMedicine(true); // เปิดฟอร์ม AddEditMedicineForm
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    setSelectedDispenseMedicines((prev) =>
      prev.map((medicine) =>
        medicine.id === id ? { ...medicine, quantity: newQuantity } : medicine
      )
    );
  };
  const handleCancelAddMedicine = () => {

    setStage('edit'); // ตั้งค่า stage เป็น edit
    setIsAddingMedicine(true);
  };
  const handleSubmitMedicine = async (medicineData) => {
    try {
      // ตรวจสอบว่าชื่อยาถูกกรอกหรือไม่
      if (!medicineData.medicineName || medicineData.medicineName.trim() === '') {
        alert('กรุณากรอกชื่อยา');
        return; // หยุดการทำงานหากไม่มีชื่อยา
      }

      // ตรวจสอบว่าชื่อประเภทของยาถูกกรอกหรือไม่
      if (!medicineData.type || medicineData.type.trim() === '') {
        alert('กรุณากรอกประเภทของยา');
        return; // หยุดการทำงานหากไม่มีประเภทของยา
      }

      // ตรวจสอบว่าราคาถูกกรอกหรือไม่
      if (!medicineData.price || isNaN(Number(medicineData.price))) {
        alert('กรุณากรอกราคาของยาให้ถูกต้อง');
        return; // หยุดการทำงานหากไม่มีราคาหรือราคาผิด
      }

      if (stage === 'add') {
        // เพิ่มยาใหม่
        const payload = { ...medicineData, isActive: true, productCode: Date.now().toString() }; // กำหนด productCode เฉพาะในโหมด add
        const response = await addMedicine(payload);
        if (response) {
          alert('เพิ่มยาสำเร็จ');
          setMedicines((prev) => [...prev, response]); // อัปเดตรายการยา
        }
      } else if (stage === 'edit') {
        // แก้ไขยา
        const { productCode, ...updatedData } = medicineData; // ตัด productCode ออก
        const response = await updateMedicine(selectedMedicine.id, updatedData);
        if (response) {
          alert('แก้ไขยาสำเร็จ');
          // setMedicines((prev) =>
          //   prev.map((med) => (med.id === selectedMedicine.id ? response : med))
          // ); // อัปเดตรายการยา
          fetchMedicines();

        }
      }
    } catch (error) {
      console.error('Error saving medicine:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsAddingMedicine(false);
      setSelectedMedicine(null);
      setStage(null);
    }
  };

  // const updateMedicineInDispenseList = (updatedMedicine: Medicine) => {
  //   setSelectedDispenseMedicines((prev) =>
  //     prev.map((medicine) =>
  //       medicine.id === updatedMedicine.id ? { ...medicine, ...updatedMedicine } : medicine
  //     )
  //   );
  // };
  const handleDispense = async () => {

    if (!selectedUser) {
      alert('กรุณาเลือกผู้ใช้ก่อนทำการจ่ายยา');
      return; // หยุดการทำงานถ้าไม่มีผู้ใช้ถูกเลือก
    }
    if (selectedDispenseMedicines.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 รายการยาก่อนทำการจ่ายยา');
      return; // หยุดการทำงานถ้าไม่มีรายการยา
    }
    if (!totalPrice || isNaN(Number(totalPrice))) {
      alert('กรุณากรอกราคารวมที่ถูกต้อง');
      return; // หยุดการทำงานถ้าราคารวมไม่ถูกต้อง
    }

    // ตรวจสอบว่ายาตัวใดไม่มี expiryDate
    const medicineWithoutExpiryDate = selectedDispenseMedicines.find(
      (medicine) => !medicine.expiryDate || medicine.expiryDate.trim() === ''
    );

    if (medicineWithoutExpiryDate) {
      alert(`กรุณากรอกวันที่หมดอายุสำหรับยา ${medicineWithoutExpiryDate.medicineName}`);
      return; // หยุดการทำงานถ้ามียาที่ไม่มี expiryDate
    }

    const orderData = {
      userId: selectedUser?.id, // ดึง userId จาก state หรือ props
      pointReceived: parseInt(totalPrice, 10), // ดึงจาก state หรือคำนวณ
      medicineItems: selectedDispenseMedicines.map((medicine) => ({
        medicineId: medicine.id,
        quantity: medicine.quantity,
        usage: {
          frequency: medicine.usageTemplate?.frequency || '',
          timing: medicine.usageTemplate?.timing || [],
          mealRelation: medicine.usageTemplate?.mealRelation || [],
          caution: medicine.usageTemplate?.caution || [],
          dosePerTime: medicine.usageTemplate?.dosePerTime || '',
        },
        specialUsageInstructions: medicine.note || '',
        expiryDate: medicine.expiryDate || '',
      })),
    };
    // alert(JSON.stringify(orderData, null, 2));
    console.log('Order Data:', orderData); // ตรวจสอบ payload ก่อนส่ง
    try {
      const response = await createOrder(orderData);

      if (response.ok) {
        alert('สร้างคำสั่งซื้อสำเร็จ');
        handleClear(); // รีเซ็ตฟอร์มหลังสร้างคำสั่งซื้อสำเร็จ
        console.log('Order created successfully');
      } else {
        console.error('Failed to create order:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleExpiryDateChange = (id: string, newExpiryDate: string) => {
    setSelectedDispenseMedicines((prev) =>
      prev.map((medicine) =>
        medicine.id === id ? { ...medicine, expiryDate: newExpiryDate } : medicine
      )
    );
  };

  const handleFrequencyChange = (id: string, newFrequency: string) => {
    setSelectedDispenseMedicines((prev) =>
      prev.map((medicine) =>
        medicine.id === id
          ? {
            ...medicine,
            usageTemplate: {
              ...medicine.usageTemplate,
              frequency: newFrequency, // อัปเดตค่า frequency
            },
          }
          : medicine
      )
    );
  };

  const handleDosePerTimeChange = (id: string, newDosePerTime: string) => {
    setSelectedDispenseMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id
          ? {
            ...medicine,
            usageTemplate: {
              ...medicine.usageTemplate,
              dosePerTime: newDosePerTime || '', // ตั้งค่า default เป็นค่าว่าง
            },
          }
          : medicine
      )
    );
  };

  const handleCautionChange = (id: string, newCaution: string) => {
    setSelectedDispenseMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id
          ? {
            ...medicine,
            usageTemplate: {
              ...medicine.usageTemplate,
              caution: newCaution, // อัปเดต caution
            },
          }
          : medicine
      )
    );
  };

  const handleTimingChange = (id: string, newTiming: string[]) => {
    setSelectedDispenseMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id
          ? {
            ...medicine,
            usageTemplate: {
              ...medicine.usageTemplate,
              timing: newTiming, // อัปเดต timing
            },
          }
          : medicine
      )
    );
  };
  const handleMealRelationChange = (id: string, newMealRelation: string[]) => {
    setSelectedDispenseMedicines((prevMedicines) =>
      prevMedicines.map((medicine) =>
        medicine.id === id
          ? {
            ...medicine,
            usageTemplate: {
              ...medicine.usageTemplate,
              mealRelation: newMealRelation, // อัปเดต mealRelation
            },
          }
          : medicine
      )
    );
  };
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header with AdminMode button */}
        <View style={styles.headerRow}>
          {user?.user?.role === 'admin' && (
            <TouchableOpacity
              style={styles.adminBtn}
              onPress={() => setAdminMode((m) => !m)}
            >
              <Text style={styles.adminBtnText}>
                {adminMode ? 'User Mode' : 'Admin Mode'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!adminMode ? (
          // User Mode
          <View>
            <Text style={styles.title}>รายการยา</Text>
            {/* <View style={styles.listContainer}>
              {orders.map((order) => (
                <TouchableOpacity key={order.orderId} onPress={() => handleOrderPress(order)}>
                  <OrderItem
                    date={order.createdAt}
                    details={`สถานะ: ${order.orderStatus}`}
                    pharmacist={order.pharmacist.name} // ใช้เฉพาะ name ของ pharmacist
                  />
                </TouchableOpacity>
              ))}
            </View> */}

            {orders.length === 0 ? (
              <Text style={{ textAlign: 'center' }}>ท่านยังไม่มีรายการสั่งซื้อ</Text>
            ) : (
              <ScrollView
                contentContainerStyle={styles.listContainer}
                ref={scrollViewRef} // ผูก ref กับ ScrollView
                onScroll={({ nativeEvent }) => {
                  if (
                    nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >=
                    nativeEvent.contentSize.height - 20
                  ) {
                    loadMoreOrders(); // เรียกฟังก์ชันโหลดหน้าเพิ่มเติมเมื่อเลื่อนถึงด้านล่าง
                  }
                }}
                scrollEventThrottle={400} // ลดความถี่ในการเรียก onScroll
              >
                {orders
                  .filter((order) => order.orderStatus !== 'Cancelled') // กรองเฉพาะ order ที่สถานะไม่ใช่ Cancelled
                  .map((order) => (
                    <TouchableOpacity key={order.orderId} onPress={() => handleOrderPress(order)}>
                      <OrderItem
                        date={order.createdAt}
                        details={`สถานะ: ${order.orderStatus}`}
                        pharmacist={order.pharmacist.name} // ใช้เฉพาะ name ของ pharmacist
                        medicineNames={order.medicineItems?.map((medicine) => medicine.medicineName) || []} // ส่ง medicineName เป็น array
                      />
                    </TouchableOpacity>
                  ))}
                {loading && <Text>กำลังโหลด...</Text>}
                {!hasMoreOrders &&
                  <Text>ไม่มีคำสั่งซื้อเพิ่มเติม</Text>
                }
              </ScrollView>
            )}
            {/* ปุ่มสำหรับเปลี่ยนหน้า */}

            {orders.length > 0 && hasMoreOrders && (

              <View style={styles.paginationContainer}>

                <TouchableOpacity
                  style={[styles.paginationButton, !hasMoreOrders && styles.disabledButton]}
                  onPress={loadMoreOrders}
                  disabled={!hasMoreOrders}
                >
                  <Text style={styles.paginationButtonText}>Load More...</Text>
                </TouchableOpacity>


              </View>
            )}
          </View>
        ) : (
          // Admin Mode
          <View>
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  adminTab === 'create' && styles.activeTab,
                ]}
                onPress={() => setAdminTab('create')}
              >
                <Text style={[
                  styles.tabText,
                  adminTab === 'create' && styles.tabTextActive
                ]}>ยา</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  adminTab === 'dispense' && styles.activeTab,
                ]}
                onPress={() => setAdminTab('dispense')}
              >
                <Text style={[
                  styles.tabText,
                  adminTab === 'dispense' && styles.tabTextActive
                ]}>จ่ายยา</Text>
              </TouchableOpacity>
            </View>


            {adminTab === 'create' ? (
              <View style={styles.adminView}>
                <View style={styles.listContainer}>
                  <View>
                    <View style={styles.headerWithButton}>
                      <Text style={styles.title}>รายการยา</Text>
                      <TouchableOpacity style={styles.addButton} onPress={handleAddMedicine}>
                        <Text style={styles.addButtonText}>+ เพิ่ม</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.oneThird}>

                      <SearchableMedicineList medicines={medicines}   fetchMedicines={fetchMedicines} onSelectMedicine={handleMedicineSelect} />
                    </View>

                  </View>
                </View>
                <View style={styles.twoThirds}>
                  {isAddingMedicine ? (
                    <AddEditMedicineForm
                      onCancel={() => {
                        setIsAddingMedicine(false);
                        setSelectedMedicine(null);
                        setStage(null);
                      }}
                      onSubmit={handleSubmitMedicine}
                      stage={stage} // ส่ง stage ไปยัง AddEditMedicineForm
                      initialData={stage === 'edit' ? selectedMedicine : null} // ส่งข้อมูลยาในโหมด Edit หรือ null ในโหมด Add
                    />
                  ) : (
                    <>
                      <Text style={styles.title}>ยังไม่มีรายการ</Text>
                      <Text>สามารถกดปุ่ม "+เพิ่ม" เพื่อเพิ่มยาได้</Text>
                    </>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.adminView}>
                <View style={styles.listContainer}>
                  <View>
                    <Text style={styles.title}>รายการยา</Text>
                    <View style={styles.oneThird}>

                      <SearchableMedicineList
                        medicines={medicines}
                        onSelectMedicine={setSelectedMedicine}
                        fetchMedicines={fetchMedicines} 
                        onAddMedicine={handleAddMedicineToDispenseList} // ส่งฟังก์ชันนี้ไป
                        isTab={adminTab}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.twoThirds}>
                  <View style={styles.rightDispenseSection}>
                    <AdminDispenseList
                      selectedMedicines={selectedDispenseMedicines}
                      setSelectedMedicines={setSelectedDispenseMedicines} // ส่งฟังก์ชันนี้ไป
                      onQuantityChange={handleQuantityChange} // ส่งฟังก์ชันนี้ไป
                      onExpiryDateChange={handleExpiryDateChange} // ส่งฟังก์ชันนี้ไป
                      onFrequencyChange={handleFrequencyChange} // ส่งฟังก์ชันนี้ไป
                      onDosePerTimeChange={handleDosePerTimeChange} // ส่งฟังก์ชันนี้
                      onCautionChange={handleCautionChange} // ส่งฟังก์ชันนี้
                      onTimingChange={handleTimingChange} // ส่งฟังก์ชันนี้
                      onMealRelationChange={handleMealRelationChange} // ส่งฟังก์ชันนี้
                    />
                  </View>

                </View>

              </View>

            )}
          </View>
        )}
        {adminTab === 'dispense' && (
          <View style={styles.adminView}>
            <View style={[styles.listContainer, { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 16, marginBottom: 16, marginTop: 16 }]}>
              <View>
                <View>
                  {/* แถบสำหรับกรอกข้อมูล */}
                  <View style={styles.actionBar}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>เบอร์โทร:<Text style={{ color: 'red' }}>*</Text></Text>
                      <TextInput
                        style={styles.input}
                        placeholder="เบอร์โทร"
                        value={phoneNumber}
                        onChangeText={handleSearchUser} // ใช้ฟังก์ชัน handleSearchUser
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>ราคารวม(฿):<Text style={{ color: 'red' }}>*</Text></Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        value={totalPrice}
                        onChangeText={setTotalPrice}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                </View>
                {userList.length > 0 && (
                  <View style={styles.userListContainer}>
                    {userList.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={styles.userItem}
                        onPress={() => {
                          setPhoneNumber(user.phone); // ตั้งค่าเบอร์โทร
                          setSelectedUser(user); // ตั้งค่าผู้ใช้ที่เลือก
                          setUserList([]); // ล้างรายการผู้ใช้
                        }}
                      >
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userPhone}>{user.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                {selectedUser && (
                  <View style={styles.selectedUserContainer}>
                    <Text>ชื่อ: {selectedUser.name}</Text>
                    <Text>เบอร์โทร: {selectedUser.phone}</Text>
                  </View>
                )}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear} // ใช้ฟังก์ชัน handleClear
                  >
                    <Text style={styles.clearButtonText}>เคลียร์</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => handleDispense()} // ฟังก์ชันสำหรับจ่ายยา
                  >
                    <Text style={styles.submitButtonText}>จ่ายยา</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

          </View>
        )}
        {/* Modal for Order Details */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1} // ป้องกันการเปลี่ยนแปลงความโปร่งใสเมื่อกด
            onPress={closeModal} // เรียก closeModal เมื่อกดพื้นหลัง
          >            <View style={styles.modalContent}>
              {selectedOrder && (
                <>
                  <Text style={styles.modalTitle}>รายละเอียดและวิธีใช้งาน</Text>
                  {/* <Text style={styles.modalText}>วันที่: {selectedOrder.date}</Text> */}
                  {/* <Text style={styles.modalText}>รายละเอียด: {selectedOrder.details}</Text> */}
                  {/* <Text style={styles.modalText}>ผู้จ่ายยา: {selectedOrder.pharmacist}</Text> */}
                  {/* <Text style={styles.modalText}>รายการยา:</Text> */}
                  <ScrollView style={styles.medicineList}>
                    {Array.isArray(selectedOrder?.medicineItems) && selectedOrder.medicineItems.length > 0 ? (
                      selectedOrder.medicineItems.map((medicine) => (
                        <MedicineItem
                          key={medicine.medicineId}
                          name={medicine.medicineName || 'ไม่ระบุชื่อยา'}
                          dosage={medicine.usage?.dosePerTime || '0'}
                          timesPerDay={medicine.usage?.frequency || '0'}
                          timeOfDay={medicine.usage?.timing || []}
                          mealRelation={medicine.usage?.mealRelation || []}
                          caution={medicine.usage?.caution[0] || 'ไม่มีหมายเหตุ'}
                          expiryDate={medicine.expiryDate || 'ไม่ระบุวันหมดอายุ'}
                          imageUrl={medicine.medicineInformation?.imageUrl || 'https://storage.mumyapharmacy.app/images/default.png'} // ใช้ค่า imageUrl จาก API
                          type={medicine.type || 'ไม่ระบุประเภท'}
                          quantity={medicine.quantity || 0}
                          stage="for_order"
                        />
                      ))
                    ) : (
                      <Text style={styles.noDataText}>ไม่มีรายการยา</Text>
                    )}
                  </ScrollView>
                  <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                    <Text style={styles.closeButtonText}>ปิด</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 12,
    paddingTop: 6,
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
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#E91E63',
  },
  tabBtnTextActive: {
    color: '#fff',
  },
  tabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#fff',
  },
  adminView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listContainer: {
    flex: 1,
    marginRight: 8,
    position: 'relative', // ทำให้ zIndex ของลูกทำงาน
    overflow: 'visible', // ปรับ overflow ให้เป็น visible
  },
  formContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dispenseList: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    maxHeight: '85%', // เพิ่มพื้นที่สำหรับแสดงผล
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  medicineList: {
    width: '100%',
    maxHeight: 300,
    marginBottom: 16,
  },
  headerWithButton: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  addOrderButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10, // เพิ่ม padding แนวตั้ง
    paddingHorizontal: 20, // เพิ่ม padding แนวนอน
    borderRadius: 8,
    alignSelf: 'flex-start', // ให้ปุ่มปรับขนาดตามเนื้อหา
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 16,
    backgroundColor: '#FF0000',
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
  closeButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
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


  oneThird: {
    flex: 1,
    marginRight: 8,

  },
  twoThirds: {
    flex: 2,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  inputGroup: {
    flex: 1,
    marginHorizontal: 4,
    width: '50%',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  dashedBox: {
    borderWidth: 2,
    borderColor: '#ccc', // สีของรอยประ
    borderStyle: 'dashed', // กำหนดให้เป็นรอยประ
    borderRadius: 12, // ขอบมน
    padding: 16, // เพิ่ม padding ภายใน
    alignItems: 'flex-start', // จัดข้อความให้อยู่ตรงกลาง
    justifyContent: 'flex-start', // จัดข้อความให้อยู่ตรงกลาง
    marginVertical: 16, // เพิ่มระยะห่างด้านบนและล่าง
    width: '40%',
    height: 80,
  },
  dashedBoxText: {
    color: '#ccc', // สีข้อความ
    fontWeight: 'bold', // ตัวหนา
    fontSize: 16, // ขนาดตัวอักษร
    textAlign: 'center', // จัดข้อความให้อยู่ตรงกลาง
  },
  rightDispenseSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 16,
    height: '100%',
  },
  userListContainer: {
    position: 'absolute',
    zIndex: 99999,
    elevation: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    maxHeight: 150,
    overflow: 'hidden',
    width: '50%',
    top: 60,
    left: 0,
    pointerEvents: 'box-none', // อนุญาตให้คลิกได้
    marginBottom: 8,
    marginTop: 4,
  },
  userItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userPhone: {
    fontSize: 14,
    color: '#555',
  },
  selectedUserContainer: {

    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    width: '50%',
  },

  actionButtonsContainer: {
    position: 'absolute', // ทำให้ปุ่มลอย
    bottom: 8, // ระยะห่างจากด้านล่าง
    right: 8, // ระยะห่างจากด้านขวา
    flexDirection: 'row',
    justifyContent: 'flex-end', // จัดปุ่มให้อยู่ทางขวา
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#bbb',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8, // เพิ่มระยะห่างระหว่างปุ่ม
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  nextPageButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
    alignSelf: 'center',
  },
  nextPageButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  paginationButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paginationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  scrollToTopButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
