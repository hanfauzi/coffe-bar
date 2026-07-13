import { useState } from 'react';
import {
  ClipboardList,
  Coffee,
  LogOut,
  Moon,
  Package,
  RefreshCw,
  ShoppingBag,
  Sun,
  Clock,
  Menu,
  Sliders,
  CheckCircle2
} from 'lucide-react';


// Import Feature Pages
import DashboardPage from '../../features/dashboard/DashboardPage';
import ExpensesPage from '../../features/expenses/ExpensesPage';
import IngredientsPage from '../../features/ingredients/IngredientsPage';
import InventoryPage from '../../features/inventory/InventoryPage';
import MenusPage from '../../features/menus/MenusPage';
import PersonalCupsPage from '../../features/personal-cups/PersonalCupsPage';
import ReportsPage from '../../features/reports/ReportsPage';
import SalesPage from '../../features/sales/SalesPage';
import OrdersPage from '../../features/orders/OrdersPage';
import EstimatorPage from '../../features/estimator/EstimatorPage';
import ReconciliationsPage from '../../features/reconciliations/ReconciliationsPage';


interface SidebarLayoutProps {
  user: any;
  logout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
  fetchData: () => Promise<void>;
  loading: boolean;
  
  // Data props for pages
  dashboardData: any;
  financials: any;
  ingredients: any[];
  menus: any[];
  expenses: any[];
  sales: any[];
  consumptions: any[];
  transactions: any[];
  orders: any[];
  reconciliations: any[];
}

export default function SidebarLayout({
  user,
  logout,
  darkMode,
  toggleTheme,
  fetchData,
  loading,
  
  dashboardData,
  financials,
  ingredients,
  menus,
  expenses,
  sales,
  consumptions,
  transactions,
  orders,
  reconciliations,
}: SidebarLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Styling system variables mapped to our CSS theme variables
  const mainBgClass = 'bg-canvas text-ink';
  const sidebarBgClass = 'bg-surface border-r border-border';
  const dividerClass = 'border-border';
  const linkActiveTabClass = 'bg-primary/5 text-primary border-l-2 border-primary font-semibold';

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans ${mainBgClass}`}>

      {/* Mobile Top Navigation Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-surface border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileSidebarOpen(true)} 
            className="p-1 rounded-md hover:bg-surface-soft text-ink-secondary hover:text-ink cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-1.5 ml-1">
            <Coffee className="text-primary" size={18} />
            <span className="text-xs font-bold tracking-tight">BrewLedger</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="p-1.5 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-soft cursor-pointer"
            title="Ganti Tema"
          >
            {darkMode ? <Sun size={12} /> : <Moon size={12} />}
          </button>
          <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-[9px] text-primary font-bold">
            {user?.username?.[0]?.toUpperCase() || 'O'}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside className={`w-60 flex flex-col justify-between p-4 shrink-0 ${sidebarBgClass} fixed inset-y-0 left-0 z-50 transform ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:flex transition-transform duration-200 ease-in-out`}>
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between px-2 py-4 mb-6">
            <div className="flex items-center gap-2">
              <Coffee className="text-primary" size={24} />
              <span className="text-base font-extrabold tracking-tight">BrewLedger</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-6">
            {/* Dashboard / Analytics */}
            <div className="space-y-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Sun },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer active:scale-98 ${
                      active 
                        ? linkActiveTabClass 
                        : `text-ink-secondary hover:text-ink hover:bg-surface-soft`
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Master Data */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Master Data
              </div>
              {[
                { id: 'ingredients', label: 'Bahan Baku (Stock)', icon: Package },
                { id: 'menu', label: 'Menu & Resep Saji', icon: Coffee },
                { id: 'inventory', label: 'Histori Mutasi Stok', icon: ClipboardList },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer active:scale-98 ${
                      active 
                        ? linkActiveTabClass 
                        : `text-ink-secondary hover:text-ink hover:bg-surface-soft`
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Keuangan */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Keuangan
              </div>
              {[
                { id: 'orders', label: 'Pemesanan', icon: Clock },
                { id: 'sales', label: 'Penjualan', icon: ShoppingBag },
                { id: 'expenses', label: 'Pengeluaran', icon: Package },
                { id: 'reports', label: 'Laporan Keuangan', icon: ClipboardList },
                { id: 'reconciliations', label: 'Rekonsiliasi Kas', icon: CheckCircle2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer active:scale-98 ${
                      active 
                        ? linkActiveTabClass 
                        : `text-ink-secondary hover:text-ink hover:bg-surface-soft`
                    }`}
                  >
                    <Icon size={15} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Operasional / Konsumsi */}
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                Operasional
              </div>
              <button
                onClick={() => {
                  setActiveTab('personal');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer active:scale-98 ${
                  activeTab === 'personal'
                    ? linkActiveTabClass
                    : `text-ink-secondary hover:text-ink hover:bg-surface-soft`
                }`}
              >
                <Coffee size={15} />
                Konsumsi Pribadi
              </button>

              <button
                onClick={() => {
                  setActiveTab('estimator');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer active:scale-98 ${
                  activeTab === 'estimator'
                    ? linkActiveTabClass
                    : `text-ink-secondary hover:text-ink hover:bg-surface-soft`
                }`}
              >
                <Sliders size={15} />
                Simulasi Stok / Estimator
              </button>

            </div>
          </nav>
        </div>
        
        {/* Sync & Logout Footer */}
        <div className={`space-y-4 border-t pt-4 ${dividerClass}`}>
          <div className="flex justify-between items-center gap-2">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg text-ink-secondary hover:text-ink bg-surface-soft hover:bg-surface-muted transition cursor-pointer active:scale-95"
              title="Ganti Tema"
            >
              {darkMode ? <Sun size={13} /> : <Moon size={13} />}
            </button>

            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-ink bg-surface-soft hover:bg-surface-muted rounded-md border border-border cursor-pointer transition active:scale-98 disabled:opacity-50"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              Sync Data
            </button>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-surface-soft border border-border">
            <div className="flex items-center gap-2 truncate">
              <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-[10px] text-primary font-bold">
                {user?.username?.[0]?.toUpperCase() || 'O'}
              </div>
              <span className="text-[10px] font-bold text-ink truncate">{user?.username}</span>
            </div>
            <button 
              onClick={logout}
              className="text-ink-muted hover:text-error p-1 cursor-pointer transition"
              title="Keluar"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <DashboardPage 
            user={user}
            dashboardData={dashboardData}
            sales={sales}
            expenses={expenses}
            ingredients={ingredients}
            setActiveTab={setActiveTab}
            reconciliations={reconciliations}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersPage 
            orders={orders}
            menus={menus}
            ingredients={ingredients}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'sales' && (
          <SalesPage 
            sales={sales}
            ingredients={ingredients}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesPage 
            expenses={expenses}
            ingredients={ingredients}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryPage 
            transactions={transactions}
          />
        )}

        {activeTab === 'ingredients' && (
          <IngredientsPage 
            ingredients={ingredients}
            menus={menus}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'menu' && (
          <MenusPage 
            menus={menus}
            ingredients={ingredients}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'personal' && (
          <PersonalCupsPage 
            consumptions={consumptions}
            menus={menus}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage 
            financials={financials}
            ingredients={ingredients}
            sales={sales}
            expenses={expenses}
            consumptions={consumptions}
          />
        )}

        {activeTab === 'reconciliations' && (
          <ReconciliationsPage 
            orders={orders}
            expenses={expenses}
            fetchData={fetchData}
          />
        )}

        {activeTab === 'estimator' && (
          <EstimatorPage 
            ingredients={ingredients}
            menus={menus}
          />
        )}

      </main>
    </div>
  );
}
