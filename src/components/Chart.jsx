// Original relative path: components/Chart.jsx

// Original relative path: components/Chart.jsx

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';

const theme = { primary: '#FF0043', gridColor: 'rgba(255, 0, 67, 0.2)', textColor: '#FF0043' };

// SVG filter for the line glow effect
// This component returns standard SVG elements that React can render.
const GlowFilter = ({ color }) => (
  <filter id={`glow-${color.replace('#', '')}`} x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="4" result="coloredBlur" in="SourceGraphic" />
    <feMerge>
      <feMergeNode in="coloredBlur" />
      <feMergeNode in="SourceGraphic" />
    </feMerge>
  </filter>
);


function Chart({ datasets, currentIndex }) {

  const yDomain = useMemo(() => {
    if (!datasets || datasets.length === 0) return ['auto', 'auto'];
    
    let allPnlValues = [];
    datasets.forEach(d => {
        allPnlValues = allPnlValues.concat(d.data.pnl);
    });

    if (allPnlValues.length === 0) return ['auto', 'auto'];

    const minY = Math.min(...allPnlValues, 0);
    const maxY = Math.max(...allPnlValues, 0);
    const paddingY = (maxY - minY) * 0.2 || 1;
    return [minY - paddingY, maxY + paddingY];
  }, [datasets]);

  if (!datasets || datasets.length === 0) {
    return <div style={{ width: 960, height: 540, border: `1px solid ${theme.gridColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Please load a data file to display the chart.</div>;
  }
  
  return (
    <div style={{ width: '100%', maxWidth: '960px', height: 'auto', aspectRatio: '960/540' }}>
      <ResponsiveContainer>
        <LineChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          
          {/* Use the standard SVG <defs> element directly to define filters */}
          <defs>
            {datasets.map(d => <GlowFilter key={d.id} color={d.color} />)}
          </defs>

          <CartesianGrid stroke={theme.gridColor} />
          
          <XAxis
            allowDecimals={false}
            tick={false}
            axisLine={{ stroke: theme.primary }}
          />

          <YAxis
            domain={yDomain}
            tick={{ fill: theme.textColor, fontSize: 12, fontFamily: "'Fira Code', monospace" }}
            tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
            axisLine={{ stroke: theme.primary }}
            tickLine={{ stroke: theme.primary }}
          />

          <ReferenceLine y={0} stroke={theme.primary} strokeDasharray="2 2" />

          {datasets.map(d => {
            const chartData = d.data.pnl.map((pnlValue, index) => ({ index, pnl: pnlValue }));
            const currentPnlValue = chartData[currentIndex]?.pnl;
            const filterId = `url(#glow-${d.color.replace('#', '')})`;

            return (
              <React.Fragment key={d.id}>
                {/* Full line with opacity */}
                <Line
                  data={chartData}
                  dataKey="pnl"
                  type="monotone"
                  stroke={d.color}
                  strokeOpacity={0.3}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                {/* Active part of the line with glow */}
                <Line
                  data={chartData.slice(0, currentIndex + 1)}
                  dataKey="pnl"
                  type="monotone"
                  stroke={d.color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                  style={{ filter: filterId }}
                />
                {/* Reference dot on the active line */}
                {currentPnlValue !== undefined && (
                  <ReferenceDot
                    x={currentIndex}
                    y={currentPnlValue}
                    r={4}
                    fill={d.color}
                    stroke="none"
                    isFront={true}
                  />
                )}
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default React.memo(Chart);