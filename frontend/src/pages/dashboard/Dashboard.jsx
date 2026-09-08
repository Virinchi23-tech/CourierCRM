import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import SalesDashboard from './SalesDashboard';
import OperationsDashboard from './OperationsDashboard';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await api.get('/reports/dashboard');
      if (res.success) {
        setData(res);
        setLastUpdated(new Date());
      } else {
        setError('Dashboard data unavailable. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Failed to connect to server. Check your connection.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-sky-500" />
        <span className="text-sm font-semibold">Loading dashboard metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-500">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-sm font-semibold text-rose-600">{error}</p>
        <button
          onClick={() => fetchDashboard(false)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  const refreshProps = {
    onRefresh: () => fetchDashboard(true),
    refreshing,
    lastUpdated
  };

  if (user?.role === 'ADMIN') {
    return <AdminDashboard data={data} {...refreshProps} />;
  }

  if (user?.role === 'SALES') {
    return <SalesDashboard data={data} {...refreshProps} />;
  }

  return <OperationsDashboard data={data} {...refreshProps} />;
}
