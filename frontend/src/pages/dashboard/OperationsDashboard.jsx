import React from 'react';
import StatCard from '../../components/common/StatCard';
import { Truck, Package, AlertTriangle, CheckCircle, Clock, ShieldAlert, ArrowUpRight, Scale, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OperationsDashboard({ data, onRefresh, refreshing, lastUpdated }) {
  const kpi = data?.kpi || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-amber-100 font-bold text-xs uppercase tracking-wider">
            <Truck className="w-4 h-4" /> Operations Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">Logistics & Dispatch Control</h1>
          <p className="text-xs text-amber-100 mt-1">Package intake, volumetric weighing, courier handover & proof of delivery</p>
          {lastUpdated && (
            <p className="text-[10px] text-amber-100/80 mt-1">Last synced: {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link to="/shipments/pending" className="px-4 py-2 rounded-xl bg-white text-amber-800 hover:bg-amber-50 font-bold text-xs shadow-sm transition-all">
              Process Pickups
            </Link>
            <Link to="/shipments/all" className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs transition-all">
              All Shipments
            </Link>
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* KPI Grid - All values now real from DB */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Bookings" value={kpi.totalBookings || 0} icon={Package} color="cyan" subtitle="Incoming bookings" />
        <StatCard title="Pickup Pending" value={kpi.pickupPending || 0} icon={Clock} color="amber" subtitle="Awaiting driver" />
        <StatCard title="Packages Received" value={kpi.totalShipments || 0} icon={Scale} color="sky" subtitle="Weighed at hub" />
        <StatCard title="In Transit" value={kpi.shipmentsInTransit || 0} icon={Truck} color="amber" subtitle="Air & ground transit" />
        <StatCard title="Customs Hold" value={kpi.customsHold || 0} icon={AlertTriangle} color="rose" subtitle="Customs inspection" />
        <StatCard title="Out for Delivery" value={kpi.outForDelivery || 0} icon={ArrowUpRight} color="teal" subtitle="Local courier delivery" />
        <StatCard title="Delivered Today" value={kpi.deliveredShipments || 0} icon={CheckCircle} color="emerald" subtitle="POD Verified" />
        <StatCard title="Returned / Issues" value={kpi.returnedShipments || 0} icon={ShieldAlert} color="rose" subtitle="Delivery exceptions" />
      </div>

      {/* Operations Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/shipments/all" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Receive & Weigh Packages</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Record actual weight vs volumetric dimensions and upload condition photos.</p>
        </Link>

        <Link to="/shipments/in-transit" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Courier Handover & AWB</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Hand over packages to DHL, FedEx, UPS or Aramex and log tracking numbers.</p>
        </Link>

        <Link to="/shipments/delivered" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Upload Proof of Delivery (POD)</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Record recipient signatures, delivery dates, and scan POD receipts.</p>
        </Link>
      </div>
    </div>
  );
}
