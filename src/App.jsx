import React from 'react';
import { useImageUpload } from './hooks/useImageUpload';
import { ImageUploader } from './components/ImageUploader';
import { ImageGrid } from './components/ImageGrid';
import { FeedbackMessage } from './components/FeedbackMessage';

function App() {
  // Destructure deleteImage from your custom hook state manager
  const { uploading, acceptedImages, rejectedImages, feedback, uploadImages, deleteImage } = useImageUpload();

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#b5b8c0', margin: '0 0 8px 0' }}>
          Upload Photos
        </h1>
        <p style={{ color: '#4b5563', margin: 0 }}>
          Upload a mix of close-ups, selfies, and mid-range shots for training your AI model profile.
        </p>
      </header>

      <FeedbackMessage feedback={feedback} />
      
      <ImageUploader onFilesSelected={uploadImages} disabled={uploading} />

      {uploading && (
        <div style={{ textAlign: 'center', margin: '24px 0', color: '#4f46e5', fontWeight: '600' }}>
          Processing your images... Please wait.
        </div>
      )}

      {/* Accepted Images Showcase */}
      {acceptedImages.length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
            Accepted Photos ({acceptedImages.length})
          </h2>
          <ImageGrid 
            images={acceptedImages} 
            variant="accepted" 
            onDeleteImage={deleteImage} // Pass the callback here
          />
        </section>
      )}

      {/* Rejected Images Showcase */}
      {rejectedImages.length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626', borderBottom: '2px solid #fee2e2', paddingBottom: '8px' }}>
            Some Photos Didn't Meet Our Guidelines ({rejectedImages.length})
          </h2>
          <ImageGrid 
            images={rejectedImages} 
            variant="rejected" 
            onDeleteImage={deleteImage} // Pass the callback here
          />
        </section>
      )}
    </div>
  );
}

export default App;