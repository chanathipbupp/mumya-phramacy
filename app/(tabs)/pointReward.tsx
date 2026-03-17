import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, Picker, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
// import history from '../../composables/history.json';
import { useUser } from '../../components/UserProvider';
import { verifyRedemptionCode, useRedemptionCode, deleteReward, getRewardsAdmin, adjustUserPointAdmin, createReward, getLatestPointLedger, getMyPointBalance, getMyPointLedger, getMyRedemptions, getRewards, getUserList, getUserPointBalanceByUid, redeemReward, uploadFile, sendRewardAdmin } from '../../composables/fetchAPI';
import GiftButton from '../components/GiftButton';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // ใช้สำหรับแสดงหน้ารอโหลดฟอนต์
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native'; // เพิ่ม Linking ในกลุ่ม react-native
type CouponType = {
  id: string;
  title: string;
  description: string;
  pointCost: number;
  imageUrl?: string;
  type: string;
  discountAmount?: number;
};

type CouponData = {
  title: string;
  description: string;
  pointCost: number;
  type: string;
  imageUrl?: string;
  discountAmount?: number;
};


const RewardOwnedSkeleton = () => (
  <View style={[styles.cardOwned, { opacity: 0.6, borderColor: '#ddd' }]}>
    {/* ช่องรูปภาพสี่เหลี่ยมจตุรัสด้านบน */}
    <View style={{
      aspectRatio: 1,
      backgroundColor: '#e0e0e0',
      margin: 8,
      borderRadius: 10
    }} />

    <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>
      {/* แถบชื่อ (ทดสอบspecial) */}
      <View style={{
        height: 16,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        width: '80%',
        marginBottom: 8
      }} />

      {/* แถบแต้ม (0 P) */}
      <View style={{
        height: 18,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        width: '30%',
        marginBottom: 12
      }} />

      {/* ช่องปุ่มกด (กดเพื่อใช้) */}
      <View style={{
        height: 40,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 0, // ตามรูปปุ่มจะเป็นสี่เหลี่ยมขอบคม
        width: '100%',
        marginBottom: 10
      }} />

      {/* แถบวันหมดอายุด้านล่างสุด */}
      <View style={{
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        width: '60%',
        alignSelf: 'center'
      }} />
    </View>
  </View>
);

// คอมโพเนนต์ Skeleton สำหรับจำลอง RewardCard แบบแนวนอน
const RewardSkeleton = () => (
  <View style={[styles.cardAvailable, { opacity: 0.5, borderColor: '#eee', marginHorizontal: 16, }]}>
    {/* ช่องรูปภาพ */}
    <View style={[styles.imagePlaceholderHorizontal, { backgroundColor: '#e0e0e0', borderWidth: 0 }]} />

    <View style={styles.cardContentHorizontal}>
      <View style={{ flex: 1 }}>
        {/* แถบชื่อ */}
        <View style={{ height: 16, backgroundColor: '#e0e0e0', borderRadius: 4, width: '70%', marginBottom: 8 }} />
        {/* แถบรายละเอียด */}
        <View style={{ height: 12, backgroundColor: '#f0f0f0', borderRadius: 4, width: '90%', marginBottom: 6 }} />
        {/* แถบแต้ม */}
        <View style={{ height: 14, backgroundColor: '#e0e0e0', borderRadius: 4, width: '40%', marginTop: 8 }} />
      </View>
      {/* ช่องปุ่ม */}
      <View style={{ width: 60, height: 35, backgroundColor: '#e0e0e0', borderRadius: 8, marginLeft: 10 }} />
    </View>
  </View>
);



// --- Component: RewardCard ---
// แยก State ด้วย prop 'mode'
const RewardCard = ({
  item, userList, mode, onRefreshMyRewards, onRedeemReward, currentRedeemedCount = 0, userBalance = 0, adminMode, special, onDeleteReward, onSendGift, redemptionLimit, canRedeem, reasons, onRefreshAvailableRewards }: { item: any, userList?: any[], onSendGift?: (id: string, phone: string) => Promise<void>, onRedeemReward?: (id: string) => Promise<void>, onDeleteReward?: (id: string) => Promise<void>, mode: 'owned' | 'available', currentRedeemedCount?: number, userBalance?: number, adminMode?: boolean, special?: boolean, redemptionLimit?: string, canRedeem?: boolean, reasons?: string[], onRefreshMyRewards?: () => Promise<void>, onRefreshAvailableRewards?: () => Promise<void> }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(180); // 3 นาที = 180 วินาที
  const [isRedeeming, setIsRedeeming] = useState(false); // เพิ่มสถานะ Loading
  const [confirmModalVisible, setConfirmModalVisible] = useState(false); // สำหรับยืนยันการแลก (ใหม่)
  const [giftModalVisible, setGiftModalVisible] = useState(false); // State สำหรับ Modal ส่งของขวัญ
  const [recipientPhone, setRecipientPhone] = useState(''); // เก็บเบอร์โทรผู้รับ
  const [isSending, setIsSending] = useState(false);
  const [suggestedPhones, setSuggestedPhones] = useState<string[]>([]); // รายการเบอร์โทรศัพท์ที่แนะนำ
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const today = new Date();
  const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
  const formattedExpiry = nextMonth.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePhoneInputChange = (text: string) => {
    setRecipientPhone(text);

    if (text.length > 0) {
      // กรองจาก userList จริงในระบบ
      const filtered = userList?.filter((u) =>
        u.phone?.startsWith(text) || u.name?.toLowerCase().includes(text.toLowerCase())
      );
      setSuggestedUsers(filtered || []);
    } else {
      setSuggestedUsers([]);
    }
  };

  const handleSendGiftPress = async () => {
    if (!recipientPhone) {
      alert("กรุณากรอกเบอร์โทรศัพท์ผู้รับ");
      return;
    }

    // 1. ค้นหา User จาก userList ที่มีเบอร์ตรงกับ recipientPhone
    const targetUser = userList?.find(u => u.phone === recipientPhone);

    if (!targetUser) {
      alert("ไม่พบผู้ใช้งานที่มีเบอร์โทรศัพท์นี้ในระบบ");
      return;
    }


    setIsSending(true);
    try {
      if (onSendGift) {
        // 2. ส่ง targetUser.id (ที่เป็น ID จริงๆ) แทนเบอร์โทร
        await onSendGift(item.id, targetUser.id);
        setGiftModalVisible(false);
        setRecipientPhone('');
        setSuggestedUsers([]);
      }
    } catch (error) {
      console.error("Send gift error:", error);
      alert("เกิดข้อผิดพลาดในการส่งของขวัญ");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (modalVisible) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setModalVisible(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // เมื่อ modalVisible เปลี่ยนเป็น false (ไม่ว่าจะกดปิดเอง หรือหมดเวลา)
      // ให้ตรวจสอบว่าถ้ามีฟังก์ชัน refresh ส่งมา ให้เรียกใช้งาน
      if (onRefreshMyRewards) {
        onRefreshMyRewards();
      }
    }
    return () => clearInterval(timer);
  }, [modalVisible]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLimitReached = redemptionLimit !== null && currentRedeemedCount >= redemptionLimit;


  const handleDeletePress = () => {
    const confirmDelete = window.confirm("คุณต้องการจะลบคูปองนี้ใช่ไหม?");
    if (confirmDelete) {
      onDeleteReward && onDeleteReward(item.id);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!onRedeemReward) return;
    setIsRedeeming(true);
    try {
      await onRedeemReward(item.id);

      // เมื่อแลกสำเร็จ ให้สั่งโหลดรายการรางวัลใหม่เพื่ออัปเดตสิทธิ์คงเหลือ (1/5 -> 2/5)
      if (onRefreshAvailableRewards) {
        await onRefreshAvailableRewards();
      }

      setConfirmModalVisible(false);
    } catch (error) {
      // Error ถูกจัดการที่ parent แล้ว
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRedeemPress = () => {
    // 1. เช็คแต้มก่อน (เหมือนเดิม)
    if (userBalance < item.pointCost) {
      window.alert('แลกไม่สำเร็จ: แต้มของคุณไม่เพียงพอ');
      return;
    }

    // 2. เช็คเงื่อนไข canRedeem จาก Backend (ถ้า canRedeem เป็น false แต่แต้มพอ แสดงว่าติดเงื่อนไขอื่น)
    if (!canRedeem && !adminMode) {
      if (reasons.includes('has_unused_redemption')) {
        window.alert('คุณมีคูปองนี้ที่ยังไม่ได้ใช้งาน กรุณาใช้คูปองเดิมก่อนแลกใหม่');
      } else if (reasons.includes('limit_reached')) {
        window.alert('คุณแลกรางวัลนี้ครบกำหนดสิทธิ์แล้ว');
      }
      return;
    }

    setConfirmModalVisible(true);
  };
  const handleUseReward = () => {
    setTimeLeft(180); // รีเซ็ตเวลาเป็น 3 นาที
    setModalVisible(true); // เปิด Modal
  };

  // const handleCopyShortCode = () => {
  //   if (item.shortCode) {
  //     Clipboard.setStringAsync(item.shortCode); // คัดลอกเฉพาะ shortCode
  //     Alert.alert('คัดลอกสำเร็จ', 'คัดลอก ShortCode เรียบร้อยแล้ว');
  //   }
  // };
  const isInactive = item.status === 'used' || item.status === 'expired';

  if (mode === 'owned') {
    return (
      <View style={[styles.ticketWrapper, isInactive && { opacity: 0.6 }]}>
        <TouchableOpacity onPress={handleUseReward} activeOpacity={0.9} disabled={isInactive}>
          <View style={styles.ticketContainer}>
            {/* ส่วนบน: รูปภาพ */}
            <View style={styles.ticketTopSection}>
              <Image
                source={{
                  uri: item.imageUrl || 'https://cdn.kasidate.me/images/a6b70c7c88f54c3afbed800483c330fb188534056d571e98c4c0b65d8dfedd4c.png',
                }}
                style={styles.ticketImage}
              />
            </View>

            {/* ส่วนรอยปรุและรอยเจาะวงกลม */}
            <View style={styles.punchHoleContainer}>
              <View style={styles.punchHoleLeft} />
              <View style={styles.ticketDashedLine} />
              <View style={styles.punchHoleRight} />
            </View>

            {/* ส่วนล่าง: ข้อมูล */}
            <View style={styles.ticketBottomSection}>
              <Text
                style={styles.ticketTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title || 'ชื่อ Reward'}
              </Text>

              <Text
                style={styles.ticketDescription}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.description || 'ไม่มีระบุ'}
              </Text>

              <TouchableOpacity
                style={[
                  styles.ticketActionBtn,
                  item.status === 'used' && { backgroundColor: 'gray' } // เปลี่ยนสีปุ่มเป็นสีเทา
                ]}
                onPress={item.status === 'used' || item.status === 'expired' ? undefined : handleUseReward} // ปิดการกดปุ่มถ้า status เป็น used หรือ expired
                activeOpacity={item.status === 'used' || item.status === 'expired' ? 1 : 0.8} // ปิดการเปลี่ยนแปลง opacity เมื่อกดปุ่ม
              >
                <LinearGradient
                  colors={
                    item.status === 'used' || item.status === 'expired'
                      ? ['#d3d3d3', '#a9a9a9', '#808080'] // สีเทาเมื่อใช้งานแล้ว
                      : ['#1e88e5', '#0a65ae', '#084b8a'] // สีปกติ
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ticketActionGradient}
                >
                  <Text style={styles.ticketActionBtnText}>
                    {item.status === 'used' ? 'ใช้งานแล้ว' : item.status === 'expired' ? 'หมดอายุ' : 'ใช้คูปอง'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.ticketExpiryText}>
                หมดอายุ: {item.expiry || 'ไม่พบวันหมดอายุ'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Modal สำหรับแสดงโค้ด (โค้ดเดิมของคุณ) */}
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <Text style={styles.modalTitle}>โค้ดคูปองของคุณ</Text>
                  <Text style={styles.modalSubtitle}>กรุณาแสดงให้พนักงาน</Text>

                  {/* 1. แสดงกล่องโค้ดปกติเสมอ */}
                  <View style={styles.shortCodeBox}>
                    <Text style={styles.shortCodeText} numberOfLines={1} adjustsFontSizeToFit>
                      {item.fullCode || 'ไม่มีโค้ด'}
                    </Text>
                  </View>

                  {/* 2. เงื่อนไขเพิ่มเติม: ถ้า isActive เป็น false ให้โชว์กล่องแจ้งเตือนสีแดงเพิ่มด้านล่าง */}
                  {item.isActive === false && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => Linking.openURL('https://page.line.me/@450oymuh')}
                      style={[
                        styles.expiryWarningBox,
                        { borderColor: '#D32F2F', backgroundColor: '#FFF5F5', marginTop: 0, marginBottom: 15 }
                      ]}
                    >
                      <Text style={[styles.expiryTitle, { color: '#D32F2F', textAlign: 'center' }]}>
                        คูปองนี้ถูกลบแล้ว โปรดติดต่อ LINE นี้
                      </Text>
                      <Text style={[styles.expiryDetail, { color: '#0a65ae', textDecorationLine: 'underline', marginTop: 5, textAlign: 'center' }]}>
                        https://page.line.me/@450oymuh
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* 3. แสดงเวลาถอยหลังปกติ */}
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeBtnText}>ปิด</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    );
  }
  // Layout แบบแนวนอน (แลกของรางวัล)
  return (
    <View style={{ overflow: 'visible' }}>

      {/* 1. ปุ่มลบบนขวาสำหรับ Admin */}
      {adminMode && (
        <TouchableOpacity style={styles.deleteBadge} onPress={handleDeletePress}>
          <Text style={styles.deleteBadgeText}>✕</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.cardAvailable, isLimitReached && !adminMode ? { opacity: 0.7 } : null]}
        onPress={handleRedeemPress}
        activeOpacity={0.9}
      >
        {/* 1.1 รูปภาพ (จัตุรัสฝั่งซ้าย) */}
        <View style={styles.imageWrapperHorizontal}>
          <Image
            source={{ uri: item.imageUrl || 'https://cdn.kasidate.me/images/a6b70c7c88f54c3afbed800483c330fb188534056d571e98c4c0b65d8dfedd4c.png' }}
            style={styles.imageHorizontal}
          />
        </View>

        {/* 2. รอยปรุคั่นกลาง */}
        <View style={styles.ticketDividerContainer}>
          <View style={styles.dashDivider} />
        </View>

        {/* 3. เนื้อหาตรงกลาง */}
        <View style={{ flex: 1, padding: 12, position: 'relative' }}>
          <View style={{ paddingRight: 70 }}> {/* เว้นช่องว่างด้านขวาไว้หน่อยไม่ให้ตัวหนังสือชิดขอบปุ่มจนเกินไป */}
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <Text style={styles.cardDetail} numberOfLines={1}>
              {item.description || 'ไม่มีรายละเอียด'}
            </Text>
            <Text style={[styles.cardPointsHighlight, { marginTop: 4 }]} numberOfLines={1}>{item.pointCost} P</Text>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.limitText} numberOfLines={1}>
                {adminMode
                  ? `ขีดจำกัดต่อคน: ${item.redemptionLimitPerUser || 'ไม่จำกัด'}`
                  : `สิทธิ์แลก: ${currentRedeemedCount}/${redemptionLimit || 'ไม่มีกำหนด'}`}
              </Text>
            </View>
          </View>

          {/* 4. ส่วนปุ่มปฏิบัติการ (วางทับด้านขวาด้วย Absolute) */}
          <View style={styles.absoluteActionWrapper}>
            {adminMode && item.type === 'special' ? (
              <View style={{ alignItems: 'center' }}>
                <GiftButton onPress={() => setGiftModalVisible(true)} />
                <Text style={styles.giftLabelAdmin}>ให้ของขวัญ</Text>
              </View>
            ) : !adminMode && (
              <TouchableOpacity
                style={styles.horizontalGradientBtn}
                onPress={handleRedeemPress}
                disabled={isLimitReached || isRedeeming}
              >
                <LinearGradient
                  colors={isLimitReached ? ['#ccc', '#999'] : ['#1e88e5', '#0a65ae', '#084b8a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.horizontalGradientPadding}
                >
                  <Text style={styles.horizontalActionBtnText}>
                    {isLimitReached ? 'เต็มแล้ว' : 'แลก'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>


      {/* --- Modal ส่งของขวัญ (เพิ่มใหม่ตามรูป) --- */}
      <Modal
        visible={giftModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setGiftModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => !isSending && setGiftModalVisible(false)}>
          <View style={[styles.modalOverlay, { paddingHorizontal: 60 }]}>
            <TouchableWithoutFeedback>
              <View style={styles.giftModalContainer}>
                <Text style={styles.giftModalTitle}>ส่งของขวัญ</Text>

                <View style={styles.giftInfoBox}>
                  <Text style={styles.giftItemTitle}>{item.title}</Text>
                  <Text style={styles.giftItemDesc} numberOfLines={2}>
                    {item.description || 'ไม่มีรายละเอียด...'}
                  </Text>
                  <View style={styles.dottedLine} />
                </View>

                <Text style={styles.giftInputLabel}>กรุณากรอกเบอร์ของคนที่จะให้ของขวัญ</Text>
                <TextInput
                  style={styles.giftInput}
                  value={recipientPhone}
                  onChangeText={handlePhoneInputChange}
                  placeholder="กรอกเบอร์ลูกค้า"
                  keyboardType="phone-pad"
                />

                {/* Suggestion List - ปรับปรุงใหม่ตามรูปที่ 2 */}
                {suggestedUsers.length > 0 && (
                  <View style={styles.suggestionListContainer}>
                    {suggestedUsers.map((u, index) => (
                      <TouchableOpacity
                        key={u.id || index}
                        style={styles.suggestionCard}
                        onPress={() => {
                          setRecipientPhone(u.phone);
                          setSuggestedUsers([]); // เลือกแล้วซ่อนรายการ
                        }}
                      >
                        <Text style={styles.suggestionNameText}>{u.name || 'ไม่ระบุชื่อ'}</Text>
                        <Text style={styles.suggestionPhoneText}>{u.phone}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <View style={styles.giftBtnWrapper}>
                  <TouchableOpacity
                    style={[styles.giftSendBtn, isSending && { opacity: 0.5 }]}
                    onPress={handleSendGiftPress}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.giftSendBtnText}>ส่ง</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* --- Modal ยืนยันการแลกแต้ม (Theme Blue Gradient) --- */}
      <Modal
        visible={confirmModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isRedeeming && setConfirmModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => !isRedeeming && setConfirmModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { padding: 0, overflow: 'hidden', borderRadius: 20 }]}>
                {/* Header ส่วนหัวข้อ */}
                <View style={{ backgroundColor: '#f8f9fa', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee', width: '100%', alignItems: 'center' }}>
                  <Text style={styles.confirmModalTitle}>ยืนยันการแลกรับสิทธิ์</Text>
                </View>

                <View style={{ padding: 20, width: '100%' }}>
                  <View style={styles.confirmInfoBox}>
                    <Text style={styles.confirmItemTitle}>{item.title}</Text>
                    <Text style={styles.confirmItemDesc} numberOfLines={2}>{item.description || 'ไม่มีรายละเอียด'}</Text>

                    <View style={styles.confirmPointRow}>
                      <Text style={styles.confirmPointLabel}>แต้มที่ต้องใช้:</Text>
                      <Text style={[styles.confirmPointValue, { fontSize: 20 }]}>{item.pointCost || 0} P</Text>
                    </View>
                  </View>
                  {/* ส่วนที่เพิ่มใหม่ตรงนี้ */}
                  <View style={styles.expiryWarningBox}>
                    <Text style={styles.expiryTitle}>ระยะเวลาการใช้งาน: 1 เดือน</Text>
                    <Text style={styles.expiryDetail}>
                      กรุณามาใช้ก่อนวันที่ <Text style={styles.highlightRed}>{formattedExpiry}</Text>
                    </Text>
                  </View>
                  <View style={styles.confirmBtnRow}>
                    <TouchableOpacity
                      style={[styles.modalCancelBtn, isRedeeming && { opacity: 0.5 }]}
                      onPress={() => setConfirmModalVisible(false)}
                      disabled={isRedeeming}
                    >
                      <Text style={styles.modalCancelBtnText}>ไว้ทีหลัง</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ flex: 1, height: 48, borderRadius: 12, overflow: 'hidden' }}
                      onPress={handleConfirmRedeem}
                      disabled={isRedeeming}
                    >
                      {isRedeeming ? (
                        <View style={[styles.modalConfirmBtn, { backgroundColor: '#ccc' }]}>
                          <ActivityIndicator size="small" color="#fff" />
                        </View>
                      ) : (
                        <LinearGradient
                          colors={['#1e88e5', '#0a65ae', '#084b8a']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                        >
                          <Text style={[styles.modalConfirmBtnText, { fontSize: 16 }]}>แลกเลย</Text>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

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
  const [displayedUsers, setDisplayedUsers] = useState<any[]>([]); // ข้อมูลที่แสดงผล
  const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบัน
  //console.log('user in pointReward', user);
  // Admin action states
  const [actionType, setActionType] = useState<'credit' | 'debit'>('credit');
  const [phone, setPhone] = useState('');
  //console.log('point history', history);
  //console.log('point balance', point);
  const [displayedHistory, setDisplayedHistory] = useState<any[]>([]); // ข้อมูลที่แสดงผลใน History
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1); // หน้าปัจจุบันของ History
  const [displayedAdminHistory, setDisplayedAdminHistory] = useState<any[]>([]); // ข้อมูลที่แสดงผลใน History of Action
  const [currentAdminHistoryPage, setCurrentAdminHistoryPage] = useState(1); // หน้าปัจจุบันของ History of Action
  const [myRewards, setMyRewards] = useState<any[]>([]);
  const [loadingMyRewards, setLoadingMyRewards] = useState(true);
  const [availableRewards, setAvailableRewards] = useState<any[]>([]);
  const [loadingAvailableRewards, setLoadingAvailableRewards] = useState(true);
  const [availableRewardsPage, setAvailableRewardsPage] = useState(1); // Page for available rewards
  const [hasMoreAvailableRewards, setHasMoreAvailableRewards] = useState(true); // Check if more rewards are available
  const [myRewardsPage, setMyRewardsPage] = useState(1); // หน้าปัจจุบัน
  const [hasMoreMyRewards, setHasMoreMyRewards] = useState(true); // เช็คว่ายังมีข้อมูลอีกไหม
  const [adminTabMode, setAdminTabMode] = useState<'pointReward' | 'redeem'>('redeem'); // แยก Tab ใน Admin Mode
  // ข้อมูลสมมติสำหรับ UI
  // const myRewards = [{ id: '1' }, { id: '2' }, { id: '3' }];
  // const availableRewards = [{ id: 'a1' }, { id: 'a2' }];
  const [totalAvailablePages, setTotalAvailablePages] = useState(1);
  const ITEMS_PER_PAGE = 5; // กำหนด Limit ให้ตรงกับที่ส่งไปใน API
  const [selectedType, setSelectedType] = useState('all'); // เพิ่มอันนี้
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'used' | 'expired' | 'all'>('active'); const [activeTab, setActiveTab] = useState<'rewards' | 'history'>('rewards');
  const flatListRef = useRef<FlatList>(null);
  const [redeemCode, setRedeemCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [optionTab, setOptionTab] = useState<'item' | 'discount' | 'special'>('discount');
  const [redeemItems, setRedeemItems] = useState([
    { name: 'Coupon Item 1' },
    { name: 'Coupon Item 2' },
    { name: 'Coupon Item 3' },
  ]);
  const [receivedCode, setReceivedCode] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminSearchQuery, setAdminSearchQuery] = useState(''); // เพิ่มสำหรับ Admin แยกต่างหาก
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [couponData, setCouponData] = useState<any>({
    title: '',
    description: '',
    pointCost: 0,
    type: 'item',
    discountAmount: 0,
    redemptionLimitPerUser: '', // เพิ่มค่าเริ่มต้น
    imageUrl: '',
  });
  const [redemptionData, setRedemptionData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }


  const filteredCoupons = availableRewards.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    return matchesSearch && matchesType;
  });


  const handleAddCoupon = (coupon: CouponType) => {
    // ตัวอย่างการจัดการการแลกคูปอง
    if (userBalances[user?.id] >= coupon.pointCost) {
      Alert.alert('สำเร็จ', `คุณได้แลกคูปอง ${coupon.title} เรียบร้อยแล้ว!`);
      // อัปเดตข้อมูลคูปองที่แลกแล้ว
      setCoupons((prevCoupons) =>
        prevCoupons.map((c) =>
          c.id === coupon.id ? { ...c, redeemed: true } : c
        )
      );
    } else {
      Alert.alert('ข้อผิดพลาด', 'แต้มของคุณไม่เพียงพอ');
    }
  };
  const handleVerifyCode = async (code: string) => {
    setIsVerifying(true);
    try {
      const response = await verifyRedemptionCode(code); // ส่ง shortCode ในรูปแบบออบเจกต์
      if (response && response.valid && response.redemption) {
        setRedemptionData(response.redemption); // เก็บข้อมูล redemption
        setModalVisible(true); // เปิด Modal
      } else {
        alert(response.message || "ไม่พบข้อมูลคูปองหรือโค้ดไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      alert("เกิดข้อผิดพลาดในการตรวจสอบ");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUseRedemptionCode = async (code: string) => {
    if (!code) return;
    try {
      const response = await useRedemptionCode(code);
      alert("แลกคูปองสำเร็จ!");
      setModalVisible(false); // ปิด Popup
      setRedemptionData(null); // ล้างข้อมูล
    } catch (error) {
      console.error("Error using redemption code:", error);
      alert("เกิดข้อผิดพลาดในการแลกคูปอง");
    }
  };

  const handleSendGift = async (rewardId: string, userId: string) => {
    try {
      const response = await sendRewardAdmin({ rewardId, userId });
      console.log('Reward sent successfully:', response);
      alert('ส่งรางวัลสำเร็จ!');

    } catch (error) {
      console.error('Error sending reward:', error);
      alert('เกิดข้อผิดพลาดในการส่งรางวัล');
    }
  };


  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      const file = e.target.files[0];
      const res = await uploadFile(file); // ใช้ฟังก์ชัน uploadFile
      const uploadedImageUrl = res.url || res.data?.url || '';
      setImageUrl(uploadedImageUrl); // อัปเดต URL ของรูปภาพ
      setCouponData((prev) => ({ ...prev, imageUrl: uploadedImageUrl })); // อัปเดต couponData.imageUrl
    } catch (err) {
      alert('อัปโหลดไฟล์ไม่สำเร็จ');
    }
  };

  const scrollToTab = (tab: 'rewards' | 'history') => {
    setActiveTab(tab);
    // ถ้าอยากให้กดแล้วเด้งขึ้นไปบนสุดของเนื้อหา
    // scrollRef.current?.scrollTo({ y: 250, animated: true }); 
  };

  const fetchAllRewards = async (specificSearch?: string) => {
    setLoadingAvailableRewards(true);
    try {
      // เตรียม Params สำหรับส่งให้ API
      const params = {
        page: availableRewardsPage,
        limit: ITEMS_PER_PAGE,
        search: adminMode ? adminSearchQuery : (specificSearch ?? searchQuery),        // ถ้าเลือก 'all' ให้ส่งเป็น undefined เพื่อไม่ให้ติด filter type ใน query string
        type: selectedType === 'all' ? undefined : selectedType,
        isActive: adminMode ? true : undefined,
        sort: 'pointCost',
        desc: 0
      };

      // ลบ `type` ออกจาก `params` หากมันเป็น `undefined`
      if (params.type === undefined) {
        delete params.type;
      }
      // ลบ `type` ออกจาก `params` หากมันเป็น `undefined`
      if (params.isActive === undefined) {
        delete params.isActive;
      }

      let response;
      if (adminMode) {
        // --- ใช้ API สำหรับ Admin ---
        response = await getRewardsAdmin(params);
        setAvailableRewards(response.items || []); // แทนที่ข้อมูลเดิมสำหรับ Pagination
      } else {
        // --- ใช้ API สำหรับ User ทั่วไป ---
        response = await getRewards(params);
        setAvailableRewards(prev =>
          availableRewardsPage === 1 ? (response.items || []) : [...prev, ...(response.items || [])]
        ); // ต่อท้ายข้อมูลสำหรับ Infinite Scroll
      }

      // คำนวณจำนวนหน้าทั้งหมดจาก total ที่ API ส่งมา
      if (response.total) {
        setTotalAvailablePages(Math.ceil(response.total / ITEMS_PER_PAGE));
      } else if (response.totalPages) {
        setTotalAvailablePages(response.totalPages);
      }

      setHasMoreAvailableRewards((response.items?.length || 0) === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      setAvailableRewards([]);
    } finally {
      setLoadingAvailableRewards(false);
    }
  };

  // แก้ไข useEffect ส่วนการดึง User List
  useEffect(() => {
    // เพิ่มเงื่อนไขให้ดึงข้อมูลเมื่ออยู่ในหน้า redeem ของ admin ด้วย
    if (adminMode && (adminTab === 'dashboard' || adminTabMode === 'redeem')) {
      setUserListLoading(true);

      const fetchAllUsers = async () => {
        let allUsers = [];
        let currentPageNum = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const data = await getUserList({
              search: '',
              page: currentPageNum.toString(),
              limit: '20',
              sortBy: 'createdAt',
              sortDir: 'desc',
            });

            allUsers = [...allUsers, ...(data?.items || [])];
            hasMore = data?.items?.length === 20;
            currentPageNum++;
          } catch (error) {
            console.error("Error fetching users:", error);
            hasMore = false;
          }
        }

        setUserList(allUsers);
        // ถ้าเป็นหน้า dashboard ค่อย setDisplayedUsers สำหรับตาราง
        if (adminTab === 'dashboard') {
          setDisplayedUsers(allUsers.slice(0, 20));
        }
        setUserListLoading(false);
      };

      fetchAllUsers();
    }
  }, [adminMode, adminTab, adminTabMode]); // เพิ่ม adminTabMode ใน dependencies


  // สำหรับโหลด Reward ทั่วไป (User Mode)
  useEffect(() => {
    if (!adminMode) {
      fetchAllRewards();
    }
  }, [availableRewardsPage, searchQuery, selectedType, adminMode]);

  // สำหรับโหลด Reward ในหน้า Admin
  useEffect(() => {
    if (adminMode) {
      fetchAllRewards();
    }
  }, [availableRewardsPage, adminSearchQuery, selectedType, adminMode]);

  const loadMoreAvailableRewards = () => {
    if (hasMoreAvailableRewards && !loadingAvailableRewards) {
      setAvailableRewardsPage(prev => prev + 1); // Increment page
    }
  };

  // ยกฟังก์ชันนี้ออกมาไว้นอก useEffect แต่อยู่ใน TabTwoScreen
  const fetchMyRedemptions = async () => {
    if (myRewardsPage === 1) setLoadingMyRewards(true);
    try {
      // 1. เตรียม params พื้นฐาน
      const params: any = {
        page: myRewardsPage,
        limit: 20
      };

      // 2. เช็คเงื่อนไข: ถ้าไม่ใช่ 'all' ถึงจะใส่ status เข้าไปใน object
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      // 3. ส่ง params ที่ถูกกรองแล้วไปหา API
      const response = await getMyRedemptions(params);

      const newItems = response.items || [];
      setMyRewards(prev => myRewardsPage === 1 ? newItems : [...prev, ...newItems]);
      setHasMoreMyRewards(newItems.length === 20);
    } catch (error) {
      console.error('Failed to fetch my redemptions:', error);
    } finally {
      setLoadingMyRewards(false);
    }
  };
  // แล้วใน useEffect ก็แค่เรียกใช้งาน
  useEffect(() => {
    setMyRewardsPage(1)
    fetchMyRedemptions();
  }, [selectedStatus]);

  // ฟังก์ชันสำหรับเรียกโหลดหน้าถัดไป
  const loadMoreMyRewards = () => {
    if (hasMoreMyRewards && !loadingMyRewards) {
      setMyRewardsPage(prev => prev + 1);
    }
  };


  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyPointBalance(),
      getMyPointLedger({ limit: '100' }) // ดึงข้อมูลทั้งหมด
    ])
      .then(([balanceData, ledgerData]) => {
        setPoint(balanceData); // <-- set full data object
        setHistory(ledgerData?.items ?? []);
        setDisplayedHistory(ledgerData?.items?.slice(0, 20) ?? []); // แสดงผลเฉพาะ 20 รายการแรก
      })
      .catch(() => {
        setPoint({ balance: 0 }); // <-- fallback to object with balance
        setHistory([]);
        setDisplayedHistory([]);
      })
      .finally(() => setLoading(false));
  }, []);
  const handleHistoryPageChange = (page: number) => {
    const startIndex = (page - 1) * 20;
    const endIndex = startIndex + 20;
    setDisplayedHistory(history.slice(startIndex, endIndex)); // อัปเดตข้อมูลที่แสดงผล
    setCurrentHistoryPage(page);
  };



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
      getLatestPointLedger({ limit: '100' }) // ดึงข้อมูลทั้งหมด
        .then(data => {
          const historyData = Array.isArray(data) ? data : [];
          setAdminHistory(historyData);
          setDisplayedAdminHistory(historyData.slice(0, 20)); // แสดงผลเฉพาะ 20 รายการแรก
        })
        .catch(() => {
          setAdminHistory([]);
          setDisplayedAdminHistory([]);
        })
        .finally(() => setAdminHistoryLoading(false));
    }
  }, [adminMode, adminTab]);

  const handleAdminHistoryPageChange = (page: number) => {
    const startIndex = (page - 1) * 20; // เปลี่ยนจาก 5 เป็น 20
    const endIndex = startIndex + 20; // เปลี่ยนจาก 5 เป็น 20
    setDisplayedAdminHistory(adminHistory.slice(startIndex, endIndex)); // อัปเดตข้อมูลที่แสดงผล
    setCurrentAdminHistoryPage(page);
  };

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

  // ฟังก์ชันช่วยนับจำนวนที่เคยแลกสำหรับรางวัลแต่ละ ID
  const getRedeemedCount = (rewardTitle: string) => {
    return myRewards.filter(item => item.reward?.title === rewardTitle).length;
  };


  const handleDeleteReward = async (id: string) => {
    try {
      // 1. เรียก API ลบ (คุณอาจต้องไปเพิ่มฟังก์ชัน deleteReward ใน fetchAPI.ts)
      await deleteReward(id);

      alert('ลบคูปองสำเร็จ');

      // 2. รีเฟรชหน้าจอ (โหลดข้อมูลใหม่)
      fetchAllRewards();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleRedeemReward = async (id: string) => {
    try {
      const result = await redeemReward({ rewardId: id });

      // 1. ดึงแต้มล่าสุดมาอัปเดต
      const balanceData = await getMyPointBalance();
      setPoint(balanceData);

      alert('แลกรางวัลเรียบร้อยแล้ว');

      // 2. เคลียร์รางวัลที่มีอยู่และรีเซ็ตหน้าเป็นหน้า 1 ทันที
      // การ setAvailableRewardsPage(1) จะไป trigger useEffect ให้ fetchAllRewards ทำงานเอง
      setAvailableRewards([]); // ล้างลิสต์เก่าทิ้งเพื่อไม่ให้ข้อมูลซ้ำ
      setAvailableRewardsPage(1);

      // หากหน้าปัจจุบันเป็น 1 อยู่แล้ว useEffect จะไม่ทำงาน (เพราะค่าไม่เปลี่ยน) 
      // เราต้องดึงเองเผื่อไว้
      if (availableRewardsPage === 1) {
        fetchAllRewards();
      }

      // 3. รีเฟรชฝั่ง "Reward ของฉัน" ด้วย
      setMyRewards([]);
      setMyRewardsPage(1);
      fetchMyRedemptions();

    } catch (error: any) {
      alert('ไม่สามารถแลกได้');
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

  useEffect(() => {
    if (adminMode && adminTab === 'dashboard') {
      setUserListLoading(true);
      const fetchAllUsers = async () => {
        let allUsers = [];
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          try {
            const data = await getUserList({
              search: '', // ดึงข้อมูลทั้งหมด
              page: currentPage.toString(),
              limit: '20', // ดึงทีละ 20 รายการ
              sortBy: 'createdAt',
              sortDir: 'desc',
            });

            allUsers = [...allUsers, ...(data?.items || [])];
            hasMore = data?.items?.length === 20; // ถ้าจำนวนที่ดึงมาเท่ากับ limit แสดงว่ายังมีข้อมูลเหลือ
            currentPage++;
          } catch {
            hasMore = false;
          }
        }

        setUserList(allUsers); // เก็บข้อมูลทั้งหมด
        setDisplayedUsers(allUsers.slice(0, 20)); // แสดงผลแค่ 20 รายการแรก
        setUserListLoading(false);
      };

      fetchAllUsers();
    }
  }, [adminMode, adminTab]);

  // ฟังก์ชันสำหรับการค้นหา
  const handleSearch = (searchPhone: string) => {
    setPhone(searchPhone); // อัปเดตเบอร์โทรที่ค้นหา
    const filteredUsers = userList.filter(user =>
      user.phone?.includes(searchPhone.trim())
    );
    setDisplayedUsers(filteredUsers.slice(0, 20)); // แสดงผลเฉพาะ 20 รายการแรกที่ตรงกับการค้นหา
    setCurrentPage(1); // รีเซ็ตหน้าเป็นหน้าแรก
  };

  // ฟังก์ชันสำหรับเปลี่ยนหน้า pagination
  const handlePageChange = (page: number) => {
    const startIndex = (page - 1) * 20;
    const endIndex = startIndex + 20;
    const filteredUsers = userList.filter(user =>
      phone.trim() === '' ? true : user.phone?.includes(phone.trim())
    );
    setDisplayedUsers(filteredUsers.slice(startIndex, endIndex)); // อัปเดตข้อมูลที่แสดงผล
    setCurrentPage(page);
  };
  const generatePagination = (totalPages: number, currentPage: number) => {
    const pagination = [];
    const maxVisiblePages = 2; // จำนวนหน้าที่แสดงผลก่อนและหลังหน้าปัจจุบัน

    if (totalPages <= 6) {
      // กรณีที่จำนวนหน้าทั้งหมด <= 6 แสดงทุกหน้า
      for (let i = 1; i <= totalPages; i++) {
        pagination.push(i);
      }
    } else {
      // กรณีที่จำนวนหน้ามากกว่า 6
      if (currentPage <= maxVisiblePages + 1) {
        // แสดงหน้าแรก ๆ
        for (let i = 1; i <= maxVisiblePages + 2; i++) {
          pagination.push(i);
        }
        pagination.push('...');
        pagination.push(totalPages);
      } else if (currentPage >= totalPages - maxVisiblePages) {
        // แสดงหน้าสุดท้าย
        pagination.push(1);
        pagination.push('...');
        for (let i = totalPages - (maxVisiblePages + 1); i <= totalPages; i++) {
          pagination.push(i);
        }
      } else {
        // แสดงหน้าตรงกลาง
        pagination.push(1);
        pagination.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pagination.push(i);
        }
        pagination.push('...');
        pagination.push(totalPages);
      }
    }

    return pagination;
  };

  async function handleCreateReward() {
    const dataToSend = { ...couponData };
    // 1. Validation เช็คชื่อ, แต้ม, และประเภท
    if (!couponData.title.trim()) {
      alert('กรุณากรอกชื่อคูปอง');
      return;
    }
    if (couponData.pointCost < 0) {
      alert('กรุณากรอกแต้มที่ต้องใช้ (ต้องมากกว่า 0)');
      return;
    }
    if (!couponData.type) {
      alert('กรุณาเลือกประเภทคูปอง');
      return;
    }
    // 2. เช็คกรณีประเภทเป็น discount
    if (couponData.type === 'discount') {
      if (!couponData.discountAmount || couponData.discountAmount <= 0) {
        alert('กรณีประเภทส่วนลด (discount) ต้องระบุจำนวนส่วนลดที่มากกว่า 0');
        return;
      }
    }
    // Remove redemptionLimitPerUser if "ไม่จำกัด" is selected
    if (dataToSend.redemptionLimitPerUser === '') {
      delete dataToSend.redemptionLimitPerUser;
    }

    try {
      // Send data to backend or perform the creation logic
      await createReward(dataToSend);
      alert('สร้างคูปองเรียบร้อยแล้ว');

      // Reset couponData
      setCouponData({
        title: '',
        description: '',
        pointCost: 0,
        type: 'item',
        discountAmount: undefined,
        redemptionLimitPerUser: '',
        imageUrl: '',
      });
      setImageUrl(null);

      setAvailableRewardsPage(1); // รีเซ็ตไปหน้าแรกเพื่อให้เห็นคูปองใหม่ล่าสุด
      fetchAllRewards();
    } catch (error) {
      alert('ไม่สามารถสร้างคูปองได้ กรุณาลองใหม่');
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      onScroll={({ nativeEvent }) => {

        // แก้ไขเงื่อนไขตรงนี้: ให้ทำงานเฉพาะ User Mode เท่านั้น
        if (!adminMode && activeTab === 'rewards') {
          const isCloseToBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y
            >= nativeEvent.contentSize.height - 100;

          if (isCloseToBottom) {
            loadMoreAvailableRewards();
          }
        }
      }}
    >
      <LinearGradient
        colors={['#eef9ff', '#f0faff', '#c1ced2']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.container}>
        <LinearGradient
          colors={['#eef9ff', '#f0faff', '#c1ced2']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Header with AdminMode button */}
        <View style={styles.headerRow}>
          {/* <Text style={styles.header}>แต้มของฉัน</Text> */}
          {user?.user?.role === "admin" && (
            <>
              <TouchableOpacity
                style={styles.adminBtn}
                onPress={() => setAdminMode(m => !m)}
              >
                <Text style={styles.adminBtnText}>{adminMode ? 'User Mode' : 'Admin Mode'}</Text>
              </TouchableOpacity>
              {adminMode && (
                <View style={styles.navBar}>
                  <TouchableOpacity
                    style={[styles.navBarButton, adminTabMode === 'pointReward' && styles.navBarButtonActive]}
                    onPress={() => setAdminTabMode('pointReward')}
                  >
                    <Text style={[styles.navBarButtonText, adminTabMode === 'pointReward' && styles.navBarButtonTextActive]}>
                      PointReward
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navBarButton, adminTabMode === 'redeem' && styles.navBarButtonActive]}
                    onPress={() => setAdminTabMode('redeem')}
                  >
                    <Text style={[styles.navBarButtonText, adminTabMode === 'redeem' && styles.navBarButtonTextActive]}>
                      Redeem
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
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


            <View style={styles.userTabRow}>
              <TouchableOpacity
                onPress={() => scrollToTab('rewards')} // ส่งค่าตรงๆ
                style={[styles.userTabBtn, activeTab === 'rewards' && styles.userTabBtnActive]}
              >
                <Text style={[styles.userTabLabel, activeTab === 'rewards' && styles.userTabLabelActive]}>
                  Rewards
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => scrollToTab('history')} // ส่งค่าตรงๆ
                style={[styles.userTabBtn, activeTab === 'history' && styles.userTabBtnActive]}
              >
                <Text style={[styles.userTabLabel, activeTab === 'history' && styles.userTabLabelActive]}>
                  ประวัติ
                </Text>
              </TouchableOpacity>
            </View>


            {/* ส่วนเนื้อหาที่เปลี่ยนตาม Tab */}
            <View style={styles.tabContent}>
              {activeTab === 'rewards' ? (
                <View>
                  {/* Section: Reward ของฉัน */}

                  <View style={styles.filterRow}>
                    <Text style={styles.sectionHeader}>Reward ของฉัน</Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={selectedStatus}
                        onValueChange={(itemValue: any) => setSelectedStatus(itemValue)}
                        style={styles.statusPicker}
                      >
                        <Picker.Item label="ใช้งานได้ (Active)" value="active" />
                        <Picker.Item label="ใช้แล้ว (Used)" value="used" />
                        <Picker.Item label="หมดอายุ (Expired)" value="expired" />
                        <Picker.Item label="ทั้งหมด" value="all" />
                      </Picker>
                    </View>
                  </View>
                  {loadingMyRewards && myRewards.length === 0 ? (
                    <View style={{ flexDirection: 'row' }}>
                      <RewardOwnedSkeleton />
                      <RewardOwnedSkeleton />
                      <RewardOwnedSkeleton />
                    </View>
                  ) : (
                    <FlatList
                      horizontal
                      data={myRewards}
                      keyExtractor={(item, index) => `${item.id}-${index}`}
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <RewardCard
                          item={{
                            title: item.reward.title,
                            points: item.pointsUsed,
                            expiry: new Date(item.expireAt).toLocaleDateString(),
                            shortCode: item.shortCode,
                            status: item.status,
                            fullCode: item.fullCode,
                            imageUrl: item.imageUrl,
                            ...item.reward,
                          }}
                          mode="owned"
                          onRefreshMyRewards={fetchMyRedemptions}
                        />
                      )}
                      // ส่วนสำคัญสำหรับการทำ Infinite Scroll
                      onEndReached={loadMoreMyRewards}
                      onEndReachedThreshold={0.3} // เลื่อนถึง 30% ของตัวสุดท้ายให้โหลดเลย
                      ListFooterComponent={() => (
                        // ตัวหมุนโหลดเล็กๆ ตอนท้ายลิสต์แนวนอน
                        (loadingMyRewards && myRewards.length > 0) ? (
                          <View style={{ justifyContent: 'center', paddingHorizontal: 10 }}>
                            <ActivityIndicator size="small" color="#0a65ae" />
                          </View>
                        ) : null
                      )}
                      contentContainerStyle={{ paddingBottom: 4 }}
                    />
                  )}
                  {/* Section: แลกของรางวัล */}
                  <Text style={[styles.sectionHeader, { marginTop: 18 }]}>แลกของรางวัล✨</Text>

                  <View style={styles.verticalList}>
                    {/* แสดงรายการที่มีอยู่เสมอ */}
                    {availableRewards.map((item, index) => (
                      <RewardCard
                        key={`${item.id}-${index}`}
                        item={item}
                        mode="available"
                        onRedeemReward={handleRedeemReward}
                        onRefreshAvailableRewards={fetchAllRewards}
                        // ใช้ค่าจาก Backend แทนการคำนวณเอง
                        currentRedeemedCount={item.userRedemptionStats?.redeemedCount || 0}
                        redemptionLimit={item.userRedemptionStats?.limitPerUser || item.redemptionLimitPerUser}
                        canRedeem={item.userEligibility?.canRedeem ?? true} // ถ้าไม่มีข้อมูล ให้ถือว่าแลกได้ไว้ก่อน (หรือเช็คตามความเหมาะสม)
                        reasons={item.userEligibility?.reasons || []}
                        userBalance={item.userEligibility?.userBalance || point?.balance || 0}
                        adminMode={adminMode}
                        userList={userList} // <--- ต้องส่งอันนี้ลงไปด้วยเพื่อให้ Modal ใน Card รู้จักรายชื่อคน

                      />
                    ))}

                    {/* แสดงตัวโหลด (Spinner) ต่อท้ายเมื่อกำลังโหลดหน้าใหม่ */}
                    {loadingAvailableRewards && (
                      <View>
                        <RewardSkeleton />
                        <RewardSkeleton />
                        <RewardSkeleton />
                      </View>
                    )}

                    {/* แสดงข้อความเมื่อโหลดจนครบหมดแล้ว */}
                    {!hasMoreAvailableRewards && availableRewards.length > 0 && (
                      <Text style={{ textAlign: 'center', color: '#999', marginVertical: 20, fontFamily: 'Prompt-Regular' }}>
                        — คุณดูทั้งหมดแล้ว —
                      </Text>
                    )}

                    {/* แสดงข้อความกรณีไม่มีข้อมูลเลยจริงๆ */}
                    {!loadingAvailableRewards && availableRewards.length === 0 && (
                      <Text style={styles.emptyText}>ไม่มีรางวัลที่พร้อมแลก</Text>
                    )}
                  </View>
                </View>
              ) : (
                // --- เนื้อหาหน้า ประวัติ (โค้ดเดิมของคุณ) ---
                <>
                  <Text style={styles.historyHeader}>ประวัติการรับ/ใช้แต้ม</Text>
                  <View style={styles.historyList}>
                    {loading ? (
                      <Text style={styles.emptyText}>กำลังโหลด...</Text>
                    ) : displayedHistory.length === 0 ? (
                      <Text style={styles.emptyText}>ไม่มีประวัติ</Text>
                    ) : (
                      displayedHistory.map(item => {
                        const isDebit = item.action === 'debit';
                        return (
                          <View key={item.id} style={styles.historyItem}>
                            <Text style={styles.historyDesc}>{item.reason || item.refType}</Text>
                            <Text
                              style={[
                                styles.historyPoints,
                                isDebit && { color: '#D32F2F' }
                              ]}
                            >
                              {isDebit ? `-${Math.abs(item.amount)}` : `+${item.amount}`}
                            </Text>
                            <Text style={styles.historyDate}>
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : ''}
                            </Text>
                          </View>
                        );
                      })
                    )}
                  </View>

                  {/* Pagination สำหรับหน้าประวัติ */}
                  <View style={styles.pagination}>
                    {Math.ceil(history.length / 20) > 1 &&
                      generatePagination(Math.ceil(history.length / 20), currentHistoryPage).map((page, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.pageButton,
                            currentHistoryPage === page && styles.pageButtonActive,
                          ]}
                          onPress={() => typeof page === 'number' && handleHistoryPageChange(page)}
                        >
                          <Text style={styles.pageButtonText}>{page}</Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}
            </View>
          </>
        ) : (
          <>
            {adminTabMode === 'pointReward' ? (
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
                          handleSearch(val)
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
                      displayedUsers
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
                              <Text style={[styles.tableCell, { flex: 2 }]}>
                                {user.email?.includes('lineaccount.temp.mumyapharmacy.app')
                                  ? 'From LINE'
                                  : user.email || '-'}
                              </Text>
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
                              </View>
                            </View>
                          </TouchableOpacity>

                        ))

                    )}
                    <View style={styles.pagination}>
                      {Math.ceil(userList.length / 20) > 1 &&
                        generatePagination(Math.ceil(userList.length / 20), currentPage).map((page, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.pageButton,
                              currentPage === page && styles.pageButtonActive,
                            ]}
                            onPress={() => typeof page === 'number' && handlePageChange(page)}
                          >
                            <Text style={styles.pageButtonText}>{page}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
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
                      displayedAdminHistory.map(item => (
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
                    <View style={styles.pagination}>
                      {Math.ceil(adminHistory.length / 20) > 1 && // เปลี่ยนจาก 5 เป็น 20
                        generatePagination(Math.ceil(adminHistory.length / 20), currentAdminHistoryPage).map((page, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.pageButton,
                              currentAdminHistoryPage === page && styles.pageButtonActive,
                            ]}
                            onPress={() => typeof page === 'number' && handleAdminHistoryPageChange(page)}
                          >
                            <Text style={styles.pageButtonText}>{page}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.container}>

                {/* --- เพิ่มส่วนกรอกโค้ดด้านบนสุด (ตามรูป 6e38ff) --- */}
                <View style={styles.receivedCodeContainer}>
                  <Text style={styles.receivedCodeLabel}>กรอกโค้ดที่ได้รับ</Text>
                  <View style={styles.receivedCodeRow}>
                    <TextInput
                      style={styles.receivedCodeInput}
                      placeholder="กรอกโค้ด 6 หลัก ที่นี่..."
                      value={receivedCode}
                      onChangeText={setReceivedCode}
                    />
                    <TouchableOpacity
                      style={styles.useCouponBtn}
                      onPress={() => {
                        if (!receivedCode) {
                          alert('กรุณากรอกโค้ด');
                          return;
                        }
                        handleVerifyCode(receivedCode); // เรียกฟังก์ชันตรวจสอบโค้ด
                      }}
                    >
                      <Text style={styles.useCouponBtnText}>
                        {isVerifying ? 'กำลังตรวจสอบ...' : 'ใช้คูปอง'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {/* ส่วนซ้าย-ขวา */}
                <View style={styles.topSection}>
                  {/* ซ้าย: ค้นหาและรายการคูปอง */}
                  <View style={styles.leftPane}>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="ค้นหาคูปอง"
                      value={adminSearchQuery}
                      onChangeText={(text) => {
                        setAdminSearchQuery(text); // เปลี่ยนจาก setSearchQuery
                        setSelectedType('all'); // เพิ่มบรรทัดนี้: รีเซ็ต Type เป็นทั้งหมด
                        setAvailableRewardsPage(1); // ค้นหาแล้วให้กลับไปหน้า 1 เสมอ
                      }}
                    />
                    {/* --- ส่วน Category Filter ที่เพิ่มใหม่ --- */}
                    <View style={styles.categoryRow}>
                      {['all', 'item', 'discount', 'special'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.categoryBtn,
                            selectedType === type && styles.categoryBtnActive
                          ]}
                          onPress={() => {
                            setSelectedType(type);
                            setAvailableRewardsPage(1); // รีเซ็ตหน้าเมื่อเปลี่ยนหมวด
                          }}
                        >
                          <Text style={[
                            styles.categoryBtnText,
                            selectedType === type && styles.categoryBtnTextActive
                          ]}>
                            {type === 'all' ? 'ทั้งหมด' : type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* ห่อ ScrollView กับ Pagination ไว้ด้วยกัน */}
                    <View style={{ flex: 1 }}>
                      <ScrollView style={styles.couponList}>
                        {filteredCoupons.map((item, index) => (
                          <RewardCard
                            key={`${item.id}-${index}`}
                            item={item}
                            mode="available"
                            onRedeemReward={handleRedeemReward}
                            currentRedeemedCount={getRedeemedCount(item.title)}
                            userBalance={point?.balance || 0}
                            adminMode={true} // เพิ่ม prop นี้เพื่อบอกว่าเป็นโหมด Admin
                            onDeleteReward={handleDeleteReward}
                            onSendGift={handleSendGift}
                            userList={userList}
                          />
                        ))}

                        {availableRewards.length === 0 && !loadingAvailableRewards && (
                          <Text style={{ textAlign: 'center', color: '#999', marginTop: 20, fontFamily: 'Prompt-Regular' }}>
                            ไม่พบรายการคูปอง
                          </Text>
                        )}

                        {loadingAvailableRewards && (
                          <ActivityIndicator size="small" color="#0a65ae" style={{ marginTop: 10 }} />
                        )}
                      </ScrollView>

                      {/* --- แถบเลขหน้าสำหรับหน้า Admin --- */}
                      <View style={[styles.pagination, { paddingVertical: 10 }]}>
                        {totalAvailablePages > 1 &&
                          generatePagination(totalAvailablePages, availableRewardsPage).map((page, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.pageButton,
                                availableRewardsPage === page && styles.pageButtonActive,
                              ]}
                              onPress={() => typeof page === 'number' && setAvailableRewardsPage(page)}
                            >
                              <Text style={styles.pageButtonText}>{page}</Text>
                            </TouchableOpacity>
                          ))
                        }
                      </View>
                    </View>
                  </View>

                  {/* ขวา: ฟอร์มการสร้างคูปอง */}
                  <View style={styles.rightPane}>
                    <Text style={styles.formTitle}>สร้างคูปอง</Text>

                    <View style={styles.formBody}>
                      {/* ฝั่งซ้ายของฟอร์ม: รูปภาพ */}
                      <View style={styles.imagePreviewContainer}>
                        {imageUrl ? (
                          <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                        ) : (
                          <View style={styles.imagePlaceholder}>
                            <Text style={styles.imagePlaceholderText}>เลือกรูปภาพ</Text>
                          </View>
                        )}
                        <View style={styles.uploadContainer}>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={styles.fileInput}
                          />
                        </View>
                      </View>

                      {/* ฝั่งขวาของฟอร์ม: ข้อมูล Text */}
                      <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>ชื่อคูปอง:<Text style={{ color: 'red' }}> *</Text></Text>
                        <TextInput
                          style={styles.input}
                          placeholder="title"
                          value={couponData.title}
                          onChangeText={(text) => setCouponData({ ...couponData, title: text })}
                        />

                        <Text style={styles.inputLabel}>คำอธิบาย:</Text>
                        <TextInput
                          style={[styles.input, { height: 40 }]}
                          placeholder="description"
                          multiline
                          value={couponData.description}
                          onChangeText={(text) => setCouponData({ ...couponData, description: text })}
                        />

                        <View style={styles.rowInputs}>
                          <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.inputLabel}>จำนวนการแลก</Text>

                            <TextInput
                              style={styles.input}
                              placeholder="ไม่มีกำหนด"
                              keyboardType="numeric"
                              value={couponData.redemptionLimitPerUser?.toString() || ''}
                              onChangeText={(val) => {
                                if (val.trim() === '') {
                                  setCouponData({ ...couponData, redemptionLimitPerUser: '' });
                                } else {
                                  const numericValue = parseInt(val, 10);
                                  if (!isNaN(numericValue)) {
                                    setCouponData({ ...couponData, redemptionLimitPerUser: numericValue });
                                  }
                                }
                              }}
                            />

                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inputLabel}>แต้มที่ต้องใช้<Text style={{ color: 'red' }}> *</Text></Text>
                            <TextInput
                              style={styles.input}
                              placeholder="pointCost"
                              keyboardType="numeric"
                              value={couponData.pointCost.toString()}
                              onChangeText={(text) => setCouponData({ ...couponData, pointCost: parseInt(text) || 0 })}
                            />
                          </View>
                        </View>

                        <Text style={styles.inputLabel}>ประเภท: (จะมี discount, item, special)<Text style={{ color: 'red' }}> *</Text></Text>
                        <Picker
                          selectedValue={couponData.type}
                          onValueChange={(value) => setCouponData({ ...couponData, type: value })}
                          style={styles.input}
                        >
                          <Picker.Item label="item" value="item" />
                          <Picker.Item label="discount" value="discount" />
                          <Picker.Item label="special" value="special" />
                        </Picker>

                        {couponData.type === 'discount' && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.inputLabel}>
                              จำนวนส่วนลด:<Text style={{ color: 'red' }}> *</Text>
                            </Text>
                            <TextInput
                              style={styles.input}
                              placeholder="ระบุจำนวนเงินส่วนลด"
                              keyboardType="numeric"
                              value={couponData.discountAmount?.toString() || ''}
                              onChangeText={(text) => setCouponData({ ...couponData, discountAmount: parseInt(text) || 0 })}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={styles.createBtnWrapper}>
                      <TouchableOpacity
                        style={styles.clearBtn}
                        onPress={() => {
                          setCouponData({
                            title: '',
                            description: '',
                            pointCost: 0,
                            type: 'item',
                            discountAmount: undefined,
                            redemptionLimitPerUser: '',
                            imageUrl: '',
                          });
                          setImageUrl(''); // รีเซ็ต imageUrl ใน state
                        }}
                      >
                        <Text style={styles.clearBtnText}>เคลียร์</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.createButton} onPress={handleCreateReward}>
                        <Text style={styles.createButtonText}>สร้าง</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

              </View>

            )}
            <Modal
              visible={modalVisible}
              animationType="fade"
              transparent={true}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  {redemptionData ? (
                    <>
                      <Text style={[styles.modalTitle, { marginBottom: 15 }]}>ยืนยันการใช้สิทธิ์</Text>

                      <View style={{ width: 100, height: 100, marginBottom: 15, borderRadius: 10, overflow: 'hidden' }}>
                        <Image
                          source={{ uri: redemptionData.imageUrl || 'https://cdn.kasidate.me/images/a6b70c7c88f54c3afbed800483c330fb188534056d571e98c4c0b65d8dfedd4c.png' }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                      </View>

                      <Text style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'Prompt-Bold' }}>{redemptionData.title}</Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Prompt-Regular' }}>{redemptionData.description}</Text>

                      {/* --- ส่วนที่ปรับปรุงใหม่: แสดงข้อมูลผู้ใช้ --- */}
                      <View style={{ alignItems: 'center', marginVertical: 10 }}>
                        <Text style={{ color: '#333', fontSize: 16, fontFamily: 'Prompt-Bold' }}>
                          ผู้ใช้: {redemptionData.user?.name || 'ไม่ระบุชื่อ'}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 14, fontFamily: 'Prompt-Regular' }}>
                          เบอร์โทร: {redemptionData.user?.phone || 'ไม่ระบุเบอร์'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, color: '#E91E63', fontWeight: 'bold', fontFamily: 'Prompt-Bold' }}>
                        แต้มที่หักไป: {redemptionData.pointsUsed} P
                      </Text>

                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 25 }}>
                        <TouchableOpacity
                          onPress={() => setModalVisible(false)}
                          style={[styles.confirmButton, { backgroundColor: '#ccc' }]}
                        >
                          <Text style={styles.confirmButtonText}>ยกเลิก</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleUseRedemptionCode(receivedCode)}
                          style={styles.confirmButton}
                        >
                          <Text style={styles.confirmButtonText}>ยืนยันการแลก</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <ActivityIndicator size="large" color="#E91E63" />
                  )}
                </View>
              </View>
            </Modal>
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
    fontFamily: 'Prompt-Bold',
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
    fontFamily: 'Prompt-Regular',
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
    fontFamily: 'Prompt-Bold',
  },
  historyHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 4,
    fontFamily: 'Prompt-Bold',
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
    fontFamily: 'Prompt-Bold',
  },
  historyPoints: {
    fontSize: 14,
    color: '#00796B',
    marginBottom: 2,
    fontFamily: 'Prompt-Regular',
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Prompt-Regular',
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
    fontFamily: 'Prompt-Bold',
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
    fontFamily: 'Prompt-Regular',
  },
  picker: {
    flex: 1,
    height: 40,
    padding: 4,
    fontFamily: 'Prompt-Regular',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    backgroundColor: '#fafafa',
    marginBottom: 4,
    fontFamily: 'Prompt-Regular',
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
    fontFamily: 'Prompt-Bold',
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
    fontFamily: 'Prompt-Bold',
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
    fontFamily: 'Prompt-Regular',
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
    fontFamily: 'Prompt-Regular',
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
    fontFamily: 'Prompt-Bold',
  },
  tabBtnTextActive: {
    color: '#fff',
    fontFamily: 'Prompt-Bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  pageButton: {
    padding: 8,
    marginHorizontal: 4,
    backgroundColor: '#eee',
    borderRadius: 4,
  },
  pageButtonActive: {
    backgroundColor: '#E91E63',
  },
  pageButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  userTabRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    padding: 4,
  },
  userTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  userTabBtnActive: {
    backgroundColor: '#fff', // สีขาวตัดกับพื้นเทา ดูสะอาดตา
    elevation: 2,
  },
  userTabLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
    color: '#757575',
  },
  userTabLabelActive: {
    color: '#0a65aeff', // สีฟ้าเดียวกับตัวเลขแต้ม
  },
  tabContent: {
    paddingHorizontal: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
    fontSize: 16,
    fontFamily: 'Prompt-Regular',
  },
  // --- Styles สำหรับ RewardCard ---
  cardOwned: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#000',
    overflow: 'hidden'
  },
  cardAvailable: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 10,

    minHeight: 125, // เปลี่ยนจาก height เป็น minHeight
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // ลดความเข้มลงนิดนึงให้ดูคลีน
    shadowRadius: 10,
    overflow: 'hidden', // กันรูปภาพล้นขอบโค้ง
  },
  // 1.1 ส่วนรูปภาพ (ซ้าย)
  imageWrapperHorizontal: {
    width: 110,
    height: '100%',
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
  },
  imageHorizontal: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // 2. ส่วนรอยเจาะตั๋ว (เส้นคั่นกลาง)
  ticketDividerContainer: {
    width: 20,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', // สีเดียวกับพื้นหลัง Card
  },
  // punchHoleTop: {
  //   position: 'absolute',
  //   top: -12,
  //   width: 24,
  //   height: 24,
  //   borderRadius: 12,
  //   borderBottomColor: '#ddd',
  //   // เปลี่ยนจาก #F5F5F5 เป็นสีพื้นหลังหน้าจอของคุณ
  //   // ถ้าใช้ Gradient ให้เลือกสีที่อยู่ตรงตำแหน่งนั้นๆ ครับ
  //   backgroundColor: '#fff',
  // },
  // punchHoleBottom: {
  //   position: 'absolute',
  //   bottom: -12,
  //   width: 24,
  //   height: 24,
  //   borderRadius: 12,
  //   backgroundColor: '#fff', // สีเดียวกับข้างบน
  //   borderTopColor: '#ddd',
  // },
  dashDivider: {
    height: '100%', // ไม่ให้เส้นประติดขอบวงกลมเกินไป
    width: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },

  // 1.2 ส่วนข้อมูล (กลาง)
  cardContentHorizontal: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Prompt-Bold',
    flex: 1,
    marginRight: 4,
  },
  cardPointsHighlight: {
    fontSize: 18,
    color: '#1e88e5',
    fontFamily: 'Prompt-Bold',
  },
  cardDetail: {
    fontSize: 12,
    color: '#777',
    fontFamily: 'Prompt-Regular',
    marginVertical: 2,
  },
  limitText: {
    fontSize: 11,
    color: '#1e88e5',
    fontWeight: '600',
    fontFamily: 'Prompt-Regular',
  },

  // 1.3 ส่วนปุ่มแลก (ขวา)
  absoluteActionWrapper: {
    position: 'absolute',
    right: 12, // ระยะห่างจากขอบขวาของการ์ด
    top: 0,
    bottom: 0,
    justifyContent: 'center', // จัดให้อยู่กึ่งกลางแนวตั้งทับเนื้อหา
    alignItems: 'center',
    zIndex: 10, // ให้มั่นใจว่าปุ่มอยู่บนสุด
  },

  // ปรับความกว้างปุ่มให้เป็นแคปซูลสั้นๆ ตามรูป
  horizontalGradientBtn: {
    width: 65, // กำหนดความกว้างที่แน่นอน
    height: 35,
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4, // เพิ่มเงาให้ปุ่มดูลอยเด่นขึ้นมาเหนือเนื้อหา
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  horizontalGradientPadding: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  giftLabelAdmin: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#E91E63',
    fontFamily: "Prompt-Regular"
  },
  horizontalActionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  disabledBtn: {
    backgroundColor: '#eee',
    borderRadius: 20,
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // imagePlaceholder: {
  //   height: 100,
  //   backgroundColor: '#fff',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   borderBottomWidth: 1,
  //   borderColor: '#000',
  //   margin: 8,
  //   borderRadius: 10
  // },
  imagePlaceholderHorizontal: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 10
  },
  placeholderText: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  cardContent: { padding: 10, alignItems: 'flex-start' },
  // cardContentHorizontal: { flex: 1, paddingLeft: 15, flexDirection: 'row', alignItems: 'center' },
  // cardTitle: { fontSize: 14, fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  // cardDetail: { fontSize: 12, color: '#666', fontFamily: 'Prompt-Regular' },
  cardType: { fontSize: 10, color: '#666', marginTop: 4, fontFamily: 'Prompt-Regular' },
  cardPoints: { fontSize: 16, fontWeight: 'bold', marginVertical: 4, fontFamily: 'Prompt-Bold' },
  cardPointsSmall: { fontSize: 14, fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, fontFamily: 'Prompt-Bold' },
  horizontalScroll: { marginBottom: 10 },
  useBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 8,
    alignItems: 'center',
    marginVertical: 5
  },
  useBtnText: { fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  expiryText: { fontSize: 10, color: '#666', marginTop: 5, width: '100%', textAlign: 'center', fontFamily: 'Prompt-Regular' },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeBtn: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  exchangeBtnText: { fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  durationText: { fontSize: 10, color: '#666', marginTop: 5, fontFamily: 'Prompt-Regular' },
  verticalList: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, fontFamily: 'Prompt-Bold' },
  modalSubtitle: { fontSize: 16, color: 'gray', marginBottom: 20, fontFamily: 'Prompt-Regular' },
  shortCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    marginBottom: 20,
  },
  shortCodeText: { fontSize: 18, flex: 1, fontFamily: 'Prompt-Bold', textAlign: 'center' },
  copyBtn: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  copyBtnText: { color: 'white', fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  modalNote: { fontSize: 14, color: 'gray', marginBottom: 20, fontFamily: 'Prompt-Regular' },
  closeBtn: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontFamily: 'Prompt-Bold' },
  loadingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Prompt-Regular',
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginVertical: 10,
    textAlign: 'center',
    fontFamily: 'Prompt-Bold',
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    fontFamily: 'Prompt-Bold',
  },
  confirmInfoBox: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  confirmItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a65ae',
    marginBottom: 5,
    fontFamily: 'Prompt-Bold',
  },
  confirmItemDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'Prompt-Regular',
  },
  confirmPointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  confirmPointLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Prompt-Bold',
  },
  confirmPointValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E91E63',
    fontFamily: 'Prompt-Bold',
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#666',
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E91E63',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  limitText: {
    fontSize: 12,
    color: '#0a65aeff',
    fontWeight: 'bold',
    marginTop: 2,
    fontFamily: 'Prompt-Bold',
  },
  disabledBtn: {
    backgroundColor: '#e0e0e0',
    borderColor: '#ccc',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 12,         // ทำมุมโค้งมนแบบแคปซูล
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',  // พื้นหลังขาว
    alignSelf: 'flex-end',    // ชิดขวาตามตำแหน่งเดิมในโค้ดคุณ
  },
  navBarButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderBottomWidth: 2,     // เตรียมพื้นที่สำหรับเส้นใต้
    borderBottomColor: 'transparent', // ปกติให้สีโปร่งใสไว้
  },
  navBarButtonActive: {
    borderBottomColor: '#E91E63', // เมื่อ active ให้เปลี่ยนเส้นใต้เป็นสีแดง
  },
  navBarButtonText: {
    fontSize: 15,
    color: '#000',            // ข้อความปกติสีดำ
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  navBarButtonTextActive: {
    color: '#E91E63',             // ข้อความเมื่อเลือกสีแดง
    fontFamily: 'Prompt-Bold',
  },
  redeemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionSection: {
    flex: 1,
    marginRight: 20,
  },
  redeemListSection: {
    flex: 2,
  },
  redeemTabs: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  redeemTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  redeemTabActive: {
    backgroundColor: '#E91E63',
  },
  redeemTabText: {
    color: '#333',
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  redeemTabTextActive: {
    color: '#fff',
    fontFamily: 'Prompt-Bold',
  },
  redeemList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  redeemItem: {
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  redeemItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  redeemButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  redeemButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  leftPane: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 2,
  },
  rightPane: {
    flex: 1.2, // ปรับขนาดตามความเหมาะสม
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginLeft: 10,
    elevation: 2,
  },
  formBody: {
    flexDirection: 'row',
  },
  imageSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  imagePreviewBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholderText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Prompt-Bold',
  },
  inputSection: {
    flex: 1.5,
    paddingLeft: 15,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
    fontFamily: 'Prompt-Bold',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Prompt-Bold',
  },
  createBtnWrapper: {
    justifyContent: 'flex-end',
    marginTop: 15,
    flexDirection: 'row',
    gap: 10,
  },
  createButton: {
    backgroundColor: '#E91E63',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Prompt-Bold',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
    fontFamily: 'Prompt-Regular',
  },
  couponList: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  couponItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  couponDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Prompt-Regular',
  },
  addButton: {
    backgroundColor: '#E91E63',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'Prompt-Bold',
  },

  bottomSection: {
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  imagePlaceholderText: {
    color: '#aaa',
    fontSize: 14,
    fontFamily: 'Prompt-Regular',
  },
  uploadContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  fileInput: {
    marginTop: 8,
    fontFamily: 'Prompt-Regular',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // สำหรับ expo-image ใช้ contentFit แทน resizeMode
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  categoryBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 20,           // ทรงแคปซูล
    backgroundColor: '#eee',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    fontFamily: 'Prompt-Bold',
  },
  categoryBtnActive: {
    backgroundColor: '#E91E63', // สีชมพูแดงตามธีมคุณ
    borderColor: '#E91E63',
  },
  categoryBtnText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'capitalize', // ให้ตัวแรกเป็นตัวพิมพ์ใหญ่ (Item, Discount)
    fontFamily: 'Prompt-Bold',
  },
  categoryBtnTextActive: {
    color: '#fff',
    fontFamily: 'Prompt-Bold',
  },
  deleteBadge: {
    position: 'absolute',
    top: -8,      // ดันขึ้นไปนอกกรอบบน
    right: -8,    // ดันออกไปนอกกรอบขวา
    backgroundColor: '#D32F2F',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,       // ให้เงาสูงกว่าปกติเพื่อไม่ให้กลืนไปกับพื้นหลัง
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    zIndex: 9999,        // มั่นใจว่าอยู่บนสุดแน่นอน
  },
  deleteBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  giftModalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  giftModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
    fontFamily: 'Prompt-Bold',
  },
  giftInfoBox: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  giftItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'Prompt-Bold',
  },
  giftItemDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontFamily: 'Prompt-Regular',
  },
  dottedLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ccc',
    marginTop: 5,
  },
  giftInputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontFamily: 'Prompt-Bold',
  },
  giftInput: {
    width: '100%',
    height: 45,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    paddingHorizontal: 15,
    marginBottom: 30,
    fontSize: 16,
    fontFamily: 'Prompt-Regular',
  },
  giftBtnWrapper: {
    width: '100%',
    alignItems: 'flex-end',
  },
  giftSendBtn: {
    backgroundColor: '#E91E63',

    paddingVertical: 10,
    paddingHorizontal: 35,
    borderRadius: 15,

  },
  giftSendBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Prompt-Bold',

  },
  receivedCodeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  receivedCodeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    fontFamily: 'Prompt-Bold',
  },
  receivedCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receivedCodeInput: {
    flex: 1,           // ให้ Input ยืดเต็มพื้นที่ที่เหลือ
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#fafafa',
    fontSize: 16,
    fontFamily: 'Prompt-Regular',
  },
  useCouponBtn: {
    backgroundColor: '#E91E63', // สีชมพูแดงตามธีม
    paddingHorizontal: 25,
    height: 45,
    justifyContent: 'center',
    borderRadius: 12,           // มนๆ ตามรูป 6e38ff
  },
  useCouponBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Prompt-Bold',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    backgroundColor: '#0a65ae',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginTop: 15,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Prompt-Bold',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
    width: 150, // ปรับขนาดตามความเหมาะสม
    height: 40,
    justifyContent: 'center',
  },
  statusPicker: {
    height: 40,
    width: '100%',
    fontFamily: 'Prompt-Regular',
    borderRadius: 6,
    paddingLeft: 8,
  },

  suggestionList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    maxHeight: 150,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionListContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: -25, // ให้แนบชิดกับ TextInput ด้านบน (ถ้าต้องการ)
    marginBottom: 20,
    width: '100%',
    maxHeight: 200, // กันยาวเกินไปจนทับปุ่มส่ง
    overflow: 'hidden',
  },
  suggestionCard: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  suggestionNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'Prompt-Bold',
  },
  suggestionPhoneText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Prompt-Regular',
  },
  ticketWrapper: {
    marginRight: 15,
    marginBottom: 10,
  },
  ticketContainer: {
    width: 170,              // ปรับความกว้างตามที่ต้องการได้เลย (เช่น 180, 220, 250)
    aspectRatio: 200 / 350,   // ระบบจะคำนวณความสูงให้เองอัตโนมัติรักษาสัดส่วนเดิมเป๊ะ
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketTopSection: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  ticketImage: {
    width: '100%',
    height: '100%',
    contentFit: 'contain',
  },
  punchHoleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    width: '100%',
  },
  punchHoleLeft: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#f0faff', // สีเดียวกับพื้นหลัง ScrollView
    marginLeft: -10,            // เลื่อนออกไปครึ่งวงกลม
    borderRightWidth: 1,
    borderColor: '#ddd',

  },
  punchHoleRight: {
    width: 25,
    height: 25,
    borderRadius: 15,
    backgroundColor: '#f0faff', // สีเดียวกับพื้นหลัง ScrollView
    marginRight: -10,           // เลื่อนออกไปครึ่งวงกลม
    borderLeftWidth: 1,
    borderColor: '#ddd',
  },
  ticketDashedLine: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    height: 1,
    marginHorizontal: 2,
  },
  ticketBottomSection: {
    flex: 1.5,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketTitle: {
    fontSize: 14,
    fontFamily: 'Prompt-Bold',
    textAlign: 'center',
    color: '#000',
    lineHeight: 18,
  },
  ticketDescription: {
    fontSize: 10,
    fontFamily: 'Prompt-Regular',
    textAlign: 'left',
    color: '#999',
    marginVertical: 2,
  },
  ticketActionBtn: {
    // ถอด backgroundColor ออกจากตัวปุ่ม
    // backgroundColor: '#0a65ae', 
    width: '90%',
    borderRadius: 12, // กำหนด borderRadius ที่ตัวปุ่มเพื่อให้ขอบมน
    overflow: 'hidden', // กัน Gradient เลยขอบปุ่ม
    elevation: 4, // เพิ่มเงาเล็กน้อยเพื่อให้ปุ่มดูลอยขึ้น
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  // สไตล์ใหม่สำหรับ LinearGradient
  ticketActionGradient: {
    flex: 1, // ให้ขยายเต็มพื้นที่ของปุ่ม
    paddingVertical: 12, // ปรับ paddingVertical เพื่อให้ปุ่มดูสูงขึ้น
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketActionBtnText: {
    color: '#fff',
    fontSize: 16, // เพิ่มขนาดฟอนต์เล็กน้อย
    fontFamily: 'Prompt-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)', // เพิ่มเงาที่ตัวอักษรเพื่อให้ดูคมขึ้น
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  ticketExpiryText: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'Prompt-Regular',
    marginTop: 5,
  },


  horizontalDisabledContainer: {
    backgroundColor: '#e0e0e0', // สีเทาสำหรับปุ่มปิดใช้งาน
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // horizontalActionBtnText: {
  //   color: '#fff',
  //   fontSize: 14,
  //   fontFamily: 'Prompt-Bold',
  //   // ถ้าสถานะ disabled อาจจะเปลี่ยนสีตัวอักษรเป็นสีเทาเข้ม
  // },
  expiryWarningBox: {
    backgroundColor: '#FFF5F5', // พื้นหลังชมพูอ่อนมาก
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFEBEE',
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
  },
  expiryTitle: {
    fontSize: 14,
    fontFamily: 'Prompt-Bold',
    color: '#333',
    marginBottom: 2,
  },
  expiryDetail: {
    fontSize: 13,
    fontFamily: 'Prompt-Regular',
    color: '#666',
  },
  highlightRed: {
    color: '#D32F2F', // สีแดงเข้ม
    fontFamily: 'Prompt-Bold',
    fontSize: 14,
  },
  sideActionContainer: {
    width: 55, // เพิ่มความกว้างขึ้นนิดหน่อยเพื่อให้ตัวหนังสือเอียงได้สวย    height: '100%',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  sideActionStrip: {
    width: 55, // ล็อคความกว้างไว้เลย ไม่ให้โดนบีบ
    height: '100%',
    backgroundColor: '#fff', // เพื่อให้เห็นขอบมนชัดเจน
  },
  verticalTextContainer: {
    width: 100, // กว้างกว่าแถบเพื่อให้มีพื้นที่หมุน
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // ทำขอบซ้ายให้โค้งเว้าเข้าตามรูปตั๋วที่คุณชอบ
    // borderTopLeftRadius: 25,
    // borderBottomLeftRadius: 25,
    // ขอบขวาให้มนตามกรอบนอก
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  sideGiftBtn: {
    flex: 1,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  verticalText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Prompt-Bold',
    // เทคนิคทำตัวอักษรแนวตั้ง (สำหรับภาษาไทย/อังกฤษสั้นๆ)
    textAlign: 'center',
    width: 20,
    lineHeight: 22,
  },
  verticalTextWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70, // ความกว้างหลอกเพื่อให้ Text หมุนได้ไม่หลุด
  },
  rotatedText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Prompt-Bold',
    // หมุนข้อความ 90 องศา ตัวอักษรจะไม่ซ้อนกัน
    transform: [{ rotate: '-90deg' }],
    textAlign: 'center',
    width: 120,
  },
});