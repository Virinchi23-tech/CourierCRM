import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Globe, RefreshCw, CheckCircle, ShieldCheck, Layers, Bot } from 'lucide-react';

export default function MetaLeads() {
  const [metaLeads, setMetaLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMetaLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meta/leads');
      if (res.success) {
        setMetaLeads(res.leads);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetaLeads();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-blue-100 font-bold text-xs uppercase tracking-wider">
            <Globe className="w-4 h-4" /> Meta Lead Ads Automation
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">Facebook & Instagram Lead Integration</h1>
          <p className="text-xs text-blue-100 mt-1">Real-time webhook ingestion from Facebook / Instagram Lead Forms</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMetaLeads} className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Pipeline
          </button>
        </div>
      </div>

      {/* Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 uppercase font-bold block mb-1">Webhook Endpoint</span>
          <span className="font-mono text-sky-700 font-bold">/api/meta/webhook</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 uppercase font-bold block mb-1">Verification Status</span>
          <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Ready (Active)</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 uppercase font-bold block mb-1">Auto Assignment</span>
          <span className="text-purple-700 font-bold">Round-Robin / Sales Pool</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-500 uppercase font-bold block mb-1">Duplicate Protection</span>
          <span className="text-teal-700 font-bold">Mobile & Email Match</span>
        </div>
      </div>

      {/* Meta Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" /> Ingested Meta Lead Records ({metaLeads.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Meta Lead ID</th>
                <th className="px-4 py-3">Ad Name</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Payload Data</th>
                <th className="px-4 py-3">Ingested Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metaLeads.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500 font-medium">
                    No raw Meta leads logged yet. Submit a test form on Facebook Lead Ads or trigger webhook test.
                  </td>
                </tr>
              ) : (
                metaLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-sky-700">{lead.meta_lead_id}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{lead.ad_name || 'Global Courier Campaign Ad'}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{lead.campaign_name || 'US Export Ads 2026'}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                      {lead.form_data_json || '{}'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-medium">{new Date(lead.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
