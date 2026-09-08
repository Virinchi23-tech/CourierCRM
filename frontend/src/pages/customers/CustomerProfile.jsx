import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { User, Phone, Mail, Building, MapPin, FileText, CalendarCheck, CreditCard, Truck, MessageSquare, Clock, ArrowLeft, Plus } from 'lucide-react';

export default function CustomerProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/customers/${id}`);
        if (res.success) {
          setProfile(res);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Loading Customer 360 Profile...</div>;
  }

  const cust = profile?.customer;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button & Header Banner */}
      <div>
        <Link to="/customers" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Customers List
        </Link>

        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-700 via-indigo-700 to-sky-700 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-extrabold text-xl flex items-center justify-center border border-white/30 backdrop-blur-md">
              {cust?.name ? cust.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-purple-200 bg-white/10 px-2 py-0.5 rounded">{cust?.customer_code}</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/20 text-white border border-white/30">
                  Verified Client
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">{cust?.name}</h1>
              <p className="text-xs text-purple-100 font-medium">{cust?.company_name || 'Individual Shipper'} • {cust?.city}, {cust?.country}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link to="/enquiries" className="px-4 py-2 rounded-xl bg-white text-purple-800 hover:bg-purple-50 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all">
              <Plus className="w-3.5 h-3.5" /> New Enquiry
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-bold">
        {['overview', 'enquiries', 'quotations', 'bookings', 'payments', 'shipments', 'followups'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 border-b-2 uppercase tracking-wider transition-all ${
              activeTab === tab
                ? 'border-purple-600 text-purple-700 font-extrabold bg-purple-50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab} ({profile?.[tab]?.length || (tab === 'overview' ? '' : 0)})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" /> Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-slate-400 block font-semibold">Mobile:</span><span className="font-bold text-slate-900">{cust?.mobile}</span></div>
              <div><span className="text-slate-400 block font-semibold">WhatsApp:</span><span className="font-bold text-slate-900">{cust?.whatsapp_number || cust?.mobile}</span></div>
              <div><span className="text-slate-400 block font-semibold">Email:</span><span className="font-bold text-slate-900">{cust?.email || 'N/A'}</span></div>
              <div><span className="text-slate-400 block font-semibold">Company:</span><span className="font-bold text-slate-900">{cust?.company_name || 'N/A'}</span></div>
              <div><span className="text-slate-400 block font-semibold">Country:</span><span className="font-bold text-slate-900">{cust?.country}</span></div>
              <div><span className="text-slate-400 block font-semibold">Postal Code:</span><span className="font-bold text-slate-900">{cust?.postal_code || 'N/A'}</span></div>
            </div>
            {cust?.address && (
              <div className="pt-3 border-t border-slate-100">
                <span className="text-slate-400 block font-semibold">Full Billing Address:</span>
                <p className="text-slate-800 font-medium">{cust.address}, {cust.city}, {cust.country}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" /> Multi-Shipment Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block uppercase font-bold text-[10px]">Total Shipments</span>
                <span className="text-2xl font-extrabold text-slate-900">{profile?.shipments?.length || 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block uppercase font-bold text-[10px]">Payments Received</span>
                <span className="text-2xl font-extrabold text-emerald-700">
                  ₹{(profile?.payments || []).reduce((acc, p) => acc + (p.amount || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shipments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Tracking #</th>
                <th className="p-3.5">AWB</th>
                <th className="p-3.5">Courier</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profile?.shipments || []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-sky-700">{s.tracking_number}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{s.awb_number || 'Pending'}</td>
                  <td className="p-3.5 text-purple-700 font-bold">{s.courier_name || 'DHL'}</td>
                  <td className="p-3.5 text-slate-900 font-semibold">{s.destination}</td>
                  <td className="p-3.5"><Badge status={s.current_status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Enquiry Code</th>
                <th className="p-3.5">Receiver</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Chargeable Wt</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profile?.enquiries || []).map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-amber-700">{e.enquiry_code}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{e.receiver_name}</td>
                  <td className="p-3.5 text-sky-700 font-bold">{e.destination_country}</td>
                  <td className="p-3.5 text-emerald-700 font-extrabold">{e.chargeable_weight} kg</td>
                  <td className="p-3.5"><Badge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Quote Code</th>
                <th className="p-3.5">Service</th>
                <th className="p-3.5">Chargeable Wt</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profile?.quotations || []).map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-indigo-700">{q.quotation_code}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{q.service_type}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{q.chargeable_weight} kg</td>
                  <td className="p-3.5 font-bold text-emerald-700">₹{q.total_amount?.toLocaleString()}</td>
                  <td className="p-3.5"><Badge status={q.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Booking Code</th>
                <th className="p-3.5">AWB / Tracking #</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profile?.bookings || []).map((b) => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-cyan-700">{b.booking_code}</td>
                  <td className="p-3.5 font-mono text-slate-600 font-semibold">{b.tracking_number || b.awb_number || 'Pending'}</td>
                  <td className="p-3.5 text-slate-800 font-medium">{b.destination_country}</td>
                  <td className="p-3.5 font-bold text-emerald-700">₹{b.total_amount?.toLocaleString()}</td>
                  <td className="p-3.5"><Badge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Payment Code</th>
                <th className="p-3.5">Method</th>
                <th className="p-3.5">Transaction ID</th>
                <th className="p-3.5">Amount</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profile?.payments || []).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-emerald-700">{p.payment_code}</td>
                  <td className="p-3.5 font-bold text-purple-700">{p.payment_method}</td>
                  <td className="p-3.5 font-mono text-slate-600 font-medium">{p.transaction_id || 'N/A'}</td>
                  <td className="p-3.5 font-extrabold text-emerald-700 text-sm">₹{p.amount?.toLocaleString()}</td>
                  <td className="p-3.5"><Badge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'followups' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
              <tr>
                <th className="p-3.5">Follow-up Date</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(profile?.followups || []).map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-slate-900">{f.followup_date}</td>
                  <td className="p-3.5 font-bold text-sky-700">{f.type}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{f.notes || 'Routine follow-up call'}</td>
                  <td className="p-3.5"><Badge status={f.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
