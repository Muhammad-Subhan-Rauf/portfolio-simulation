// Original relative path: components/Controls.jsx

import React, { useRef, useState } from 'react';
import { TEXTS } from '../constants';
import ColorPicker from './ColorPicker';

function Controls({
  currentIndex,
  maxIndex,
  speed,
  isPlaying,
  onFrameChange,
  onStepChange, // Receive the handler
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
  const [editingColorId, setEditingColorId] = useState(null);

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
    }
    event.target.value = null; 
  };

  const handleColorUpdate = (id, color) => {
    onUpdateDatasetColor(id, color);
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
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: dataset.color }}
                    onClick={() => setEditingColorId(editingColorId === dataset.id ? null : dataset.id)}
                    title="Change line color"
                  />
                  {editingColorId === dataset.id && (
                    <ColorPicker 
                      dataset={dataset} 
                      onUpdateDatasetColor={handleColorUpdate}
                      onClose={() => setEditingColorId(null)}
                    />
                  )}
                  <button onClick={() => onRemoveDataset(dataset.id)} className="remove-btn">
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="new-controls-container">
        {/* Step Section */}
        <div className="control-group">
          <label htmlFor="frame" className="neon-text">{TEXTS.controls_hour}</label>
          <div className="step-buttons">
            {/* Use the onStepChange handler here */}
            <button onClick={() => onStepChange(-1)} disabled={isDisabled || currentIndex <= 0}>◀</button>
            <button onClick={() => onStepChange(1)} disabled={isDisabled || currentIndex >= maxIndex}>▶</button>
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
          />
          <output id="frameVal" className="neon-text">{currentIndex}</output>
        </div>

        {/* Play/Pause Section */}
        <div className="control-group">
          <button onClick={onPlayPause} disabled={isDisabled} className="play-pause-btn neon-text">
            {isPlaying ? TEXTS.controls_pause : TEXTS.controls_play}
          </button>
        </div>
        
        {/* Speed Section */}
        <div className="control-group">
          <label htmlFor="speed" className="neon-text">{TEXTS.controls_speed}</label>
          <input
            type="range"
            id="speed"
            min="1"
            max="2000"
            step="20"
            value={speed}
            disabled={isDisabled}
            onInput={(e) => onSpeedChange(Number(e.target.value))}
          />
          <span className="small neon-text">{TEXTS.controls_speed_unit}</span>
        </div>
      </div>
    </>
  );
}

export default Controls;