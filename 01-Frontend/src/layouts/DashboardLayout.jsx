import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { KeyRound, Check, CheckCircle2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { getLowStockProducts } from '../services/inventoryService';
import { saveAccountCredentials } from '../services/authService';

export const DashboardLayout = () => {
  const { 
    currentUser, 
    userProfile, 
    loading,
    pendingSaveAccount,
    savePendingAccount,
    dismissPendingAccount
  } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const location = useLocation();

  const handleConfirmSave = () => {
    if (pendingSaveAccount) {
      savePendingAccount();
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 4500);
    }
  };

  const handleDismissSave = () => {
    dismissPendingAccount();
  };

  useEffect(() => {
    // Periodically or on route change check low stock counts
    const checkStock = async () => {
      try {
        const lowStock = await getLowStockProducts();
        setLowStockCount(lowStock.length);
      } catch (err) {
        console.warn("Failed to check low stock", err);
      }
    };

    if (currentUser || userProfile) {
      checkStock();
    }
  }, [currentUser, userProfile, location.pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner text="Authenticating user access..." size="large" />
      </div>
    );
  }

  // If not authenticated, redirect to Login
  if (!currentUser && !userProfile) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          lowStockCount={lowStockCount}
        />

        {/* Save Login Credentials Banner (appears after new account creation) */}
        {pendingSaveAccount && (
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-4 py-3 shadow-md border-b border-blue-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 border border-white/20">
                <KeyRound className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-xs font-semibold text-white flex items-center gap-2">
                  <span>Save login credentials on this device?</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    pendingSaveAccount.role === 'Admin' 
                      ? 'bg-purple-900/60 text-purple-200 border border-purple-400/40' 
                      : pendingSaveAccount.role === 'Inventory Staff'
                      ? 'bg-amber-900/60 text-amber-200 border border-amber-400/40'
                      : 'bg-emerald-900/60 text-emerald-200 border border-emerald-400/40'
                  }`}>
                    {pendingSaveAccount.role}
                  </span>
                </p>
                <p className="text-xs text-blue-100 mt-0.5">
                  Save <strong className="text-white font-medium">{pendingSaveAccount.name}</strong> ({pendingSaveAccount.email}) for quick one-click sign-in.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={handleDismissSave}
                className="px-3 py-1.5 text-xs font-medium text-blue-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-3.5 py-1.5 text-xs font-semibold bg-white text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Save Login Info</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Toast after Saving */}
        {saveSuccessToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" strokeWidth={2} />
              <span>Login credentials saved! You can now use quick sign-in from the login page.</span>
            </div>
            <button 
              onClick={() => setSaveSuccessToast(false)} 
              className="text-emerald-200 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet context={{ refreshLowStock: () => {} }} />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
