import React, { useState } from 'react';
import { TerminalInterface } from './TerminalInterface';

interface DeflectAsteroidButtonProps {
  onDeflectionAttempt?: (success: boolean) => void;
  asteroidId?: string;
}

export const DeflectAsteroidButton: React.FC<DeflectAsteroidButtonProps> = ({
  onDeflectionAttempt,
  asteroidId
}) => {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);


  // Listen for the custom event to open terminal
  React.useEffect(() => {
    const handleOpenDeflectTerminal = () => {
      setIsTerminalOpen(true);
    };

    window.addEventListener('openDeflectTerminal', handleOpenDeflectTerminal);
    return () => {
      window.removeEventListener('openDeflectTerminal', handleOpenDeflectTerminal);
    };
  }, []);

  const handleCloseTerminal = () => {
    setIsTerminalOpen(false);
  };

  const handleCommand = (command: string) => {
    // Handle deflection results
    if (command.startsWith('deflect ') && onDeflectionAttempt) {
      // Simple success/failure logic based on command
      const success = Math.random() > 0.3; // 70% success rate
      onDeflectionAttempt(success);
    }
  };

  return (
    <>
      {isTerminalOpen && (
        <TerminalInterface
          onCommand={handleCommand}
          isVisible={isTerminalOpen}
          onClose={handleCloseTerminal}
          asteroidId={asteroidId}
        />
      )}
    </>
  );
};