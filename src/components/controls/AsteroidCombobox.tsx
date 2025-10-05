"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { asteroidData } from '../../data/asteroids';
import type { Asteroid } from '../../types/asteroid';

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AsteroidComboboxProps {
  onAsteroidSelect: (asteroid: Asteroid, index: number) => void;
  selectedAsteroidIndex: number;
  onEnterPress?: (asteroid: Asteroid) => void;
  disabled?: boolean;
}

export const AsteroidCombobox: React.FC<AsteroidComboboxProps> = ({
  onAsteroidSelect,
  selectedAsteroidIndex,
  onEnterPress,
  disabled = false
}) => {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  // Initialize value with selected asteroid
  React.useEffect(() => {
    if (selectedAsteroidIndex >= 0 && selectedAsteroidIndex < asteroidData.length) {
      const asteroid = asteroidData[selectedAsteroidIndex];
      setValue(asteroid.id);
    }
  }, [selectedAsteroidIndex]);

  const selectedAsteroid = asteroidData.find(asteroid => asteroid.id === value);

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value ? "" : currentValue;
    setValue(newValue);
    setOpen(false);
    
    if (newValue) {
      const asteroid = asteroidData.find(a => a.id === newValue);
      if (asteroid) {
        const actualIndex = asteroidData.findIndex(a => a.id === asteroid.id);
        onAsteroidSelect(asteroid, actualIndex);
        
        // Automatically trigger navigation to simulation
        if (onEnterPress) {
          onEnterPress(asteroid);
        }
      }
    }
  };

  return (
    <div className="glass-panel p-3">
      <label className="block text-xs text-white/60 uppercase tracking-wider mb-2">
        Asteroid Search
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-black/60 border-white/30 text-white hover:bg-white/10"
            disabled={disabled}
          >
            {selectedAsteroid ? selectedAsteroid.name : "Select asteroid..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-black/95 border-white/20">
          <Command>
            <CommandInput 
              placeholder="Search asteroids by name or ID..." 
              className="h-9 bg-transparent text-white placeholder:text-white/60"
            />
            <CommandList>
              <CommandEmpty>No asteroid found.</CommandEmpty>
              <CommandGroup>
                {asteroidData.map((asteroid) => (
                  <CommandItem
                    key={asteroid.id}
                    value={asteroid.id}
                    onSelect={handleSelect}
                    className="text-white hover:bg-white/10 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <div className="font-medium">{asteroid.name}</div>
                      <div className="text-xs text-white/60">
                        ID: {asteroid.id} | Size: {asteroid.estimated_diameter.meters.estimated_diameter_max.toFixed(0)}m
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === asteroid.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedAsteroid && (
        <div className="mt-2 text-xs text-white/80">
          Selected: {selectedAsteroid.name}
        </div>
      )}
    </div>
  )
}
