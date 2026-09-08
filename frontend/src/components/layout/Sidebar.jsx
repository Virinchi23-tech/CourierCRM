import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  HelpCircle,
  FileText,
  CalendarCheck,
  Truck,
  CreditCard,
  Building2,
  MessageSquare,
  Clock,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Globe,
  Upload,
  UserPlus
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const [openLeads, setOpenLeads] = useState(location.pathname.startsWith('/leads'));
  const [openShipments, setOpenShipments] = useState(location.pathname.startsWith('/shipments'));

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
      isActive
        ? 'bg-sky-50 text-sky-700 border-l-4 border-sky-600 font-bold shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  const subNavItemClass = ({ isActive }) =>
    `flex items-center gap-2 pl-9 pr-3 py-2 rounded-lg text-xs font-semibold transition-all ${
      isActive
        ? 'text-sky-700 font-bold bg-sky-50'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
    }`;

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 shadow-sm ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Globe className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight">CourierCRM</h1>
          <span className="text-[10px] tracking-wider font-bold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-200">
            Intl Logistics
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4 space-y-1">
        {/* Dashboard */}
        <NavLink to="/dashboard" className={navItemClass}>
          <LayoutDashboard className="w-4 h-4 text-sky-600" />
          <span>Dashboard</span>
        </NavLink>

        {/* Leads (Admin & Sales) */}
        {hasRole('SALES') && (
          <div>
            <button
              onClick={() => setOpenLeads(!openLeads)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Leads</span>
              </div>
              {openLeads ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            {openLeads && (
              <div className="mt-1 space-y-0.5">
                <NavLink to="/leads/all" className={subNavItemClass}>
                  All Leads
                </NavLink>
                <NavLink to="/leads/my" className={subNavItemClass}>
                  My Leads
                </NavLink>
                <NavLink to="/leads/new" className={subNavItemClass}>
                  <UserPlus className="w-3 h-3" /> Add Lead
                </NavLink>
                <NavLink to="/leads/meta" className={subNavItemClass}>
                  Meta Leads
                </NavLink>
                <NavLink to="/leads/import" className={subNavItemClass}>
                  <Upload className="w-3 h-3" /> CSV Import
                </NavLink>
              </div>
            )}
          </div>
        )}

        {/* Customers */}
        <NavLink to="/customers" className={navItemClass}>
          <UserCheck className="w-4 h-4 text-purple-600" />
          <span>Customers</span>
        </NavLink>

        {/* Enquiries (Sales & Admin) */}
        {hasRole('SALES') && (
          <NavLink to="/enquiries" className={navItemClass}>
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Enquiries</span>
          </NavLink>
        )}

        {/* Quotations (Sales & Admin) */}
        {hasRole('SALES') && (
          <NavLink to="/quotations" className={navItemClass}>
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Quotations</span>
          </NavLink>
        )}

        {/* Bookings */}
        <NavLink to="/bookings" className={navItemClass}>
          <CalendarCheck className="w-4 h-4 text-blue-600" />
          <span>Bookings</span>
        </NavLink>

        {/* Shipments (All Roles) */}
        <div>
          <button
            onClick={() => setOpenShipments(!openShipments)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-4 h-4 text-cyan-600" />
              <span>Shipments</span>
            </div>
            {openShipments ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
          {openShipments && (
            <div className="mt-1 space-y-0.5">
              <NavLink to="/shipments/all" className={subNavItemClass}>All Shipments</NavLink>
              <NavLink to="/shipments/pending" className={subNavItemClass}>Pending Pickup</NavLink>
              <NavLink to="/shipments/in-transit" className={subNavItemClass}>In Transit</NavLink>
              <NavLink to="/shipments/customs" className={subNavItemClass}>Customs Hold</NavLink>
              <NavLink to="/shipments/out-for-delivery" className={subNavItemClass}>Out for Delivery</NavLink>
              <NavLink to="/shipments/delivered" className={subNavItemClass}>Delivered</NavLink>
              <NavLink to="/shipments/returned" className={subNavItemClass}>Returned</NavLink>
            </div>
          )}
        </div>

        {/* Payments */}
        <NavLink to="/payments" className={navItemClass}>
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Payments</span>
        </NavLink>

        {/* Couriers */}
        <NavLink to="/couriers" className={navItemClass}>
          <Building2 className="w-4 h-4 text-orange-600" />
          <span>Couriers</span>
        </NavLink>

        {/* WhatsApp (Sales & Admin) */}
        {hasRole('SALES') && (
          <NavLink to="/whatsapp" className={navItemClass}>
            <MessageSquare className="w-4 h-4 text-teal-600" />
            <span>WhatsApp</span>
          </NavLink>
        )}

        {/* Follow-ups (Sales & Admin) */}
        {hasRole('SALES') && (
          <NavLink to="/followups" className={navItemClass}>
            <Clock className="w-4 h-4 text-rose-600" />
            <span>Follow-ups</span>
          </NavLink>
        )}

        {/* Reports (Admin & Sales) */}
        {hasRole('SALES') && (
          <NavLink to="/reports" className={navItemClass}>
            <BarChart3 className="w-4 h-4 text-yellow-600" />
            <span>Reports</span>
          </NavLink>
        )}

        {/* Settings (Admin Only) */}
        {hasRole('ADMIN') && (
          <NavLink to="/settings" className={navItemClass}>
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}
