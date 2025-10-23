// Original relative path: components/Chart.jsx

import React, { useRef, useEffect, useMemo } from 'react';

const theme = { primary: '#FF0043', secondary: '#5D71FC', gridColor: 'rgba(255, 0, 67, 0.2)', textColor: '#FF0043' };

// Helper function for smooth line drawing (Cardinal Spline)
function drawSmoothLine(ctx, points) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  const tension = 0.4;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  }
  ctx.stroke();
}

function Chart({ data, currentIndex }) {
  const canvasRef = useRef(null);

  // The Y-axis bounds are still calculated based on the ENTIRE dataset.
  // This is crucial to prevent the vertical scale from jumping around during playback.
  const chartBounds = useMemo(() => {
    if (!data?.pnl) return { yMin: -1, yMax: 1 };
    const pnlValues = data.pnl;
    const minY = Math.min(...pnlValues, 0);
    const maxY = Math.max(...pnlValues, 0);
    const paddingY = (maxY - minY) * 0.2 || 1;
    return { yMin: minY - paddingY, yMax: maxY + paddingY };
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    
    const ctx = canvas.getContext('2d');
    const { yMin, yMax } = chartBounds;

    const m = { left: 70, right: 20, top: 20, bottom: 40 };
    const w = canvas.width - m.left - m.right;
    const h = canvas.height - m.top - m.bottom;

    // ====================================================================
    // START: MODIFIED COORDINATE LOGIC
    // ====================================================================
    
    // The `getPoint` function now scales the X-coordinate based on the `currentIndex`.
    // `index / currentIndex` ensures that when i === currentIndex, x === w (the far right).
    const getPoint = (index, currentVisibleMaxIndex) => {
      const pnlValue = data.pnl[index];
      // Prevent division by zero when only the first point is visible.
      const x = (currentVisibleMaxIndex > 0) ? (index / currentVisibleMaxIndex) * w : 0;
      const y = h - ((pnlValue - yMin) / (yMax - yMin)) * h;
      return { x, y };
    };
    
    // ====================================================================
    // END: MODIFIED COORDINATE LOGIC
    // ====================================================================

    // Clear and draw static elements (axes, grid, labels) - No changes here
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(m.left, m.top);
    ctx.font = "12px 'Fira Code', monospace";
    ctx.strokeStyle = theme.primary;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, h);
    ctx.lineTo(w, h);
    ctx.stroke();
    
    const y0 = h - ((0 - yMin) / (yMax - yMin)) * h;
    if (y0 > 0 && y0 < h) {
      ctx.save();
      ctx.strokeStyle = theme.primary;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(w, y0);
      ctx.stroke();
      ctx.restore();
    }

    for (let i = 0; i <= 5; i++) {
        const yVal = yMin + (i / 5) * (yMax - yMin);
        const y = h - (i / 5) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.strokeStyle = theme.gridColor;
        ctx.stroke();
        ctx.fillStyle = theme.textColor;
        ctx.fillText(yVal.toFixed(2), -65, y + 4);
    }
    
    // Generate the points for the visible portion of the data
    const pointsToDraw = [];
    for (let i = 0; i <= currentIndex; i++) {
        pointsToDraw.push(getPoint(i, currentIndex));
    }
    
    // Draw the smooth blue line
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 2;
    if (pointsToDraw.length > 1) {
      drawSmoothLine(ctx, pointsToDraw);
    }
    
    // Draw the red dot at the current position (which is always the last point)
    if (pointsToDraw.length > 0) {
      const lastPoint = pointsToDraw[pointsToDraw.length - 1];
      ctx.fillStyle = theme.primary;
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.restore();

  }, [data, currentIndex, chartBounds]);

  return <canvas ref={canvasRef} id="canvas" width="960" height="540"></canvas>;
}

export default Chart;