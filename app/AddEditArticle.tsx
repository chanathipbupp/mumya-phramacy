import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Button, ScrollView, Platform, Pressable } from 'react-native';
import { createArticle, updateArticle, getArticles, uploadFile, getArticleBySlug } from '../composables/fetchAPI';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

const defaultArticle = {
  title: '',
  content: { type: 'paragraph', version: 1, content: '' }, // <-- FIXED
  status: 'draft',
  tags: [],
  customSlug: '',
  coverImage: '',
  publishDate: '',
  activeFrom: '',
  activeTo: '',
  isOptional: [],
};

export default function AddEditArticle() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const slug = params.slug as string | undefined;
  const mode = params.mode === 'add' ? 'add' : 'edit';

  const [form, setForm] = useState({ ...defaultArticle });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showPublishDatePicker, setShowPublishDatePicker] = useState(false);

  // Tag input state
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<any>(null);

  // Add this state at the top
  const [originalCustomSlug, setOriginalCustomSlug] = useState<string | undefined>('');

  // Load article for edit
  useEffect(() => {
    if (mode === 'edit' && slug) {
      (async () => {
        setLoading(true);
        try {
          // Use getArticleBySlug instead of getArticles
          const article = await getArticleBySlug(slug);
          if (article) {
            setForm({
              ...defaultArticle,
              ...article,
              content:
                typeof article.content === 'object' && article.content !== null
                  ? article.content
                  : { type: 'doc', version: 1, content: article.content || '' },
            });
            setOriginalCustomSlug(article.customSlug); // <-- store original
          }
          console.log('Loaded article for edit:', article);
        } catch {}
        setLoading(false);
      })();
    } else {
      setForm({ ...defaultArticle });
    }
  }, [mode, slug]);

  const handleChange = (key: string, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  // --- Tag logic ---
  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (form.tags.includes(value)) return;
    handleChange('tags', [...form.tags, value]);
    setTagInput('');
  };
  const removeTag = (tag: string) => {
    handleChange('tags', form.tags.filter((t: string) => t !== tag));
  };
  const handleTagInputKeyDown = (e: any) => {
    if (e.nativeEvent?.key === 'Enter') {
      addTag();
      e.preventDefault?.();
    }
  };
  const handleTagInputBlur = () => {
    addTag();
  };

  // --- Date logic ---
  const formatDateTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // --- File upload handler for web ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const res = await uploadFile(file);
      handleChange('coverImage', res.url || res.data?.url || '');
    } catch (err) {
      window.alert('อัปโหลดไฟล์ไม่สำเร็จ');
    }
    setUploading(false);
  };

  // --- Validation ---
const validateForm = () => {
  const errors: string[] = [];
  if (!form.title || !form.title.trim()) errors.push('หัวข้อ');
  // Fix: check content string inside object
  const contentString =
    typeof form.content === 'object' && form.content !== null
      ? form.content.content
      : form.content;
  if (!contentString  || !contentString) errors.push('เนื้อหา');
  if (!form.status || !form.status.trim()) errors.push('สถานะ');
  return errors;
};

  // --- Submit ---
  const handleSubmit = async () => {
  const errors = validateForm();
  if (errors.length > 0) {
    if (Platform.OS === 'web') {
      window.alert(`กรุณากรอก: ${errors.join(', ')}`);
    } else {
      // @ts-ignore
      Alert.alert('กรุณากรอกข้อมูลให้ครบถ้วน', `กรุณากรอก: ${errors.join(', ')}`);
    }
    return;
  }

  // Hardcode activeFrom and activeTo
  const now = new Date();
  const twoYearsFromNow = new Date();
  twoYearsFromNow.setFullYear(now.getFullYear() + 2);

  const submitData = {
    ...form,
    activeFrom: now.toISOString(),
    activeTo: twoYearsFromNow.toISOString(),
  };

  setLoading(true);
  try {
    if (mode === 'add') {
      // Build payload in the required format
      const createBody = {
        title: form.title,
        content: form.content, // <--- use directly
        status: form.status || "published",
        tags: Array.isArray(form.tags)
          ? form.tags.filter(Boolean)
          : (typeof form.tags === 'string' ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
        customSlug: form.customSlug || undefined,
        coverImage: form.coverImage || "https://cdn.kasidate.me/images/White%20Red%20Yellow%20Minimalist%20Pill%20Medical%20Pharmacy%20Logo.png",
        publishDate: form.publishDate || new Date().toISOString(),
      };
      console.log('Creating article with form data:', createBody);
      const res = await createArticle(createBody);
      if (Platform.OS === 'web') {
        window.alert('เพิ่มบทความสำเร็จ');
      } else {
        // @ts-ignore
        Alert.alert('สำเร็จ', 'เพิ่มบทความสำเร็จ');
      }
    } else if (mode === 'edit' && form._id) {
      // Hardcode every value for debugging
      const now = new Date();
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(now.getFullYear() + 2);

      const hardcoded = {
        _id: form._id,
        title: form.title || "Mumya Pharmacy",
        content: {
            type: "paragraph", 
            version: 1,
            content: form.content?.content 
          },
        status: form.status || "published",
        tags: form.tags.length > 0 ? form.tags : ["health", "wellness"],
        coverImage: form.coverImage ||"https://cdn.kasidate.me/images/White%20Red%20Yellow%20Minimalist%20Pill%20Medical%20Pharmacy%20Logo.png",
        publishDate: form.publishDate ||now.toISOString(),
        activeFrom: now.toISOString(),
        activeTo: twoYearsFromNow.toISOString(),
        isOptional: [],
      };

      // Conditionally add customSlug if changed
      if (form.customSlug !== originalCustomSlug) {
        hardcoded.customSlug = form.customSlug;
      }

      console.log("Updating article with hardcoded data:", hardcoded);
      await updateArticle(form._id, hardcoded);

      if (Platform.OS === 'web') {
        window.alert('อัปเดตบทความสำเร็จ');
      } else {
        // @ts-ignore
        Alert.alert('สำเร็จ', 'อัปเดตบทความสำเร็จ');
      }
    }
    router.back();
  } catch (error: any) {
    if (Platform.OS === 'web') {
      window.alert(error?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } else {
      // @ts-ignore
      Alert.alert(
        'เกิดข้อผิดพลาด',
        error?.error?.details?.[0]?.message ||
        error?.message ||
        'ไม่สามารถบันทึกข้อมูลได้'
      );
    }
  }
  setLoading(false);
};

  return (
    <View style={styles.bg}>
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.header}>{mode === 'add' ? 'สร้างบทความ' : 'แก้ไขบทความ'}</Text>
          {loading ? (
            <Text style={{ textAlign: 'center', marginVertical: 24 }}>กำลังโหลดข้อมูล...</Text>
          ) : (
            <>
              {/* Top row: Title, Status, Tags */}
              <View style={styles.topRow}>
                {/* Status */}
                <View style={styles.topColSmall}>
                  <Text style={styles.label}>
                    สถานะ <Text style={{ color: 'red' }}>*</Text>
                  </Text>
                  {Platform.OS === 'web' ? (
                    <select
                      style={{ ...styles.input, padding: 8, height: 44 }}
                      value={form.status}
                      onChange={e => handleChange('status', e.target.value)}
                    >
                      <option value="draft">draft</option>
                      <option value="published">published</option>
                    </select>
                  ) : (
                    <View style={[styles.input, { padding: 0, justifyContent: 'center' }]}>
                      <Pressable onPress={() => handleChange('status', 'draft')}>
                        <Text style={{ color: form.status === 'draft' ? '#007AFF' : '#000', padding: 8 }}>draft</Text>
                      </Pressable>
                      <Pressable onPress={() => handleChange('status', 'published')}>
                        <Text style={{ color: form.status === 'published' ? '#007AFF' : '#000', padding: 8 }}>published</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Tags */}
                <View style={styles.topColLarge}>
                  <Text style={styles.label}>แท็ก</Text>
                  <TextInput
                    ref={tagInputRef}
                    style={[styles.input, { minWidth: 120, width: '100%' }]}
                    value={tagInput}
                    onChangeText={setTagInput}
                    onBlur={handleTagInputBlur}
                    onKeyPress={handleTagInputKeyDown}
                    placeholder="เพิ่มแท็กแล้วกด Enter"
                    placeholderTextColor="#aaa"
                    returnKeyType="done"
                  />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {form.tags.map((tag: string) => (
                      <View key={tag} style={styles.tagButton}>
                        <Text style={styles.tagText}>{tag}</Text>
                        <Pressable onPress={() => removeTag(tag)}>
                          <Text style={styles.tagRemove}>×</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
                
                {/* Title */}
                <View style={styles.topColMedium}>
                  <Text style={styles.label}>
                    หัวข้อ <Text style={{ color: 'red' }}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={form.title}
                    onChangeText={v => handleChange('title', v)}
                    placeholder="กรอกหัวข้อ"
                    placeholderTextColor="#aaa"
                  />
                </View>
                
              </View>

              {/* Content */}
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
                  <Text style={styles.label}>Custom Slug</Text>
                  <TextInput
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 24,
                      padding: 12,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#ddd',
                      marginBottom: 4,
                      width: 210, // <-- set your desired width here
                      alignSelf: 'flex-start', // optional: aligns to the left
                    }}
                    value={form.customSlug}
                    onChangeText={v => handleChange('customSlug', v)}
                    placeholder="custom slug"
                    placeholderTextColor="#aaa"
                  />
                  <Text style={styles.label}>URL รูปภาพ</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {Platform.OS === 'web' ? (
                      <div
                        style={{ position: 'relative',  display: 'flex', alignItems: 'center' }}
                        onMouseEnter={() => setShowImagePreview(true)}
                        onMouseLeave={() => setShowImagePreview(false)}
                      >
                        <TextInput
                          style={styles.input}
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
                    {Platform.OS === 'web' && (
                      <input
                        type="file"
                        accept="image/*"
                        style={{ height: 40, padding: 4 }}
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                    )}
                  </View>
                  <Text style={styles.label}>วันที่เผยแพร่</Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="datetime-local"
                      style={{ ...styles.input, width: '20%' }}
                      value={form.publishDate ? form.publishDate.substring(0, 16) : ''}
                      onChange={e => handleChange('publishDate', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    />
                  ) : (
                    <>
                      <Pressable onPress={() => setShowPublishDatePicker(true)}>
                        <TextInput
                          style={styles.input}
                          value={formatDateTime(form.publishDate)}
                          placeholder="เลือกวันที่และเวลา"
                          placeholderTextColor="#aaa"
                          editable={false}
                          pointerEvents="none"
                        />
                      </Pressable>
                      {showPublishDatePicker && (
                        <DateTimePicker
                          value={form.publishDate ? new Date(form.publishDate) : new Date()}
                          mode="datetime"
                          display="default"
                          onChange={(_, date) => {
                            setShowPublishDatePicker(false);
                            if (date) handleChange('publishDate', date.toISOString());
                          }}
                        />
                      )}
                    </>
                  )}
                </View>

                {/* Right column - removed as per request */}
              </View>
              <View style={styles.buttonWrapper}>
                <Button title={loading ? "กำลังบันทึก..." : mode === 'edit' ? "อัปเดต" : "สร้าง"} onPress={handleSubmit} disabled={loading} />
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
    paddingHorizontal: 52,
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
    alignItems: 'flex-start',
  },
  topColSmall: {
    flex: 0.7, // smaller
    minWidth: 120,
    maxWidth: 180,
    marginRight: 8,
  },
  topColMedium: {
    flex: 2,
    minWidth: 200,
    marginRight: 8,
  },
  topColLarge: {
    flex: 1.2, // smaller than before
    minWidth: 160,
    maxWidth: 320,
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
  contentRow: {
    marginBottom: 16,
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
  buttonWrapper: {
    marginTop: 32,
    marginBottom: 8,
    alignItems: 'flex-start', // <-- align left

  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 0,
    marginBottom: 0,
    marginTop: 0,
  },
  tagText: {
    color: '#3730a3',
    fontSize: 15,
    marginRight: 4,
  },
  tagRemove: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 2,
    marginRight: 2,
    lineHeight: 18,
  },
});