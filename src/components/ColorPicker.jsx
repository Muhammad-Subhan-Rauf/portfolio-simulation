// Original relative path: components/ColorPicker.jsx

import React, { useState, useEffect, useRef } from 'react';
import { PRESET_COLORS } from '../constants'; // Import from constants

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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