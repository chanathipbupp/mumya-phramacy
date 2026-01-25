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
      <Text style={styles.dateText}>วันที่: {formatDate(date)}</Text>
      <Text style={styles.detailsText}>{details}</Text>
      {/* แสดงรายการ medicineName */}
      {medicineNames.map((name, index) => (
        <Text key={index} style={styles.medicineName}>
          - {name}
        </Text>
      ))}
        <Text style={styles.pharmacistText}>ผู้จ่ายยา: {pharmacist}</Text>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 10,
    marginBottom: 8,
    color: '#555',
  },
  pharmacistText: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#333',
    textAlign: 'right',
  },
  medicineName: {
    fontSize: 14,
    color: '#333',
    marginLeft: 16,
    marginBottom: 4,
  },
});

export default OrderItem;