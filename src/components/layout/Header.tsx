import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sparkles, Store, ShieldCheck, FileEdit, RotateCcw, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { useStoreData } from '../../context/StoreDataContext';

interface HeaderProps {
  onOpenSidebar: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar, title }) => {
  const navigate = useNavigate();
  const {
    analyses,
    selectedStoreId,
    setSelectedStoreId,
    isDataLoaded,
    isSampleData,
    isSupabaseData,
    isLoadingSupabase,
    supabaseError,
    supabaseTableCounts,
    loadSupabaseData,
    clearAnalysis
  } = useStoreData();

  const handleConnectSupabase = async () => {
    const success = await loadSupabaseData();
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <div className="text-[11px] text-slate-500 hidden sm:block">
            Store Operations & Intelligence Platform
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Supabase DB Connection Button / Badge */}
        <button
          onClick={handleConnectSupabase}
          disabled={isLoadingSupabase}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
            isSupabaseData
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : supabaseError
              ? 'bg-red-50 border-red-300 text-red-800 hover:bg-red-100'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
          }`}
          title="Fetch live records from Supabase database tables (stores, products, inventory, sales)"
        >
          {isLoadingSupabase ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          ) : (
            <Database className="w-3.5 h-3.5 text-indigo-600" />
          )}
          <span>
            {isLoadingSupabase
              ? 'Connecting Supabase...'
              : isSupabaseData
              ? 'Supabase DB Connected'
              : 'Fetch Supabase DB'}
          </span>
        </button>

        {/* Dataset badge */}
        {isDataLoaded ? (
          <div className="hidden md:flex items-center gap-2">
            {isSupabaseData ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                Live Supabase PostgreSQL Data
              </span>
            ) : isSampleData ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-semibold text-amber-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Synthetic demonstration data
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                User Analysis ({analyses.length} Store{analyses.length > 1 ? 's' : ''})
              </span>
            )}
          </div>
        ) : (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-medium text-slate-600">
            No active analysis
          </span>
        )}

        {/* Store Selector in Header if multiple analyzed stores */}
        {isDataLoaded && analyses.length > 1 && (
          <div className="hidden sm:flex items-center gap-1.5">
            <Store className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStoreId || analyses[0]?.store.storeId}
              onChange={e => setSelectedStoreId(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {analyses.map(a => (
                <option key={a.store.storeId} value={a.store.storeId}>
                  {a.store.storeName} ({a.store.storeId})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Analyze Store Button */}
        <button
          onClick={() => navigate('/analyze')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
        >
          <FileEdit className="w-3.5 h-3.5" />
          <span>Analyze Store</span>
        </button>

        {/* Reset Analysis button */}
        {isDataLoaded && (
          <button
            onClick={() => {
              clearAnalysis();
              navigate('/analyze');
            }}
            title="Clear current analysis"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
