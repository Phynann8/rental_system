import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatUSD, formatKHR, toKHR } from '../utils/currency';

interface CurrencyContextType {
  exchangeRate: number;
  loading: boolean;
  formatUSD: (amount: number) => string;
  formatKHR: (amount: number) => string;
  convertToKHR: (amountUsd: number) => number;
  refreshSettings: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode; isAuthenticated?: boolean }> = ({ 
  children, 
  isAuthenticated = false 
}) => {
  const [exchangeRate, setExchangeRate] = useState<number>(4100);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settings = await api.getSettings();
      setExchangeRate(settings.exchangeRateUsdToKhr || 4100);
    } catch (error: any) {
      // 401 is expected if not logged in; stay with default values
      if (error?.status !== 401) {
        console.error('Failed to load currency settings:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const value: CurrencyContextType = {
    exchangeRate,
    loading,
    formatUSD,
    formatKHR,
    convertToKHR: (amount: number) => toKHR(amount, exchangeRate),
    refreshSettings: fetchSettings,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
