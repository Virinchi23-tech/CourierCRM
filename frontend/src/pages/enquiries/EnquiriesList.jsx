import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { HelpCircle, Plus, Search, Scale, ArrowRight, User, Phone, MapPin, Package, FileText, CheckCircle, Trash2 } from 'lucide-react';

export default function EnquiriesList() {
  const { hasRole } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    sender_name: '',
    sender_mobile: '',
    sender_city: '',
    sender_country: 'India',
    receiver_name: '',
    receiver_mobile: '',
    receiver_address: '',
    receiver_city: '',
    receiver_country: 'United States',
    shipment_type: 'PARCEL',
    actual_weight: 5,
    length: 30,
    width: 20,
    height: 20,
    contents: 'Commercial Garments & Samples'
  });

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/enquiries', { params: { search: searchTerm } });
      if (res.success) setEnquiries(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
    api.get('/customers').then(res => res.success && setCustomers(res.data)).catch(() => {});
  }, [searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateEnquiry = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enquiries', formData);
      setIsModalOpen(false);
      fetchEnquiries();
    } catch (err) {
      alert(err.message || 'Failed to create enquiry');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete enquiry ${code}?`)) return;
    try {
      await api.delete(`/enquiries/${id}`);
      fetchEnquiries();
    } catch (err) {
      alert('Failed to delete enquiry');
    }
  };

  const volumetricWeight = (formData.length * formData.width * formData.height) / 5000;
  const chargeableWeight = Math.max(Number(formData.actual_weight), volumetricWeight);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-slate-900" /> Courier Enquiries
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Sender/Receiver requirements, volumetric weight & cargo specifications</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-900 font-medium"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Enquiry
          </button>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
            <tr>
              <th className="p-3.5">Enquiry Code</th>
              <th className="p-3.5">Sender</th>
              <th className="p-3.5">Receiver</th>
              <th className="p-3.5">Destination</th>
              <th className="p-3.5">Actual Wt</th>
              <th className="p-3.5">Volumetric Wt</th>
              <th className="p-3.5">Chargeable Wt</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="9" className="p-8 text-center text-slate-500 font-medium">Loading enquiries...</td></tr>
            ) : enquiries.length === 0 ? (
              <tr><td colSpan="9" className="p-8 text-center text-slate-500 font-medium">No enquiries recorded yet.</td></tr>
            ) : (
              enquiries.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-amber-700">{e.enquiry_code}</td>
                  <td className="p-3.5 font-bold text-slate-900">{e.sender_name} ({e.sender_mobile})</td>
                  <td className="p-3.5 text-slate-700 font-medium">{e.receiver_name}</td>
                  <td className="p-3.5 text-sky-700 font-bold">{e.destination_country}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{e.actual_weight} kg</td>
                  <td className="p-3.5 text-purple-700 font-bold">{e.volumetric_weight} kg</td>
                  <td className="p-3.5 text-emerald-700 font-extrabold">{e.chargeable_weight} kg</td>
                  <td className="p-3.5"><Badge status={e.status} /></td>
                  <td className="p-3.5 text-right">
                    {hasRole('ADMIN') && (
                      <button
                        onClick={() => handleDelete(e.id, e.enquiry_code)}
                        title="Delete Enquiry"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Courier Enquiry" icon={HelpCircle} maxWidth="max-w-2xl">
        <form onSubmit={handleCreateEnquiry} className="space-y-4 text-xs">
          {/* Sender & Receiver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Sender Name *
              </label>
              <input required name="sender_name" value={formData.sender_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" placeholder="Sender Full Name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Sender Mobile *
              </label>
              <input required name="sender_mobile" value={formData.sender_mobile} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" placeholder="+919876543210" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Receiver Name *
              </label>
              <input required name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" placeholder="Recipient Full Name" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Receiver Mobile *
              </label>
              <input required name="receiver_mobile" value={formData.receiver_mobile} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" placeholder="+1 415 555 2671" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Receiver Full Address *
              </label>
              <input required name="receiver_address" value={formData.receiver_address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" placeholder="Street, Suite, Building Number" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Receiver Country *
              </label>
              <input required name="receiver_country" value={formData.receiver_country} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" placeholder="e.g. United States, Germany" />
            </div>
          </div>

          {/* Section Subheading */}
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 mt-4 border-t border-slate-100 pt-3">
            CARGO WEIGHT & DIMENSIONS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                <Scale className="w-3.5 h-3.5 text-slate-400" /> Actual Weight (kg)
              </label>
              <input type="number" step="0.1" name="actual_weight" value={formData.actual_weight} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div><label className="block text-xs font-bold text-slate-800 mb-1.5">Length (cm)</label><input type="number" name="length" value={formData.length} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" /></div>
            <div><label className="block text-xs font-bold text-slate-800 mb-1.5">Width (cm)</label><input type="number" name="width" value={formData.width} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" /></div>
            <div><label className="block text-xs font-bold text-slate-800 mb-1.5">Height (cm)</label><input type="number" name="height" value={formData.height} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" /></div>
          </div>

          {/* Volumetric Weight Summary Card */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 text-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <span className="text-purple-900 font-bold block uppercase tracking-wider text-[10px]">Volumetric Weight Formula</span>
              <span className="text-slate-600 font-medium">(Length x Width x Height) / 5000 = <strong className="text-purple-800 font-bold">{volumetricWeight.toFixed(2)} kg</strong></span>
            </div>
            <div className="text-right">
              <span className="text-emerald-900 font-bold block uppercase tracking-wider text-[10px]">Chargeable Weight</span>
              <span className="text-xl font-extrabold text-emerald-700">{chargeableWeight.toFixed(2)} kg</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all">Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all">Save Enquiry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
