import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { FileText, Plus, CheckCircle, MessageSquare, Printer, ArrowRight, DollarSign, User, Truck, Scale, Calendar, Tag, ShieldCheck } from 'lucide-react';

export default function QuotationsList() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPdfQuote, setSelectedPdfQuote] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    courier_id: '',
    service_type: 'International Express',
    actual_weight: 5,
    volumetric_weight: 2.4,
    chargeable_weight: 5,
    base_rate: 450,
    pickup_charge: 150,
    packing_charge: 100,
    customs_charge: 200,
    discount: 50,
    valid_until: '2026-10-01'
  });

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/quotations');
      if (res.success) setQuotations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
    api.get('/customers').then(res => res.success && setCustomers(res.data)).catch(() => {});
    api.get('/couriers').then(res => res.success && setCouriers(res.couriers)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quotations', formData);
      setIsModalOpen(false);
      fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to generate quotation');
    }
  };

  const handleConvertToBooking = async (quoteId, code) => {
    if (!window.confirm(`Convert Quotation ${code} into confirmed booking?`)) return;
    try {
      const res = await api.post(`/quotations/${quoteId}/convert-booking`, {
        pickup_date: '2026-09-10',
        pickup_address: 'Client Office Hub'
      });
      if (res.success) {
        alert(`Booking Confirmed! Booking Code: ${res.booking_code}`);
        fetchQuotations();
      }
    } catch (err) {
      alert(err.message || 'Conversion failed');
    }
  };

  const handleSendWhatsapp = async (quote) => {
    try {
      await api.post('/whatsapp/send', {
        phone: quote.customer_mobile || '+919876543210',
        content: `Dear ${quote.customer_name}, your International Courier Quotation (${quote.quotation_code}) is ready! Chargeable Weight: ${quote.chargeable_weight} kg, Total Amount: ₹${quote.total_amount}. Valid until ${quote.valid_until || 'Next Month'}.`
      });
      alert(`WhatsApp Quotation message dispatched to ${quote.customer_mobile || 'Client'}!`);
    } catch (err) {
      alert('WhatsApp message queued.');
    }
  };

  const shippingCharge = Number(formData.chargeable_weight) * Number(formData.base_rate);
  const subtotal = shippingCharge + Number(formData.pickup_charge) + Number(formData.packing_charge) + Number(formData.customs_charge) - Number(formData.discount);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> Quotation Builder
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Generate rate quotes, send over WhatsApp & convert accepted proposals into bookings</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Quotation
        </button>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
            <tr>
              <th className="p-3.5">Quotation Code</th>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Courier Provider</th>
              <th className="p-3.5">Chargeable Wt</th>
              <th className="p-3.5">Total Amount</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">Loading quotations...</td></tr>
            ) : quotations.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">No quotations found.</td></tr>
            ) : (
              quotations.map(q => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-indigo-700">{q.quotation_code}</td>
                  <td className="p-3.5 font-bold text-slate-900">{q.customer_name}</td>
                  <td className="p-3.5 text-purple-700 font-bold">{q.courier_name || 'DHL Express'}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{q.chargeable_weight} kg</td>
                  <td className="p-3.5 font-extrabold text-emerald-700">₹{q.total_amount?.toLocaleString()}</td>
                  <td className="p-3.5"><Badge status={q.status} /></td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedPdfQuote(q)}
                        title="View PDF Invoice / Rate breakdown"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendWhatsapp(q)}
                        title="Send via WhatsApp"
                        className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      {q.status !== 'ACCEPTED' && (
                        <button
                          onClick={() => handleConvertToBooking(q.id, q.quotation_code)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Convert Booking
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Quotation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate Courier Rate Quotation" icon={FileText} maxWidth="max-w-2xl">
        <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
          
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">CLIENT & PARTNER SELECTION</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Customer Name *
              </label>
              <select required name="customer_id" value={formData.customer_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
                <option value="">-- Select Client --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customer_code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-400" /> Courier Partner *
              </label>
              <select name="courier_id" value={formData.courier_id} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
                <option value="">-- Select Courier Provider --</option>
                {couriers.map(cr => <option key={cr.id} value={cr.id}>{cr.name} ({cr.service_type})</option>)}
              </select>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 pt-3 border-t border-slate-100">TARIFF & CHARGES BREAKDOWN</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" /> Actual Wt (kg)
              </label>
              <input type="number" step="0.1" name="actual_weight" value={formData.actual_weight} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" /> Chargeable (kg)
              </label>
              <input type="number" step="0.1" name="chargeable_weight" value={formData.chargeable_weight} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Base Rate / kg (₹)
              </label>
              <input type="number" name="base_rate" value={formData.base_rate} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Pickup Fee (₹)
              </label>
              <input type="number" name="pickup_charge" value={formData.pickup_charge} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Packing Fee (₹)
              </label>
              <input type="number" name="packing_charge" value={formData.packing_charge} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Customs (₹)
              </label>
              <input type="number" name="customs_charge" value={formData.customs_charge} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" /> Discount (₹)
              </label>
              <input type="number" name="discount" value={formData.discount} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Valid Until
              </label>
              <input type="date" name="valid_until" value={formData.valid_until} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <span className="text-slate-600 font-medium block">Shipping Freight Charge: ₹{shippingCharge}</span>
              <span className="text-slate-600 font-medium block">GST Tax (18%): ₹{tax.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 font-bold block uppercase tracking-wider text-[10px]">Grand Total Amount</span>
              <span className="text-2xl font-extrabold text-slate-900">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Generate Quotation</button>
          </div>
        </form>
      </Modal>

      {/* PDF Rate Breakdown Modal */}
      {selectedPdfQuote && (
        <Modal isOpen={!!selectedPdfQuote} onClose={() => setSelectedPdfQuote(null)} title={`Quotation Preview (${selectedPdfQuote.quotation_code})`} maxWidth="max-w-2xl">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 text-xs">
            <div className="flex justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">CourierCRM International</h2>
                <p className="text-slate-500 font-medium">Logistics & Air Freight Division</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-indigo-700 text-sm block">{selectedPdfQuote.quotation_code}</span>
                <span className="text-slate-500 font-medium block">{new Date(selectedPdfQuote.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-bold block uppercase">Client:</span>
                <span className="font-bold text-slate-900">{selectedPdfQuote.customer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block uppercase">Courier Provider:</span>
                <span className="font-bold text-purple-700">{selectedPdfQuote.courier_name || 'DHL Express'}</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase">
                  <tr><th className="p-2.5">Item Description</th><th className="p-2.5 text-right">Amount (INR)</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                  <tr><td className="p-2.5">Freight Charge ({selectedPdfQuote.chargeable_weight} kg)</td><td className="p-2.5 text-right">₹{selectedPdfQuote.shipping_charge || 2340}</td></tr>
                  <tr><td className="p-2.5">Pickup & Handling Charge</td><td className="p-2.5 text-right">₹{selectedPdfQuote.pickup_charge || 150}</td></tr>
                  <tr><td className="p-2.5">Export Customs Clearance</td><td className="p-2.5 text-right">₹{selectedPdfQuote.customs_charge || 200}</td></tr>
                  <tr><td className="p-2.5">GST Tax (18%)</td><td className="p-2.5 text-right">₹{selectedPdfQuote.tax || 486}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm font-extrabold text-slate-900">Total Quotation Value:</span>
              <span className="text-2xl font-extrabold text-emerald-700">₹{selectedPdfQuote.total_amount?.toLocaleString()}</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
