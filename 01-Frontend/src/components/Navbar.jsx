import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  LogOut, 
  User, 
  ChevronDown, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Navbar = ({ onToggleSidebar, lowStockCount = 0 }) => {
  const { currentUser, userProfile, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const displayEmail = userProfile?.email || currentUser?.email || 'user@inventory.edu';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm">
      {/* Left: Mobile hamburger & title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs font-medium text-slate-500">
            Store Management Console
          </span>
        </div>
      </div>

      {/* Right: Alerts, Profile & Logout */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Low Stock Alert Button */}
        <button
          onClick={() => navigate('/inventory')}
          title={lowStockCount > 0 ? `${lowStockCount} items at or below reorder level` : 'Stock levels normal'}
          className="relative p-2 text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors"
        >
          <Bell className="w-5 h-5" strokeWidth={1.75} />
          {lowStockCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
              {lowStockCount}
            </span>
          )}
        </button>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{displayName}</p>
              <p className="text-xs text-slate-500 leading-tight">{role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" strokeWidth={1.75} />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 z-50 w-56 mt-2 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-slate-100 p-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md">
                      Role: {role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full gap-2 px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
