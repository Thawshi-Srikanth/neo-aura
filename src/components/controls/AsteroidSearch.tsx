import React, { useState, useMemo, useEffect, useRef } from 'react';
import { asteroidData } from '../../data/asteroids';
import type { Asteroid } from '../../types/asteroid';

interface AsteroidSearchProps {
  onAsteroidSelect: (asteroid: Asteroid, index: number) => void;
  selectedAsteroidIndex: number;
  onEnterPress?: (asteroid: Asteroid) => void;
  disabled?: boolean;
}

export const AsteroidSearch: React.FC<AsteroidSearchProps> = ({
  onAsteroidSelect,
  selectedAsteroidIndex,
  onEnterPress,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize search term with selected asteroid
  useEffect(() => {
    if (selectedAsteroidIndex >= 0 && selectedAsteroidIndex < asteroidData.length) {
      setSearchTerm(asteroidData[selectedAsteroidIndex].name);
    }
  }, [selectedAsteroidIndex]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAsteroids = useMemo(() => {
    if (!searchTerm.trim()) return asteroidData.slice(0, 10); // Show first 10 by default
    
    return asteroidData.filter(asteroid => 
      asteroid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asteroid.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleAsteroidClick = (asteroid: Asteroid) => {
    // Find the actual index in the original array
    const actualIndex = asteroidData.findIndex(a => a.id === asteroid.id);
    onAsteroidSelect(asteroid, actualIndex);
    setIsOpen(false);
    setSearchTerm(asteroid.name);
    
    // Also trigger the enter press handler when clicking
    if (onEnterPress) {
      console.log('Click triggered onEnterPress with:', asteroid.name);
      onEnterPress(asteroid);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log('Key pressed:', e.key);
    if (e.key === 'Enter') {
      e.preventDefault();
      console.log('Enter pressed, filtered asteroids:', filteredAsteroids.length);
      if (filteredAsteroids.length > 0) {
        const firstAsteroid = filteredAsteroids[0];
        console.log('First asteroid:', firstAsteroid.name);
        const actualIndex = asteroidData.findIndex(a => a.id === firstAsteroid.id);
        onAsteroidSelect(firstAsteroid, actualIndex);
        setSearchTerm(firstAsteroid.name);
        setIsOpen(false);
        
        // Call the enter press handler if provided
        if (onEnterPress) {
          console.log('Calling onEnterPress with:', firstAsteroid.name);
          onEnterPress(firstAsteroid);
        }
      }
    }
  };

  const selectedAsteroid = asteroidData[selectedAsteroidIndex];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="glass-panel p-3">
        <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">
          Asteroid Search
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search asteroids by name or ID... (Press Enter to simulate impact)"
            disabled={disabled}
            className="w-full px-3 py-2 bg-black/60 border border-white/30 text-white text-sm rounded-md focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black/95 border border-white/20 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
              {filteredAsteroids.length > 0 ? (
                filteredAsteroids.map((asteroid) => (
                  <button
                    key={asteroid.id}
                    onClick={() => handleAsteroidClick(asteroid)}
                    className="w-full px-3 py-2 text-left text-white hover:bg-white/10 transition-colors text-sm border-b border-white/10 last:border-b-0"
                  >
                    <div className="font-medium">{asteroid.name}</div>
                    <div className="text-xs text-white/60">
                      ID: {asteroid.id} | Size: {asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-white/60 text-sm">
                  No asteroids found
                </div>
              )}
            </div>
          )}
        </div>
        {selectedAsteroid && (
          <div className="mt-2 text-xs text-white/80">
            Selected: {selectedAsteroid.name}
          </div>
        )}
      </div>
    </div>
  );
};
