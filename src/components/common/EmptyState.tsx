import React from 'react';
import { UploadCloud, FileEdit, Database, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  onEnterManual: () => void;
  onUploadCSV: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onEnterManual, onUploadCSV }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-8 md:p-12 text-center relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-sky-500 to-indigo-500" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 mb-6">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          Status: <span className="text-slate-800">No data loaded.</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          FreshPulse AI
        </h1>
        <p className="text-lg md:text-xl font-medium text-slate-700 mb-3">
          Turn your store data into clear daily decisions.
        </p>
        <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Enter your store information or upload your own CSV file to identify risks, investigate possible causes and prioritize actions across your franchise network.
        </p>

        {/* The Two Primary Working Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <button
            onClick={onEnterManual}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            <FileEdit className="w-4 h-4" />
            Enter Store Data
          </button>
          <button
            onClick={onUploadCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            <UploadCloud className="w-4 h-4" />
            Upload CSV
          </button>
        </div>

        {/* Zero-Prefill Trust & Isolation Notice */}
        <div className="border-t border-slate-100 pt-8 mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              Zero-Prefill Guarantee
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              FreshPulse AI never uses mock data, preloaded records, or fabricated metrics. Everything is calculated solely from your explicit input.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600" />
              Deterministic Rule Engine
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Explainable retail logic answers Where, Why, What next, and What if we are wrong with zero black-box hallucination.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-100">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs mb-1.5">
              <ArrowRight className="w-4 h-4 text-indigo-600" />
              Cross-Store Transfer Matcher
            </div>
            <p className="text-xs text-slate-500 leading-normal">
              Upload multiple stores or SKU records to identify peer-to-peer inventory transfers that balance stockouts against surplus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
