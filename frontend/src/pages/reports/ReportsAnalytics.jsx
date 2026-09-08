import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, Download, RefreshCw, TrendingUp, Users, Truck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const STATUS_COLORS = {
  DRAFT: '#94a3b8',
  SENT: '#0284c7',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
  EXPIRED: '#f59e0b'
};

export default function ReportsAnalytics() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.get('/reports/detailed');
      if (res.success) setReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(false);
  }, []);

  const salesChartData = (reports?.salesReport || []).map(r => ({
    status: r.status,
    quotations: Number(r.total_quotations),
    value: Number(r.total_value) || 0
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" /> Executive Reports & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">Deep analytics across lead conversion, sales revenue, shipment performance & courier metrics</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchReports(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          {/* Grid of Report Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Lead Conversion Breakdown */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" /> Lead Pipeline & Conversion Metrics
              </h3>
              {(reports?.leadsReport || []).length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-semibold">No lead data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                      <tr><th className="p-2.5">Status</th><th className="p-2.5">Lead Source</th><th className="p-2.5 text-right">Count</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(reports?.leadsReport || []).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-semibold text-sky-700">{r.status}</td>
                          <td className="p-2.5 text-slate-500">{r.source}</td>
                          <td className="p-2.5 text-right font-bold text-slate-900">{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Courier Performance Summary */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-600" /> Courier Partner Volume Analysis
              </h3>
              {(reports?.courierReport || []).length === 0 ? (
                <div className="py-6 text-center text-slate-400 font-semibold">No courier data available</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                      <tr><th className="p-2.5">Courier Partner</th><th className="p-2.5 text-right">Shipments Handled</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(reports?.courierReport || []).map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold text-purple-700">{c.courier_name}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 text-sm">{c.shipment_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sales Quotations Report (full width) */}
          <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Quotations & Sales Revenue by Status
            </h3>
            {salesChartData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 font-semibold text-xs">No quotation data available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesChartData}>
                      <XAxis dataKey="status" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                        formatter={(val, name) => [name === 'value' ? `₹${Number(val).toLocaleString()}` : val, name === 'value' ? 'Revenue' : 'Quotations']}
                      />
                      <Bar dataKey="quotations" fill="#0284c7" radius={[6, 6, 0, 0]}>
                        {salesChartData.map((entry, index) => (
                          <Cell key={index} fill={STATUS_COLORS[entry.status] || '#0284c7'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                      <tr>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Quotations</th>
                        <th className="p-2.5 text-right">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(reports?.salesReport || []).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-bold" style={{ color: STATUS_COLORS[r.status] || '#0f172a' }}>{r.status}</td>
                          <td className="p-2.5 text-right font-semibold text-slate-700">{r.total_quotations}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">₹{Number(r.total_value || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
