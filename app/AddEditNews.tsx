import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, View, Text, TextInput, StyleSheet, Button, Alert, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createNews, updateNews, getNewsBySlug, uploadFile } from '../composables/fetchAPI';
import { CheckBox } from 'react-native'; // Consider using a community checkbox for better support
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

type NewsForm = {
  _id?: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isActive: boolean;
  isPinned: boolean;
  startAt: string;
  endAt: string;
  scope: string[];
  channels: string[];
  coverImage: string;
  linkUrl: string;
  bannerStyle: string;
  customSlug: string;
  content: { type: string; version: number; content: string | null };
};

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
  content: { type: 'string', version: 1, content: '' }, // <-- FIXED HERE
};

export default function AddEditNews() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const slug = params.slug as string | undefined;
  const mode = params.mode === 'add' ? 'add' : 'edit';

  const [form, setForm] = useState<NewsForm>({ ...defaultNews });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Add state for date pickers
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);



  const validateForm = () => {
    const errors: string[] = [];
    // Title
    if (!form.title || !form.title.trim()) errors.push('หัวข้อข่าว');
    // Content
    if (
      !form.content ||
      typeof form.content.content !== 'string' ||
      !form.content.content.trim()
    ) {
      errors.push('Content');
    }
    // Type
    if (!form.type || !form.type.trim()) errors.push('ประเภท');
    // Start Date
    if (!form.startAt || !form.startAt.trim()) {
      errors.push('วันที่เริ่มต้น');
    } else {
      // const start = new Date(form.startAt);
      // const now = new Date();
      // // Remove time for comparison (only date matters)
      // start.setHours(0, 0, 0, 0);
      // now.setHours(0, 0, 0, 0);
      // if (start < now) {
      //   errors.push('วันที่เริ่มต้นต้องเป็นวันปัจจุบันหรืออนาคต');
      // }
    }
    return errors;

  };


  // Helper to parse and format ISO date
  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (mode === 'edit' && slug) {
        setLoading(true);
        try {
          const data = await getNewsBySlug(slug);
          console.log('Fetched news data:', data);
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
    const errors = validateForm();
    console.log('Validation errors:', errors); // <--- Add this line
    if (errors.length > 0) {
      if (Platform.OS === 'web') {
        window.alert(`กรุณากรอก: ${errors.join(', ')}`);
      } else {
        Alert.alert('กรุณากรอกข้อมูลให้ครบถ้วน', `กรุณากรอก: ${errors.join(', ')}`);
      }
      return;
    }

    try {
      if (mode === 'add') {
        // Hardcoded payload for add mode
        console.log('Creating news with form data:', form);
        const createBody = {
          title: form.title,
          message: form.message,
          content: {
            type: "doc",
            version: 1,
            content: form.content?.content || null
          },
          customSlug: form.customSlug || undefined,
          type: form.type,
          priority: form.priority || "normal",
          isActive: true,
          isPinned: form.isPinned || false,
          startAt: form.startAt || new Date().toISOString(),
          endAt: form.endAt || undefined,
          scope: ["all", "user"],
          channels: ["web"],
          coverImage: form.coverImage || "https://cdn.kasidate.me/images/5592d0bfc4cd439d659db94a39f05b7584fa5d4fe2791f5e5116babc31906863.png",
          linkUrl: form.linkUrl || undefined,
          bannerStyle: "banner"
        };
        const res = await createNews(createBody);
        console.log('Created news:', res);
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

  // File upload handler for web
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const res = await uploadFile(file);
      handleChange('coverImage', res.url || res.data?.url || '');
      Alert.alert('สำเร็จ', 'อัปโหลดไฟล์สำเร็จ');
    } catch (err) {
      Alert.alert('เกิดข้อผิดพลาด', 'อัปโหลดไฟล์ไม่สำเร็จ');
    }
    setUploading(false);
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
                  <Text style={styles.label}>
                    หัวข้อข่าว <Text style={{ color: 'red' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.title}
                    onChangeText={v => handleChange('title', v)}
                    placeholder="กรอกหัวข้อข่าว"
                    placeholderTextColor="#aaa"
                  />
                </View>
                <View style={styles.topColSmall}>
                  <Text style={styles.label}>
                    ประเภท <Text style={{ color: 'red' }}>*</Text>
                  </Text>
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={form.type}
                      onValueChange={v => handleChange('type', v)}
                      style={styles.picker}
                    >
                      <Picker.Item label="เลือกประเภท" value="" />
                      <Picker.Item label="ประกาศ (announcement)" value="announcement" />
                      <Picker.Item label="ปิดปรับปรุง (maintenance)" value="maintenance" />
                      <Picker.Item label="โปรโมชั่น (promo)" value="promo" />
                      <Picker.Item label="ระบบ (system)" value="system" />
                    </Picker>
                  </View>
                </View>
                <View style={styles.topColLarge}>
                  <Text style={styles.label}>รายละเอียด</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { height: 48 }]}
                    value={form.message}
                    onChangeText={v => handleChange('message', v)}
                    placeholder="กรอกรายละเอียด"
                    placeholderTextColor="#aaa"
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </View>

              {/* Content JSON */}
              <View style={styles.contentRow}>
                <Text style={styles.label}>
                  Content <Text style={{ color: 'red' }}>*</Text>
                </Text>
                <View style={{ height: 200, backgroundColor: '#fff', borderRadius: 24, marginBottom: 8, borderWidth: 1, borderColor: '#ddd' }}>
                  <TextInput
                    style={{ width: '100%', height: 180, borderRadius: 16, padding: 12, fontSize: 16 }}
                    value={form.content?.content || ''}
                    onChangeText={v => handleChange('content', { ...form.content, content: v })}
                    placeholder="กรอกเนื้อหา"
                    placeholderTextColor="#aaa"
                    multiline
                    numberOfLines={6}
                  />
                </View>
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
                    placeholderTextColor="#aaa"
                  />
                  <Text style={styles.label}>ลิงก์รูปภาพ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {Platform.OS === 'web' ? (
                      <div
                        style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={() => setShowImagePreview(true)}
                        onMouseLeave={() => setShowImagePreview(false)}
                      >
                        <TextInput
                          style={[styles.input, { width: '100%' }]}
                          value={form.coverImage}
                          onChangeText={v => handleChange('coverImage', v)}
                          placeholder="กรอก URL รูปภาพ"
                          placeholderTextColor="#aaa"
                        />
                        {showImagePreview && form.coverImage && (
                          <img
                            src={form.coverImage}
                            alt="preview"
                            style={{
                              position: 'absolute',
                              left: 0,
                              bottom: '100%',
                              marginBottom: 12,
                              maxWidth: 320,
                              maxHeight: 220,
                              border: '1px solid #ccc',
                              background: '#fff',
                              zIndex: 9999,
                              boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
                              objectFit: 'contain',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        value={form.coverImage}
                        onChangeText={v => handleChange('coverImage', v)}
                        placeholder="กรอก URL รูปภาพ"
                        placeholderTextColor="#aaa"
                      />
                    )}
                    {Platform.OS === 'web' ? (
                      <input
                        type="file"
                        accept="image/*"
                        style={{ marginLeft: 8 }}
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    ) : (
                      // For mobile, use an image picker library and call uploadFile with the result
                      <Button title="แนบไฟล์" onPress={() => {/* image picker logic */ }} />
                    )}
                  </View>
                  {/* Dates row */}
                  <View style={styles.dateRow}>
                    <View style={styles.dateColNarrow}>
                      <Text style={styles.label}>
                        วันที่เริ่มต้น <Text style={{ color: 'red' }}>*</Text>
                      </Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="date"
                          style={{ ...styles.input, width: '100%' }}
                          value={form.startAt ? form.startAt.substring(0, 10) : ''}
                          onChange={e => handleChange('startAt', new Date(e.target.value).toISOString())}
                        />
                      ) : (
                        <>
                          <TextInput
                            style={styles.input}
                            value={formatDate(form.startAt)}
                            placeholder="เลือกวันที่เริ่มต้น"
                            placeholderTextColor="#aaa"
                            editable={false}
                            onTouchStart={() => setShowStartPicker(true)}
                          />
                          {showStartPicker && (
                            <DateTimePicker
                              value={form.startAt ? new Date(form.startAt) : new Date()}
                              mode="date"
                              display="default"
                              onChange={(_, date) => {
                                setShowStartPicker(false);
                                if (date) handleChange('startAt', date.toISOString());
                              }}
                            />
                          )}
                        </>
                      )}
                    </View>
                    <Text style={styles.dateDash}>-</Text>
                    <View style={styles.dateColNarrow}>
                      <Text style={styles.label}>วันที่สิ้นสุด</Text>
                      {Platform.OS === 'web' ? (
                        <input
                          type="date"
                          style={{ ...styles.input, width: '100%' }}
                          value={form.endAt ? form.endAt.substring(0, 10) : ''}
                          onChange={e => handleChange('endAt', new Date(e.target.value).toISOString())}
                        />
                      ) : (
                        <>
                          <TextInput
                            style={styles.input}
                            value={formatDate(form.endAt)}
                            placeholder="เลือกวันที่สิ้นสุด"
                            placeholderTextColor="#aaa"
                            editable={false}
                            onTouchStart={() => setShowEndPicker(true)}
                          />
                          {showEndPicker && (
                            <DateTimePicker
                              value={form.endAt ? new Date(form.endAt) : new Date()}
                              mode="date"
                              display="default"
                              onChange={(_, date) => {
                                setShowEndPicker(false);
                                if (date) handleChange('endAt', date.toISOString());
                              }}
                            />
                          )}
                        </>
                      )}
                    </View>
                  </View>
                </View>
                {/* Right column */}
                <View style={styles.middleColRight}>
                  <Text style={styles.label}>เพิ่มเติม</Text>
                  <View >
                    <Text style={styles.checkboxLabel}>ความสำคัญ <Text style={{ color: 'red' }}>*</Text></Text>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={form.priority}
                        onValueChange={v => handleChange('priority', v)}
                        style={styles.picker}
                      >
                        <Picker.Item label="เลือกความสำคัญ" value="" />
                        <Picker.Item label="ต่ำ (low)" value="low" />
                        <Picker.Item label="ปกติ (normal)" value="normal" />
                        <Picker.Item label="สูง (high)" value="high" />
                        <Picker.Item label="วิกฤติ (critical)" value="critical" />
                      </Picker>
                    </View>
                  </View>
                  <View style={styles.checkboxRow}>
                    <CheckBox
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
                    placeholderTextColor="#aaa"
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
    color: '#000',
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  picker: {
    height: 44,
    width: '100%',
  },
});