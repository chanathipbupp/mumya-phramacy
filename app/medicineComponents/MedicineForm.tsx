import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

interface MedicineFormProps {
  onAddMedicine: (name: string, details: string) => void;
}

const MedicineForm: React.FC<MedicineFormProps> = ({ onAddMedicine }) => {
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');

  const handleAdd = () => {
    if (name && details) {
      onAddMedicine(name, details);
      setName('');
      setDetails('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ชื่อยา:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="ใส่ชื่อยา"
      />
      <Text style={styles.label}>รายละเอียด:</Text>
      <TextInput
        style={styles.input}
        value={details}
        onChangeText={setDetails}
        placeholder="ใส่รายละเอียด"
      />
      <Button title="เพิ่ม" onPress={handleAdd} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
});

export default MedicineForm;