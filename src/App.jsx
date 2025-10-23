import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { TEXTS } from './constants';
import { usePortfolioData } from './hooks/usePortfolioData';

import Header from './components/Header';
import Controls from './components/Controls';
import Chart from './components/Chart';
import Metrics from './components/Metrics';
import PositionsTable from './components/PositionsTable';

function App() {
  const { data, operatorName, fileStatus, isLoading, loadData } = usePortfolioData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(250);

  const maxIndex = data ? data.equity.length - 1 : 0;

  // Memoize the data for the current step to avoid recalculating on every render
  const currentStepData = useMemo(() => {
    if (!data) return null;
    return {
      date: data.dates[currentIndex],
      cash: data.cash[currentIndex],
      cashout: data.cashout[currentIndex],
      positions_value: data.positions_value[currentIndex],
      pnl: data.pnl[currentIndex],
      open_positions: data.open_positions[currentIndex],
      closed_positions: data.closed_positions[currentIndex],
    };
  }, [data, currentIndex]);
  
  // Playback timer effect
  useEffect(() => {
    if (isPlaying) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex >= maxIndex) {
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, speed);
      return () => clearInterval(timer);
    }
  }, [isPlaying, speed, maxIndex]);

  const handlePlayPause = () => {
    if (currentIndex >= maxIndex && !isPlaying) {
      setCurrentIndex(0); // Reset if at the end
    }
    setIsPlaying(!isPlaying);
  };

  const handleFrameChange = (newIndex) => {
    setIsPlaying(false);
    setCurrentIndex(newIndex);
  };
  
  const handleFileSelect = useCallback((file) => {
    setIsPlaying(false);
    setCurrentIndex(0);
    loadData(file);
  }, [loadData]);


  return (
    <>
      <Header operatorName={operatorName} />
      
      <Controls
        currentIndex={currentIndex}
        maxIndex={maxIndex}
        speed={speed}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onFrameChange={handleFrameChange}
        onSpeedChange={setSpeed}
        onFileSelect={handleFileSelect}
        fileStatus={fileStatus}
        isDisabled={isLoading || !data}
      />

      <Chart data={data} currentIndex={currentIndex} />

      <Metrics currentData={currentStepData} />

      <PositionsTable type="open" positions={currentStepData?.open_positions} />
      <PositionsTable type="closed" positions={currentStepData?.closed_positions} />
      
      <p className="small" dangerouslySetInnerHTML={{ __html: TEXTS.tip }}></p>
    </>
  );
}

export default App;