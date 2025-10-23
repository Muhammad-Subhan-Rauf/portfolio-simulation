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

  const handleStep = (direction) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex <= maxIndex) {
      onFrameChange(newIndex); // This function already pauses the playback
    }
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

      {/* --- MODIFIED CONTROLS SECTION --- */}
      <div className="controls-wrapper">
        <div className="row step-control-group">
          <div className="step-label-group">
            <label className="step-label" htmlFor="frame">{TEXTS.controls_hour}</label>
            <div className="step-buttons">
              <button 
                className="step-button" 
                onClick={() => handleStep(-1)} 
                disabled={isDisabled || currentIndex <= 0}
                title="Step Back"
              >◀</button>
              <button 
                className="step-button" 
                onClick={() => handleStep(1)} 
                disabled={isDisabled || currentIndex >= maxIndex}
                title="Step Forward"
              >▶</button>
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
          />
          <output id="frameVal">{currentIndex}</output>
        </div>

        <div className="row play-speed-group">
          <button onClick={onPlayPause} disabled={isDisabled}>
            {isPlaying ? TEXTS.controls_pause : TEXTS.controls_play}
          </button>
          <div className="speed-control">
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
          </div>
        </div>
      </div>
    </>
  );
}

export default Controls;