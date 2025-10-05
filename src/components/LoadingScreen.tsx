import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
  duration?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  isVisible, 
  message = "Altering asteroid orbit", 
  duration = 3000 
}) => {
  const [displayText, setDisplayText] = useState('');

  // Random characters and math symbols for the loading effect
  const randomChars = useMemo(() => [
    'α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'σ', 'τ', 'φ', 'ψ', 'ω',
    '∑', '∏', '∫', '∂', '∇', '∆', '∞', '±', '×', '÷', '√', '∛', '∜', '≈', '≠', '≤', '≥',
    '∈', '∉', '⊂', '⊃', '∪', '∩', '∅', '∀', '∃', '∴', '∵', '→', '←', '↔', '↑', '↓',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
  ], []);

  useEffect(() => {
    if (!isVisible) {
      setDisplayText('');
      setIsAnimating(false);
      return;
    }

    setDisplayText('');

    // Animate random characters
    const animateChars = () => {
      let currentText = '';
      const messageLength = message.length;
      let charIndex = 0;

      const interval = setInterval(() => {
        if (charIndex < messageLength) {
          // Show random characters for current position
          const randomChar = randomChars[Math.floor(Math.random() * randomChars.length)];
          currentText = message.substring(0, charIndex) + randomChar;
          setDisplayText(currentText);
          
          // Move to next character after a few iterations
          if (Math.random() < 0.3) {
            charIndex++;
          }
        } else {
          // Show final message
          setDisplayText(message);
          clearInterval(interval);
          
          // Hide after duration
          setTimeout(() => {
            // Animation complete
          }, duration - 1000);
        }
      }, 100);

      return () => clearInterval(interval);
    };

    const cleanup = animateChars();
    return cleanup;
  }, [isVisible, message, duration, randomChars]);

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
        {/* Main loading message */}
        <h2 className="text-2xl font-mono text-white mb-4">
          {displayText}
        </h2>
        
        {/* Simple dots */}
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.3}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Render directly to document.body to ensure it's above everything
  return createPortal(loadingContent, document.body);
};

export default LoadingScreen;
