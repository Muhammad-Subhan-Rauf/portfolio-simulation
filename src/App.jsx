// Original relative path: App.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { TEXTS } from './constants';
import { usePortfolioData } from './hooks/usePortfolioData';

import Header from './components/Header';
import Controls from './components/Controls';
import Chart from './components/Chart';
import Metrics from './components/Metrics';
import PositionsTable from './components/PositionsTable';
import DatasetSelector from './components/DatasetSelector';

function App() {
  const { datasets, fileStatus, isLoading, loadData, removeDataset, updateDatasetColor } = usePortfolioData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(250);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);

  // maxIndex is the max length across all datasets
  const maxIndex = useMemo(() => {
    if (!datasets || datasets.length === 0) return 0;
    return Math.max(...datasets.map(ds => ds.data.equity.length - 1));
  }, [datasets]);

  // Set initial selection or update if selection is removed
  useEffect(() => {
    if (!selectedDatasetId && datasets.length > 0) {
      setSelectedDatasetId(datasets[0].id);
    } else if (selectedDatasetId && !datasets.find(ds => ds.id === selectedDatasetId)) {
      setSelectedDatasetId(datasets.length > 0 ? datasets[0].id : null);
    }
  }, [datasets, selectedDatasetId]);

  const primaryDataset = useMemo(() => {
    if (!selectedDatasetId) return null;
    return datasets.find(ds => ds.id === selectedDatasetId);
  }, [datasets, selectedDatasetId]);
  
  const operatorName = primaryDataset?.operatorName || 'N/A';
  const data = primaryDataset?.data;

  // Memoize the data for the current step
  const currentStepData = useMemo(() => {
    if (!data || currentIndex >= data.dates.length) return null;
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
      setCurrentIndex(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleFrameChange = (newIndex) => {
    setIsPlaying(false);
    setCurrentIndex(newIndex);
  };
  
  const handleFileSelect = useCallback((files) => {
    setIsPlaying(false);
    setCurrentIndex(0);
    loadData(files);
  }, [loadData]);

  const handleRemoveDataset = useCallback((idToRemove) => {
    removeDataset(idToRemove);
  }, [removeDataset]);

  // Logic for the step buttons
  const handleStepChange = useCallback((direction) => {
    setIsPlaying(false); // Pause playback
    setCurrentIndex((prevIndex) => {
      const newIndex = prevIndex + direction;
      if (newIndex < 0) return 0;
      if (newIndex > maxIndex) return maxIndex;
      return newIndex;
    });
  }, [maxIndex]);

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
        onStepChange={handleStepChange} // Pass the handler function
        onSpeedChange={setSpeed}
        onFileSelect={handleFileSelect}
        fileStatus={fileStatus}
        isDisabled={isLoading || datasets.length === 0}
        datasets={datasets}
        onRemoveDataset={handleRemoveDataset}
        onUpdateDatasetColor={updateDatasetColor}
      />

      <Chart datasets={datasets} currentIndex={currentIndex} />

      {datasets.length > 1 && (
        <DatasetSelector
          datasets={datasets}
          selectedId={selectedDatasetId}
          onSelect={setSelectedDatasetId}
        />
      )}

      <Metrics currentData={currentStepData} />
      <PositionsTable type="open" positions={currentStepData?.open_positions} />
      <PositionsTable type="closed" positions={currentStepData?.closed_positions} />
      
      <p className="small" dangerouslySetInnerHTML={{ __html: TEXTS.tip }}></p>
    </>
  );
}

export default App;