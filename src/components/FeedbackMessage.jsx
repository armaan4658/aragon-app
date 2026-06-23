import React from 'react';

export const FeedbackMessage = ({ feedback }) => {
  if (!feedback) return null;

  const isError = feedback.type === 'error';

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        fontWeight: '500',
        backgroundColor: isError ? '#fef2f2' : '#ecfdf5',
        color: isError ? '#991b1b' : '#065f46',
        border: `1px solid ${isError ? '#fca5a5' : '#a7f3d0'}`,
      }}
    >
      {feedback.message}
    </div>
  );
};