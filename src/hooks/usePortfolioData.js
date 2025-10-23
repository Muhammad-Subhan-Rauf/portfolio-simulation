// Original relative path: hooks/usePortfolioData.js

import { useState, useEffect, useCallback } from 'react';
import { TEXTS } from '../constants';

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
  const [fileStatus, setFileStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (files) => {
    setIsLoading(true);
    setFileStatus(TEXTS.file_status_loading);

    const processFile = async (file) => {
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
                    color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
                };
            }
        } catch (error) {
            console.error(`Failed to load or parse ${file.name}:`, error);
        }
        return null;
    };

    if (files && files.length > 0) {
      const newDatasetsPromises = Array.from(files).map(processFile);
      const newDatasets = (await Promise.all(newDatasetsPromises)).filter(Boolean);
      setDatasets(prev => [...prev, ...newDatasets]);
      setFileStatus(`${newDatasets.length} file(s) loaded.`);
    } else if (datasets.length === 0) {
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
            color: '#FF0043'
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
  }, [datasets.length]);

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