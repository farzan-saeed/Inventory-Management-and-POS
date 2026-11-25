import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  ShoppingCart, 
  Truck, 
  BarChart3, 
  Layers, 
  X 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/products', icon: Package },
  { name: 'Inventory & Stock', path: '/inventory', icon: Boxes },
  { name: 'Sales & POS', path: '/sales', icon: ShoppingCart },
  { name: 'Suppliers', path: '/suppliers', icon: Truck },
  { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { userProfile, role } = useAuth();

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'Inventory Staff':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Sales Staff':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20">
              <Layers className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">SmartInventory</h1>
              <p className="text-xs text-slate-400">Retail Store System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* User Role Tag */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Current Role</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${getRoleBadgeColor()}`}>
              {role}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Version & Credits Footer */}
        <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>SmartInventory v1.0</span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="System Online" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
