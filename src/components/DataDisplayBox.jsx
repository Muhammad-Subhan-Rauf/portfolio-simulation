// Original relative path: components/DataDisplayBox.jsx

// Original relative path: components/DataDisplayBox.jsx

import React from 'react';
import { fmt } from '../utils/formatters';

const styles = {
  container: {
    padding: '12px',
    color: '#FFFFFF',
    fontFamily: "'Fira Code', monospace",
    fontSize: '13px',
    marginTop: '15px'
  },
  header: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#FF0043',
    textAlign: 'center',
    fontSize: '14px',
  },
  table: {
    width: '100%',
  },
  labelCell: {
    padding: '4px',
    fontWeight: 'bold',
    color: '#FF0043',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  valueCell: {
    padding: '4px',
    textAlign: 'right',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  navButton: {
    background: 'none',
    color: '#FF0043',
    cursor: 'pointer',
    padding: '4px 12px',
    fontFamily: "'Fira Code', monospace",
  }
};

// Helper function to format keys from snake_case to Title Case
const formatLabel = (key) => {
  if (key === 'pnl') return 'P&L';
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

// Helper function to format values based on their key or type
const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "NULL") return 'N/A';
    
    if (typeof value === 'number') {
        if (key.includes('price')) return fmt(value, 6);
        if (key.includes('profit') || key.includes('pnl')) return `${fmt(value, 2)}$`;
        if (key.includes('quantity') || key.includes('value')) return fmt(value, 2);
        return fmt(value);
    }

    if (typeof value === 'string' && (key.includes('date') || key.includes('data'))) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        }
    }
    
    return String(value);
};


function DataDisplayBox({ hoverData, pinnedData, pinnedDataIndex, onPinnedIndexChange }) {
  const dataToShow = pinnedData ? pinnedData[pinnedDataIndex] : hoverData;

  if (!dataToShow) {
    return null;
  }
  
  const isPinned = !!pinnedData;

  // Filter out internal properties we don't want to display
  const displayableEntries = Object.entries(dataToShow).filter(([key]) => 
    !key.endsWith('_index') && key !== 'type' && !key.endsWith('symbol_index')
  );

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>
        {isPinned ? `PINNED DATA (${pinnedDataIndex + 1} of ${pinnedData.length})` : 'HOVERED POINT DATA'}
      </h3>
      <table style={styles.table} className='no-bords'>
        <tbody>
          {displayableEntries.map(([key, value]) => (
            <tr key={key}>
              <td style={styles.labelCell} className='no-bords'>{formatLabel(key)}:</td>
              <td style={styles.valueCell} className='no-bords'>{formatValue(key, value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isPinned && pinnedData.length > 1 && (
        <div style={styles.navigation}>
          <button 
            style={styles.navButton} 
            onClick={() => onPinnedIndexChange(-1)} 
            disabled={pinnedDataIndex === 0}
          >
            ◀
          </button>
          <button 
            style={styles.navButton} 
            onClick={() => onPinnedIndexChange(1)} 
            disabled={pinnedDataIndex === pinnedData.length - 1}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

export default DataDisplayBox;