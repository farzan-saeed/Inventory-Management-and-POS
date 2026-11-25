import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Layers, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  UserCheck,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  getSavedAccounts, 
  removeSavedAccount 
} from '../services/authService';

export const Login = ({ initialMode }) => {
  const location = useLocation();
  const queryMode = new URLSearchParams(location.search).get('mode');
  const startMode = initialMode || location.state?.mode || (queryMode === 'register' ? 'register' : 'login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(startMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [role, setRole] = useState('Admin');

  // Saved accounts state for quick sign-in
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    setSavedAccounts(getSavedAccounts());
  }, []);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    } else if (location.state?.mode) {
      setMode(location.state.mode);
    } else if (queryMode === 'register') {
      setMode('register');
    }
  }, [initialMode, location.state, queryMode]);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSelectSavedAccount = async (acc) => {
    setEmail(acc.email);
    setPassword(acc.password || '');
    setError('');

    // If password was stored with saved credentials, authenticate directly
    if (acc.password) {
      setLoading(true);
      try {
        await login(acc.email, acc.password);
        navigate('/dashboard');
      } catch (err) {
        console.error("Auto sign-in error", err);
        setError(err.message || 'Failed to sign in with saved credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRemoveSaved = (emailToRemove) => {
    const updated = removeSavedAccount(emailToRemove);
    setSavedAccounts(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/dashboard');
      } else {
        const accountToSave = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role: role,
          password: password,
        };
        try {
          sessionStorage.setItem('smart_inventory_pending_save_account', JSON.stringify(accountToSave));
        } catch (e) {
          console.error("Failed to store pending account", e);
        }

        await register(email, password, name, role);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(err.message || 'Invalid email or password. Please verify credentials or create a new account.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/api-key-not-valid') {
        setError('Authentication service unavailable. Please check your credentials or create a new account.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100/80">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <div className="mb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Brand Card Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-blue-600 text-white shadow-sm mb-3">
            <Layers className="w-5 h-5" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">SmartInventory</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Smart Inventory & Sales Management System
          </p>
        </div>

        {/* Main Auth Form Container */}
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-7 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-800">
              {mode === 'login' ? 'Sign In to Your Account' : 'Register New User'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              {mode === 'login' ? 'Create Account' : 'Back to Login'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="Inventory Staff">Inventory Staff (Catalog & Stock)</option>
                    <option value="Sales Staff">Sales Staff (POS & Sales)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.75} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create & Sign In'}</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
                </>
              )}
            </button>
          </form>

          {/* Saved Accounts for Quick Sign-In */}
          {savedAccounts.length > 0 && mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <UserCheck className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
                  <span>Saved Accounts on this Device</span>
                </div>
                <span className="text-xs text-slate-400">
                  {savedAccounts.length} saved
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Click an account to sign in quickly:
              </p>
              <div className="space-y-1.5">
                {savedAccounts.map((acc) => (
                  <div
                    key={acc.email}
                    onClick={() => handleSelectSavedAccount(acc)}
                    className="group flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer text-left"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-medium text-slate-800 block truncate">{acc.name}</span>
                      <span className="text-xs text-slate-500 block truncate">{acc.email}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                        acc.role === 'Admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : acc.role === 'Inventory Staff'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {acc.role}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSaved(acc.email);
                        }}
                        title="Remove saved account"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security / System details footer */}
        <div className="mt-4 text-center text-xs text-slate-500">
          <p>Role-based access enforced via Firebase Authentication & Firestore Rules.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
