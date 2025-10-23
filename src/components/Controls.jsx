// Original relative path: components/Controls.jsx

import React, { useRef, useState, useEffect } from 'react';
import { TEXTS } from '../constants';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function DatasetColorPicker({ dataset, onUpdateDatasetColor }) {
  const [color, setColor] = useState(dataset.color);
  const debouncedColor = useDebounce(color, 500);

  useEffect(() => {
    if (debouncedColor && debouncedColor !== dataset.color) {
      onUpdateDatasetColor(dataset.id, debouncedColor);
    }
  }, [debouncedColor, dataset.id, dataset.color, onUpdateDatasetColor]);

  return (
    <input 
      type="color" 
      value={color} 
      onChange={(e) => setColor(e.target.value)}
      title="Select line color"
    />
  );
}

function Controls({
  currentIndex,
  maxIndex,
  speed,
  isPlaying,
  onFrameChange,
  onPlayPause,
  onSpeedChange,
  onFileSelect,
  fileStatus,
  isDisabled,
  datasets,
  onRemoveDataset,
  onUpdateDatasetColor,
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
    event.target.value = null; 
  };

  return (
    <>
      <div className="row file-loader">
        <label htmlFor="fileInput" className="button-like" id="file_loader_label">
          {TEXTS.file_loader_label}
        </label>
        <input
          type="file"
          id="fileInput"
          accept=".json"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
        />
        <span className="small" id="file_status">{fileStatus}</span>
      </div>

      {datasets && datasets.length > 0 && (
        <div className="file-list">
          <ul>
            {datasets.map(dataset => (
              <li key={dataset.id}>
                <span>{dataset.fileName}</span>
                <div className="file-actions">
                  <DatasetColorPicker 
                    dataset={dataset} 
                    onUpdateDatasetColor={onUpdateDatasetColor} 
                  />
                  <button onClick={() => onRemoveDataset(dataset.id)} className="remove-btn">
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="row controls">
        <div className="row">
          <label htmlFor="frame">{TEXTS.controls_hour}</label>
          <input
            type="range"
            id="frame"
            min="0"
            max={maxIndex}
            value={currentIndex}
            step="1"
            disabled={isDisabled}
            onInput={(e) => onFrameChange(Number(e.target.value))}
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
            min="1"
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

export default Controls;