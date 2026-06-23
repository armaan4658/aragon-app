import { useState, useCallback } from 'react';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
const MAX_SIZE = 12 * 1024 * 1024; // 12MB

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [acceptedImages, setAcceptedImages] = useState([]);
  const [rejectedImages, setRejectedImages] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const validateFiles = (fileList) => {
    const valid = [];
    const invalid = [];

    fileList.forEach((file) => {
      const isHEIC = file.name.toLowerCase().endsWith('.heic');
      const isValidType = ALLOWED_TYPES.includes(file.type) || isHEIC;
      const isValidSize = file.size <= MAX_SIZE;
      const previewUrl = URL.createObjectURL(file);

      if (!isValidType) {
        invalid.push({
          id: crypto.randomUUID(),
          name: file.name,
          previewUrl,
          reason: 'Unsupported format. Use JPEG, PNG, or HEIC.',
        });
      } else if (!isValidSize) {
        invalid.push({
          id: crypto.randomUUID(),
          name: file.name,
          previewUrl,
          reason: 'File exceeds 12MB size limit.',
        });
      } else {
        // Attach preview url to valid file objects for immediate fallback rendering
        file.previewUrl = previewUrl; 
        valid.push(file);
      }
    });

    return { valid, invalid };
  };

  const uploadImages = useCallback(async (rawFiles) => {
    if (!rawFiles || rawFiles.length === 0) return;

    setUploading(true);
    setFeedback(null);

    const fileArray = Array.from(rawFiles);
    const { valid, invalid } = validateFiles(fileArray);

    // Push local validation failures directly to rejected state layout
    if (invalid.length > 0) {
      setRejectedImages((prev) => [...prev, ...invalid]);
    }

    if (valid.length === 0) {
      setUploading(false);
      return;
    }

    const formData = new FormData();
    valid.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/v1/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Server upload failure.');

      const data = await response.json(); // Structure: { accepted: [...], rejected: [...] }
      
      // ✅ FIX: Explicitly append incoming backend payload elements with their real database IDs
      if (data.accepted && Array.isArray(data.accepted)) {
        const mappedAccepted = data.accepted.map((backendImg) => {
          const localMatch = valid.find(f => f.name === backendImg.name);
          return {
            id: backendImg.id, // Databases real UUID string
            name: backendImg.name,
            s3_url: backendImg.s3_url,
            previewUrl: localMatch ? localMatch.previewUrl : backendImg.s3_url
          };
        });
        
        setAcceptedImages((prev) => [...prev, ...mappedAccepted]);
      }

      if (data.rejected && Array.isArray(data.rejected)) {
        const mappedRejected = data.rejected.map((backendImg) => {
          const localMatch = valid.find(f => f.name === backendImg.name);
          return {
            id: backendImg.id,
            name: backendImg.name,
            reason: backendImg.reason,
            previewUrl: localMatch ? localMatch.previewUrl : null
          };
        });

        setRejectedImages((prev) => [...prev, ...mappedRejected]);
      }

      setFeedback({
        type: 'success',
        message: `Upload complete. Accepted: ${data.accepted?.length || 0}, Rejected: ${data.rejected?.length || 0}`,
      });

    } catch (error) {
      console.error('Upload Process Failed:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to upload images to backend cluster.',
      });
    } finally {
      setUploading(false);
    }
  }, []);

  // ✅ COMPLETE BULLETPROOF DELETION STATE LOOP
  const deleteImage = useCallback(async (id, variant) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/uploads/${id}`, {
        method: 'DELETE',
      });
      console.log(variant)

      if (!response.ok) throw new Error('Failed to drop asset from database.');

      // Run functional state updates to target live values safely
      if (variant === 'accepted') {
        setAcceptedImages((prev) => prev.filter((img) => img.id !== id));
      } else {
        setRejectedImages((prev) => prev.filter((img) => img.id !== id));
      }
      
    } catch (error) {
      console.error('Purge Failed:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to complete image deletion sequence.',
      });
    }
  }, []);

  return { uploading, acceptedImages, rejectedImages, feedback, uploadImages, deleteImage };
};