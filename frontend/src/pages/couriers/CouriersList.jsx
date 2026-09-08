import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Building2, Plus, CheckCircle, Power, Phone, Mail, ExternalLink, Globe, User, FileText } from 'lucide-react';

export default function CouriersList() {
  const { hasRole } = useAuth();
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    service_type: 'International Air Express',
    contact_person: '',
    phone: '',
    email: '',
    tracking_url: 'https://www.dhl.com/en/express/tracking.html?AWB=',
    rate_card: 'Zone A: ₹450/kg, Zone B: ₹650/kg'
  });

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/couriers');
      if (res.success) setCouriers(res.couriers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateCourier = async (e) => {
    e.preventDefault();
    try {
      await api.post('/couriers', formData);
      setIsModalOpen(false);
      fetchCouriers();
    } catch (err) {
      alert(err.message || 'Failed to add courier provider');
    }
  };

  const handleToggleActive = async (courier) => {
    try {
      await api.put(`/couriers/${courier.id}`, { active: courier.active ? 0 : 1 });
      fetchCouriers();
    } catch (err) {
      alert('Toggle status failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-slate-900" /> Courier Partners & Rate Cards
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage partner integrations (DHL, FedEx, UPS, Aramex, DTDC) and tariff rate cards</p>
        </div>

        {hasRole('ADMIN') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Courier Partner
          </button>
        )}
      </div>

      {/* Courier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500 text-xs">Loading courier master directory...</div>
        ) : (
          couriers.map(c => (
            <div key={c.id} className="glass-card p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-700" /> {c.name}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${c.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {c.active ? 'Active Partner' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">{c.service_type || 'Air Freight Express'}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                  {c.contact_person && <div><span className="text-slate-400">Contact:</span> {c.contact_person}</div>}
                  {c.phone && <div className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3 text-slate-400" /> {c.phone}</div>}
                  {c.email && <div className="flex items-center gap-1 text-slate-600"><Mail className="w-3 h-3 text-slate-400" /> {c.email}</div>}
                  {c.rate_card && <div className="p-2.5 rounded-xl bg-slate-50 text-slate-800 font-mono text-[11px] mt-2 border border-slate-200/80">{c.rate_card}</div>}
                </div>
              </div>

              {hasRole('ADMIN') && (
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <a href={c.tracking_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-slate-700 hover:text-black flex items-center gap-1">
                    Tracking Portal <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => handleToggleActive(c)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 border transition-colors ${
                      c.active ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-3 h-3" /> {c.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Courier Partner Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Courier Partner" icon={Building2} maxWidth="max-w-xl">
        <form onSubmit={handleCreateCourier} className="space-y-4 text-xs">
          
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">PARTNER INTEGRATION INFO</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Partner Name *
              </label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Aramex Express" className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Service Type
              </label>
              <input type="text" name="service_type" value={formData.service_type} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1 pt-3 border-t border-slate-100">CONTACT & TARIFF SPECS</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Contact Representative
              </label>
              <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone
              </label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" /> Tracking URL Format
              </label>
              <input type="text" name="tracking_url" value={formData.tracking_url} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Standard Rate Card Notes
              </label>
              <input type="text" name="rate_card" value={formData.rate_card} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Save Partner</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
