
// Original relative path: App.jsx

// Original relative path: App.jsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';
import { TEXTS } from './constants';
import { usePortfolioData } from './hooks/usePortfolioData';

import Header from './components/Header';
import Controls from './components/Controls';
import Chart from './components/Chart';
import Metrics from './components/Metrics';
import PositionsTable from './components/PositionsTable';

function App() {
  const { datasets, fileStatus, isLoading, loadFiles, updateColor, loadOptimalFile } = usePortfolioData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(250);

  // Refs for the requestAnimationFrame loop
  const animationFrameId = useRef(null);
  const lastUpdateTime = useRef(0);

  const maxIndex = useMemo(() => {
    if (!datasets || datasets.length === 0) return 0;
    // Find the maximum length among all datasets
    return Math.max(...datasets.map(d => d.data.equity.length)) - 1;
  }, [datasets]);

  // The primary dataset for displaying metrics and positions is the first one, or the optimal one if present.
  const primaryDataset = useMemo(() => {
      const optimal = datasets.find(d => d.isOptimal);
      return optimal || datasets[0];
  }, [datasets]);

  const currentStepData = useMemo(() => {
    if (!primaryDataset) return null;
    const data = primaryDataset.data;
    // Clamp currentIndex to the actual length of the primary dataset
    const safeIndex = Math.min(currentIndex, data.dates.length - 1);

    return {
      date: data.dates[safeIndex],
      cash: data.cash[safeIndex],
      cashout: data.cashout[safeIndex],
      positions_value: data.positions_value[safeIndex],
      pnl: data.pnl[safeIndex],
      open_positions: data.open_positions[safeIndex],
      closed_positions: data.closed_positions[safeIndex],
    };
  }, [primaryDataset, currentIndex]);

  // =================================================================
  // START: OPTIMIZED ANIMATION LOOP using requestAnimationFrame
  // =================================================================
  const animate = useCallback((currentTime) => {
    const timeSinceLastUpdate = currentTime - lastUpdateTime.current;

    if (timeSinceLastUpdate >= speed) {
      lastUpdateTime.current = currentTime;
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= maxIndex) {
          setIsPlaying(false);
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }
    animationFrameId.current = requestAnimationFrame(animate);
  }, [speed, maxIndex]);

  useEffect(() => {
    if (isPlaying) {
      lastUpdateTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, animate]);
  // =================================================================
  // END: OPTIMIZED ANIMATION LOOP
  // =================================================================

  const handlePlayPause = useCallback(() => {
    if (currentIndex >= maxIndex && !isPlaying) {
      setCurrentIndex(0);
    }
    setIsPlaying(prevIsPlaying => !prevIsPlaying);
  }, [currentIndex, maxIndex, isPlaying]);

  const handleFrameChange = useCallback((newIndex) => {
    setIsPlaying(false);
    setCurrentIndex(newIndex);
  }, []);

  const handleStepChange = useCallback((direction) => {
    setIsPlaying(false);
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + direction;
      if (newIndex < 0) return 0;
      if (newIndex > maxIndex) return maxIndex;
      return newIndex;
    });
  }, [maxIndex]);
  
  const handleSpeedChange = useCallback((newSpeed) => {
    setSpeed(newSpeed);
  }, []);

  const handleFileSelect = useCallback((files) => {
    setIsPlaying(false);
    setCurrentIndex(0);
    loadFiles(files);
  }, [loadFiles]);

  const handleOptimalFileSelect = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    loadOptimalFile();
  }, [loadOptimalFile]);


  return (
    <>
      <Header operatorName={primaryDataset?.name || '...'} />
      
      <Controls
        currentIndex={currentIndex}
        maxIndex={maxIndex}
        speed={speed}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onFrameChange={handleFrameChange}
        onStepChange={handleStepChange}
        onSpeedChange={handleSpeedChange}
        onFileSelect={handleFileSelect}
        onOptimalFileSelect={handleOptimalFileSelect}
        onColorChange={updateColor}
        fileStatus={fileStatus}
        datasets={datasets}
        isDisabled={isLoading || datasets.length === 0}
      />

      <Chart datasets={datasets} currentIndex={currentIndex} />

      <Metrics currentData={currentStepData} />

      <PositionsTable type="open" positions={currentStepData?.open_positions} />
      <PositionsTable type="closed" positions={currentStepData?.closed_positions} />
      
      <p className="small" dangerouslySetInnerHTML={{ __html: TEXTS.tip }}></p>
    </>
  );
}

export default App;
