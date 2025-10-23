// Original relative path: components/ColorPicker.jsx

import React, { useState, useEffect, useRef } from 'react';

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// New color palette from the image, plus theme colors
const PRESET_COLORS = [
  '#FF0043', // Theme Primary
  '#5D71FC', // Theme Secondary
  '#CF8863', // Orange
  '#CFC363', // Yellow
  '#6D9C72', // Green
  '#4E95EE', // Blue
  '#B57DFF', // Lavender
  '#C36CE6', // Purple
];

function ColorPicker({ dataset, onUpdateDatasetColor, onClose }) {
  const [color, setColor] = useState(dataset.color);
  const debouncedColor = useDebounce(color, 500);
  const pickerRef = useRef(null);

  // Effect to update color in parent component
  useEffect(() => {
    if (debouncedColor && debouncedColor !== dataset.color) {
      onUpdateDatasetColor(dataset.id, debouncedColor);
    }
  }, [debouncedColor, dataset.id, dataset.color, onUpdateDatasetColor]);

  // Effect to handle clicks outside the picker
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerRef, onClose]);

  return (
    <div className="color-picker-container" ref={pickerRef}>
      <div className="color-presets">
        {PRESET_COLORS.map(preset => (
          <button
            key={preset}
            className="color-preset-swatch"
            style={{ backgroundColor: preset }}
            onClick={() => setColor(preset)}
            title={preset}
          />
        ))}
      </div>
      <div className="color-input-wrapper">
        #<input
          type="text"
          className="color-input"
          value={color.replace('#', '')}
          onChange={(e) => setColor(`#${e.target.value.substring(0, 6)}`)}
          maxLength="7"
        />
      </div>
    </div>
  );
}

export default ColorPicker;