import React, { createContext, useContext, useState, ReactNode } from 'react';
import LoadingScreen from '../components/LoadingScreen';

interface NavigationContextType {
  isNavigating: boolean;
  loadingMessage: string;
  startNavigation: (message: string) => void;
  endNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startNavigation = (message: string) => {
    console.log('🚀 Starting navigation:', message);
    setIsNavigating(true);
    setLoadingMessage(message);
  };

  const endNavigation = () => {
    console.log('✅ Ending navigation');
    setIsNavigating(false);
  };

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        loadingMessage,
        startNavigation,
        endNavigation,
      }}
    >
      {children}
      {isNavigating && (
        <LoadingScreen 
          isVisible={true} 
          message={loadingMessage} 
        />
      )}
    </NavigationContext.Provider>
  );
};
