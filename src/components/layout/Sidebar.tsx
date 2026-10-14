import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FileEdit,
  LayoutDashboard,
  Store,
  CheckSquare,
  Sparkles,
  Database,
  Trash2,
  X,
  Play
} from 'lucide-react';
import { useStoreData } from '../../context/StoreDataContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDataModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    savedStores,
    isDataLoaded,
    isSampleData,
    clearAnalysis,
    clearAllData
  } = useStoreData();

  const navLinks = [
    {
      to: '/analyze',
      label: 'Analyze Store',
      icon: FileEdit,
      badge: `${savedStores.length} Saved`
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      requiresData: true
    },
    {
      to: '/store-details',
      label: 'Store Details',
      icon: Store,
      requiresData: true
    },
    {
      to: '/tasks',
      label: 'Tasks & Actions',
      icon: CheckSquare,
      requiresData: true
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo and Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold text-base">
              F
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight">
                FreshPulse
              </div>
              <div className="text-[10px] text-teal-400 font-medium tracking-wide uppercase">
                Store Operations
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset Status Banner */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Analysis State</span>
            {isDataLoaded ? (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                isSampleData ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSampleData ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {isSampleData ? 'Synthetic Demo' : 'Live Analysis'}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Not analyzed yet</span>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navLinks.map(item => {
            const Icon = item.icon;
            const disabled = item.requiresData && !isDataLoaded;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600/20 text-teal-300 font-semibold border border-teal-500/30'
                      : disabled
                      ? 'text-slate-500 hover:text-slate-400 opacity-60 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {item.badge}
                  </span>
                ) : disabled ? (
                  <span className="text-[10px] text-slate-500 italic">No analysis</span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-2">
          {isDataLoaded ? (
            <button
              onClick={() => {
                clearAnalysis();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
            >
              Reset Current Analysis
            </button>
          ) : null}

          {savedStores.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all saved stores from browser localStorage?')) {
                  clearAllData();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-900/60 text-red-400 hover:bg-red-950/40 text-xs font-medium cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Saved Stores
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
