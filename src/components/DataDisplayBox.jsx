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

function DataDisplayBox({ hoverData, pinnedData, pinnedDataIndex, onPinnedIndexChange }) {
  const dataToShow = pinnedData ? pinnedData[pinnedDataIndex] : hoverData;

  if (!dataToShow) {
    return null;
  }

  const formatDateTime = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const isPinned = !!pinnedData;

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>
        {isPinned ? `PINNED DATA (${pinnedDataIndex + 1} of ${pinnedData.length})` : 'HOVERED POINT DATA'}
      </h3>
      <table style={styles.table} className='no-bords'>
        <tbody>
          <tr>
            <td style={styles.labelCell} className='no-bords'>Crypto:</td>
            <td style={styles.valueCell} className='no-bords'>{dataToShow.crypto}</td>
          </tr>
          <tr>
            <td style={styles.labelCell} className='no-bords'>Time Open:</td>
            <td style={styles.valueCell} className='no-bords'>{formatDateTime(dataToShow.timeOpen)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell} className='no-bords'>Time Closed:</td>
            <td style={styles.valueCell} className='no-bords'>{formatDateTime(dataToShow.timeClosed)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell} className='no-bords'>Price Open:</td>
            <td style={styles.valueCell} className='no-bords'>{fmt(dataToShow.priceOpen, 6)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell} className='no-bords'>Price Close:</td>
            <td style={styles.valueCell} className='no-bords'>{fmt(dataToShow.priceClose, 6)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell} className='no-bords'>P&L:</td>
            <td style={styles.valueCell} className='no-bords'>{fmt(dataToShow.pnl, 2)}$</td>
          </tr>
          <tr>
            <td style={styles.labelCell} className='no-bords'>Best Choice:</td>
            <td style={styles.valueCell} className='no-bords'>{dataToShow.bestChoice}</td>
          </tr>
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