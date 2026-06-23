import React, { useState } from 'react';

export const ImageUploader = ({ onFilesSelected, disabled }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && !disabled) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragActive ? '#4f46e5' : '#d1d5db'}`,
        backgroundColor: isDragActive ? '#f5f3ff' : '#f9fafb',
        padding: '40px 20px',
        borderRadius: '12px',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      <input
        type="file"
        id="file-upload-input"
        multiple
        accept=".jpg,.jpeg,.png,.heic"
        onChange={handleFileInput}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <label htmlFor="file-upload-input" style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#374151' }}>
          Drag & drop your photos here, or click to browse
        </p>
        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
          Supports JPEG, PNG, HEIC up to 12MB (Select at least 4-6 files)
        </p>
      </label>
    </div>
  );
};