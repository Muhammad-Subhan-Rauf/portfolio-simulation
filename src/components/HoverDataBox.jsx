import React from 'react';
import { fmt } from '../utils/formatters';

// Simple inline styles for the component
const styles = {
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid #FF0043',
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
    borderCollapse: 'collapse',
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
  }
};

function HoverDataBox({ data }) {
  if (!data) {
    return null; // Don't render if no data is provided
  }

  // Helper to format date strings consistently
  const formatDateTime = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>HOVERED POINT DATA</h3>
      <table style={styles.table}>
        <tbody>
          <tr>
            <td style={styles.labelCell}>Crypto:</td>
            <td style={styles.valueCell}>{data.crypto}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>Time Open:</td>
            <td style={styles.valueCell}>{formatDateTime(data.timeOpen)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>Time Closed:</td>
            <td style={styles.valueCell}>{formatDateTime(data.timeClosed)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>Price Open:</td>
            <td style={styles.valueCell}>{fmt(data.priceOpen, 6)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>Price Close:</td>
            <td style={styles.valueCell}>{fmt(data.priceClose, 6)}</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>P&L:</td>
            <td style={styles.valueCell}>{fmt(data.pnl, 2)}$</td>
          </tr>
          <tr>
            <td style={styles.labelCell}>Best Choice:</td>
            <td style={styles.valueCell}>{data.bestChoice}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default HoverDataBox;