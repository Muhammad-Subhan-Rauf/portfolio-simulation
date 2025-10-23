import React from 'react';
import { TEXTS } from '../constants';
import { fmt } from '../utils/formatters';

function Metrics({ currentData }) {
  if (!currentData) return <div className="metrics">Loading metrics...</div>;
  
  const { date, cash, cashout, positions_value, pnl } = currentData;

  const formattedDateTime = date
    ? new Date(date).toLocaleString(TEXTS.locale, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
    : 'N/A';
  
  return (
    <div className="metrics" id="metrics">
        <div className="metrics-grid">
            <span>{TEXTS.metrics_datetime}:</span><span className="metrics-value">{formattedDateTime}</span>
            <span>{TEXTS.metrics_available_money}:</span><span className="metrics-value">{fmt(cash, 2)}$</span>
            <span>{TEXTS.metrics_cashout}:</span><span className="metrics-value">{fmt(cashout, 2)}$</span>
            <span>{TEXTS.metrics_position_values}:</span><span className="metrics-value">{fmt(positions_value, 2)}$</span>
            <span>{TEXTS.metrics_pnl_cumulated}:</span><span className="metrics-value">{fmt(pnl, 2)}$</span>
        </div>
    </div>
  );
}

// ... component code remains the same
export default React.memo(Metrics);