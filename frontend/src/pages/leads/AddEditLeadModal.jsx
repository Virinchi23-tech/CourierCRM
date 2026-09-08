import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { User, Phone, Mail, Globe, MapPin, Package, FileText } from 'lucide-react';

export default function AddEditLeadModal({ isOpen, onClose, lead, onRefresh }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile: '',
    whatsapp_number: '',
    email: '',
    city: '',
    state: '',
    country: 'India',
    source: 'Manual',
    requirement: '',
    destination_country: '',
    destination_city: '',
    package_type: 'PARCEL',
    estimated_weight: 0,
    notes: '',
    status: 'NEW',
    assigned_to: ''
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (lead) {
      setFormData({
        customer_name: lead.customer_name || '',
        mobile: lead.mobile || '',
        whatsapp_number: lead.whatsapp_number || '',
        email: lead.email || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || 'India',
        source: lead.source || 'Manual',
        requirement: lead.requirement || '',
        destination_country: lead.destination_country || '',
        destination_city: lead.destination_city || '',
        package_type: lead.package_type || 'PARCEL',
        estimated_weight: lead.estimated_weight || 0,
        notes: lead.notes || '',
        status: lead.status || 'NEW',
        assigned_to: lead.assigned_to || ''
      });
    } else {
      setFormData({
        customer_name: '',
        mobile: '',
        whatsapp_number: '',
        email: '',
        city: '',
        state: '',
        country: 'India',
        source: 'Manual',
        requirement: '',
        destination_country: '',
        destination_city: '',
        package_type: 'PARCEL',
        estimated_weight: 0,
        notes: '',
        status: 'NEW',
        assigned_to: ''
      });
    }

    api.get('/users').then(res => {
      if (res.success) setUsers(res.users);
    }).catch(() => {});
  }, [lead, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (lead) {
        await api.put(`/leads/${lead.id}`, formData);
      } else {
        await api.post('/leads', formData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={lead ? `Edit Lead (${lead.lead_code})` : 'Create New Lead'} icon={User} maxWidth="max-w-2xl">
      {error && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Basic Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Customer / Company Name *
            </label>
            <input
              type="text"
              required
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              placeholder="e.g. Acme Tech Corp"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number *
            </label>
            <input
              type="text"
              required
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="+919876543210"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" /> WhatsApp Number
            </label>
            <input
              type="text"
              name="whatsapp_number"
              value={formData.whatsapp_number}
              onChange={handleChange}
              placeholder="+919876543210"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@acme.com"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Lead Source
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            >
              <option value="Meta Ads">Meta Ads</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Website">Website</option>
              <option value="CSV Import">CSV Import</option>
              <option value="Manual">Manual</option>
              <option value="Referral">Referral</option>
              <option value="Existing Customer">Existing Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" /> Lead Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="QUOTATION_SENT">QUOTATION_SENT</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
              <option value="BOOKED">BOOKED</option>
              <option value="LOST">LOST</option>
              <option value="NOT_INTERESTED">NOT_INTERESTED</option>
            </select>
          </div>
        </div>

        {/* Section Subheading */}
        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 mt-4 border-t border-slate-100 pt-3">
          LOGISTICS & CARGO SPECIFICATIONS
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Destination Country
            </label>
            <input
              type="text"
              name="destination_country"
              value={formData.destination_country}
              onChange={handleChange}
              placeholder="e.g. United States, United Kingdom"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Destination City
            </label>
            <input
              type="text"
              name="destination_city"
              value={formData.destination_city}
              onChange={handleChange}
              placeholder="e.g. London, Chicago"
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" /> Package Type
            </label>
            <select
              name="package_type"
              value={formData.package_type}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            >
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="PARCEL">PARCEL</option>
              <option value="COMMERCIAL">COMMERCIAL</option>
              <option value="SAMPLE">SAMPLE</option>
              <option value="PERSONAL">PERSONAL</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" /> Est. Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              name="estimated_weight"
              value={formData.estimated_weight}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Assign Salesperson
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
            >
              <option value="">-- Unassigned --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Shipment Requirement / Notes
          </label>
          <textarea
            rows="2"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Special instructions or commercial shipment requirements..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
          ></textarea>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md shadow-slate-900/20 transition-all"
          >
            {loading ? 'Saving...' : (lead ? 'Update Lead' : 'Confirm Lead')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
