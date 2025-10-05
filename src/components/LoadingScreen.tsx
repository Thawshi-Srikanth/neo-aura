import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isVisible, 
  message = "Loading..." 
}) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isVisible) {
      setDots('');
      return;
    }

    let dotCount = 0;
    const interval = setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setDots('.'.repeat(dotCount));
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const loadingContent = (
    <div 
      className="fixed inset-0 bg-black flex items-center justify-center" 
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh'
      }}
    >
      <div className="text-center">
        {/* Simple spinner */}
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        
        {/* Clean message */}
        <div className="text-white/80 text-sm font-medium">
          {message}{dots}
        </div>
      </div>
    </div>
  );

  return createPortal(loadingContent, document.body);
};

export default LoadingScreen;
