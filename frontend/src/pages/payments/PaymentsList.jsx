import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { CreditCard, DollarSign, Plus, CheckCircle, Search, FileText, User, Package, Hash } from 'lucide-react';

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({ totalReceived: 0, totalPaid: 0, totalPending: 0 });
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    booking_id: '',
    amount: 3186,
    payment_method: 'UPI',
    transaction_id: 'UPI/20260908/990011',
    notes: 'Advance courier freight payment'
  });

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments');
      if (res.success) {
        setPayments(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    api.get('/customers').then(res => res.success && setCustomers(res.data)).catch(() => {});
    api.get('/bookings').then(res => res.success && setBookings(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      setIsModalOpen(false);
      fetchPayments();
    } catch (err) {
      alert(err.message || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-slate-900" /> Payment Management & Invoices
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Track received revenue, pending balances & payment receipts</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Record Payment
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Payments Received" value={`₹${summary.totalReceived.toLocaleString()}`} icon={DollarSign} color="emerald" subtitle="All time transactions" />
        <StatCard title="Confirmed Revenue" value={`₹${summary.totalPaid.toLocaleString()}`} icon={CheckCircle} color="sky" subtitle="Cleared in bank" />
        <StatCard title="Outstanding Balance" value={`₹${summary.totalPending.toLocaleString()}`} icon={CreditCard} color="amber" subtitle="Pending collection" />
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
            <tr>
              <th className="p-3.5">Payment Code</th>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Booking Code</th>
              <th className="p-3.5">Payment Method</th>
              <th className="p-3.5">Transaction ID</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">No payments recorded.</td></tr>
            ) : (
              payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-emerald-700">{p.payment_code}</td>
                  <td className="p-3.5 font-bold text-slate-900">{p.customer_name}</td>
                  <td className="p-3.5 font-mono text-cyan-700 font-bold">{p.booking_code || 'Direct Payment'}</td>
                  <td className="p-3.5 font-bold text-purple-700">{p.payment_method}</td>
                  <td className="p-3.5 font-mono text-slate-600 font-medium">{p.transaction_id || 'N/A'}</td>
                  <td className="p-3.5 font-extrabold text-emerald-700 text-sm">₹{p.amount?.toLocaleString()}</td>
                  <td className="p-3.5"><Badge status={p.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Customer Payment" icon={CreditCard} maxWidth="max-w-xl">
        <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
          
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">CUSTOMER & BOOKING ALLOCATION</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Customer Name *
              </label>
              <select required name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
                <option value="">-- Select Customer --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customer_code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Linked Booking (Optional)
              </label>
              <select name="booking_id" value={formData.booking_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
                <option value="">-- Direct Payment / No Booking --</option>
                {bookings.map(b => <option key={b.id} value={b.id}>{b.booking_code} ({b.customer_name})</option>)}
              </select>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 pt-3 border-t border-slate-100">TRANSACTION DETAILS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Amount Received (₹) *
              </label>
              <input required type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Method
              </label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="BANK_TRANSFER">Bank Wire / NEFT / RTGS</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash Deposit</option>
                <option value="ONLINE">Online Gateway</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-slate-400" /> Transaction Ref / UTR #
              </label>
              <input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} placeholder="UTR / Ref Number" className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Confirm Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
