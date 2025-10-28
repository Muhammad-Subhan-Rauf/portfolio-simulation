// Original relative path: hooks/usePortfolioData.js

// Original relative path: hooks/usePortfolioData.js

// Original relative path: hooks/usePortfolioData.js

import { useState, useEffect, useCallback } from 'react';
import { TEXTS, PRESET_COLORS } from '../constants';

const getOperatorName = (fileName) => {
  const suffix = '_consolidated_json.json';
  if (fileName && fileName.endsWith(suffix)) {
    return fileName.slice(0, -suffix.length);
  }
  return fileName ? fileName.replace('.json', '') : 'N/A';
};

const processData = (rawData) => {
  if (!rawData?.available_money?.length || rawData.date_list.length !== rawData.available_money.length) {
    alert("Invalid or inconsistent data format.");
    return null;
  }

  const cash = rawData.available_money;
  const positions_value = rawData.open_position_value;
  const equity = cash.map((c, i) => c + positions_value[i]);

  return {
    cash,
    equity,
    cashout: rawData.cashout,
    positions_value,
    pnl: rawData.cumulated_profit_and_loss,
    open_positions: rawData.open_position,
    closed_positions: rawData.close_position,
    dates: rawData.date_list,
    choice_evaluation: rawData.choice_evaluation,
    false_positives: rawData.false_positives,
    false_negatives: rawData.false_negatives,
  };
};

export const usePortfolioData = () => {
  const [datasets, setDatasets] = useState([]);
  const [fileStatus, setFileStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (files) => {
    setIsLoading(true);
    setFileStatus(TEXTS.file_status_loading);

    const processFile = async (file, color) => {
        try {
            const fileName = file.name;
            const text = await file.text();
            const jsonData = JSON.parse(text);
            const processed = processData(jsonData);
            if (processed) {
                return {
                    id: `${fileName}-${Date.now()}`,
                    data: processed,
                    operatorName: getOperatorName(fileName),
                    fileName,
                    color: color,
                };
            }
        } catch (error) {
            console.error(`Failed to load or parse ${file.name}:`, error);
        }
        return null;
    };

    if (files && files.length > 0) {
      // 1. Create a frequency map of currently used colors.
      const colorCounts = datasets.reduce((acc, ds) => {
        acc[ds.color] = (acc[ds.color] || 0) + 1;
        return acc;
      }, {});

      // 2. Sort the preset colors by their usage count (ascending).
      // Unused colors will have a count of 0 and will appear first.
      const sortedColorCandidates = [...PRESET_COLORS].sort((colorA, colorB) => {
          const countA = colorCounts[colorA] || 0;
          const countB = colorCounts[colorB] || 0;
          return countA - countB;
      });

      // 3. Assign colors to new files cyclically from the sorted list.
      const newDatasetsPromises = Array.from(files).map((file, index) => {
          const colorToAssign = sortedColorCandidates[index % sortedColorCandidates.length];
          return processFile(file, colorToAssign);
      });
      
      const newDatasets = (await Promise.all(newDatasetsPromises)).filter(Boolean);
      setDatasets(prev => [...prev, ...newDatasets]);
      setFileStatus(`${newDatasets.length} file(s) loaded.`);

    } else if (datasets.length === 0) { // Handle initial default load
      try {
        const operatorName = 'Ⲗ';
        const fileName = `${operatorName}_consolidated_json.json`;
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        const processed = processData(jsonData);
        if (processed) {
          setDatasets([{
            id: `default-${Date.now()}`,
            data: processed,
            operatorName: getOperatorName(fileName),
            fileName,
            color: PRESET_COLORS[0] // Always start with the first color
          }]);
          setFileStatus(TEXTS.file_status_default);
        }
      } catch (error) {
        console.error("Failed to load or parse default data:", error);
        setFileStatus(`Error loading default data: ${error.message}`);
        setDatasets([]);
      }
    }
    
    setIsLoading(false);
  }, [datasets]); // Dependency is crucial for getting the latest color counts

  const removeDataset = useCallback((id) => {
    setDatasets(prev => prev.filter(ds => ds.id !== id));
  }, []);

  const updateDatasetColor = useCallback((id, color) => {
    setDatasets(prev => prev.map(ds => ds.id === id ? { ...ds, color } : ds));
  }, []);

  useEffect(() => {
    if (datasets.length === 0) {
      loadData();
    }
  }, [loadData, datasets.length]);

  return { datasets, fileStatus, isLoading, loadData, removeDataset, updateDatasetColor };
};