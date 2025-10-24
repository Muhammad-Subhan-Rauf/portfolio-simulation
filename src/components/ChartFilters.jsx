import React, { useState } from 'react';
import './ChartFilters.css';

function ChartFilters({ filters, onFilterChange }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    onFilterChange({ ...filters, [name]: checked });
  };

  return (
    <div className={`chart-filters-container ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-button" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '›' : '‹'}
      </button>
      <div className="filters-content">
        <h3>FILTERS</h3>
        <div className="filter-item">
          <label htmlFor="showFalsePositives">
            <span className="legend-marker circle"></span>
            False Positives
          </label>
          <input
            type="checkbox"
            id="showFalsePositives"
            name="showFalsePositives"
            checked={filters.showFalsePositives}
            onChange={handleCheckboxChange}
          />
        </div>
        <div className="filter-item">
          <label htmlFor="showFalseNegatives">
            <span className="legend-marker triangle"></span>
            False Negatives
          </label>
          <input
            type="checkbox"
            id="showFalseNegatives"
            name="showFalseNegatives"
            checked={filters.showFalseNegatives}
            onChange={handleCheckboxChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ChartFilters;