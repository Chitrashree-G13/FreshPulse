import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingDown,
  Building2,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Trash2,
  Truck,
  ShieldCheck,
  CheckSquare,
  Target,
  Flame,
  Activity,
  Eye,
  Check,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { useStoreData } from '../../context/StoreDataContext';
import { Badge } from '../common/Badge';

interface StoreDetailsPageProps {
  onOpenDataModal?: (tab?: 'manual' | 'csv' | 'sample') => void;
}

export const StoreDetailsPage: React.FC<StoreDetailsPageProps> = () => {
  const navigate = useNavigate();
  const {
    isDataLoaded,
    analyses,
    selectedStoreId,
    setSelectedStoreId,
    selectedAnalysis,
    updateActionStatus
  } = useStoreData();

  if (!isDataLoaded || !selectedAnalysis) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white rounded-2xl border border-slate-200">
        <Store className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">No Store Selected</h2>
        <p className="text-xs text-slate-500 mb-6 mt-1">
          Please run an analysis to review individual store performance and recommendations.
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

  const { store, metrics, risks, actions, rank, urgencyLevel, mainProblem, primaryEvidence, businessImpact, firstAction, rankExplanation, coreAnswers, rootCauseAnalysis } = selectedAnalysis;

  // Days of stock remaining calculation
  const daysCoverage = store.inventorySold > 0
    ? (store.inventoryAvailable / store.inventorySold).toFixed(2)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Store Header & Rank Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold font-mono text-lg shrink-0 ${
            rank === 1
              ? 'bg-red-600 text-white shadow-xs'
              : rank === 2
              ? 'bg-amber-500 text-white'
              : 'bg-teal-700 text-white'
          }`}>
            #{rank}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {store.storeName}
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {store.storeId}
              </span>
              <Badge
                variant={
                  urgencyLevel === 'Critical'
                    ? 'critical'
                    : urgencyLevel === 'High'
                    ? 'high'
                    : urgencyLevel === 'Medium'
                    ? 'medium'
                    : 'neutral'
                }
                size="sm"
              >
                {urgencyLevel} Priority
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Location: {store.location} • Report Date: {store.analysisDate} • Network Rank: #{rank} of {analyses.length}
            </p>
            <p className="text-xs text-slate-700 font-medium mt-1">
              {rankExplanation}
            </p>
          </div>
        </div>

        {/* Switch Store Dropdown & Score */}
        <div className="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Priority Score</div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {selectedAnalysis.priorityScore}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
          </div>

          {analyses.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedStoreId || store.storeId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                {analyses.map(a => (
                  <option key={a.store.storeId} value={a.store.storeId}>
                    #{a.rank} {a.store.storeName} ({a.priorityScore} pts)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7 CORE DECISION QUESTIONS ANSWERED IN PLAIN LANGUAGE (Requirement 1 & 2) */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Executive Decision Briefing: 7 Core Manager Questions
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-teal-300 bg-teal-950 border border-teal-800 px-2.5 py-0.5 rounded-full">
            Plain-Language Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* Q1 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              1. Which store should I investigate first?
            </div>
            <p className="text-slate-200 leading-relaxed">
              {coreAnswers.q1WhichStore}
            </p>
          </div>

          {/* Q2 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              2. What is the most important problem in this store?
            </div>
            <p className="text-slate-200 leading-relaxed font-semibold">
              {coreAnswers.q2WhatProblem}
            </p>
          </div>

          {/* Q3 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              3. What actual data supports this finding?
            </div>
            <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
              {coreAnswers.q3WhatEvidence}
            </p>
          </div>

          {/* Q4 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
              4. Why is this problem more urgent than problems in other stores?
            </div>
            <p className="text-slate-200 leading-relaxed">
              {coreAnswers.q4WhyMoreUrgent}
            </p>
          </div>

          {/* Q5 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              5. What is the estimated business impact if it continues?
            </div>
            <p className="text-slate-200 leading-relaxed">
              <strong className="text-red-300 font-bold">{businessImpact.formattedLoss}</strong>: {coreAnswers.q5BusinessImpact}
            </p>
          </div>

          {/* Q6 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              6. Which action should be taken first?
            </div>
            <p className="text-slate-200 leading-relaxed">
              {coreAnswers.q6ActionFirst}
            </p>
          </div>

          {/* Q7 */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 md:col-span-2 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              7. What should the manager monitor after taking that action?
            </div>
            <p className="text-slate-200 leading-relaxed">
              {coreAnswers.q7WhatToMonitor}
            </p>
          </div>
        </div>
      </section>

      {/* KEY METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Sales & Orders</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900 font-mono">
            ${store.totalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {store.transactions} orders (${metrics.averageBasketSize.toFixed(2)} avg basket)
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Traffic & Conversion</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900 font-mono">
            {store.footfall} visitors
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.conversionRate}% checkout conversion
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Stock Buffer Coverage</span>
            <Package className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-base font-bold font-mono ${store.inventoryAvailable === 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {store.inventoryAvailable} units
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {daysCoverage !== null ? `${daysCoverage}x daily sales velocity` : 'No velocity'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
            <span>Wastage & Delivery</span>
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className={`text-base font-bold font-mono ${metrics.wastageRate > 6 ? 'text-amber-600' : 'text-slate-900'}`}>
            {metrics.wastageRate.toFixed(1)}% waste
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            PO: <span className="font-semibold text-slate-700">{store.purchaseOrderStatus}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROOT-CAUSE INVESTIGATION SECTION (Requirement C) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900">
              Root-Cause Investigation Analysis
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Factual diagnosis & ruled-out causes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Most Likely Causes */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
            <div className="font-bold text-amber-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Most Likely Causes (Supported by Data)
            </div>
            <ul className="space-y-1.5 pt-1 text-slate-700">
              {rootCauseAnalysis.mostLikelyCauses.map((cause, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{cause}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Causes Ruled Out by Data */}
          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Causes Ruled Out by Dataset Evidence
            </div>
            <ul className="space-y-1.5 pt-1 text-slate-700">
              {rootCauseAnalysis.ruledOutCauses.length > 0 ? (
                rootCauseAnalysis.ruledOutCauses.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))
              ) : (
                <li className="text-slate-500 italic">No alternative operational factors ruled out under current metrics.</li>
              )}
            </ul>
          </div>

          {/* Supporting Facts */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <CheckSquare className="w-4 h-4 text-teal-600" />
              Supporting Facts from User Dataset
            </div>
            <ul className="space-y-1.5 pt-1 text-slate-700 font-mono text-[11px]">
              {rootCauseAnalysis.supportingFacts.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Missing Data & Falsification Criteria */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Missing Data That Limits Confidence
              </div>
              <ul className="space-y-1 pt-1.5 text-slate-600 text-[11px]">
                {rootCauseAnalysis.missingData.map((miss, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span>{miss}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                What Would Prove Diagnosis Wrong (Falsification)
              </div>
              <ul className="space-y-1 pt-1.5 text-slate-600 text-[11px]">
                {rootCauseAnalysis.falsificationCriteria.map((crit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PRACTICAL RECOMMENDATIONS & ACTIONS (Requirement D) */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recommended Practical Actions ({actions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Concrete operational steps, expected outcomes, monitoring metrics, and feasibility checks.
            </p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Manage All Tasks
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {actions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-700">No Interventions Needed</h3>
            <p className="text-xs text-slate-500 mt-1">Store is currently operating smoothly within normal parameters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map(action => {
              const isPending = action.status === 'pending';
              const isApproved = action.status === 'approved';
              const isExecuted = action.status === 'executed' || action.status === 'completed';
              const isRejected = action.status === 'rejected';

              return (
                <div
                  key={action.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
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
                        {action.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <h3 className="font-bold text-slate-900 text-sm">{action.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        isExecuted
                          ? 'bg-emerald-100 text-emerald-800'
                          : isApproved
                          ? 'bg-sky-100 text-sky-800'
                          : isRejected
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {action.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {action.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <strong className="text-slate-800 block mb-0.5">Concrete First Step:</strong>
                      <span className="text-slate-600">{action.concreteFirstStep || action.rationale}</span>
                    </div>

                    <div>
                      <strong className="text-slate-800 block mb-0.5">Expected Outcome:</strong>
                      <span className="text-emerald-700 font-medium">{action.expectedOutcome || 'Stabilize store operating buffer.'}</span>
                    </div>

                    <div>
                      <strong className="text-slate-800 block mb-0.5">Specific Monitoring Indicators:</strong>
                      <span className="text-slate-600">
                        {action.monitoringMetrics?.join(' • ') || 'Inventory units • Checkout volume'}
                      </span>
                    </div>

                    <div>
                      <strong className="text-slate-800 block mb-0.5">Feasibility Check:</strong>
                      <span className="text-slate-600">{action.feasibilityCheck || 'Standard shift task.'}</span>
                    </div>
                  </div>

                  {/* Impact preview */}
                  {action.simulatedImpact && (
                    <div className="flex flex-wrap items-center justify-between text-xs bg-teal-50/60 border border-teal-100 p-2.5 rounded-lg text-teal-900">
                      <span>
                        <strong>Score Impact:</strong> Priority score projected to reduce from {action.simulatedImpact.currentScore} down to {action.simulatedImpact.projectedScore} points.
                      </span>
                      {action.simulatedImpact.estimatedRevenueAtRisk && (
                        <span className="font-mono font-bold text-amber-800">
                          Protects ~${action.simulatedImpact.estimatedRevenueAtRisk.toLocaleString()} revenue
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actionable buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => updateActionStatus(action.id, 'approved')}
                      disabled={isApproved}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isApproved
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Approve Action'}
                    </button>

                    <button
                      onClick={() => updateActionStatus(action.id, 'executed')}
                      disabled={isExecuted}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        isExecuted
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      <Play className="w-3 h-3 inline mr-1 fill-current" />
                      {isExecuted ? 'Executed' : 'Execute Action'}
                    </button>

                    <button
                      onClick={() => updateActionStatus(action.id, 'rejected')}
                      disabled={isRejected}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer"
                    >
                      Reject
                    </button>

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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
