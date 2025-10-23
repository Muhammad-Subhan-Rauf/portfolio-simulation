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
  const [data, setData] = useState(null);
  const [operatorName, setOperatorName] = useState('Ⲗ');
  const [fileStatus, setFileStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (file) => {
    setIsLoading(true);
    setFileStatus(TEXTS.file_status_loading);
    try {
      let jsonData;
      let fileName;

      if (file) { // User uploaded a file
        fileName = file.name;
        const text = await file.text();
        jsonData = JSON.parse(text);
      } else { // Load default
        fileName = `${operatorName}_consolidated_json.json`;
        const response = await fetch(fileName);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        jsonData = await response.json();
      }
      
      const processed = processData(jsonData);
      if (processed) {
        setData(processed);
        setOperatorName(getOperatorName(fileName));
        setFileStatus(`${TEXTS.file_status_loaded} ${fileName}`);
      }
    } catch (error) {
      console.error("Failed to load or parse data:", error);
      setFileStatus(`Error: ${error.message}`);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [operatorName]);


  // Load default data on initial mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, operatorName, fileStatus, isLoading, loadData };
};