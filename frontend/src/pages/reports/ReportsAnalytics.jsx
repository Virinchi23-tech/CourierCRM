import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, Download, RefreshCw, PieChart as PieIcon, TrendingUp, Users } from 'lucide-react';

export default function ReportsAnalytics() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/detailed');
      if (res.success) setReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export Report Summary
        </button>
      </div>

      {/* Grid of Report Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Lead Conversion Breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" /> Lead Pipeline & Conversion Metrics
          </h3>
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
        </div>

        {/* Courier Performance Summary */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" /> Courier Partner Volume Analysis
          </h3>
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
        </div>
      </div>
    </div>
  );
}
