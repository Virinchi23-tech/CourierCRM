import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import { CalendarCheck, Truck, CreditCard, ArrowRight, Plus, Search } from 'lucide-react';

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', { params: { search: searchTerm } });
      if (res.success) setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [searchTerm]);

  const handleCreateShipmentFromBooking = async (booking) => {
    if (!window.confirm(`Create operational shipment for booking ${booking.booking_code}?`)) return;
    try {
      const res = await api.post('/shipments', {
        booking_id: booking.id,
        customer_id: booking.customer_id,
        courier_id: booking.courier_id,
        service_type: booking.service_type || 'International Express',
        destination: 'United States',
        package_count: 1,
        actual_weight: 5.0
      });

      if (res.success) {
        alert(`Shipment Created! Tracking Number: ${res.tracking_number}`);
        fetchBookings();
      }
    } catch (err) {
      alert(err.message || 'Shipment creation failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-slate-900" /> Courier Bookings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Confirmed courier bookings linked to quotations, payments & operational shipments</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search booking code or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 outline-none focus:bg-white focus:border-slate-900 font-medium"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
            <tr>
              <th className="p-3.5">Booking Code</th>
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Pickup Date</th>
              <th className="p-3.5">Courier Provider</th>
              <th className="p-3.5">Payment Status</th>
              <th className="p-3.5">Booking Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">Loading bookings...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-slate-500 font-medium">No bookings recorded yet.</td></tr>
            ) : (
              bookings.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono font-bold text-cyan-700">{b.booking_code}</td>
                  <td className="p-3.5 font-bold text-slate-900">{b.customer_name}</td>
                  <td className="p-3.5 text-slate-700 font-medium">{b.pickup_date || '2026-09-10'}</td>
                  <td className="p-3.5 text-purple-700 font-bold">{b.courier_name || 'DHL Express'}</td>
                  <td className="p-3.5"><Badge status={b.payment_status} /></td>
                  <td className="p-3.5"><Badge status={b.booking_status} /></td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleCreateShipmentFromBooking(b)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center gap-1.5 ml-auto transition-colors"
                    >
                      <Truck className="w-3.5 h-3.5" /> Dispatch Shipment
                    </button>
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
