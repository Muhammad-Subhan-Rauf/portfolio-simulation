// Original relative path: hooks/usePortfolioData.js

import { useState, useCallback } from 'react';
import { TEXTS } from '../constants';

// A simple color generator for default line colors
const generateColor = (index) => {
  const colors = ['#FF0043', '#5D71FC', '#00F7A0', '#F7E800', '#F78C00', '#8B00F7'];
  return colors[index % colors.length];
};

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
  };
};

export const usePortfolioData = () => {
  const [datasets, setDatasets] = useState([]);
  const [fileStatus, setFileStatus] = useState(TEXTS.file_status_default);
  const [isLoading, setIsLoading] = useState(false);

  const loadFiles = useCallback(async (files, isOptimal = false) => {
    setIsLoading(true);
    setFileStatus(TEXTS.file_status_loading);
    
    const newDatasets = [...datasets];

    for (const file of files) {
      try {
        const fileName = file.name;
        const text = await file.text();
        const jsonData = JSON.parse(text);
        const processed = processData(jsonData);

        if (processed) {
          newDatasets.push({
            id: `${fileName}-${Date.now()}`,
            name: getOperatorName(fileName),
            data: processed,
            color: generateColor(newDatasets.length),
            isOptimal,
          });
        }
      } catch (error) {
        console.error("Failed to load or parse data:", error);
        setFileStatus(`Error loading ${file.name}: ${error.message}`);
        // Continue to next file
      }
    }
    
    setDatasets(newDatasets);
    setFileStatus(`${files.length} file(s) loaded.`);
    setIsLoading(false);
  }, [datasets]);

  const updateColor = useCallback((id, newColor) => {
    setDatasets(prevDatasets =>
      prevDatasets.map(d => (d.id === id ? { ...d, color: newColor } : d))
    );
  }, []);

  const loadOptimalFile = useCallback(async () => {
    // This is a placeholder for loading a specific, "most optimal" JSON.
    // In a real scenario, you might have a predefined file path or a server endpoint.
    // For this example, we'll simulate fetching a file named 'optimal_data.json'.
    try {
        setIsLoading(true);
        const response = await fetch('/optimal_consolidated_json.json'); // Assuming the optimal file is in public folder
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        const file = new File([blob], "optimal_consolidated_json.json", { type: "application/json" });
        await loadFiles([file], true);
    } catch (error) {
        console.error("Failed to load optimal file:", error);
        setFileStatus(`Error: Could not load the optimal JSON. Make sure 'optimal_consolidated_json.json' is in the public folder.`);
        setIsLoading(false);
    }
  }, [loadFiles]);


  return { datasets, fileStatus, isLoading, loadFiles, updateColor, loadOptimalFile };
};