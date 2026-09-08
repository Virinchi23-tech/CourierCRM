import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminDashboard from './AdminDashboard';
import SalesDashboard from './SalesDashboard';
import OperationsDashboard from './OperationsDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (user?.role === 'ADMIN') {
    return <AdminDashboard data={data} />;
  }

  if (user?.role === 'SALES') {
    return <SalesDashboard data={data} />;
  }

  return <OperationsDashboard data={data} />;
}
