// Original relative path: components/Chart.jsx

import React, { useRef, useEffect, useMemo, useState } from "react";
import "./Chart.css";
import DataDisplayBox from './DataDisplayBox';

const theme = {
    primary: "#FF0043",
    gridColor: "rgba(255, 0, 67, 0.2)",
    textColor: "#FF0043",
};

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

function Chart({ datasets, currentIndex, zoomRange, onZoomChange }) {
    const canvasRef = useRef(null);
    const [tooltip, setTooltip] = useState(null);
    const [selection, setSelection] = useState(null);
    const badPurchasePointsRef = useRef([]);
    const [highlightedSegment, setHighlightedSegment] = useState(null);
    const [isFilterVisible, setIsFilterVisible] = useState(true);
    const [filters, setFilters] = useState({ falsePositive: false, falseNegative: false });
    const [debouncedHoverPoint, setDebouncedHoverPoint] = useState(null);
    const hoverTimerRef = useRef(null);
    
    const [hoverData, setHoverData] = useState(null);
    const [pinnedData, setPinnedData] = useState(null);
    const [pinnedDataIndex, setPinnedDataIndex] = useState(0);

    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const allSuboptimalPoints = useMemo(() => {
        const points = [];
        datasets.forEach(dataset => {
            if (dataset.data?.choice_evaluation) {
                dataset.data.choice_evaluation.forEach((evaluation, index) => {
                    if (evaluation) {
                        const isFalsePositive = evaluation.selected_symbol && (evaluation.best_symbol === "NULL" || (evaluation.best_symbol !== evaluation.selected_symbol && evaluation.selected_symbol !== "NULL"));
                        const isFalseNegative = evaluation.selected_symbol === "NULL" && evaluation.best_symbol && evaluation.best_symbol !== "NULL";
                        if (isFalseNegative || isFalsePositive) {
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !datasets || !zoomRange || zoomRange.end === null) return;

        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

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

            ctx.strokeStyle = color || "#8DBAFD";
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
                            ctx.fillStyle = "#8DBAFD";
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
                                x: point.x + m.left, y: point.y + m.top, radius: markerSize, content: tooltipContent,
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
                for (let i = highlightedSegment.start; i <= highlightedSegment.end; i++) {
                    if (dataset.data.pnl[i] !== undefined) {
                        highlightPoints.push(getPoint(dataset.data.pnl[i], i));
                    }
                }
                if (highlightPoints.length > 1) {
                    ctx.save();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 3;
                    drawSmoothLine(ctx, highlightPoints);
                    ctx.restore();
                }
            }
        }

        if (debouncedHoverPoint) {
            ctx.save();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.setLineDash([18, 18]);
            const yAxis = h - ((0 - yMin) / (yMax - yMin)) * h;
            ctx.beginPath();
            ctx.moveTo(debouncedHoverPoint.x, debouncedHoverPoint.y);
            ctx.lineTo(debouncedHoverPoint.x, yAxis > h ? h : yAxis < 0 ? 0 : yAxis);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }, [datasets, currentIndex, chartBounds, zoomRange, selection, filters, highlightedSegment, allSuboptimalPoints, debouncedHoverPoint, windowSize]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !zoomRange || zoomRange.end === null) return;

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
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            setDebouncedHoverPoint(null);
            if (!pinnedData) setHoverData(null);

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (selection && selection.isDragging) {
                const currentX = Math.max(0, Math.min(x - m.left, w));
                setSelection((prev) => ({ ...prev, endX: currentX }));
            }

            if (x > m.left && x < m.left + w && y > m.top && y < m.top + h) {
                const dataIndex = pixelToDataIndex(x);
                let closestPoint = null;
                let minDistance = Infinity;
                let dataForHover = null;

                datasets.forEach(dataset => {
                    if (dataset.data.pnl && dataIndex >= 0 && dataIndex < dataset.data.pnl.length) {
                        const pnlValue = dataset.data.pnl[dataIndex];
                        if (pnlValue !== undefined) {
                            const point = getPoint(pnlValue, dataIndex);
                            const canvasY = point.y + m.top;
                            const distance = Math.abs(y - canvasY);
                            
                            if (distance < 20 && distance < minDistance) {
                                minDistance = distance;
                                closestPoint = point;

                                if (!pinnedData) {
                                    const closedPositions = dataset.data.closed_positions[dataIndex] || [];
                                    const positionToShow = closedPositions[0];
                                    const choiceEval = dataset.data.choice_evaluation[dataIndex] || {};

                                    if (positionToShow) {
                                        dataForHover = {
                                            crypto: positionToShow.symbol,
                                            timeOpen: dataset.data.dates[positionToShow.buy_index],
                                            timeClosed: Object.prototype.hasOwnProperty.call(positionToShow, 'sell_value') ? dataset.data.dates[dataIndex] : 'N/A',
                                            priceOpen: positionToShow.initial_price_close,
                                            priceClose: positionToShow.current_price_close,
                                            pnl: positionToShow.profit_and_loss,
                                            bestChoice: choiceEval.best_symbol || 'N/A'
                                        };
                                    }
                                }
                            }
                        }
                    }
                });

                if (closestPoint) {
                    hoverTimerRef.current = setTimeout(() => {
                        setDebouncedHoverPoint(closestPoint);
                        if (!pinnedData) setHoverData(dataForHover);
                    }, 0);
                }
            }

            let foundPoint = null;
            for (const point of badPurchasePointsRef.current) {
                const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
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
            if (selection?.isDragging) setSelection(null);
            setTooltip(null);
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
            setDebouncedHoverPoint(null);
            if (!pinnedData) setHoverData(null);
        };
        
        const handleClick = (event) => {
            if (selection?.isDragging) return;

            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            let clickedSuboptimalPoint = null;
            let minDistance = Infinity;

            for (const point of allSuboptimalPoints) {
                const dataset = datasets.find(ds => ds.id === point.datasetId);
                if (dataset?.data?.pnl && point.buyIndex >= zoomRange.start && point.buyIndex <= zoomRange.end) {
                    const pnlValue = dataset.data.pnl[point.buyIndex];
                    const { x, y } = getPoint(pnlValue, point.buyIndex);
                    const canvasX = x + m.left;
                    const canvasY = y + m.top;
                    const distance = Math.sqrt(Math.pow(clickX - canvasX, 2) + Math.pow(clickY - canvasY, 2));

                    if (distance < 10 && distance < minDistance) {
                        minDistance = distance;
                        clickedSuboptimalPoint = point;
                    }
                }
            }

            if (clickedSuboptimalPoint) {
                const dataset = datasets.find(ds => ds.id === clickedSuboptimalPoint.datasetId);
                if (!dataset) return;

                const { data } = dataset;
                const closedPositions = data.closed_positions;
                let sellIndex = -1;
                let soldPosition = null;

                for (let i = clickedSuboptimalPoint.buyIndex + 1; i < closedPositions.length; i++) {
                    const positionsAtStep = closedPositions[i] || [];
                    const foundPosition = positionsAtStep.find(p => Number(p.buy_index) === Number(clickedSuboptimalPoint.buyIndex));
                    if (foundPosition) {
                        sellIndex = i;
                        soldPosition = foundPosition;
                        break;
                    }
                }

                if (sellIndex !== -1 && soldPosition) {
                    // Set highlight and pinned data together
                    setHighlightedSegment({
                        start: clickedSuboptimalPoint.buyIndex,
                        end: sellIndex,
                        datasetId: clickedSuboptimalPoint.datasetId
                    });

                    const choiceEval = data.choice_evaluation[sellIndex] || {};
                    const formattedPosition = {
                        crypto: soldPosition.symbol,
                        timeOpen: data.dates[soldPosition.buy_index],
                        timeClosed: Object.prototype.hasOwnProperty.call(soldPosition, 'sell_value') ? data.dates[sellIndex] : 'N/A',
                        priceOpen: soldPosition.initial_price_close,
                        priceClose: soldPosition.current_price_close,
                        pnl: soldPosition.profit_and_loss,
                        bestChoice: choiceEval.best_symbol || 'N/A'
                    };
                    
                    setPinnedData([formattedPosition]);
                    setPinnedDataIndex(0);
                } else {
                    setHighlightedSegment(null);
                    setPinnedData(null);
                }
                return; 
            }

            setHighlightedSegment(null);
            const dataIndex = pixelToDataIndex(clickX);
            let closestDataset = null;
            minDistance = Infinity;

            datasets.forEach(dataset => {
                if (dataset.data.pnl && dataIndex >= 0 && dataIndex < dataset.data.pnl.length) {
                    const pnlValue = dataset.data.pnl[dataIndex];
                    if (pnlValue !== undefined) {
                        const point = getPoint(pnlValue, dataIndex);
                        const canvasY = point.y + m.top;
                        const distance = Math.abs(clickY - canvasY);
                        if (distance < 20 && distance < minDistance) {
                            minDistance = distance;
                            closestDataset = dataset;
                        }
                    }
                }
            });

            if (closestDataset) {
                const { data } = closestDataset;
                const positionsAtStep = data.closed_positions[dataIndex] || [];
                if (positionsAtStep.length > 0) {
                    const choiceEval = data.choice_evaluation[dataIndex] || {};
                    const formattedPositions = positionsAtStep.map(pos => ({
                        crypto: pos.symbol,
                        timeOpen: data.dates[pos.buy_index],
                        timeClosed: Object.prototype.hasOwnProperty.call(pos, 'sell_value') ? data.dates[dataIndex] : 'N/A',
                        priceOpen: pos.initial_price_close,
                        priceClose: pos.current_price_close,
                        pnl: pos.profit_and_loss,
                        bestChoice: choiceEval.best_symbol || 'N/A'
                    }));
                    setPinnedData(formattedPositions);
                    setPinnedDataIndex(0);
                    setHoverData(null);
                } else {
                    setPinnedData(null);
                }
            } else {
                 setPinnedData(null);
            }
        };

        const handleDoubleClick = () => {
            setPinnedData(null);
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
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
        };
    }, [zoomRange, onZoomChange, selection, datasets, chartBounds, allSuboptimalPoints, windowSize, pinnedData]);

    const handlePinnedIndexChange = (direction) => {
        setPinnedDataIndex(prev => {
            const newIndex = prev + direction;
            if (newIndex >= 0 && newIndex < (pinnedData?.length || 0)) {
                return newIndex;
            }
            return prev;
        });
    };

    return (
        <div className="container-chart-and-controls">
            <div className="chart-container">
                <canvas ref={canvasRef} id="canvas"></canvas>
                {tooltip && (
                    <div className="chart-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
                        {tooltip.content}
                    </div>
                )}
            </div>
            <div className="right-bar">
                
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
                               <p>δ: min faux positifs</p>
                               <p>δ: max profit / max return</p>
                               <p>δ: max profit and loss</p>
                           </div>
                        </div>
                    )}
                </div>
                <DataDisplayBox 
                    hoverData={hoverData}
                    pinnedData={pinnedData}
                    pinnedDataIndex={pinnedDataIndex}
                    onPinnedIndexChange={handlePinnedIndexChange}
                />
            </div>
        </div>
    );
}

export default Chart;