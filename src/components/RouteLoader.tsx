import React, { useState, useEffect, useRef } from 'react';
import LoadingScreen from './LoadingScreen';
import { useNavigation } from '../contexts/NavigationContext';

interface RouteLoaderProps {
  children: React.ReactNode;
  loadingMessage?: string;
  minLoadingTime?: number;
}

const RouteLoader: React.FC<RouteLoaderProps> = ({ 
  children, 
  loadingMessage = "Loading...",
  minLoadingTime = 1000 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const startTime = useRef(Date.now());
  const { endNavigation } = useNavigation();

  useEffect(() => {
    // Set a minimum loading time to prevent flash
    const minTime = minLoadingTime;
    const elapsed = Date.now() - startTime.current;
    const remainingTime = Math.max(0, minTime - elapsed);

    const timer = setTimeout(() => {
      if (isComponentReady) {
        setIsLoading(false);
        // Add a small delay before ending navigation to ensure smooth transition
        setTimeout(() => {
          endNavigation();
        }, 200);
      }
    }, remainingTime);

    return () => clearTimeout(timer);
  }, [isComponentReady, minLoadingTime, endNavigation]);

  // Check if component is ready
  useEffect(() => {
    // Use multiple requestAnimationFrame calls to ensure DOM is fully ready
    const checkReady = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsComponentReady(true);
          });
        });
      });
    };

    // Longer delay to ensure component has fully rendered
    const timer = setTimeout(checkReady, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <LoadingScreen 
        isVisible={true} 
        message={loadingMessage} 
      />
    );
  }

  return <>{children}</>;
};

export default RouteLoader;
