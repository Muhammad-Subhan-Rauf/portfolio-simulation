// Original relative path: components/DatasetSelector.jsx

import React, { useState, useEffect, useRef } from 'react';

function DatasetSelector({ datasets, selectedId, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedDataset = datasets.find(ds => ds.id === selectedId);
  const selectorRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectorRef]);

  const handleSelect = (id) => {
    onSelect(id);
    setIsOpen(false);
  };

  if (!selectedDataset) {
    return <div className="dataset-selector-placeholder">No dataset selected</div>;
  }

  return (
    <div className="dataset-selector" ref={selectorRef}>
      <button className="selector-button" onClick={() => setIsOpen(!isOpen)}>
        <span>Metrics for: <b>{selectedDataset.fileName}</b></span>
        <span className={`arrow ${isOpen ? 'up' : 'down'}`}></span>
      </button>
      {isOpen && (
        <ul className="selector-list">
          {datasets.map(ds => (
            <li
              key={ds.id}
              className={ds.id === selectedId ? 'selected' : ''}
              onClick={() => handleSelect(ds.id)}
            >
              {ds.fileName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DatasetSelector;