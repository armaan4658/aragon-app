import React from 'react';
import { ImageCard } from './ImageCard';
import { useImageUpload } from '../hooks/useImageUpload';

export const ImageGrid = ({ images, variant }) => {
  if (!images || images.length === 0) return null;
  const { deleteImage } = useImageUpload();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '16px',
        margin: '16px 0',
      }}
    >
      {images.map((img) => (
        <ImageCard key={img.id} image={img} variant={variant} onDelete={() => deleteImage(img.id, variant)}/>
      ))}
    </div>
  );
};