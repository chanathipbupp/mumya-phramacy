const ArticleSkeleton = () => (
  <div style={{
    marginBottom: 24,
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f0f0', // สีพื้นหลังเทาอ่อน
    borderRadius: '32px',
    width: '100%',
    maxWidth: 420,
    margin: '16px auto',
    overflow: 'hidden',
    animation: 'pulse 1.5s infinite ease-in-out', // เพิ่ม animation
  }}>
    {/* Image Skeleton */}
    <div style={{ width: '100%', height: 180, background: '#e0e0e0' }} />
    
    {/* Content Skeleton */}
    <div style={{ padding: '16px 12px 12px 12px' }}>
      <div style={{ width: '70%', height: 24, background: '#e0e0e0', borderRadius: 4, marginBottom: 12 }} />
      <div style={{ width: '90%', height: 16, background: '#e0e0e0', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ width: '40%', height: 16, background: '#e0e0e0', borderRadius: 4, marginBottom: 20 }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '100px', height: 14, background: '#e0e0e0', borderRadius: 4 }} />
        <div style={{ width: '60px', height: 30, background: '#e0e0e0', borderRadius: 12 }} />
      </div>
    </div>

    {/* ใส่ CSS Animation แบบ Inline */}
    <style>{`
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `}</style>
  </div>
);
export default ArticleSkeleton;