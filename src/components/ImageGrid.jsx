import React from 'react';
import { ImageCard } from './ImageCard';

// Accept onDeleteImage from App.jsx props destructuring
export const ImageGrid = ({ images, variant, onDeleteImage }) => {
  if (!images || images.length === 0) return null;

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
        <ImageCard 
          key={img.id} 
          image={img} 
          variant={variant} 
          // Run the callback coming from App.jsx's single source of truth hook
          onDelete={() => onDeleteImage(img.id, variant)}
        />
      ))}
    </div>
  );
};