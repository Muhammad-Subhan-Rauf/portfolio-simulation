// Original relative path: components/Controls.jsx

import React, { useRef, useState, useEffect } from 'react';
import { TEXTS } from '../constants';

/**
 * A memoized and optimized color picker component.
 * It uses local state to avoid re-rendering the entire app while the color is being changed.
 * The final color is committed only when the input loses focus (onBlur).
 */
const OptimizedColorPicker = React.memo(({ initialColor, onColorChange }) => {
  // Local state to manage the color picker's value without causing global re-renders.
  const [color, setColor] = useState(initialColor);

  // Sync with external changes if needed.
  useEffect(() => {
    setColor(initialColor);
  }, [initialColor]);

  // Update local state on every input change for a responsive UI.
  const handleInputChange = (e) => {
    setColor(e.target.value);
  };

  // Commit the final color to the parent state only when the user is done.
  const handleBlur = () => {
    onColorChange(color);
  };

  return (
    <input
      type="color"
      value={color}
      onChange={handleInputChange}
      onBlur={handleBlur}
      className="color-picker"
      title="Change line color"
    />
  );
});

const DatasetList = ({ datasets, onColorChange }) => {
  if (!datasets || datasets.length === 0) {
    return null;
  }

  return (
    <div className="dataset-list">
      <ul>
        {datasets.map(d => (
          <li key={d.id}>
            <OptimizedColorPicker
              initialColor={d.color}
              onColorChange={(newColor) => onColorChange(d.id, newColor)}
            />
            <span className="dataset-name">{d.name}{d.isOptimal && ' (Optimal)'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


function Controls({
  currentIndex,
  maxIndex,
  speed,
  isPlaying,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
  onFileSelect,
  onOptimalFileSelect,
  onColorChange,
  fileStatus,
  isDisabled,
  onStepChange,
  datasets,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(Array.from(files));
      // Reset the input value to allow re-uploading the same file
      event.target.value = null;
    }
  };

  return (
    <>
      <div className="row file-loader-container">
        <div className="file-buttons">
            <label htmlFor="fileInput" className="button-like">
              {TEXTS.file_loader_label}
            </label>
            <input
              type="file"
              id="fileInput"
              accept=".json"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <button onClick={onOptimalFileSelect} className="button-like optimal-button">
              {TEXTS.add_optimal_json}
            </button>
        </div>
        <span className="small file-status">{fileStatus}</span>
      </div>
      
      <DatasetList datasets={datasets} onColorChange={onColorChange} />


      <div className="row controls">
        <div className="row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <label htmlFor="frame">{TEXTS.controls_hour}</label>
            <div>
              <button
                onClick={() => onStepChange(-1)}
                disabled={isDisabled || currentIndex === 0}
                className="step-button"
                aria-label="Previous Step"
              >
                ◄
              </button>
              <button
                onClick={() => onStepChange(1)}
                disabled={isDisabled || currentIndex >= maxIndex}
                className="step-button"
                aria-label="Next Step"
              >
                ►
              </button>
            </div>
          </div>
          
          <input
            type="range"
            id="frame"
            min="0"
            max={maxIndex}
            value={currentIndex}
            step="1"
            disabled={isDisabled}
            onInput={(e) => onFrameChange(Number(e.target.value))}
            style={{ flexGrow: 1 }}
          />
          <output id="frameVal">{currentIndex}</output>
        </div>
        <div className="row">
          <button onClick={onPlayPause} disabled={isDisabled}>
            {isPlaying ? TEXTS.controls_pause : TEXTS.controls_play}
          </button>
        </div>
        <div className="row">
          <label htmlFor="speed">{TEXTS.controls_speed}</label>
          <input
            type="range"
            id="speed"
            min="0"
            max="2000"
            step="20"
            value={speed}
            onInput={(e) => onSpeedChange(Number(e.target.value))}
          />
          <span className="small">{TEXTS.controls_speed_unit}</span>
        </div>
      </div>
    </>
  );
}

export default React.memo(Controls);