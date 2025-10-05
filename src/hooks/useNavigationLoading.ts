import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useNavigationLoading = () => {
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    // Reset navigation state when route changes
    setIsNavigating(false);
  }, [location.pathname]);

  const startNavigation = (message: string) => {
    setIsNavigating(true);
    setLoadingMessage(message);
  };

  const endNavigation = () => {
    setIsNavigating(false);
  };

  return {
    isNavigating,
    loadingMessage,
    startNavigation,
    endNavigation
  };
};
