import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Trash2,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  FileEdit,
  UploadCloud,
  Store,
  Info,
  Target,
  Flame,
  CheckSquare,
  HelpCircle,
  Eye,
  Activity,
  Database,
  RefreshCw,
  Code2,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { useStoreData } from '../../context/StoreDataContext';
import { Badge } from '../common/Badge';
import { ScoreGauge } from '../common/ScoreGauge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isDataLoaded,
    isSampleData,
    isSupabaseData,
    isLoadingSupabase,
    supabaseError,
    supabaseTableCounts,
    loadSupabaseData,
    analyses,
    networkSummary,
    setSelectedStoreId,
    loadDemoData,
    clearAnalysis
  } = useStoreData();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'Critical' | 'High' | 'Medium' | 'Low'>('all');
  const [showSqlSeedModal, setShowSqlSeedModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Filtered stores
  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => {
      const s = a.store;
      const matchesSearch =
        s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.storeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.mainProblem.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (urgencyFilter !== 'all' && a.urgencyLevel !== urgencyFilter) return false;
      return true;
    });
  }, [analyses, searchTerm, urgencyFilter]);

  // Priority #1 Store (Ranked first by the engine)
  const priorityOneStore = analyses.length > 0 ? analyses[0] : null;

  // Operational alerts breakdown
  const stockShortageStores = useMemo(() => {
    return analyses.filter(
      a => a.store.inventoryAvailable === 0 || a.metrics.stockToSalesRatio < 0.35
    );
  }, [analyses]);

  const highWastageStores = useMemo(() => {
    return analyses.filter(a => a.metrics.wastageRate > 6);
  }, [analyses]);

  const delayedDeliveryStores = useMemo(() => {
    return analyses.filter(
      a =>
        a.store.purchaseOrderStatus === 'Delayed' ||
        a.store.purchaseOrderStatus === 'Critical Delay'
    );
  }, [analyses]);

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    navigate('/store-details');
  };

  const sqlSeedText = `-- FreshPulse AI — Supabase Demo Record Seed Script
-- Run this in your Supabase SQL Editor to populate demo records into products, inventory, and sales tables.

INSERT INTO public.products (id, product_name, category, price, sku) VALUES
(1, 'Organic Gala Apples 1kg', 'Produce', 3.99, 'SKU-APP-01'),
(2, 'Fresh Whole Milk 1L', 'Dairy', 2.49, 'SKU-MLK-02'),
(3, 'Whole Wheat Sliced Bread', 'Bakery', 2.99, 'SKU-BRD-03'),
(4, 'Ripe Bananas Bunch 1kg', 'Produce', 1.99, 'SKU-BAN-04'),
(5, 'Free Range Eggs 12pk', 'Dairy', 4.50, 'SKU-EGG-05')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory (id, store_id, product_id, stock) VALUES
(1, 1, 1, 120),
(2, 1, 2, 45),
(3, 1, 3, 80),
(4, 1, 4, 15),
(5, 1, 5, 200)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sales (id, store_id, product_id, sale_date) VALUES
(1, 1, 1, NOW() - INTERVAL '1 day'),
(2, 1, 2, NOW() - INTERVAL '1 day'),
(3, 1, 3, NOW() - INTERVAL '2 days'),
(4, 1, 4, NOW() - INTERVAL '1 day'),
(5, 1, 5, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSeedText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // EMPTY STATE (Section 1 & 3 requirement)
  if (!isDataLoaded || analyses.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-8 sm:p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto mb-5 font-bold text-xl">
            FP
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            FreshPulse Store Operations
          </h2>
          <p className="text-base font-medium text-slate-600 mb-2">
            Turn your store data into clear daily decisions.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
            Prioritize which store to investigate first, identify root causes backed by empirical data, estimate business loss, and execute concrete operational recommendations.
          </p>

          {/* Error Banner if Supabase connection failed */}
          {supabaseError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong>Supabase Error:</strong> {supabaseError}
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-lg mx-auto mb-8">
            <button
              onClick={() => loadSupabaseData()}
              disabled={isLoadingSupabase}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              {isLoadingSupabase ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              Fetch Supabase Database
            </button>

            <button
              onClick={() => navigate('/analyze')}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <FileEdit className="w-4 h-4" />
              Manual Input Form
            </button>
          </div>

          {/* Optional Sample Data Button */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-400">Want to preview the decision-support dashboard with example data?</p>
            <button
              onClick={loadDemoData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Load Demo Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chart data from active user stores
  const chartData = analyses.map(a => ({
    name: a.store.storeName.length > 14 ? `${a.store.storeName.slice(0, 12)}…` : a.store.storeName,
    storeId: a.store.storeId,
    sales: a.store.totalSales,
    footfall: a.store.footfall,
    orders: a.store.transactions,
    stockCoverage: Number(a.metrics.stockToSalesRatio.toFixed(2)),
    wastagePct: Number(a.metrics.wastageRate.toFixed(1))
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Live Supabase Connection Banner */}
      {isSupabaseData && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs text-emerald-950">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <strong>Connected to Supabase PostgreSQL Database.</strong> Real records fetched from database tables.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadSupabaseData()}
                disabled={isLoadingSupabase}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSupabase ? 'animate-spin' : ''}`} />
                Refresh DB Data
              </button>
              <button
                onClick={() => setShowSqlSeedModal(true)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-700" />
                Demo Seed SQL
              </button>
            </div>
          </div>

          {/* Table Row Counts */}
          {supabaseTableCounts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/80 font-mono text-[11px]">
              <div className="bg-white/80 px-2.5 py-1 rounded border border-emerald-200">
                <span className="text-slate-500 font-sans">stores: </span>
                <strong className="text-emerald-800">{supabaseTableCounts.stores} rows</strong>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded border border-emerald-200">
                <span className="text-slate-500 font-sans">products: </span>
                <strong className={supabaseTableCounts.products === 0 ? 'text-amber-700' : 'text-emerald-800'}>
                  {supabaseTableCounts.products} rows
                </strong>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded border border-emerald-200">
                <span className="text-slate-500 font-sans">inventory: </span>
                <strong className={supabaseTableCounts.inventory === 0 ? 'text-amber-700' : 'text-emerald-800'}>
                  {supabaseTableCounts.inventory} rows
                </strong>
              </div>
              <div className="bg-white/80 px-2.5 py-1 rounded border border-emerald-200">
                <span className="text-slate-500 font-sans">sales: </span>
                <strong className={supabaseTableCounts.sales === 0 ? 'text-amber-700' : 'text-emerald-800'}>
                  {supabaseTableCounts.sales} rows
                </strong>
              </div>
            </div>
          )}

          {/* Empty Tables Warning Notice if products/inventory/sales are empty */}
          {supabaseTableCounts && (supabaseTableCounts.products === 0 || supabaseTableCounts.inventory === 0 || supabaseTableCounts.sales === 0) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice:</span> Some Supabase tables (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">products</code>, <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">inventory</code>, or <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">sales</code>) currently contain 0 rows in your database. Store metadata from <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">stores</code> is displayed above. Click <strong>Demo Seed SQL</strong> to get non-sensitive SQL insert queries to populate demo items in Supabase.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Illustrative Sample Data Alert Banner */}
      {isSampleData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Currently viewing synthetic demonstration data.</strong> Clear this illustrative data or connect to your Supabase database anytime.
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => loadSupabaseData()}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Fetch Supabase DB
            </button>
            <button
              onClick={clearAnalysis}
              className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-medium cursor-pointer"
            >
              Reset Demo
            </button>
          </div>
        </div>
      )}

      {/* SQL Seed Modal */}
      {showSqlSeedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Supabase Demo Record SQL Seed Script
                </h3>
              </div>
              <button
                onClick={() => setShowSqlSeedModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Copy and execute these SQL statements in your <strong>Supabase Dashboard &gt; SQL Editor</strong> to populate demo items into your <code className="font-mono bg-slate-100 px-1 rounded">products</code>, <code className="font-mono bg-slate-100 px-1 rounded">inventory</code>, and <code className="font-mono bg-slate-100 px-1 rounded">sales</code> PostgreSQL tables:
            </p>

            <pre className="bg-slate-900 text-slate-100 font-mono text-[11px] p-4 rounded-xl overflow-x-auto max-h-64">
              {sqlSeedText}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={copySqlToClipboard}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                {copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}
              </button>

              <button
                onClick={() => setShowSqlSeedModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HERO SECTION: PRIORITY #1 STORE TO INVESTIGATE FIRST */}
      {priorityOneStore && (
        <section className="bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 sm:p-7 text-white shadow-lg space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold tracking-wide uppercase">
                <Target className="w-3.5 h-3.5 text-red-400 shrink-0" />
                Priority #1 Store to Investigate First
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {priorityOneStore.store.storeName}
                </h2>
                <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-slate-800 font-bold text-teal-300">
                  {priorityOneStore.store.storeId}
                </span>
                <span className="text-xs text-slate-400">
                  {priorityOneStore.store.location} • Report Date: {priorityOneStore.store.analysisDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Risk Priority Score
                </div>
                <div className="text-3xl font-black font-mono text-red-400">
                  {priorityOneStore.priorityScore}
                  <span className="text-sm text-slate-500 font-normal">/100</span>
                </div>
                <div className="text-[11px] font-bold text-red-300 uppercase">
                  {priorityOneStore.urgencyLevel} Urgency
                </div>
              </div>

              <button
                onClick={() => handleSelectStore(priorityOneStore.store.storeId)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold shadow-md hover:shadow-teal-500/20 transition-all cursor-pointer"
              >
                Investigate Details
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                1. Main Problem Detected
              </div>
              <p className="text-slate-100 font-medium leading-relaxed">
                {priorityOneStore.mainProblem}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                2. Supporting Data Evidence
              </div>
              <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                {priorityOneStore.primaryEvidence}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                3. Why Most Urgent in Network
              </div>
              <p className="text-slate-200 leading-relaxed">
                {priorityOneStore.coreAnswers.q4WhyMoreUrgent}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-red-400" />
                4. Estimated Business Loss Impact
              </div>
              <p className="text-slate-100 font-medium leading-relaxed">
                <strong className="text-red-300 font-bold">{priorityOneStore.businessImpact.formattedLoss}</strong>: {priorityOneStore.businessImpact.description}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                5. Recommended First Action
              </div>
              <p className="text-slate-200 leading-relaxed">
                <strong className="text-white">{priorityOneStore.firstAction.title}:</strong> {priorityOneStore.firstAction.concreteStep}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                6. What Manager Must Monitor
              </div>
              <p className="text-slate-200 leading-relaxed">
                {priorityOneStore.firstAction.monitoringMetrics.join(' • ')}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* RANKED STORES PRIORITY LIST */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Ranked Stores Priority List ({filteredAnalyses.length})
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Stores automatically ranked from most urgent to lowest risk based on actual data evidence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search store or problem..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 w-52 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value as any)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="all">All Urgencies</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200 tracking-wider">
              <tr>
                <th className="px-3.5 py-3 w-14 text-center">Rank</th>
                <th className="px-3.5 py-3">Store</th>
                <th className="px-3.5 py-3">Urgency & Score</th>
                <th className="px-3.5 py-3">Main Problem</th>
                <th className="px-3.5 py-3">Supporting Evidence</th>
                <th className="px-3.5 py-3">Business Impact</th>
                <th className="px-3.5 py-3">Recommended First Action</th>
                <th className="px-3.5 py-3">Why Ranked Here</th>
                <th className="px-3.5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAnalyses.map(analysis => {
                const s = analysis.store;
                const isRankOne = analysis.rank === 1;

                return (
                  <tr
                    key={s.storeId}
                    onClick={() => handleSelectStore(s.storeId)}
                    className={`hover:bg-slate-50/90 transition-colors cursor-pointer ${
                      isRankOne ? 'bg-red-50/30' : ''
                    }`}
                  >
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-black font-mono text-xs ${
                          analysis.rank === 1
                            ? 'bg-red-600 text-white shadow-xs'
                            : analysis.rank === 2
                            ? 'bg-amber-500 text-white'
                            : analysis.rank === 3
                            ? 'bg-amber-100 text-amber-900 font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        #{analysis.rank}
                      </span>
                    </td>

                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-900 hover:text-teal-700 flex items-center gap-1.5">
                        {s.storeName}
                      </div>
                      <div className="font-mono text-[11px] text-teal-800 font-semibold">{s.storeId}</div>
                      <div className="text-[11px] text-slate-400">{s.location}</div>
                    </td>

                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {analysis.priorityScore}
                          <span className="text-[10px] text-slate-400 font-normal">/100</span>
                        </span>
                        <Badge
                          variant={
                            analysis.urgencyLevel === 'Critical'
                              ? 'critical'
                              : analysis.urgencyLevel === 'High'
                              ? 'high'
                              : analysis.urgencyLevel === 'Medium'
                              ? 'medium'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {analysis.urgencyLevel}
                        </Badge>
                      </div>
                    </td>

                    <td className="px-3.5 py-3 max-w-xs">
                      <p className="font-medium text-slate-900 line-clamp-2">
                        {analysis.mainProblem}
                      </p>
                    </td>

                    <td className="px-3.5 py-3 max-w-xs">
                      <p className="font-mono text-[11px] text-slate-600 line-clamp-2">
                        {analysis.primaryEvidence}
                      </p>
                    </td>

                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className={`font-mono font-bold text-xs ${
                        analysis.businessImpact.severity === 'critical'
                          ? 'text-red-700 bg-red-50 px-2 py-0.5 rounded'
                          : analysis.businessImpact.severity === 'high'
                          ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded'
                          : 'text-slate-700'
                      }`}>
                        {analysis.businessImpact.formattedLoss}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 max-w-xs">
                      <p className="text-slate-800 font-semibold line-clamp-1">
                        {analysis.firstAction.title}
                      </p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {analysis.firstAction.concreteStep}
                      </p>
                    </td>

                    <td className="px-3.5 py-3 max-w-xs text-[11px] text-slate-600 leading-tight">
                      <p className="line-clamp-2">
                        {analysis.rankExplanation}
                      </p>
                    </td>

                    <td className="px-3.5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSelectStore(s.storeId);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-teal-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Investigate
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* KEY NETWORK METRICS */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Total Sales</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
            ${networkSummary.totalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{networkSummary.totalStores} store{networkSummary.totalStores !== 1 ? 's' : ''}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Transactions</span>
            <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
            {networkSummary.totalTransactions.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Orders checked out</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Footfall Traffic</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
            {networkSummary.totalFootfall.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {networkSummary.averageConversionRate}% avg conversion
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Available Stock</span>
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
            {networkSummary.totalAvailableStock.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Units on hand</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Wastage Volume</span>
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${networkSummary.totalWastageUnits > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {networkSummary.totalWastageUnits.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Units spoiled</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1 flex items-center justify-between">
            <span>Delayed Deliveries</span>
            <Truck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-lg sm:text-xl font-bold font-mono ${delayedDeliveryStores.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {delayedDeliveryStores.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending shipments</div>
        </div>
      </section>

      {/* OPERATIONAL ALERT PANELS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
                !
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Stock Shortages</h3>
            </div>
            <span className="text-xs font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {stockShortageStores.length} store{stockShortageStores.length !== 1 ? 's' : ''}
            </span>
          </div>

          {stockShortageStores.length === 0 ? (
            <p className="text-xs text-slate-500 pt-2">All stores maintain adequate stock coverage.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {stockShortageStores.map(a => (
                <div
                  key={a.store.storeId}
                  onClick={() => handleSelectStore(a.store.storeId)}
                  className="p-2.5 rounded-lg bg-red-50/50 hover:bg-red-50 border border-red-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{a.store.storeName}</div>
                    <div className="text-[11px] text-slate-500">
                      Available: {a.store.inventoryAvailable} units ({a.metrics.stockToSalesRatio.toFixed(2)}x coverage)
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                W
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Wastage Alerts</h3>
            </div>
            <span className="text-xs font-bold font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {highWastageStores.length} store{highWastageStores.length !== 1 ? 's' : ''}
            </span>
          </div>

          {highWastageStores.length === 0 ? (
            <p className="text-xs text-slate-500 pt-2">Wastage rates across all stores are below threshold (&lt;6%).</p>
          ) : (
            <div className="space-y-2 pt-1">
              {highWastageStores.map(a => (
                <div
                  key={a.store.storeId}
                  onClick={() => handleSelectStore(a.store.storeId)}
                  className="p-2.5 rounded-lg bg-amber-50/50 hover:bg-amber-50 border border-amber-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{a.store.storeName}</div>
                    <div className="text-[11px] text-slate-500">
                      Wastage Rate: {a.metrics.wastageRate.toFixed(1)}% ({a.store.wastageQuantity} units)
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Delayed Deliveries</h3>
            </div>
            <span className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {delayedDeliveryStores.length} order{delayedDeliveryStores.length !== 1 ? 's' : ''}
            </span>
          </div>

          {delayedDeliveryStores.length === 0 ? (
            <p className="text-xs text-slate-500 pt-2">All supplier purchase orders are on time or delivered.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {delayedDeliveryStores.map(a => (
                <div
                  key={a.store.storeId}
                  onClick={() => handleSelectStore(a.store.storeId)}
                  className="p-2.5 rounded-lg bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-semibold text-slate-900">{a.store.storeName}</div>
                    <div className="text-[11px] text-slate-500">
                      Status: {a.store.purchaseOrderStatus}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CHARTS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Store Sales & Customer Footfall</h3>
              <p className="text-[11px] text-slate-500">Comparing recorded sales ($) and visitor traffic</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              {isSupabaseData ? 'Supabase Live' : 'Live Data'}
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="sales" name="Sales ($)" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="footfall" name="Footfall (Visitors)" fill="#0284c7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Coverage & Wastage Rate</h3>
              <p className="text-[11px] text-slate-500">Days of stock coverage vs. percentage of produce wasted</p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              Efficiency
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="stockCoverage" name="Stock Coverage (x)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wastagePct" name="Wastage Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};
