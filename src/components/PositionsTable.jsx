import React from 'react';
import { TEXTS } from '../constants';
import { fmt } from '../utils/formatters';

function PositionsTable({ type, positions }) {
  const isOpen = type === 'open';
  const caption = isOpen ? TEXTS.open_positions_caption : TEXTS.closed_positions_caption;
  const noDataText = isOpen ? TEXTS.open_positions_none : TEXTS.closed_positions_none;
  const headers = isOpen
    ? [TEXTS.open_positions_symbol, TEXTS.open_positions_quantity, TEXTS.open_positions_purchase_price, TEXTS.open_positions_current_price, TEXTS.open_positions_value]
    : [TEXTS.closed_positions_symbol, TEXTS.closed_positions_quantity, TEXTS.closed_positions_purchase_price, TEXTS.closed_positions_current_price, TEXTS.closed_positions_value, TEXTS.closed_positions_pnl, TEXTS.closed_positions_pnl_pct];

  return (
    <div style={{ marginTop: '24px' }}>
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {headers.map(header => <th key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {(!positions || positions.length === 0) ? (
            <tr>
              <td colSpan={headers.length}><i>{noDataText}</i></td>
            </tr>
          ) : (
            positions.map((r, index) => (
              <tr key={`${r.symbol}-${index}`}>
                <td style={{ textAlign: 'left' }}>{r.symbol}</td>
                <td className="tableValue">{fmt(r.asset_quantity, 4)}</td>
                <td className="tableValue">{fmt(r.initial_price_close, 6)}</td>
                <td className="tableValue">{fmt(r.current_price_close, 6)}</td>
                <td className="tableValue">{fmt(r.value, 2)}</td>
                {!isOpen && (
                  <>
                    <td className="tableValue">{fmt(r.profit_and_loss, 2)}</td>
                    <td className="tableValue">{fmt(r.profit_and_loss_percentage, 2)}%</td>
                  </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PositionsTable;