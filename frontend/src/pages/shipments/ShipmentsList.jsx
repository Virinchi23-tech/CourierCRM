import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { Truck, Search, Eye, ExternalLink, Calendar, MapPin, Package } from 'lucide-react';

export default function ShipmentsList({ defaultStatus = '' }) {
  const { status: routeStatus } = useParams();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const activeTabStatus = routeStatus || defaultStatus;

  const fetchShipments = async () => {
    setLoading(true);
    try {
      let statusParam = '';
      if (activeTabStatus === 'pending') statusParam = 'PENDING';
      else if (activeTabStatus === 'in-transit') statusParam = 'IN_TRANSIT';
      else if (activeTabStatus === 'customs') statusParam = 'CUSTOMS';
      else if (activeTabStatus === 'out-for-delivery') statusParam = 'OUT_FOR_DELIVERY';
      else if (activeTabStatus === 'delivered') statusParam = 'DELIVERED';
      else if (activeTabStatus === 'returned') statusParam = 'RETURNED';

      const res = await api.get('/shipments', {
        params: { search: searchTerm, status: statusParam }
      });
      if (res.success) setShipments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [activeTabStatus, searchTerm]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan-600" /> International Shipments Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Live tracking, courier AWB assignment & operational status management</p>
        </div>
      </div>

      {/* Submenu Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'all', label: 'All Shipments', path: '/shipments/all' },
          { key: 'pending', label: 'Pending Pickup', path: '/shipments/pending' },
          { key: 'in-transit', label: 'In Transit', path: '/shipments/in-transit' },
          { key: 'customs', label: 'Customs Hold', path: '/shipments/customs' },
          { key: 'out-for-delivery', label: 'Out for Delivery', path: '/shipments/out-for-delivery' },
          { key: 'delivered', label: 'Delivered', path: '/shipments/delivered' },
          { key: 'returned', label: 'Returned', path: '/shipments/returned' }
        ].map(tab => {
          const isActive = (activeTabStatus || 'all') === tab.key;
          return (
            <Link
              key={tab.key}
              to={tab.path}
              className={`px-4 py-3 border-b-2 uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive
                  ? 'border-cyan-600 text-cyan-700 font-extrabold bg-cyan-50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tracking #, AWB, customer name, destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
            <tr>
              <th className="p-3.5">Tracking Number</th>
              <th className="p-3.5">AWB Number</th>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Courier Provider</th>
              <th className="p-3.5">Destination</th>
              <th className="p-3.5">Chargeable Wt</th>
              <th className="p-3.5">Current Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-500 font-medium">Loading shipments...</td></tr>
            ) : shipments.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-slate-500 font-medium">No shipments found in this category.</td></tr>
            ) : (
              shipments.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-extrabold text-cyan-700">
                    <Link to={`/shipments/detail/${s.tracking_number}`} className="hover:underline">
                      {s.tracking_number}
                    </Link>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700 font-medium">{s.awb_number || 'Pending'}</td>
                  <td className="p-3.5 font-bold text-slate-900">{s.customer_name}</td>
                  <td className="p-3.5 text-purple-700 font-bold">{s.courier_name || 'DHL Express'}</td>
                  <td className="p-3.5 text-slate-800 font-medium">{s.destination}</td>
                  <td className="p-3.5 text-emerald-700 font-extrabold">{s.chargeable_weight} kg</td>
                  <td className="p-3.5"><Badge status={s.current_status} /></td>
                  <td className="p-3.5 text-right">
                    <Link
                      to={`/shipments/detail/${s.tracking_number}`}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-sky-700 font-bold text-[11px] inline-flex items-center gap-1 border border-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> Timeline
                    </Link>
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
