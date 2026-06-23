import { useState, useCallback } from 'react';
import { evaluateImageQuality } from '../services/faceValidationService';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic'];
const MAX_SIZE = 12 * 1024 * 1024; // 12MB

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [acceptedImages, setAcceptedImages] = useState([]);
  const [rejectedImages, setRejectedImages] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Unified Async Validation Loop Engine
  const validateFilesAsync = async (fileList) => {
    const valid = [];
    const invalid = [];

    // Reset baseline embedding if this is a completely brand new fresh batch upload
    if (acceptedImages.length === 0) {
      const { resetSubjectBaseline } = await import('../services/faceValidationService');
      resetSubjectBaseline();
    }

    // Dynamically import heic2any only if a HEIC file exists in the fileList
    const hasHEIC = Array.from(fileList).some(f => f.name.toLowerCase().endsWith('.heic'));
    let heic2any = null;
    if (hasHEIC) {
      try {
        const module = await import('heic2any');
        heic2any = module.default;
      } catch (err) {
        console.error('Failed to load HEIC converter module:', err);
      }
    }

    for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      const isHEIC = file.name.toLowerCase().endsWith('.heic');
      const isValidType = ALLOWED_TYPES.includes(file.type) || isHEIC;
      const isValidSize = file.size <= MAX_SIZE;

      if (!isValidType) {
        invalid.push({ id: crypto.randomUUID(), name: file.name, previewUrl: '', reason: 'Unsupported format.' });
        continue;
      }
      if (!isValidSize) {
        invalid.push({ id: crypto.randomUUID(), name: file.name, previewUrl: '', reason: 'File exceeds 12MB limit.' });
        continue;
      }

      let previewUrl = '';

      // ✅ Handle HEIC conversion to readable JPEG blob at runtime
      if (isHEIC && heic2any) {
        try {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.85
          });

          // Re-wrap the converted blob into a standard File object to preserve matching names downstream
          const newFileName = file.name.replace(/\.heic$/i, '.jpg');
          file = new File([convertedBlob], newFileName, { type: 'image/jpeg' });
          previewUrl = URL.createObjectURL(convertedBlob);
        } catch (conversionError) {
          console.error('HEIC parsing exception:', conversionError);
          invalid.push({ id: crypto.randomUUID(), name: file.name, previewUrl: '', reason: 'Failed to transcode HEIC image format.' });
          continue;
        }
      } else {
        previewUrl = URL.createObjectURL(file);
      }

      // Check if we already have accepted photos in state to see if this requires matching a target subject
      const isFirstSubjectPhoto = (acceptedImages.length === 0 && valid.length === 0);

      // Run our updated multi-layered ML check
      const mlEvaluation = await evaluateImageQuality(previewUrl, isFirstSubjectPhoto);

      if (!mlEvaluation.isValid) {
        invalid.push({
          id: crypto.randomUUID(),
          name: file.name,
          previewUrl,
          reason: mlEvaluation.reason,
        });
      } else {
        file.previewUrl = previewUrl;
        valid.push(file);
      }
    }

    return { valid, invalid };
  };

  // Central Core Upload Orchestration Sequence
  const uploadImages = useCallback(async (rawFiles) => {
    if (!rawFiles || rawFiles.length === 0) return;

    setUploading(true);
    setFeedback(null);

    const fileArray = Array.from(rawFiles);
    
    // Execute our updated multi-layered ML vision async validation sequence
    const { valid, invalid } = await validateFilesAsync(fileArray);

    if (invalid.length > 0) {
      setRejectedImages((prev) => [...prev, ...invalid]);
    }

    if (valid.length === 0) {
      setUploading(false);
      setFeedback({ 
        type: 'warning', 
        message: 'All selected images failed client-side vision validation criteria.' 
      });
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

      const data = await response.json();
      
      // Explicitly append incoming backend payload elements with real DB UUID strings
      if (data.accepted && Array.isArray(data.accepted)) {
        const mappedAccepted = data.accepted.map((backendImg) => {
          const localMatch = valid.find(f => f.name === backendImg.name);
          return {
            id: backendImg.id, 
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
        message: 'Failed to upload valid images to backend architecture.',
      });
    } finally {
      setUploading(false);
    }
  }, [acceptedImages]); // Rebind dependency context to verify state lengths cleanly

  // Asset Purging / State Removal Operation Routine
  const deleteImage = useCallback(async (id, variant) => {
    try {
      const response = await fetch(`http://localhost:5000/api/v1/uploads/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to drop asset from storage.');

      console.log(id, acceptedImages, rejectedImages, variant);

      // Safely target live state array values directly inside functional modifiers
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