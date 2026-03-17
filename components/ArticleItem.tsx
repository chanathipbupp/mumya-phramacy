import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import AppLoading from 'expo-app-loading'; // ใช้สำหรับแสดงหน้ารอโหลดฟอนต์
import { LinearGradient } from 'expo-linear-gradient';

type ArticleItemProps = {
  slug: string;
  id: string;
  title: string;
  content?: string;
  coverImage: string;
  date?: string;
  tags?: string[]; // <-- add this line
  onDeleted?: () => void;
  role?: string; // <-- add this line
};

export default function ArticleItem({ slug, ...props }: ArticleItemProps) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'Prompt-Regular': require('../assets/fonts/Prompt-Regular.ttf'),
    'Prompt-Bold': require('../assets/fonts/Prompt-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />; // แสดงหน้ารอโหลดฟอนต์
  }

  //console.log(props?.role, "role in article item")
  const handleDelete = async (e?: any) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?")) return;
    try {
      await import('../composables/fetchAPI').then(api => api.deleteArticle(props.id));
      window.alert("ลบสำเร็จ บทความถูกลบแล้ว");
      if (props.onDeleted) props.onDeleted();
    } catch (e: any) {
      window.alert(e.message || "ไม่สามารถลบบทความได้");
    }
  };

  const handleEdit = () => {
    //console.log('edit', slug);
    router.push({
      pathname: '/AddEditArticle',
      params: { slug, mode: 'edit' },
    });
  };

  return (
    <div
      onClick={() => router.push({ pathname: '/ArticlesDetail', params: { slug } })}
      style={{ cursor: 'pointer' }}
    >
      <div
        style={{
          position: 'relative',
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          background: '#fff',
          borderRadius: '32px',
          boxShadow: '0 2px 8px #0001',
          overflow: 'visible',
          minWidth: 0,
          width: '100%',
          maxWidth: 420,
          margin: '16px auto',
          paddingRight: 2
        }}
      >
        {/* Big Red X */}
        {props?.role?.toLowerCase() === 'admin' && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: -4,
              right: 2,
              background: '#f44',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: 'pointer',
              zIndex: 2,
              boxShadow: '0 2px 8px #0002',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              fontFamily: 'Prompt-Bold',
            }}
            title="ลบบทความ"
          >✕</button>
        )}

        {/* Picture */}
        <div
          style={{
            width: '100%',
            minHeight: 180,                 // <-- increase minHeight
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '32px 32px 0 0',
            overflow: 'hidden',
            background: '#525252ff',
            position: 'relative',
          }}
        >
          <img
            src={props.coverImage}
            alt={props.title}
            style={{
              width: 'auto',
              height: 160,                  // <-- increase height
              maxWidth: '90%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: 2,
            background: 'transparent',
            borderBottom: '2px solid #ccc',
            margin: 0,
          }}
        />

        {/* Content */}
        <div
          style={{
            padding: '16px 12px 12px 12px',
            borderRadius: '0 0 32px 32px',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 120,
            position: 'relative',
          }}
        >
          <div style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 8, wordBreak: 'break-word', fontFamily: 'Prompt-Bold' }}>
            {props.title}
          </div>
          <div
            style={{
              color: '#888',
              fontSize: 14,
              marginBottom: 16,
              borderBottom: '1px dotted #bbb',
              paddingBottom: 6,
              minHeight: 24,
              whiteSpace: 'nowrap',           // <-- single line
              overflow: 'hidden',             // <-- hide overflow
              textOverflow: 'ellipsis',       // <-- show ...
              wordBreak: 'break-all',
              fontFamily: 'Prompt-Regular',
            }}
          >
            {props.content}
          </div>
          {props.tags && props.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, margin: '2px 0 0 0', flexWrap: 'wrap' }}>
              {props.tags.map(tag => (
                <div key={tag} style={{ borderRadius: 12, overflow: 'hidden' }}>
                  <LinearGradient
                    // ไล่เฉดจากฟ้าสว่าง ไปหาฟ้าหลักที่คุณชอบ (#5ccbffff)
                    colors={['#9de5ff', '#5ccbffff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: 16, // ระยะห่างซ้าย-ขวา
                      paddingVertical: 4,    // ระยะห่างบน-ล่าง
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: '#ffffff',
                        fontSize: 14,
                        fontWeight: 500,
                        fontFamily: 'Prompt-Regular',
                        textShadow: '0px 1px 2px rgba(0,0,0,0.1)', // เพิ่มเงาให้ตัวหนังสืออ่านง่ายขึ้น
                      }}
                    >
                      {tag}
                    </span>
                  </LinearGradient>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 8,
            }}
          >

            <div style={{ color: '#000000ff', fontSize: 13, fontWeight: 400, wordBreak: 'break-all', marginBottom: 8, marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Prompt-Regular' }}>
              <Ionicons name="calendar-outline" size={18} color="#888" style={{ marginRight: 6 }} />
              {props.date
                ? new Date(props.date).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) + ' น.'
                : 'Date..........'}
            </div>

            {props?.role?.toLowerCase() === 'admin' && (
              <button
                onClick={e => {
                  e.stopPropagation(); // <-- Add this line
                  handleEdit();
                }}
                style={{
                  border: '2px solid #0097a7',
                  color: '#ffffffff',
                  backgroundColor: '#0097a7',
                  margin: 4,
                  borderRadius: 12,
                  padding: '8px 18px',
                  fontSize: 15,
                  fontFamily: 'Prompt-Bold',

                  fontWeight: 400,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'background 0.2s, color 0.2s',
                }}
                title="แก้ไขบทความ"
              >
                แก้ไข
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}