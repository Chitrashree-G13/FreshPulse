import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Building2,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  DollarSign,
  Eye,
  ShieldCheck,
  Search
} from 'lucide-react';
import { useStoreData } from '../../context/StoreDataContext';
import { ActionItem, ActionStatus, ActionPriority, RiskCategory } from '../../types';
import { Badge } from '../common/Badge';

interface TasksPageProps {
  onOpenDataModal?: (tab?: 'manual' | 'csv' | 'sample') => void;
}

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4
};

export const TasksPage: React.FC<TasksPageProps> = () => {
  const navigate = useNavigate();
  const {
    isDataLoaded,
    analyses,
    updateActionStatus
  } = useStoreData();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'executed' | 'rejected'>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | RiskCategory>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isDataLoaded || analyses.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-slate-200">
        <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">No Store Actions Available</h2>
        <p className="text-xs text-slate-500 mb-6 mt-1">
          Store recommendations are generated from your store operations analysis.
        </p>
        <button
          onClick={() => navigate('/analyze')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
        >
          Go to Analyze Store
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Aggregate all actions and sort strictly by urgency (urgent -> high -> medium -> low)
  const allActions: ActionItem[] = useMemo(() => {
    const list = analyses.flatMap(a => a.actions);
    return list.sort((a, b) => {
      const orderA = PRIORITY_ORDER[a.priority] || 5;
      const orderB = PRIORITY_ORDER[b.priority] || 5;
      return orderA - orderB;
    });
  }, [analyses]);

  const filteredActions = useMemo(() => {
    return allActions.filter(act => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'executed') {
          if (act.status !== 'executed' && act.status !== 'completed') return false;
        } else if (act.status !== statusFilter) {
          return false;
        }
      }
      if (storeFilter !== 'all' && act.storeId !== storeFilter) return false;
      if (urgencyFilter !== 'all' && act.priority !== urgencyFilter) return false;
      if (categoryFilter !== 'all' && act.category !== categoryFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matches =
          act.title.toLowerCase().includes(query) ||
          act.description.toLowerCase().includes(query) ||
          act.storeName.toLowerCase().includes(query) ||
          act.storeId.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [allActions, statusFilter, storeFilter, urgencyFilter, categoryFilter, searchTerm]);

  const pendingCount = allActions.filter(a => a.status === 'pending').length;
  const approvedCount = allActions.filter(a => a.status === 'approved').length;
  const executedCount = allActions.filter(a => a.status === 'executed' || a.status === 'completed').length;
  const rejectedCount = allActions.filter(a => a.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Tasks & Actionable Recommendations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ordered by urgency. Review, approve, and execute operational actions across stores.
          </p>
        </div>

        {/* Quick summary counts */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 font-semibold text-amber-800">
            {pendingCount} Pending
          </span>
          <span className="px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 font-semibold text-sky-800">
            {approvedCount} Approved
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 font-semibold text-emerald-800">
            {executedCount} Executed
          </span>
          {rejectedCount > 0 && (
            <span className="px-2.5 py-1 rounded-md bg-red-50 border border-red-200 font-semibold text-red-800">
              {rejectedCount} Rejected
            </span>
          )}
        </div>
      </div>

      {/* Filters Bar: Urgency, Category, Store, Status (Requirement E) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5 text-xs">
        {/* Row 1: Search & Status Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1">Status:</span>
            {(['all', 'pending', 'approved', 'executed', 'rejected'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 w-full md:w-48 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Store, Urgency, Category) */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          {/* Store Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Store:</span>
            <select
              value={storeFilter}
              onChange={e => setStoreFilter(e.target.value)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Stores ({analyses.length})</option>
              {analyses.map(a => (
                <option key={a.store.storeId} value={a.store.storeId}>
                  #{a.rank} {a.store.storeName} ({a.store.storeId})
                </option>
              ))}
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={e => setUrgencyFilter(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Urgencies</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Categories</option>
              <option value="inventory">Inventory</option>
              <option value="supply_chain">Supply Chain</option>
              <option value="wastage">Wastage</option>
              <option value="sales">Sales & Conversion</option>
              <option value="operations">Operations</option>
            </select>
          </div>

          <div className="ml-auto text-slate-400">
            Showing {filteredActions.length} of {allActions.length} actions
          </div>
        </div>
      </div>

      {/* ACTION ITEMS LIST (ORDERED BY URGENCY) */}
      {filteredActions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Actions Found</h3>
          <p className="text-xs text-slate-500 mt-1">No actions match your current filter selection.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map(action => {
            const isPending = action.status === 'pending';
            const isApproved = action.status === 'approved';
            const isExecuted = action.status === 'executed' || action.status === 'completed';
            const isRejected = action.status === 'rejected';

            return (
              <div
                key={action.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Top Row: Store Badge, Urgency Badge, Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                      {action.storeId}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {action.storeName}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                      • {action.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        action.priority === 'urgent'
                          ? 'critical'
                          : action.priority === 'high'
                          ? 'high'
                          : 'medium'
                      }
                      size="sm"
                    >
                      {action.priority.toUpperCase()} URGENCY
                    </Badge>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isExecuted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isApproved
                          ? 'bg-sky-100 text-sky-800'
                          : isRejected
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {action.status}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{action.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Concrete First Step & Expected Outcome Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Concrete First Step:</strong>
                    <span className="text-slate-700">{action.concreteFirstStep || action.rationale}</span>
                  </div>

                  <div>
                    <strong className="text-slate-800 block mb-0.5">Expected Outcome:</strong>
                    <span className="text-emerald-700 font-medium">{action.expectedOutcome || 'Stabilize store operating buffer.'}</span>
                  </div>

                  <div>
                    <strong className="text-slate-800 block mb-0.5">Specific Metrics to Monitor:</strong>
                    <span className="text-slate-600">
                      {action.monitoringMetrics?.join(' • ') || 'Inventory buffer • Checkout transactions'}
                    </span>
                  </div>

                  <div>
                    <strong className="text-slate-800 block mb-0.5">Feasibility Check:</strong>
                    <span className="text-slate-600">{action.feasibilityCheck || 'Standard shift execution.'}</span>
                  </div>
                </div>

                {/* Supporting Evidence */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                  <strong className="text-slate-800">Observed Evidence:</strong> {action.supportingEvidence}
                </div>

                {/* Simulated Impact Preview (Requirement E) */}
                {action.simulatedImpact && (
                  <div className="flex flex-wrap items-center justify-between text-xs bg-teal-50/60 border border-teal-100 p-2.5 rounded-lg text-teal-900">
                    <span>
                      <strong>Impact Preview:</strong> {action.simulatedImpact.riskReductionDetails}
                    </span>
                    {action.simulatedImpact.estimatedRevenueAtRisk && (
                      <span className="font-mono font-bold text-amber-800">
                        Revenue At Risk: ~${action.simulatedImpact.estimatedRevenueAtRisk.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}

                {/* Actionable Buttons: Approve, Reject, Execute (Requirement E) */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Action status changes persist in local storage automatically.
                  </span>

                  <div className="flex items-center gap-2">
                    {/* 1. APPROVE BUTTON */}
                    <button
                      onClick={() => updateActionStatus(action.id, 'approved')}
                      disabled={isApproved}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isApproved
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Approve'}
                    </button>

                    {/* 2. EXECUTE BUTTON */}
                    <button
                      onClick={() => updateActionStatus(action.id, 'executed')}
                      disabled={isExecuted}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors ${
                        isExecuted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {isExecuted ? 'Executed' : 'Execute'}
                    </button>

                    {/* 3. REJECT BUTTON */}
                    <button
                      onClick={() => updateActionStatus(action.id, 'rejected')}
                      disabled={isRejected}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-medium cursor-pointer transition-colors"
                    >
                      Reject
                    </button>

                    {/* 4. RESET BUTTON */}
                    {(isApproved || isExecuted || isRejected) && (
                      <button
                        onClick={() => updateActionStatus(action.id, 'pending')}
                        className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        title="Reset to Pending"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
