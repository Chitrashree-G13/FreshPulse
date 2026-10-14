/**
 * FreshPulse — Store Data Context
 * Clean, lightweight store operations state with Supabase integration and LocalStorage persistence.
 * Uses src/services/supabaseService.ts for Supabase database integration.
 * Uses src/store/storeStore.ts for persistent saved store records.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  StoreRecord,
  ProductRecord,
  StoreAnalysis,
  CSVParseSummary,
  ActionStatus,
  NetworkSummary,
  AnalysisResult
} from '../types';
import {
  getSavedStores,
  saveStore,
  updateStore,
  deleteStore
} from '../store/storeStore';
import { analyzeAll } from '../engine/pipeline';
import { ILLUSTRATIVE_SAMPLE_STORES } from '../engine/sampleData';
import { OFFICIAL_JURY_STORES, OFFICIAL_JURY_PRODUCTS } from '../engine/juryDataAdapter';
import { fetchSupabaseData, SupabaseFetchResult } from '../services/supabaseService';

interface StoreDataContextType {
  // Saved Stores (from localStorage)
  savedStores: StoreRecord[];
  refreshSavedStores: () => void;
  addStore: (store: StoreRecord) => { success: boolean; message: string; isDuplicate?: boolean };
  modifyStore: (store: StoreRecord) => { success: boolean; message: string };
  removeStore: (storeId: string) => { success: boolean; message: string };

  // Supabase State
  isSupabaseData: boolean;
  isLoadingSupabase: boolean;
  supabaseError: string | null;
  supabaseTableCounts: { stores: number; products: number; inventory: number; sales: number } | null;
  loadSupabaseData: () => Promise<boolean>;

  // Active Analysis State
  activeAnalysisResult: AnalysisResult | null;
  analyses: StoreAnalysis[];
  networkSummary: NetworkSummary;
  selectedStoreId: string | null;
  selectedAnalysis: StoreAnalysis | null;
  isAnalyzing: boolean;
  isDataLoaded: boolean;
  isSampleData: boolean;

  // Analysis Trigger
  runAnalysis: (storesToAnalyze: StoreRecord[], isSample?: boolean, productsToAnalyze?: ProductRecord[]) => Promise<boolean>;
  clearAnalysis: () => void;
  loadDemoData: () => Promise<boolean>;
  clearAllData: () => void;

  // Store Selection & Actions
  setSelectedStoreId: (storeId: string | null) => void;
  actionStatuses: Record<string, ActionStatus>;
  updateActionStatus: (actionId: string, status: ActionStatus) => void;
}

const StoreDataContext = createContext<StoreDataContextType | undefined>(undefined);

const LOCAL_STORAGE_ACTION_KEY = 'freshpulse_action_statuses_v2';
const LOCAL_STORAGE_SAMPLE_KEY = 'freshpulse_is_sample_v2';

export const StoreDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Saved Stores from localStorage
  const [savedStores, setSavedStores] = useState<StoreRecord[]>(() => {
    return getSavedStores();
  });

  const refreshSavedStores = () => {
    setSavedStores(getSavedStores());
  };

  const addStore = (store: StoreRecord) => {
    const res = saveStore(store);
    if (res.success) {
      setSavedStores(getSavedStores());
    }
    return res;
  };

  const modifyStore = (store: StoreRecord) => {
    const res = updateStore(store);
    if (res.success) {
      setSavedStores(getSavedStores());
    }
    return res;
  };

  const removeStore = (storeId: string) => {
    const res = deleteStore(storeId);
    if (res.success) {
      setSavedStores(getSavedStores());
      if (selectedStoreId === storeId) {
        setSelectedStoreId(null);
      }
    }
    return res;
  };

  // 2. Supabase Integration State
  const [isSupabaseData, setIsSupabaseData] = useState<boolean>(false);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [supabaseTableCounts, setSupabaseTableCounts] = useState<{
    stores: number;
    products: number;
    inventory: number;
    sales: number;
  } | null>(null);

  // 3. Active Analysis State
  const [activeAnalysisResult, setActiveAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSampleData, setIsSampleData] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_SAMPLE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  // 4. Action Statuses persistence
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ACTION_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTION_KEY, JSON.stringify(actionStatuses));
    } catch {
      // Ignore
    }
  }, [actionStatuses]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SAMPLE_KEY, isSampleData ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }, [isSampleData]);

  // Derived analyses decorated with action statuses
  const analyses = useMemo(() => {
    if (!activeAnalysisResult || !activeAnalysisResult.analyses) return [];
    return activeAnalysisResult.analyses.map(analysis => ({
      ...analysis,
      actions: analysis.actions.map(act => ({
        ...act,
        status: actionStatuses[act.id] || act.status
      }))
    }));
  }, [activeAnalysisResult, actionStatuses]);

  // Network Summary
  const networkSummary = useMemo(() => {
    if (!activeAnalysisResult || !activeAnalysisResult.networkSummary) {
      return {
        totalStores: 0,
        totalSales: 0,
        totalTransactions: 0,
        totalFootfall: 0,
        totalWastageUnits: 0,
        totalAvailableStock: 0,
        averageConversionRate: 0,
        averageComplianceScore: 0,
        storesRequiringAttention: 0,
        criticalStoresCount: 0,
        totalOpenActions: 0
      };
    }
    return activeAnalysisResult.networkSummary;
  }, [activeAnalysisResult]);

  // Selected Store Analysis
  const selectedAnalysis = useMemo(() => {
    if (analyses.length === 0) return null;
    if (!selectedStoreId) return analyses[0];
    return analyses.find(a => a.store.storeId === selectedStoreId) || analyses[0];
  }, [analyses, selectedStoreId]);

  // 5. Run Analysis Function
  const runAnalysis = async (
    storesToAnalyze: StoreRecord[],
    isSample: boolean = false,
    productsToAnalyze?: ProductRecord[]
  ): Promise<boolean> => {
    if (!storesToAnalyze || storesToAnalyze.length === 0) {
      return false;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeAll({
        stores: storesToAnalyze,
        products: productsToAnalyze
      });
      setActiveAnalysisResult(result);
      setIsSampleData(isSample);
      setSelectedStoreId(storesToAnalyze[0]?.storeId || null);
      setIsAnalyzing(false);
      return true;
    } catch (err) {
      console.error('Analysis failed:', err);
      setIsAnalyzing(false);
      return false;
    }
  };

  // 6. Load Supabase Data Function
  const loadSupabaseData = async (): Promise<boolean> => {
    setIsLoadingSupabase(true);
    setSupabaseError(null);
    try {
      const res: SupabaseFetchResult = await fetchSupabaseData();
      if (!res.success) {
        setSupabaseError(res.error || 'Failed to retrieve Supabase database rows.');
        setIsLoadingSupabase(false);
        return false;
      }

      setSupabaseTableCounts(res.tableCounts);

      if (res.mappedStoreRecords.length > 0) {
        const success = await runAnalysis(
          res.mappedStoreRecords,
          false,
          res.mappedProductRecords
        );
        if (success) {
          setIsSupabaseData(true);
          setIsSampleData(false);
        }
        setIsLoadingSupabase(false);
        return success;
      } else {
        setIsSupabaseData(true);
        setIsSampleData(false);
        setIsLoadingSupabase(false);
        return true;
      }
    } catch (err: any) {
      setSupabaseError(err?.message || 'Error connecting to Supabase database.');
      setIsLoadingSupabase(false);
      return false;
    }
  };

  // Clear current active analysis
  const clearAnalysis = () => {
    setActiveAnalysisResult(null);
    setSelectedStoreId(null);
    setIsSampleData(false);
    setIsSupabaseData(false);
    setSupabaseError(null);
  };

  // Load demo data using jury dataset
  const loadDemoData = async (): Promise<boolean> => {
    setIsSupabaseData(false);
    return await runAnalysis(OFFICIAL_JURY_STORES, true, OFFICIAL_JURY_PRODUCTS);
  };

  // Clear all data (both saved stores and active analysis)
  const clearAllData = () => {
    try {
      localStorage.removeItem('freshpulse_saved_stores_v1');
      localStorage.removeItem(LOCAL_STORAGE_ACTION_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SAMPLE_KEY);
    } catch {
      // Ignore
    }
    setSavedStores([]);
    setActiveAnalysisResult(null);
    setSelectedStoreId(null);
    setIsSampleData(false);
    setIsSupabaseData(false);
    setSupabaseError(null);
    setActionStatuses({});
  };

  // Update action status
  const updateActionStatus = (actionId: string, status: ActionStatus) => {
    setActionStatuses(prev => ({
      ...prev,
      [actionId]: status
    }));
  };

  const isDataLoaded = activeAnalysisResult !== null && analyses.length > 0;

  return (
    <StoreDataContext.Provider
      value={{
        savedStores,
        refreshSavedStores,
        addStore,
        modifyStore,
        removeStore,
        isSupabaseData,
        isLoadingSupabase,
        supabaseError,
        supabaseTableCounts,
        loadSupabaseData,
        activeAnalysisResult,
        analyses,
        networkSummary,
        selectedStoreId,
        selectedAnalysis,
        isAnalyzing,
        isDataLoaded,
        isSampleData,
        runAnalysis,
        clearAnalysis,
        loadDemoData,
        clearAllData,
        setSelectedStoreId,
        actionStatuses,
        updateActionStatus
      }}
    >
      {children}
    </StoreDataContext.Provider>
  );
};

export function useStoreData() {
  const context = useContext(StoreDataContext);
  if (!context) {
    throw new Error('useStoreData must be used within a StoreDataProvider');
  }
  return context;
}
