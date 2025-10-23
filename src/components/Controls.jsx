import React, { useRef } from 'react';
import { TEXTS } from '../constants';

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
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      onFileSelect(file);
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
        />
        <span className="small" id="file_status">{fileStatus}</span>
      </div>

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