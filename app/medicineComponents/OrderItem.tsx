import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface OrderItemProps {
  date: string;
  details: string;
  pharmacist: string;
  medicineNames: string[]; // เพิ่ม prop สำหรับรับ medicineName
}

const OrderItem: React.FC<OrderItemProps> = ({ date, details = 'ไม่มีรายละเอียด', pharmacist, medicineNames }) => {
  const formatDate = (dateString: string) => {
    const dateObj = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    const formattedDate = dateObj.toLocaleString('th-TH', options);
    const [datePart, timePart] = formattedDate.split(' ');
    return `${datePart} เวลา ${timePart} น.`;
  };

  return (
    <View style={styles.container}>
      {/* ส่วนบน: วันที่และรายละเอียด */}
      <View style={styles.headerSection}>
        <Text style={styles.dateText}>📅 วันที่: {formatDate(date)}</Text>
        <Text style={styles.detailsText}>{details}</Text>
      </View>

      {/* เส้นประ (Dashed Line) */}
      <View style={styles.dashedLine} />

      {/* ส่วนกลาง: รายการยา */}
      <View style={styles.medicineSection}>
        <Text style={styles.sectionTitle}>รายการยา:</Text>
        {medicineNames.map((name, index) => (
          <Text key={index} style={styles.medicineName}>
            • {name}
          </Text>
        ))}
      </View>

      {/* ส่วนล่าง: ผู้จ่ายยา */}
      <View style={styles.footerSection}>
        <View style={styles.pharmacistBadge}>
          <Text style={styles.pharmacistLabel}>ผู้จ่ายยา:</Text>
          <Text style={styles.pharmacistText}>{pharmacist}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
 container: {
    backgroundColor: '#ffffff',
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    // เงาสำหรับ iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // เงาสำหรับ Android
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  headerSection: {
    padding: 16,
    paddingBottom: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#0a65ae',
    fontFamily: 'Prompt-Bold',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#777',
    fontFamily: 'Prompt-Regular',
    lineHeight: 18,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginHorizontal: 16,
  },
  medicineSection: {
    padding: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Prompt-Bold',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 14,
    color: '#444',
    marginLeft: 4,
    marginBottom: 6,
    fontFamily: 'Prompt-Regular',
  },
  footerSection: {
    backgroundColor: '#f9fbfd',
    padding: 12,
    alignItems: 'flex-end',
  },
  pharmacistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pharmacistLabel: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'Prompt-Regular',
    marginRight: 4,
  },
  pharmacistText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'Prompt-Bold',
  },
});

export default OrderItem;