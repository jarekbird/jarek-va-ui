import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container" data-testid="loading-spinner">
      <div className="loading-spinner" />
    </div>
  );
};
