import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Layers, 
  Package, 
  Boxes, 
  ShoppingCart, 
  Truck, 
  AlertCircle, 
  BarChart3, 
  ArrowRight, 
  Check, 
  Menu, 
  X, 
  PackagePlus, 
  Receipt, 
  TrendingUp 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import WarehouseHeroIllustration from '../components/WarehouseHeroIllustration';

export const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (currentUser || userProfile) {
      navigate('/dashboard');
    } else {
      navigate('/login?mode=register', { state: { mode: 'register' } });
    }
  };

  const handleSignIn = () => {
    if (currentUser || userProfile) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      title: 'Product Management',
      summary: 'Add, edit, organize and manage product records.',
      description: 'Create standardized catalog records, categorize items, validate unique SKUs, and manage purchase and retail pricing in one structured directory.',
      icon: Package,
      badge: 'Catalog Control',
    },
    {
      title: 'Stock Management',
      summary: 'Track stock movements and monitor available quantities.',
      description: 'Record incoming supplier shipments, process manual write-offs, and maintain a complete audit ledger of every stock movement.',
      icon: Boxes,
      badge: 'Real-time Tracking',
    },
    {
      title: 'Sales Management',
      summary: 'Record transactions and automatically update inventory.',
      description: 'Process customer checkouts with a cashier-friendly POS terminal that computes totals, deducts stock atomically, and logs completed orders.',
      icon: ShoppingCart,
      badge: 'Instant POS Sync',
    },
    {
      title: 'Supplier Management',
      summary: 'Maintain supplier information and associated products.',
      description: 'Keep vendor contacts, orders, and addresses current with built-in relational safeguards preventing accidental deletion of active suppliers.',
      icon: Truck,
      badge: 'Vendor Directory',
    },
    {
      title: 'Low Stock Alerts',
      summary: 'Identify products that need restocking.',
      description: 'Automated monitoring flags items dipping to or below reorder levels so your team can replenish before stockouts disrupt sales.',
      icon: AlertCircle,
      badge: 'Proactive Restocking',
    },
    {
      title: 'Reports & Analytics',
      summary: 'Review sales performance and inventory reports.',
      description: 'Track 7-day sales trends, calculate gross profit margins, evaluate stock turnover, filter by custom date ranges, and export clean CSV reports.',
      icon: BarChart3,
      badge: 'Business Insights',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Manage Your Products',
      subtitle: 'Add products and organize your inventory.',
      description: 'Set up categories, pricing, unit quantities, and reorder levels to establish your single source of product truth.',
      icon: PackagePlus,
    },
    {
      step: '02',
      title: 'Record Your Sales',
      subtitle: 'Process sales transactions and automatically update stock.',
      description: 'Ring up orders via the POS cashier interface. Inventory deductions and item receipts update instantly without manual tallies.',
      icon: Receipt,
    },
    {
      step: '03',
      title: 'Monitor Your Business',
      subtitle: 'Review inventory levels, transactions and reports.',
      description: 'Track weekly turnover, monitor low stock items, review audit movements, and export executive reports for complete visibility.',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* ---------------- NAVIGATION BAR ---------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Brand Logo & Title */}
            <div 
              onClick={() => scrollToSection('hero')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
                <Layers className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex items-center">
                <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-blue-600 transition">
                  SmartInventory
                </span>
                <span className="hidden sm:inline-block ml-2.5 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md border border-slate-200/70">
                  Retail Edition
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <button 
                onClick={() => scrollToSection('hero')}
                className="hover:text-slate-900 transition-colors"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="hover:text-slate-900 transition-colors"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className="hover:text-slate-900 transition-colors"
              >
                How It Works
              </button>
            </nav>

            {/* Desktop Authentication CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {currentUser || userProfile ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    Signed in as <strong className="text-slate-800 font-semibold">{userProfile?.name || currentUser?.email?.split('@')[0]}</strong>
                  </span>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm transition active:scale-[0.98]"
                  >
                    Get Started
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Menu Toggle */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" strokeWidth={2} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              How It Works
            </button>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {currentUser || userProfile ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <button
                    onClick={handleSignIn}
                    className="w-full py-2.5 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-sm"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
      <main className="flex-1">
        {/* ---------------- HERO SECTION ---------------- */}
        <section id="hero" className="relative pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Copy & Actions */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Supporting Text Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 text-slate-700 border border-slate-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                  <span>Everything you need to manage your inventory in one place.</span>
                </div>

                {/* Primary Headline */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                  Manage Your Inventory. <br className="hidden sm:inline" />
                  <span className="text-blue-600">Simplify Your Business.</span>
                </h1>

                {/* Supporting Description */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                  Take control of your products, stock, suppliers, and sales with one simple inventory management platform.
                </p>

                {/* Action CTA Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <button
                    onClick={handleGetStarted}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium text-sm sm:text-base hover:bg-blue-700 shadow-sm transition active:scale-[0.98]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </button>

                  <button
                    onClick={() => scrollToSection('features')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm sm:text-base transition active:scale-[0.98]"
                  >
                    <span>Explore Features</span>
                  </button>
                </div>

                {/* Key Capability Indicators */}
                <div className="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
                    <span>Real-time POS checkout</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
                    <span>Automated low stock alerts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} />
                    <span>Pre-loaded demo evaluation</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Custom Inventory Vector Illustration */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <WarehouseHeroIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- FEATURES SECTION ---------------- */}
        <section id="features" className="py-20 sm:py-28 bg-slate-50/70 border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-semibold text-blue-600 tracking-wide">
                Core Capabilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
                Everything You Need to Manage Your Inventory
              </h2>
              <p className="text-base text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
                A simple, robust system built to eliminate stock discrepancies, delay replenishment, and give retail store teams total visibility.
              </p>
            </div>

            {/* 6 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top: Icon & Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/70">
                          <IconComponent className="w-5 h-5" strokeWidth={1.75} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 rounded-md">
                          {feature.badge}
                        </span>
                      </div>

                      {/* Card Content */}
                      <h3 className="text-base font-semibold text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-700 mt-1">
                        {feature.summary}
                      </p>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- HOW IT WORKS SECTION ---------------- */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-semibold text-blue-600 tracking-wide">
                Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
                Simple Inventory Management in Three Steps
              </h2>
              <p className="text-base text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
                Designed for retail store operations, your team can start organizing inventory and ringing up sales immediately.
              </p>
            </div>

            {/* 3 Step Process Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7">
              {workflowSteps.map((stepItem, idx) => {
                const StepIcon = stepItem.icon;
                return (
                  <div
                    key={idx}
                    className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-6 sm:p-7 flex flex-col items-start hover:bg-slate-50 transition-colors"
                  >
                    {/* Top Row: Step Badge & Icon */}
                    <div className="flex items-center justify-between w-full mb-4">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                        Step {stepItem.step}
                      </span>
                      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shadow-xs">
                        <StepIcon className="w-4.5 h-4.5" strokeWidth={1.75} />
                      </div>
                    </div>

                    {/* Step Title & Subtitle */}
                    <h3 className="text-base font-semibold text-slate-900 mt-2 mb-1">
                      {stepItem.title}
                    </h3>
                    <p className="text-sm font-medium text-blue-700 mb-2">
                      {stepItem.subtitle}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {stepItem.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------------- CALL TO ACTION SECTION ---------------- */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12 lg:p-14 text-center border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto space-y-5">
                <span className="inline-block text-xs font-medium text-blue-300 bg-slate-800 border border-slate-700/80 px-3 py-1 rounded-md">
                  Ready to optimize retail operations?
                </span>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                  Ready to Take Control of Your Inventory?
                </h2>

                <p className="text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
                  Bring your products, stock and sales management together in one place.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <button
                    onClick={handleGetStarted}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium text-sm sm:text-base hover:bg-blue-500 shadow-sm transition active:scale-[0.98]"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </button>

                  <button
                    onClick={handleSignIn}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm sm:text-base transition border border-slate-700"
                  >
                    <span>Sign In to Your Account</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 pt-1 font-normal">
                  No complex setup required. Evaluation accounts pre-configured for academic inspection.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="bg-white border-t border-slate-200 pt-12 pb-8 text-slate-500 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-100">
            {/* Brand column */}
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold">
                  <Layers className="w-4 h-4" strokeWidth={2} />
                </div>
                <span className="text-base font-bold text-slate-900 tracking-tight">
                  SmartInventory
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                Smart Inventory and Sales Management System — a simple, functional, and user-friendly web application designed for retail store product cataloging, stock control, POS sales processing, and supplier tracking.
              </p>
            </div>

            {/* Quick Links Column */}
            <div className="md:col-span-3 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={() => scrollToSection('hero')} 
                    className="hover:text-blue-600 transition"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('features')} 
                    className="hover:text-blue-600 transition"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('how-it-works')} 
                    className="hover:text-blue-600 transition"
                  >
                    How It Works
                  </button>
                </li>
              </ul>
            </div>

            {/* Authentication Column */}
            <div className="md:col-span-3 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
                Access
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button 
                    onClick={handleSignIn} 
                    className="hover:text-blue-600 transition"
                  >
                    Sign In
                  </button>
                </li>
                <li>
                  <button 
                    onClick={handleGetStarted} 
                    className="hover:text-blue-600 transition"
                  >
                    Get Started (Register)
                  </button>
                </li>
                {currentUser || userProfile ? (
                  <li>
                    <Link 
                      to="/dashboard" 
                      className="hover:text-blue-600 transition font-medium text-blue-600"
                    >
                      Open Dashboard
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Project Note */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} SmartInventory. All rights reserved.
            </p>
            <p className="text-slate-400 text-center sm:text-right">
              University Academic Information System Project — Retail Store Edition
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
