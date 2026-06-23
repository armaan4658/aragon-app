export const ImageCard = ({ image, variant, onDelete }) => {
  const isRejected = variant === 'rejected';

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        border: `1px solid ${isRejected ? '#fca5a5' : '#e5e7eb'}`,
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        opacity: isRejected ? 0.75 : 1,
      }}
    >
      {/* Absolute positioned Delete Action Button */}
      <button
        onClick={(e) => {
          e.preventDefault();  // CRITICAL: Prevents default browser submit actions
          e.stopPropagation();
          if (window.confirm('Are you sure you want to remove this image?')) onDelete();
        }}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
          color: '#dc2626',
          fontWeight: 'bold',
          fontSize: '14px',
        }}
        title="Delete Photo"
        type="button"
      >
        ✕
      </button>

      <div style={{ position: 'relative', paddingTop: '100%' }}>
        <img
          src={image.previewUrl || image.s3_url}
          alt={image.name || 'Uploaded photo'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>

      {isRejected && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderTop: '1px solid #fca5a5' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
            ⚠️ {image.reason || 'Failed validation Check'}
          </p>
        </div>
      )}
    </div>
  );
};