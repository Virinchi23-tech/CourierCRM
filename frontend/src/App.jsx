import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import LeadsList from './pages/leads/LeadsList';
import MetaLeads from './pages/leads/MetaLeads';
import CustomersList from './pages/customers/CustomersList';
import CustomerProfile from './pages/customers/CustomerProfile';
import EnquiriesList from './pages/enquiries/EnquiriesList';
import QuotationsList from './pages/quotations/QuotationsList';
import BookingsList from './pages/bookings/BookingsList';
import ShipmentsList from './pages/shipments/ShipmentsList';
import ShipmentDetail from './pages/shipments/ShipmentDetail';
import PaymentsList from './pages/payments/PaymentsList';
import CouriersList from './pages/couriers/CouriersList';
import WhatsAppInbox from './pages/whatsapp/WhatsAppInbox';
import FollowupsList from './pages/followups/FollowupsList';
import ReportsAnalytics from './pages/reports/ReportsAnalytics';
import Settings from './pages/settings/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Protected CRM Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Leads */}
          <Route path="/leads/all" element={<LeadsList />} />
          <Route path="/leads/my" element={<LeadsList myLeadsOnly={true} />} />
          <Route path="/leads/new" element={<LeadsList />} />
          <Route path="/leads/meta" element={<MetaLeads />} />
          <Route path="/leads/import" element={<LeadsList />} />

          {/* Customers */}
          <Route path="/customers" element={<CustomersList />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />

          {/* Enquiries & Quotations & Bookings */}
          <Route path="/enquiries" element={<EnquiriesList />} />
          <Route path="/quotations" element={<QuotationsList />} />
          <Route path="/bookings" element={<BookingsList />} />

          {/* Shipments */}
          <Route path="/shipments/all" element={<ShipmentsList defaultStatus="" />} />
          <Route path="/shipments/pending" element={<ShipmentsList defaultStatus="pending" />} />
          <Route path="/shipments/in-transit" element={<ShipmentsList defaultStatus="in-transit" />} />
          <Route path="/shipments/customs" element={<ShipmentsList defaultStatus="customs" />} />
          <Route path="/shipments/out-for-delivery" element={<ShipmentsList defaultStatus="out-for-delivery" />} />
          <Route path="/shipments/delivered" element={<ShipmentsList defaultStatus="delivered" />} />
          <Route path="/shipments/returned" element={<ShipmentsList defaultStatus="returned" />} />
          <Route path="/shipments/detail/:tracking_number" element={<ShipmentDetail />} />

          {/* Payments & Couriers */}
          <Route path="/payments" element={<PaymentsList />} />
          <Route path="/couriers" element={<CouriersList />} />

          {/* Communications & Tasks */}
          <Route path="/whatsapp" element={<WhatsAppInbox />} />
          <Route path="/followups" element={<FollowupsList />} />

          {/* Reports & Settings */}
          <Route path="/reports" element={<ReportsAnalytics />} />
          <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><Settings /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
