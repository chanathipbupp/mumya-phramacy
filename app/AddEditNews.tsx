import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Button, Alert, ScrollView, Platform, Image, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createNews, updateNews, getNewsBySlug, uploadFile } from '../composables/fetchAPI';
import DateTimePicker from '@react-native-community/datetimepicker';

const defaultNews = {
  _id: '',
  title: '',
  message: '',
  type: '',
  priority: '',
  isActive: true,
  isPinned: false,
  startAt: '',
  endAt: '',
  scope: [],
  channels: [],
  coverImage: '',
  linkUrl: '',
  bannerStyle: '',
  customSlug: '',
  content: { type: 'version', version: 1, content: '' },
};

export default function AddEditNews() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const slug = params.slug as string | undefined;
  const mode = params.mode === 'add' ? 'add' : 'edit';

  const [form, setForm] = useState({ ...defaultNews });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && slug) {
        setLoading(true);
        try {
          const data = await getNewsBySlug(slug);
          setForm({
            ...defaultNews,
            ...data,
            _id: data._id,
            scope: Array.isArray(data.scope) ? data.scope : [],
            channels: Array.isArray(data.channels) ? data.channels : [],
            content: data.content || defaultNews.content,
          });
        } catch (e) {
          Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลข่าวสาร');
        }
        setLoading(false);
      } else {
        setForm({ ...defaultNews });
      }
    };
    fetchData();
  }, [mode, slug]);

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (mode === 'add') {
        const { _id, ...createBody } = form;
        createBody.bannerStyle = 'banner';
        createBody.scope = ['all', 'user'];
        createBody.channels = ['web'];
        await createNews(createBody);
        Alert.alert('สำเร็จ', 'เพิ่มข่าวสารสำเร็จ');
      } else if (mode === 'edit' && form._id) {
        await updateNews(form._id, form);
        Alert.alert('สำเร็จ', 'แก้ไขข่าวสารสำเร็จ');
      }
      router.back();
    } catch (error: any) {
      Alert.alert(
        'เกิดข้อผิดพลาด',
        error?.error?.details?.[0]?.message ||
        error?.message ||
        'ไม่สามารถบันทึกข้อมูลได้'
      );
    }
  };

  // File upload handler for web (optional, only works on web)
  const handleFileChange = async (event: any) => {
    if (!event?.nativeEvent?.target?.files || event.nativeEvent.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = event.nativeEvent.target.files[0];
      const res = await uploadFile(file);
      handleChange('coverImage', res.url || res.data?.url || '');
      Alert.alert('สำเร็จ', 'อัปโหลดไฟล์สำเร็จ');
    } catch (err) {
      Alert.alert('เกิดข้อผิดพลาด', 'อัปโหลดไฟล์ไม่สำเร็จ');
    }
    setUploading(false);
  };

  // Helper to parse and format ISO date
  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <View style={styles.bg}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.header}>{mode === 'add' ? 'เพิ่มข่าวสาร' : 'แก้ไขข่าวสาร'}</Text>
          {loading ? (
            <Text style={{ textAlign: 'center', marginVertical: 24 }}>กำลังโหลดข้อมูล...</Text>
          ) : (
            <>
              {/* Top row: หัวข้อข่าว, ประเภท, รายละเอียด */}
              <View style={styles.topRow}>
                <View style={styles.topColSmall}>
                  <Text style={styles.label}>หัวข้อข่าว</Text>
                  <TextInput
                    style={styles.input}
                    value={form.title}
                    onChangeText={v => handleChange('title', v)}
                    placeholder="กรอกหัวข้อข่าว"
                  />
                </View>
                <View style={styles.topColSmall}>
                  <Text style={styles.label}>ประเภท</Text>
                  <TextInput
                    style={styles.input}
                    value={form.type}
                    onChangeText={v => handleChange('type', v)}
                    placeholder="ประเภท เช่น general"
                  />
                </View>
                <View style={styles.topColLarge}>
                  <Text style={styles.label}>รายละเอียด</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { height: 48 }]}
                    value={form.message}
                    onChangeText={v => handleChange('message', v)}
                    placeholder="กรอกรายละเอียด"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Content JSON as normal TextInput */}
              <View style={styles.contentRow}>
                <Text style={styles.label}>Content</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { height: 120 }]}
                  value={form.content?.content || ''}
                  onChangeText={text => handleChange('content', { ...form.content, content: text })}
                  placeholder="กรอกเนื้อหา"
                  multiline
                  numberOfLines={6}
                />
              </View>

              {/* Middle row: left and right */}
              <View style={styles.middleRow}>
                {/* Left column */}
                <View style={styles.middleColLeft}>
                  <Text style={styles.label}>ลิงก์เพิ่มเติม</Text>
                  <TextInput
                    style={styles.input}
                    value={form.linkUrl}
                    onChangeText={v => handleChange('linkUrl', v)}
                    placeholder="กรอก URL เพิ่มเติม"
                  />
                  <Text style={styles.label}>ลิงก์รูปภาพ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={form.coverImage}
                      onChangeText={v => handleChange('coverImage', v)}
                      placeholder="กรอก URL รูปภาพ"
                    />
                    {form.coverImage ? (
                      <Image
                        source={{ uri: form.coverImage }}
                        style={{ width: 48, height: 48, borderRadius: 8, marginLeft: 8 }}
                        resizeMode="cover"
                      />
                    ) : null}
                  </View>
                  {/* Dates row */}
                  <View style={styles.dateRow}>
                    <View style={styles.dateColNarrow}>
                      <Text style={styles.label}>วันที่เริ่มต้น</Text>
                      <TextInput
                        style={styles.input}
                        value={form.startAt ? form.startAt.substring(0, 10) : ''}
                        onChangeText={text => {
                          // Accepts YYYY-MM-DD
                          let iso = '';
                          if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
                            iso = new Date(text).toISOString();
                          }
                          handleChange('startAt', iso);
                        }}
                        placeholder="YYYY-MM-DD"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <Text style={styles.dateDash}>-</Text>
                    <View style={styles.dateColNarrow}>
                      <Text style={styles.label}>วันที่สิ้นสุด</Text>
                      <TextInput
                        style={styles.input}
                        value={form.endAt ? form.endAt.substring(0, 10) : ''}
                        onChangeText={text => {
                          let iso = '';
                          if (text && /^\d{4}-\d{2}-\d{2}$/.test(text)) {
                            iso = new Date(text).toISOString();
                          }
                          handleChange('endAt', iso);
                        }}
                        placeholder="YYYY-MM-DD"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                </View>
                {/* Right column */}
                <View style={styles.middleColRight}>
                  <Text style={styles.label}>เพิ่มเติม</Text>
                  <View style={styles.priorityRow}>
                    <Text style={styles.checkboxLabel}>ความสำคัญ</Text>
                    <View style={styles.priorityOptions}>
                      <Button
                        title="สูง"
                        color={form.priority === 'high' ? '#1976d2' : '#bbb'}
                        onPress={() => handleChange('priority', 'high')}
                      />
                      <Button
                        title="ปกติ"
                        color={form.priority === 'normal' ? '#1976d2' : '#bbb'}
                        onPress={() => handleChange('priority', 'normal')}
                      />
                      <Button
                        title="ต่ำ"
                        color={form.priority === 'low' ? '#1976d2' : '#bbb'}
                        onPress={() => handleChange('priority', 'low')}
                      />
                    </View>
                  </View>
                  <View style={styles.checkboxRow}>
                    <Switch
                      value={form.isPinned}
                      onValueChange={v => handleChange('isPinned', v)}
                    />
                    <Text style={styles.checkboxLabel}>ปักหมุด</Text>
                  </View>
                  <Text style={styles.label}>Custom Slug</Text>
                  <TextInput
                    style={styles.input}
                    value={form.customSlug}
                    onChangeText={v => handleChange('customSlug', v)}
                    placeholder="custom slug"
                  />
                </View>
              </View>
              <View style={styles.buttonWrapper}>
                <Button title="บันทึก" onPress={handleSubmit} />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    minHeight: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    marginVertical: 0,
    marginHorizontal: 0,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'center',
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  topColSmall: {
    flex: 1,
    marginRight: 8,
  },
  topColLarge: {
    flex: 2,
    marginLeft: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
    marginTop: 8,
    color: '#aaa',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 4,
  },
  textArea: {
    height: 48,
    textAlignVertical: 'top',
  },
  contentRow: {
    marginBottom: 16,
  },
  contentInput: {
    borderRadius: 48,
    height: 120,
    marginTop: 4,
  },
  middleRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  middleColLeft: {
    flex: 1,
    gap: 8,
  },
  middleColRight: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 8,
    marginLeft: 16,
  },
  priorityRow: {
    marginBottom: 12,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  checkboxLabel: {
    marginLeft: 8,
    color: '#aaa',
    fontSize: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  dateColNarrow: {
    flex: 0.9,
    minWidth: 140,
  },
  dateDash: {
    fontSize: 24,
    marginHorizontal: 8,
    marginBottom: 8,
    color: '#aaa',
    fontWeight: 'bold',
    alignSelf: 'flex-end',
  },
  buttonWrapper: {
    marginTop: 32,
    marginBottom: 8,
    alignItems: 'center',
  },
});