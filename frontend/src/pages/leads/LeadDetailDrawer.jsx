import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { X, User, Phone, Mail, MapPin, Calendar, Clock, Plus, ArrowRight, Activity, CheckCircle2 } from 'lucide-react';

export default function LeadDetailDrawer({ leadId, onClose, onRefresh }) {
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followupNote, setFollowupNote] = useState('');
  const [followupDate, setFollowupDate] = useState(new Date().toISOString().split('T')[0]);
  const [converting, setConverting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchLeadDetails = async () => {
    if (!leadId) return;
    setLoading(true);
    try {
      const res = await api.get(`/leads/${leadId}`);
      if (res.success) {
        setLeadData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [leadId]);

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!followupDate) return;
    try {
      await api.post('/followups', {
        lead_id: leadId,
        followup_date: followupDate,
        type: 'CALL',
        notes: followupNote
      });
      setFollowupNote('');
      setMsg('Follow-up scheduled!');
      fetchLeadDetails();
    } catch (err) {
      setMsg('Failed to schedule follow-up');
    }
  };

  const handleConvertToCustomer = async () => {
    setConverting(true);
    setMsg('');
    try {
      const res = await api.post(`/leads/${leadId}/convert`);
      if (res.success) {
        setMsg(`Converted! Customer Code: ${res.customer_code}`);
        onRefresh && onRefresh();
        fetchLeadDetails();
      }
    } catch (err) {
      setMsg('Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  if (!leadId) return null;

  const lead = leadData?.lead;
  const activities = leadData?.activities || [];
  const followups = leadData?.followups || [];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <span className="text-[10px] font-extrabold text-sky-700 uppercase tracking-wider">{lead?.lead_code}</span>
              <h2 className="text-lg font-extrabold text-slate-900">{lead?.customer_name}</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Scroll Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
            {msg && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 font-bold">
                {msg}
              </div>
            )}

            {/* Status & Quick Actions Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Current Status</span>
                <Badge status={lead?.status} />
              </div>
              <button
                onClick={handleConvertToCustomer}
                disabled={converting}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Convert to Customer
              </button>
            </div>

            {/* Contact Information */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" /> Contact Details
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Mobile:</span>
                  <span className="font-bold text-slate-900">{lead?.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">WhatsApp:</span>
                  <span className="font-bold text-slate-900">{lead?.whatsapp_number || lead?.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Email:</span>
                  <span className="font-bold text-slate-900">{lead?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Source:</span>
                  <span className="font-bold text-sky-700">{lead?.source}</span>
                </div>
              </div>
            </div>

            {/* Shipment Requirement */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-600" /> Destination & Cargo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block font-semibold">Destination:</span>
                  <span className="font-bold text-slate-900">{lead?.destination_country || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Package Type:</span>
                  <span className="font-bold text-slate-900">{lead?.package_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Estimated Weight:</span>
                  <span className="font-bold text-slate-900">{lead?.estimated_weight} kg</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Assigned Agent:</span>
                  <span className="font-bold text-purple-700">{lead?.assigned_to_name || 'Unassigned'}</span>
                </div>
              </div>
              {lead?.notes && (
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block font-semibold">Notes / Instructions:</span>
                  <p className="text-slate-700 italic font-medium">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Add Follow-up */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-rose-600" /> Schedule Follow-up Call
              </h3>
              <form onSubmit={handleAddFollowup} className="space-y-2">
                <input
                  type="date"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                />
                <input
                  type="text"
                  placeholder="Notes for call/WhatsApp message..."
                  value={followupNote}
                  onChange={(e) => setFollowupNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-sky-700 font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Task Followup
                </button>
              </form>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" /> Activity History
              </h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200">
                {activities.map((act) => (
                  <div key={act.id} className="relative pl-6">
                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-sky-600" />
                    <p className="font-bold text-slate-900">{act.description}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(act.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
