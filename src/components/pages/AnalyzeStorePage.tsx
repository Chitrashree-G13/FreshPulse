import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileEdit,
  UploadCloud,
  Save,
  Play,
  RotateCcw,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Database,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Check
} from 'lucide-react';
import { useStoreData } from '../../context/StoreDataContext';
import {
  validateStoreInput,
  parseStoreCSV,
  getStoreCSVHeaderTemplate,
  VALID_PO_STATUSES
} from '../../engine/validator';
import { parseUploadedCSVFiles } from '../../engine/juryDataAdapter';
import { StoreRecord, ProductRecord, POStatus } from '../../types';

export const AnalyzeStorePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    savedStores,
    addStore,
    modifyStore,
    removeStore,
    runAnalysis,
    loadDemoData,
    loadSupabaseData,
    isLoadingSupabase,
    supabaseError,
    isAnalyzing
  } = useStoreData();

  // Active sub-tab: 'form' | 'csv'
  const [activeTab, setActiveTab] = useState<'form' | 'csv'>('form');

  // Editing state (if editing an existing saved store)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  // Form State
  const initialFormState: Partial<StoreRecord> = {
    storeId: '',
    storeName: '',
    location: '',
    analysisDate: new Date().toISOString().split('T')[0],
    totalSales: undefined,
    transactions: undefined,
    footfall: undefined,
    inventoryAvailable: undefined,
    inventorySold: undefined,
    wastageQuantity: undefined,
    purchaseOrderStatus: 'On Time' as POStatus,
    staffCount: undefined,
    complianceScore: undefined,
    notes: ''
  };

  const [formData, setFormData] = useState<Partial<StoreRecord>>(initialFormState);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Selection of saved stores for batch analysis
  const [selectedForAnalysis, setSelectedForAnalysis] = useState<string[]>([]);

  // CSV State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvUploadState, setCsvUploadState] = useState<{
    fileNames: string[];
    parsedStores: StoreRecord[];
    parsedProducts: ProductRecord[];
    summaryMessage: string;
    issues: string[];
    validCount: number;
    totalCount: number;
  } | null>(null);

  // Input Change Handler
  const handleInputChange = (field: keyof StoreRecord, value: string) => {
    if (formErrors[field]) {
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }

    if (
      [
        'totalSales',
        'transactions',
        'footfall',
        'inventoryAvailable',
        'inventorySold',
        'wastageQuantity',
        'staffCount',
        'complianceScore'
      ].includes(field)
    ) {
      const num = value === '' ? undefined : Number(value);
      setFormData(prev => ({ ...prev, [field]: num }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // 1. SAVE STORE BUTTON HANDLER
  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const validation = validateStoreInput(formData);
    if (!validation.isValid || !validation.record) {
      setFormErrors(validation.errors);
      setNotification({
        type: 'error',
        message: 'Please resolve the highlighted validation errors before saving.'
      });
      return;
    }

    if (isEditing && editingStoreId) {
      // Update existing
      const result = modifyStore(validation.record);
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
        setIsEditing(false);
        setEditingStoreId(null);
        setFormData(initialFormState);
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    } else {
      // Add new store
      const result = addStore(validation.record);
      if (result.success) {
        setNotification({ type: 'success', message: result.message });
        // Clear form after successful save
        setFormData(initialFormState);
        setFormErrors({});
      } else {
        setNotification({ type: 'error', message: result.message });
      }
    }
  };

  // 2. ANALYZE STORE BUTTON HANDLER (Form Input)
  const handleAnalyzeCurrentForm = async () => {
    setNotification(null);
    const validation = validateStoreInput(formData);
    if (!validation.isValid || !validation.record) {
      setFormErrors(validation.errors);
      setNotification({
        type: 'error',
        message: 'Please provide valid store information before analyzing.'
      });
      return;
    }

    const success = await runAnalysis([validation.record], false);
    if (success) {
      navigate('/dashboard');
    } else {
      setNotification({
        type: 'error',
        message: 'Analysis calculation failed. Please verify inputs.'
      });
    }
  };

  // 3. ANALYZE SELECTED SAVED STORES
  const handleAnalyzeSelectedSaved = async () => {
    const storesToAnalyze = savedStores.filter(s => selectedForAnalysis.includes(s.storeId));
    if (storesToAnalyze.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please select at least one saved store to analyze.'
      });
      return;
    }

    const success = await runAnalysis(storesToAnalyze, false);
    if (success) {
      navigate('/dashboard');
    }
  };

  // 4. ANALYZE SINGLE SAVED STORE DIRECTLY
  const handleAnalyzeSingleSaved = async (store: StoreRecord) => {
    const success = await runAnalysis([store], false);
    if (success) {
      navigate('/dashboard');
    }
  };

  // 5. LOAD STORE INTO FORM FOR EDITING
  const handleEditSavedStore = (store: StoreRecord) => {
    setFormData(store);
    setIsEditing(true);
    setEditingStoreId(store.storeId);
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. DELETE SAVED STORE
  const handleDeleteSavedStore = (storeId: string) => {
    if (window.confirm(`Delete store ID "${storeId}" from saved records?`)) {
      const res = removeStore(storeId);
      setNotification({
        type: res.success ? 'success' : 'error',
        message: res.message
      });
      setSelectedForAnalysis(prev => prev.filter(id => id !== storeId));
      if (editingStoreId === storeId) {
        setIsEditing(false);
        setEditingStoreId(null);
        setFormData(initialFormState);
      }
    }
  };

  // 7. RESET FORM
  const handleResetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setIsEditing(false);
    setEditingStoreId(null);
    setNotification(null);
  };

  // 8. CSV FILE HANDLING
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const res = await parseUploadedCSVFiles(files);
      setCsvUploadState({
        fileNames: res.fileNames,
        parsedStores: res.stores,
        parsedProducts: res.products,
        summaryMessage: res.summaryMessage,
        issues: res.issues,
        validCount: res.stores.length,
        totalCount: res.stores.length
      });
    } catch (err) {
      console.error('Failed to parse uploaded CSV files:', err);
      setNotification({
        type: 'error',
        message: 'Failed to parse uploaded CSV files. Please verify your file format.'
      });
    }
  };

  // Save parsed CSV rows to Saved Stores
  const handleSaveCSVRounds = () => {
    if (!csvUploadState || csvUploadState.parsedStores.length === 0) return;
    let addedCount = 0;
    csvUploadState.parsedStores.forEach(s => {
      const res = addStore(s);
      if (res.success) addedCount++;
    });

    setNotification({
      type: 'success',
      message: `Saved ${addedCount} stores from CSV to your saved stores list.`
    });
    setCsvUploadState(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Analyze parsed CSV directly
  const handleAnalyzeCSVDirect = async () => {
    if (!csvUploadState || csvUploadState.parsedStores.length === 0) return;
    const success = await runAnalysis(
      csvUploadState.parsedStores,
      false,
      csvUploadState.parsedProducts
    );
    if (success) {
      navigate('/dashboard');
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csvContent = getStoreCSVHeaderTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'freshpulse_store_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Analyze Your Store
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Enter your store data or load directly from Supabase PostgreSQL database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={async () => {
                const success = await loadSupabaseData();
                if (success) navigate('/dashboard');
              }}
              disabled={isLoadingSupabase}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              {isLoadingSupabase ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              Fetch Supabase DB
            </button>

            <button
              onClick={async () => {
                const success = await loadDemoData();
                if (success) navigate('/dashboard');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold cursor-pointer transition-colors"
              title="Load illustrative demo stores for testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Load Demo Data
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {supabaseError && (
          <div className="mt-4 p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Supabase Error: {supabaseError}</span>
          </div>
        )}

        {/* Global Notification Banner */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Loading Overlay state if analyzing */}
        {isAnalyzing && (
          <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold flex items-center gap-3">
            <span className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
            <span>Analyzing store data... Evaluating buffer coverage, spoilage, and operational risks.</span>
          </div>
        )}
      </div>

      {/* TABS: MANUAL INPUT vs CSV UPLOAD */}
      <div className="flex border-b border-slate-200 gap-3">
        <button
          onClick={() => setActiveTab('form')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'form'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileEdit className="w-3.5 h-3.5" />
          Manual Store Input Form
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`py-2.5 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
            activeTab === 'csv'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          CSV Upload Control
        </button>
      </div>

      {/* TAB 1: MANUAL STORE FORM */}
      {activeTab === 'form' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              {isEditing ? `Edit Store: ${formData.storeId}` : 'Enter Store Operational Data'}
            </h2>
            {isEditing && (
              <span className="text-xs bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                Editing Mode
              </span>
            )}
          </div>

          <form onSubmit={handleSaveStore} noValidate className="space-y-6">
            {/* Section 1: Store Information */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3">
                1. Store Identification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Store ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FP-101"
                    disabled={isEditing}
                    value={formData.storeId || ''}
                    onChange={e => handleInputChange('storeId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.storeId ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    } ${isEditing ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                    required
                  />
                  {formErrors.storeId && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.storeId}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Downtown Central"
                    value={formData.storeName || ''}
                    onChange={e => handleInputChange('storeName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.storeName ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.storeName && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.storeName}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Concourse"
                    value={formData.location || ''}
                    onChange={e => handleInputChange('location', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.location ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.location && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.location}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Analysis Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.analysisDate || ''}
                    onChange={e => handleInputChange('analysisDate', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Sales & Customer Footfall */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3">
                2. Sales & Customer Traffic
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Total Sales ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.totalSales !== undefined ? formData.totalSales : ''}
                    onChange={e => handleInputChange('totalSales', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.totalSales ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.totalSales && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.totalSales}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Transactions <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.transactions !== undefined ? formData.transactions : ''}
                    onChange={e => handleInputChange('transactions', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.transactions ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.transactions && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.transactions}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Customer Footfall <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.footfall !== undefined ? formData.footfall : ''}
                    onChange={e => handleInputChange('footfall', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.footfall ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.footfall && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.footfall}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Inventory & Wastage */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3">
                3. Inventory & Wastage (Units)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Inventory Available (Units) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.inventoryAvailable !== undefined ? formData.inventoryAvailable : ''}
                    onChange={e => handleInputChange('inventoryAvailable', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.inventoryAvailable ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.inventoryAvailable && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.inventoryAvailable}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Inventory Sold (Units) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.inventorySold !== undefined ? formData.inventorySold : ''}
                    onChange={e => handleInputChange('inventorySold', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.inventorySold ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.inventorySold && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.inventorySold}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Wastage Quantity (Units) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.wastageQuantity !== undefined ? formData.wastageQuantity : ''}
                    onChange={e => handleInputChange('wastageQuantity', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.wastageQuantity ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.wastageQuantity && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.wastageQuantity}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Operations & Logistics */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3">
                4. Operations, Logistics & Compliance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Purchase Order Delivery Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.purchaseOrderStatus || 'On Time'}
                    onChange={e => handleInputChange('purchaseOrderStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  >
                    {VALID_PO_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Staff Count <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="4"
                    value={formData.staffCount !== undefined ? formData.staffCount : ''}
                    onChange={e => handleInputChange('staffCount', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.staffCount ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.staffCount && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.staffCount}</span>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Compliance Score (0–100) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="85"
                    value={formData.complianceScore !== undefined ? formData.complianceScore : ''}
                    onChange={e => handleInputChange('complianceScore', e.target.value)}
                    className={`w-full px-3 py-2 border font-mono rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                      formErrors.complianceScore ? 'border-red-400 bg-red-50/40' : 'border-slate-300'
                    }`}
                    required
                  />
                  {formErrors.complianceScore && (
                    <span className="text-red-600 text-[11px] mt-0.5 block">{formErrors.complianceScore}</span>
                  )}
                </div>
              </div>
            </div>

            {/* BUTTON BAR: SAVE STORE, ANALYZE STORE, RESET (Requirement Section 2) */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                Reset Form
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {/* 1. SAVE STORE BUTTON */}
                <button
                  type="submit"
                  onClick={handleSaveStore}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-teal-400" />
                  {isEditing ? 'Update Saved Store' : 'Save Store'}
                </button>

                {/* 2. ANALYZE STORE BUTTON */}
                <button
                  type="button"
                  onClick={handleAnalyzeCurrentForm}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Store'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CSV UPLOAD CONTROL */}
      {activeTab === 'csv' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upload Store Operations CSV</h2>
              <p className="text-xs text-slate-500 mt-0.5">Parse multiple store records using Papa Parse.</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Template
            </button>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-teal-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-teal-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              Click to browse or select your CSV dataset file(s)
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Select one or all 9 dataset CSV files: <code>stores.csv</code>, <code>products.csv</code>, <code>inventory.csv</code>, <code>sales.csv</code>, <code>wastage.csv</code>, <code>purchase_orders.csv</code>, <code>customers.csv</code>, <code>staff.csv</code>, <code>compliance.csv</code>.
            </p>
          </div>

          {/* Parsed CSV Review Section */}
          {csvUploadState && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    Uploaded Files: {csvUploadState.fileNames.join(', ')}
                  </div>
                  <div className="text-slate-600 mt-1 font-medium">
                    {csvUploadState.summaryMessage}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCSVRounds}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-teal-400" />
                    Save Stores to List
                  </button>
                  <button
                    onClick={handleAnalyzeCSVDirect}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Analyze Uploaded Stores
                  </button>
                </div>
              </div>

              {/* Parsed Stores Table Preview */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Store Name</th>
                      <th className="px-3 py-2">Sales</th>
                      <th className="px-3 py-2">Orders</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Wastage</th>
                      <th className="px-3 py-2">PO Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {csvUploadState.parsedStores.map(s => (
                      <tr key={s.storeId}>
                        <td className="px-3 py-1.5 font-bold text-teal-800">{s.storeId}</td>
                        <td className="px-3 py-1.5 font-sans font-medium text-slate-900">{s.storeName}</td>
                        <td className="px-3 py-1.5">₹{s.totalSales.toLocaleString()}</td>
                        <td className="px-3 py-1.5">{s.transactions}</td>
                        <td className="px-3 py-1.5">{s.inventoryAvailable}</td>
                        <td className="px-3 py-1.5">{s.wastageQuantity}</td>
                        <td className="px-3 py-1.5 font-sans">{s.purchaseOrderStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVED STORES SECTION (Requirement Section 1 & 2) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              Saved Stores ({savedStores.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Persistent records in local browser storage. Select and click "Analyze Store" to generate report.
            </p>
          </div>

          {savedStores.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (selectedForAnalysis.length === savedStores.length) {
                    setSelectedForAnalysis([]);
                  } else {
                    setSelectedForAnalysis(savedStores.map(s => s.storeId));
                  }
                }}
                className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg cursor-pointer"
              >
                {selectedForAnalysis.length === savedStores.length ? 'Deselect All' : 'Select All'}
              </button>

              <button
                onClick={handleAnalyzeSelectedSaved}
                disabled={selectedForAnalysis.length === 0 || isAnalyzing}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-current" />
                Analyze Selected ({selectedForAnalysis.length})
              </button>
            </div>
          )}
        </div>

        {savedStores.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">No Saved Stores Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Use the manual form above and click "Save Store" or upload a CSV file to save your store records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedForAnalysis.length === savedStores.length && savedStores.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedForAnalysis(savedStores.map(s => s.storeId));
                        } else {
                          setSelectedForAnalysis([]);
                        }
                      }}
                      className="rounded accent-teal-600"
                    />
                  </th>
                  <th className="px-3 py-2.5">Store ID</th>
                  <th className="px-3 py-2.5">Store Name</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Sales</th>
                  <th className="px-3 py-2.5">Orders</th>
                  <th className="px-3 py-2.5">Stock</th>
                  <th className="px-3 py-2.5">Wastage</th>
                  <th className="px-3 py-2.5">PO Status</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {savedStores.map(store => {
                  const isChecked = selectedForAnalysis.includes(store.storeId);

                  return (
                    <tr key={store.storeId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedForAnalysis(prev => [...prev, store.storeId]);
                            } else {
                              setSelectedForAnalysis(prev => prev.filter(id => id !== store.storeId));
                            }
                          }}
                          className="rounded accent-teal-600 cursor-pointer"
                        />
                      </td>

                      <td className="px-3 py-2.5 font-mono font-bold text-teal-800">
                        {store.storeId}
                      </td>

                      <td className="px-3 py-2.5 font-bold text-slate-900">
                        {store.storeName}
                      </td>

                      <td className="px-3 py-2.5 text-slate-500">
                        {store.location}
                      </td>

                      <td className="px-3 py-2.5 font-mono text-slate-800">
                        ${store.totalSales.toLocaleString()}
                      </td>

                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {store.transactions}
                      </td>

                      <td className="px-3 py-2.5 font-mono">
                        <span className={store.inventoryAvailable === 0 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                          {store.inventoryAvailable}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-slate-700">
                        {store.wastageQuantity}
                      </td>

                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                          store.purchaseOrderStatus === 'Critical Delay'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : store.purchaseOrderStatus === 'Delayed'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {store.purchaseOrderStatus}
                        </span>
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleAnalyzeSingleSaved(store)}
                            title="Analyze this store now"
                            className="p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            onClick={() => handleEditSavedStore(store)}
                            title="Edit store"
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSavedStore(store.storeId)}
                            title="Delete store"
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
