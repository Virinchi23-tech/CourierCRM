import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { Clock, CheckCircle2, Phone, Calendar, Plus, User } from 'lucide-react';

export default function FollowupsList() {
  const [category, setCategory] = useState('today');
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/followups', { params: { category } });
      if (res.success) setFollowups(res.followups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [category]);

  const handleMarkComplete = async (id) => {
    try {
      await api.put(`/followups/${id}/status`, { status: 'COMPLETED' });
      fetchFollowups();
    } catch (err) {
      alert('Update failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-rose-600" /> Sales Follow-up Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">Schedule & complete calls, WhatsApp follow-ups and meetings with shippers</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'today', label: "Today's Tasks" },
          { key: 'overdue', label: 'Overdue Follow-ups' },
          { key: 'upcoming', label: 'Upcoming Tasks' },
          { key: 'completed', label: 'Completed Log' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setCategory(tab.key)}
            className={`px-4 py-3 border-b-2 uppercase tracking-wider transition-all ${
              category === tab.key
                ? 'border-rose-600 text-rose-600 font-bold bg-rose-50/80 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow-ups List Table */}
      <div className="glass-card rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
            <tr>
              <th className="p-3.5">Date / Time</th>
              <th className="p-3.5">Type</th>
              <th className="p-3.5">Lead / Customer</th>
              <th className="p-3.5">Contact Mobile</th>
              <th className="p-3.5">Assigned Agent</th>
              <th className="p-3.5">Notes</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading tasks...</td></tr>
            ) : followups.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-500">No follow-ups found in this category.</td></tr>
            ) : (
              followups.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-semibold text-slate-900">{f.followup_date} ({f.followup_time || '10:00'})</td>
                  <td className="p-3.5 font-bold text-rose-600">{f.type}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{f.lead_name || f.customer_name || 'Prospect'}</td>
                  <td className="p-3.5 text-slate-600">{f.lead_mobile}</td>
                  <td className="p-3.5 text-purple-700 font-medium">{f.assigned_to_name || 'Agent'}</td>
                  <td className="p-3.5 text-slate-500">{f.notes || 'Follow-up call scheduled'}</td>
                  <td className="p-3.5"><Badge status={f.status} /></td>
                  <td className="p-3.5 text-right">
                    {f.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleMarkComplete(f.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Complete Task
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
