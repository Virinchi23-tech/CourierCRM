import React from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, Clock, AlertCircle, FileText, CalendarCheck, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SalesDashboard({ data }) {
  const kpi = data?.kpi || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-emerald-100 font-bold text-xs uppercase tracking-wider">
            <TrendingUp className="w-4 h-4" /> Sales Workspace
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">Sales Performance Dashboard</h1>
          <p className="text-xs text-emerald-100 mt-1">Track assigned leads, follow-ups, quotations & bookings conversion</p>
        </div>
        <div className="flex gap-2">
          <Link to="/leads/new" className="px-4 py-2 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 font-bold text-xs shadow-sm transition-all">
            + Add New Lead
          </Link>
          <Link to="/quotations" className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition-all">
            Create Quotation
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="My Leads" value={kpi.totalLeads || 0} icon={Users} color="emerald" subtitle="Total assigned" />
        <StatCard title="Follow-ups Today" value={kpi.newLeadsToday || 0} icon={Clock} color="sky" subtitle="Action items" />
        <StatCard title="Overdue Follow-ups" value="0" icon={AlertCircle} color="rose" subtitle="Requires attention" />
        <StatCard title="Quotations Sent" value={kpi.totalQuotations || 0} icon={FileText} color="purple" subtitle="Proposals" />
        <StatCard title="Quotations Accepted" value={kpi.convertedLeads || 0} icon={CheckCircle} color="emerald" subtitle="Accepted" />
        <StatCard title="Bookings Created" value={kpi.totalBookings || 0} icon={CalendarCheck} color="cyan" subtitle="Confirmed orders" />
        <StatCard title="Pending Payment" value={`₹${(kpi.pendingPayments || 0).toLocaleString()}`} icon={DollarSign} color="amber" subtitle="Awaiting client" />
        <StatCard title="Revenue Generated" value={`₹${(kpi.paymentsReceived || 0).toLocaleString()}`} icon={DollarSign} color="emerald" subtitle="Paid revenue" />
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/leads/all" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Lead Pipeline Management</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Review new enquiries, assign sales agents & update lead statuses.</p>
        </Link>

        <Link to="/followups" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Scheduled Follow-ups</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Never miss a call or WhatsApp follow-up with prospective shippers.</p>
        </Link>

        <Link to="/whatsapp" className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">WhatsApp & Quotations</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Dispatch rate quotes directly to clients over WhatsApp Cloud API.</p>
        </Link>
      </div>
    </div>
  );
}
