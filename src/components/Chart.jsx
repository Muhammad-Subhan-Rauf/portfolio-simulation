// Original relative path: components/Chart.jsx

// Original relative path: components/Chart.jsx

import React, { useRef, useEffect, useMemo, useState } from "react";
import "./Chart.css"; // Import a new CSS file for the chart component

const theme = {
    primary: "#FF0043",
    gridColor: "rgba(255, 0, 67, 0.2)",
    textColor: "#FF0043",
};

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
        const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.stroke();
}

function Chart({
    datasets,
    currentIndex,
    zoomRange,
    onZoomChange,
    onZoomReset,
}) {
    const canvasRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [selection, setSelection] = useState(null);
    const badPurchasePointsRef = useRef([]);
    const [highlightedSegment, setHighlightedSegment] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    const [filters, setFilters] = useState({
        falsePositive: false,
        falseNegative: false,
    });

    // Memoize the complete list of all suboptimal points across all datasets.
    // This is only recalculated if the datasets themselves change.
    const allSuboptimalPoints = useMemo(() => {
        const points = [];
        datasets.forEach(dataset => {
            if (dataset.data?.choice_evaluation) {
                dataset.data.choice_evaluation.forEach((evaluation, index) => {
                    if (evaluation) {
                        const isFalsePositive = evaluation.selected_symbol && (evaluation.best_symbol === "NULL" || (evaluation.best_symbol !== evaluation.selected_symbol && evaluation.selected_symbol !== "NULL"));
                        const isFalseNegative = evaluation.selected_symbol === "NULL" && evaluation.best_symbol && evaluation.best_symbol !== "NULL";
                        const isSuboptimal = (isFalseNegative || isFalsePositive);
                        if (isSuboptimal) {
                            points.push({
                                buyIndex: index,
                                symbol: evaluation.selected_symbol,
                                datasetId: dataset.id,
                            });
                        }
                    }
                });
            }
        });
        return points;
    }, [datasets]);


    const handleFilterChange = (filterName) => {
        setFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
    };
    useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const rightBar = document.querySelector(".right-bar");
  const container = document.querySelector(".container-chart-and-controls");

  if (rightBar && container) {
    rightBar.style.height = `${canvas.height}px`;
    container.style.alignItems = "stretch";
  }
}, []);

    const chartBounds = useMemo(() => {
        if (!datasets || datasets.length === 0 || !zoomRange || zoomRange.end === null) {
            return { yMin: -1, yMax: 1 };
        }
        const { start, end } = zoomRange;
        const allPnlValues = datasets.flatMap((ds) =>
            ds.data.pnl ? ds.data.pnl.slice(start, end + 1) : []
        );
        if (allPnlValues.length === 0) return { yMin: -1, yMax: 1 };

        const minY = Math.min(...allPnlValues, 0);
        const maxY = Math.max(...allPnlValues, 0);
        const paddingY = (maxY - minY) * 0.2 || 1;
        return { yMin: minY - paddingY, yMax: maxY + paddingY };
    }, [datasets, zoomRange]);

    // Drawing effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !datasets || !zoomRange || zoomRange.end === null) return;

        const ctx = canvas.getContext("2d");
        const { yMin, yMax } = chartBounds;
        const m = { left: 70, right: 20, top: 20, bottom: 40 };
        const w = canvas.width - m.left - m.right;
        const h = canvas.height - m.top - m.bottom;

        const getPoint = (pnlValue, dataIndex) => {
            const zoomWidth = zoomRange.end - zoomRange.start;
            const x = zoomWidth > 0 ? ((dataIndex - zoomRange.start) / zoomWidth) * w : 0;
            const y = h - ((pnlValue - yMin) / (yMax - yMin)) * h;
            return { x, y };
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(m.left, m.top);
        ctx.font = "12px 'Fira Code', monospace";
        ctx.strokeStyle = theme.primary;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(0, h); ctx.lineTo(w, h);
        ctx.stroke();

        const y0 = h - ((0 - yMin) / (yMax - yMin)) * h;
        if (y0 > 0 && y0 < h) {
            ctx.save();
            ctx.strokeStyle = theme.primary;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(0, y0); ctx.lineTo(w, y0);
            ctx.stroke();
            ctx.restore();
        }

        for (let i = 0; i <= 5; i++) {
            const yVal = yMin + (i / 5) * (yMax - yMin);
            const y = h - (i / 5) * h;
            ctx.beginPath();
            ctx.moveTo(0, y); ctx.lineTo(w, y);
            ctx.strokeStyle = theme.gridColor;
            ctx.stroke();
            ctx.fillStyle = theme.textColor;
            ctx.fillText(yVal.toFixed(2), -65, y + 4);
        }

        if (selection && selection.isDragging) {
            const rectX = Math.min(selection.startX, selection.endX);
            const rectWidth = Math.abs(selection.endX - selection.startX);
            ctx.fillStyle = "rgba(255, 0, 67, 0.2)";
            ctx.fillRect(rectX, 0, rectWidth, h);
        }

        badPurchasePointsRef.current = [];

        datasets.forEach((dataset) => {
            const { data, color } = dataset;
            if (!data?.pnl) return;

            const pointsToDraw = [];
            const startDrawIndex = zoomRange.start;
            const endDrawIndex = Math.min(currentIndex, zoomRange.end);

            for (let i = startDrawIndex; i <= endDrawIndex; i++) {
                if (data.pnl[i] !== undefined) {
                    pointsToDraw.push(getPoint(data.pnl[i], i));
                }
            }

            ctx.strokeStyle = color || "#5D71FC";
            ctx.lineWidth = 2;
            if (pointsToDraw.length > 1) drawSmoothLine(ctx, pointsToDraw);

            if (pointsToDraw.length > 0) {
                const lastPoint = pointsToDraw[pointsToDraw.length - 1];
                ctx.fillStyle = theme.primary;
                ctx.beginPath();
                ctx.arc(lastPoint.x, lastPoint.y, 4, 0, 2 * Math.PI);
                ctx.fill();
            }

            if (data.choice_evaluation) {
                 for (let i = startDrawIndex; i <= endDrawIndex; i++) {
                    const evaluation = data.choice_evaluation[i];
                    if (evaluation && evaluation.correct_choice !== 1) {
                        const isFalsePositive = evaluation.selected_symbol && (evaluation.best_symbol === "NULL" || (evaluation.best_symbol !== evaluation.selected_symbol && evaluation.selected_symbol !== "NULL"));
                        const isFalseNegative = evaluation.selected_symbol === "NULL" && evaluation.best_symbol && evaluation.best_symbol !== "NULL";
                        if ((isFalsePositive && filters.falsePositive) || (isFalseNegative && filters.falseNegative)) {
                            const point = getPoint(data.pnl[i], i);

                            const markerSize = 5;
                            ctx.fillStyle = "#C36CE6";
                            let tooltipContent = "";

                            if (isFalsePositive) {
                                tooltipContent = `False Positive: Bought ${evaluation.selected_symbol}, but should not have.`;
                                ctx.beginPath();
                                ctx.arc(point.x, point.y, markerSize, 0, 2 * Math.PI);
                                ctx.fill();
                            } else {
                                tooltipContent = `False Negative: Did not buy, but should have bought ${evaluation.best_symbol}.`;
                                ctx.beginPath();
                                ctx.moveTo(point.x, point.y - markerSize);
                                ctx.lineTo(point.x - markerSize, point.y + markerSize);
                                ctx.lineTo(point.x + markerSize, point.y + markerSize);
                                ctx.closePath();
                                ctx.fill();
                            }

                            badPurchasePointsRef.current.push({
                                x: point.x + m.left,
                                y: point.y + m.top,
                                radius: markerSize,
                                content: tooltipContent,
                            });
                        }
                    }
                }
            }
        });

        if (highlightedSegment) {
            const dataset = datasets.find(ds => ds.id === highlightedSegment.datasetId);
            if (dataset) {
                const highlightPoints = [];
                // This loop correctly draws from the start (buy) to the end (sell).
                for (let i = highlightedSegment.start; i <= highlightedSegment.end; i++) {
                    if (dataset.data.pnl[i] !== undefined) {
                        highlightPoints.push(getPoint(dataset.data.pnl[i], i));
                    }
                }
                if (highlightPoints.length > 1) {
                    ctx.save();
                    ctx.strokeStyle = '#00FF00'; // Bright green for highlight
                    ctx.lineWidth = 3;
                    drawSmoothLine(ctx, highlightPoints);
                    ctx.restore();
                }
            }
        }

        ctx.restore();
    }, [datasets, currentIndex, chartBounds, zoomRange, selection, filters, highlightedSegment, allSuboptimalPoints]);

    // Effect for mouse listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !zoomRange || zoomRange.end === null) return;

        // FIX: Destructure chartBounds here to make yMin and yMax available in this scope.
        const { yMin, yMax } = chartBounds;
        const m = { left: 70, right: 20, top: 20, bottom: 40 };
        const w = canvas.width - m.left - m.right;
        const h = canvas.height - m.top - m.bottom;
        
        const getPoint = (pnlValue, dataIndex) => {
            const zoomWidth = zoomRange.end - zoomRange.start;
            const x = zoomWidth > 0 ? ((dataIndex - zoomRange.start) / zoomWidth) * w : 0;
            const y = h - ((pnlValue - yMin) / (yMax - yMin)) * h;
            return { x, y };
        };


        const pixelToDataIndex = (pixelX) => {
            const relativeX = pixelX - m.left;
            const zoomWidth = zoomRange.end - zoomRange.start;
            const indexInZoom = (relativeX / w) * zoomWidth;
            return Math.floor(zoomRange.start + indexInZoom);
        };

        const handleMouseDown = (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            if (x > m.left && x < m.left + w) {
                setSelection({ startX: x - m.left, endX: x - m.left, isDragging: true });
            }
        };

        const handleMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (selection && selection.isDragging) {
                const currentX = Math.max(0, Math.min(x - m.left, w));
                setSelection((prev) => ({ ...prev, endX: currentX }));
            }

            let foundPoint = null;
            for (const point of badPurchasePointsRef.current) {
                const distance = Math.sqrt(
                    Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
                );
                if (distance < point.radius + 3) {
                    foundPoint = { x: x, y: y, content: point.content };
                    break;
                }
            }
            setTooltip(foundPoint);
        };

        const handleMouseUp = () => {
            if (selection && selection.isDragging) {
                const startPixel = Math.min(selection.startX, selection.endX);
                const endPixel = Math.max(selection.startX, selection.endX);
                if (endPixel - startPixel > 5) {
                    const startIndex = pixelToDataIndex(startPixel + m.left);
                    const endIndex = pixelToDataIndex(endPixel + m.left);
                    onZoomChange({ start: startIndex, end: endIndex });
                }
                setSelection(null);
            }
        };

        const handleMouseLeave = () => {
            if (selection && selection.isDragging) setSelection(null);
            setTooltip(null);
        };
        
        const handleClick = (event) => {
            if (selection && selection.isDragging) return;

            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            let clickedPoint = null;
            let minDistance = Infinity;

            // Iterate over the complete list of suboptimal points
            for (const point of allSuboptimalPoints) {
                const dataset = datasets.find(ds => ds.id === point.datasetId);
                if (dataset?.data?.pnl) {
                     // Check if the point is within the current visible range
                    if (point.buyIndex >= zoomRange.start && point.buyIndex <= zoomRange.end) {
                        const pnlValue = dataset.data.pnl[point.buyIndex];
                        const { x, y } = getPoint(pnlValue, point.buyIndex);
                        const canvasX = x + m.left;
                        const canvasY = y + m.top;

                        const distance = Math.sqrt(Math.pow(clickX - canvasX, 2) + Math.pow(clickY - canvasY, 2));

                        if (distance < 10 && distance < minDistance) {
                            minDistance = distance;
                            clickedPoint = point;
                        }
                    }
                }
            }


            if (clickedPoint) {
                const dataset = datasets.find(ds => ds.id === clickedPoint.datasetId);
                if (!dataset) return;

                const closedPositions = dataset.data.closed_positions;
                let sellIndex = -1;

                // Search the entire dataset forward in time for the sell event.
                for (let i = clickedPoint.buyIndex + 1; i < closedPositions.length; i++) {
                    const positionsAtStep = closedPositions[i];
                    if (positionsAtStep?.length > 0) {
                    
                        const soldPosition = positionsAtStep.find(p => {
                            console.log("PPP: ",p.buy_index, clickedPoint.buyIndex)
                            return Number(p.buy_index) == Number(clickedPoint.buyIndex)});

                        console.log("SOLD POSITION",soldPosition)
                        if (soldPosition) {
                            sellIndex = i;
                            break;
                        }
                    }
                }
                if (sellIndex !== -1) {
                    setHighlightedSegment({
                        start: clickedPoint.buyIndex,
                        end: sellIndex,
                        datasetId: clickedPoint.datasetId
                    });
                } else {
                     setHighlightedSegment(null);
                }
            } else {
                setHighlightedSegment(null);
            }
        };

        const handleDoubleClick = () => {
            // onZoomReset();
            setHighlightedSegment(null);
        };

        canvas.addEventListener("mousedown", handleMouseDown);
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        canvas.addEventListener("dblclick", handleDoubleClick);
        canvas.addEventListener("click", handleClick);

        return () => {
            canvas.removeEventListener("mousedown", handleMouseDown);
            canvas.removeEventListener("mousemove", handleMouseMove);
            canvas.removeEventListener("mouseup", handleMouseUp);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            canvas.removeEventListener("dblclick", handleDoubleClick);
            canvas.removeEventListener("click", handleClick);
        };
    }, [zoomRange, onZoomChange, onZoomReset, selection, datasets, chartBounds, allSuboptimalPoints]);

    return (
        <div className="container-chart-and-controls">
            <div className="chart-container">
                <canvas ref={canvasRef} id="canvas" width="960" height="540"></canvas>
                {tooltip && (
                    <div className="chart-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
            <div className="right-bar">
              <div>
                  subhan
                </div>
                <div className="filter-controls">
                    <button onClick={() => setIsFilterVisible(!isFilterVisible)} className="toggle-button">
                        {isFilterVisible ? '-' : '+'}
                    </button>
                    {isFilterVisible && (
                        <div className="filter-content">
                             <ul className="filter-list">
                                <li className="filter-item" onClick={() => handleFilterChange('falsePositive')}>
                                    <span className="filter-shape circle"></span>
                                    <span className={`checkbox ${filters.falsePositive ? 'checked' : ''}`}></span>
                                    <span className="filter-label">false positifs</span>
                                 </li>
                                <li className="filter-item" onClick={() => handleFilterChange('falseNegative')}>
                                    <span className="filter-shape triangle"></span>
                                    <span className={`checkbox ${filters.falseNegative ? 'checked' : ''}`}></span>
                                    <span className="filter-label">false negatifs</span>
                                </li>
                            </ul>
                            <div className="legend-details">
                               <p>α: max recall</p>
                               <p>β: max cashout</p>
                               <p>δ: min loss</p>
                               <p>θ: min overfitting</p>
                               <p>§: min faux positifs</p>
                               <p>δ: max profit / max return</p>
                               <p>δ: max profit and loss</p>
                           </div>
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
}

export default Chart;