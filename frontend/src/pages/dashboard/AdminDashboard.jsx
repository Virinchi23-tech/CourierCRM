import React from 'react';
import StatCard from '../../components/common/StatCard';
import { Users, UserCheck, FileText, CalendarCheck, Truck, DollarSign, Package, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

export default function AdminDashboard({ data }) {
  const kpi = data?.kpi || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-700 text-white shadow-md">
        <div>
          <div className="flex items-center gap-2 text-sky-200 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Executive Overview
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-1">Admin Command Center</h1>
          <p className="text-xs text-sky-100 mt-1">Real-time performance across international sales, operations & logistics</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xs">
            Total Revenue: ₹{(kpi.paymentsReceived || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={kpi.totalLeads || 0} icon={Users} color="sky" subtitle={`+${kpi.newLeadsToday || 0} today`} />
        <StatCard title="Total Customers" value={kpi.totalCustomers || 0} icon={UserCheck} color="emerald" subtitle="Active Clients" />
        <StatCard title="Quotations Sent" value={kpi.totalQuotations || 0} icon={FileText} color="purple" subtitle="Sales Proposals" />
        <StatCard title="Total Bookings" value={kpi.totalBookings || 0} icon={CalendarCheck} color="cyan" subtitle="Confirmed Bookings" />
        <StatCard title="Shipments In Transit" value={kpi.shipmentsInTransit || 0} icon={Truck} color="amber" subtitle="Global Movement" />
        <StatCard title="Delivered Shipments" value={kpi.deliveredShipments || 0} icon={Package} color="emerald" subtitle="Completed Orders" />
        <StatCard title="Customs Hold" value={kpi.customsHold || 0} icon={AlertTriangle} color="rose" subtitle="Requires Action" />
        <StatCard title="Payments Collected" value={`₹${(kpi.paymentsReceived || 0).toLocaleString()}`} icon={DollarSign} color="emerald" subtitle="Received Revenue" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Source Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Leads Distribution by Source</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.leadsBySource || []}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, count }) => `${source}: ${count}`}
                >
                  {(charts.leadsBySource || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shipments by Status */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Shipments Volume by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.shipmentsByStatus || []}>
                <XAxis dataKey="status" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Monthly Revenue Trend (INR)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.revenueByMonth || []}>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Destination Countries */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200 bg-white">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Top Destination Countries</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.shipmentsByCountry || []} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="destination" type="category" stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
