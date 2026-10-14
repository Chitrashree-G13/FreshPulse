/**
 * FreshPulse — Store Operations Intelligence
 * Clean, modern SaaS platform for franchise store operations.
 */

import React, { useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { StoreDataProvider, useStoreData } from './context/StoreDataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AnalyzeStorePage } from './components/pages/AnalyzeStorePage';
import { DashboardPage } from './components/pages/DashboardPage';
import { StoreDetailsPage } from './components/pages/StoreDetailsPage';
import { TasksPage } from './components/pages/TasksPage';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDataLoaded } = useStoreData();
  const location = useLocation();

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/analyze':
        return 'Analyze Your Store';
      case '/':
        return isDataLoaded ? 'Operations Dashboard' : 'Analyze Your Store';
      case '/dashboard':
        return 'Operations Dashboard';
      case '/store-details':
        return 'Store Performance Details';
      case '/tasks':
        return 'Tasks & Actions';
      default:
        return 'FreshPulse';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800 font-sans antialiased">
      {/* Navigation Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          onOpenSidebar={() => setSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={isDataLoaded ? <DashboardPage /> : <AnalyzeStorePage />}
            />
            <Route path="/analyze" element={<AnalyzeStorePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/store-details" element={<StoreDetailsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <StoreDataProvider>
      <HashRouter>
        <AppLayout />
      </HashRouter>
    </StoreDataProvider>
  );
}
