import React from 'react';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ 
  value, 
  onValueChange, 
  max = 100, 
  min = 0, 
  step = 1, 
  className = '' 
}) => (
  <input
    id="slider-input"
    type="range"
    value={value[0] || 0}
    onChange={(e) => onValueChange([Number(e.target.value)])}
    max={max}
    min={min}
    step={step}
    aria-label="Slider value selector"
    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${className}`}
  />
); 