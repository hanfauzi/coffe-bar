import { useEffect, useState } from 'react';
import { useToast } from './context/ToastContext';

// Import Layout & Auth Page
import AuthPage from './features/auth/AuthPage';
import SidebarLayout from './components/layout/SidebarLayout';

// Import Custom Hooks Layer
import { useAuth } from './features/auth/hooks/useAuth';
import { useIngredients } from './features/ingredients/hooks/useIngredients';
import { useSales } from './features/sales/hooks/useSales';
import { useExpenses } from './features/expenses/hooks/useExpenses';
import { useMenus } from './features/menus/hooks/useMenus';
import { usePersonalCups } from './features/personal-cups/hooks/usePersonalCups';
import { useInventory } from './features/inventory/hooks/useInventory';
import { useReports } from './features/reports/hooks/useReports';
import { useOrders } from './features/orders/hooks/useOrders';
import { useReconciliations } from './features/reconciliations/hooks/useReconciliations';

export default function App() {
  const { toast } = useToast();
  
  // Theme state: default to light mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Hook-based State Management
  const { token, user, loading: authLoading, logout, setAuth } = useAuth();
  
  const { dashboardData, financials, loading: reportsLoading, refetch: refetchReports } = useReports(token);
  const { ingredients, loading: ingredientsLoading, refetch: refetchIngredients } = useIngredients(token);
  const { menus, loading: menusLoading, refetch: refetchMenus } = useMenus(token);
  const { expenses, loading: expensesLoading, refetch: refetchExpenses } = useExpenses(token);
  const { sales, loading: salesLoading, refetch: refetchSales } = useSales(token);
  const { consumptions, loading: consumptionsLoading, refetch: refetchConsumptions } = usePersonalCups(token);
  const { transactions, loading: transactionsLoading, refetch: refetchTransactions } = useInventory(token);
  const { orders, loading: ordersLoading, refetch: refetchOrders } = useOrders(token);
  const { reconciliations, loading: reconciliationsLoading, refetch: refetchReconciliations } = useReconciliations(token);

  const loading = authLoading || reportsLoading || ingredientsLoading || menusLoading || expensesLoading || salesLoading || consumptionsLoading || transactionsLoading || ordersLoading || reconciliationsLoading;

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Sync HTML class for dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Sync data across all hooks
  const fetchData = async () => {
    if (!token) return;
    try {
      await Promise.all([
        refetchReports(),
        refetchIngredients(),
        refetchMenus(),
        refetchExpenses(),
        refetchSales(),
        refetchConsumptions(),
        refetchTransactions(),
        refetchOrders(),
        refetchReconciliations(),
      ]);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('Unauthorized') || e.message?.includes('token')) {
        logout();
      } else {
        toast.error(e.message || 'Gagal memuat data dari server');
      }
    }
  };

  // Re-fetch data on mount or token state change
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    setAuth(newToken, newUser);
  };

  // Login View
  if (!token) {
    return (
      <AuthPage 
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <SidebarLayout 
      user={user}
      logout={logout}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      fetchData={fetchData}
      loading={loading}
      
      dashboardData={dashboardData}
      financials={financials}
      ingredients={ingredients}
      menus={menus}
      expenses={expenses}
      sales={sales}
      consumptions={consumptions}
      transactions={transactions}
      orders={orders}
      reconciliations={reconciliations}
    />
  );
}
