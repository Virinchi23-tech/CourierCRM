import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import { Settings as SettingsIcon, Shield, Users, Lock, Key, Activity, Save, Plus, Search, CheckCircle2, Phone, Mail, Building, Globe, DollarSign } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('users');

  // Users management
  const [users, setUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: 'User@123', role: 'SALES', mobile: '' });
  const [userSearch, setUserSearch] = useState('');

  // System Settings state
  const [integrationsForm, setIntegrationsForm] = useState({
    meta_verify_token: 'meta_couriercrm_verify_secret',
    meta_page_token: 'EAAGk182903810928301283',
    meta_app_secret: '9901823709128301293',
    whatsapp_phone_id: '109283019283012',
    whatsapp_token: 'EAAW128903810923'
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: 'CourierCRM International',
    support_phone: '+91 98765 43210',
    support_email: 'support@couriercrm.com',
    currency: 'INR (₹)',
    gst_percentage: '18',
    default_courier: 'DHL Express'
  });

  const [toastMsg, setToastMsg] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [logSearch, setLogSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.success && Array.isArray(res.users)) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && Array.isArray(res.settings)) {
        const settingsMap = {};
        res.settings.forEach(s => {
          settingsMap[s.key] = s.value;
        });

        if (settingsMap.meta_verify_token) {
          setIntegrationsForm({
            meta_verify_token: settingsMap.meta_verify_token || '',
            meta_page_token: settingsMap.meta_page_token || '',
            meta_app_secret: settingsMap.meta_app_secret || '',
            whatsapp_phone_id: settingsMap.whatsapp_phone_id || '',
            whatsapp_token: settingsMap.whatsapp_token || ''
          });
        }

        if (settingsMap.company_name) {
          setCompanyForm({
            company_name: settingsMap.company_name || 'CourierCRM International',
            support_phone: settingsMap.support_phone || '+91 98765 43210',
            support_email: settingsMap.support_email || 'support@couriercrm.com',
            currency: settingsMap.currency || 'INR (₹)',
            gst_percentage: settingsMap.gst_percentage || '18',
            default_courier: settingsMap.default_courier || 'DHL Express'
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/settings/audit-logs');
      if (res.success && Array.isArray(res.logs)) {
        setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchSettings(), fetchAuditLogs()]).finally(() => setLoading(false));
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', userForm);
      setIsAddUserOpen(false);
      setUserForm({ name: '', email: '', password: 'User@123', role: 'SALES', mobile: '' });
      fetchUsers();
      showToast('System user created successfully!');
    } catch (err) {
      alert(err.message || 'User creation failed');
    }
  };

  const handleUpdateUserStatus = async (user, newStatus) => {
    try {
      await api.put(`/users/${user.id}`, { status: newStatus });
      fetchUsers();
      showToast(`User ${user.name} status updated to ${newStatus}`);
    } catch (err) {
      alert('Update failed');
    }
  };

  const handleSaveIntegrations = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const settingsPayload = Object.entries(integrationsForm).map(([key, value]) => ({
        key,
        value,
        category: 'INTEGRATIONS'
      }));

      await api.put('/settings', { settings: settingsPayload });
      showToast('Meta & WhatsApp API credentials saved and synced with database!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveCompanyConfig = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const settingsPayload = Object.entries(companyForm).map(([key, value]) => ({
        key,
        value,
        category: 'COMPANY'
      }));

      await api.put('/settings', { settings: settingsPayload });
      showToast('Company logistics preferences saved to database!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(l =>
    l.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.entity?.toLowerCase().includes(logSearch.toLowerCase()) ||
    l.user_name?.toLowerCase().includes(logSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn text-xs">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[10000] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-slate-900" /> System Settings & Audit Logs
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage RBAC user accounts, Meta/WhatsApp credentials, preferences & audit logs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'users', label: 'User & RBAC Management' },
          { key: 'integrations', label: 'Meta & WhatsApp API Setup' },
          { key: 'company', label: 'Company Preferences' },
          { key: 'audit', label: 'System Audit Logs' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-3 border-b-2 uppercase tracking-wider transition-all ${
              activeTab === tab.key
                ? 'border-slate-900 text-slate-900 font-bold bg-slate-100 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Users Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter users by name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Add System User
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3.5">User Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Mobile</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading system users...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="p-8 text-center text-slate-500">No users found.</td></tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                      <td className="p-3.5 text-slate-600">{u.email}</td>
                      <td className="p-3.5 font-bold text-purple-700">{u.role}</td>
                      <td className="p-3.5 text-slate-600">{u.mobile || 'N/A'}</td>
                      <td className="p-3.5"><Badge status={u.status} /></td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleUpdateUserStatus(u, u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Meta & WhatsApp Integrations */}
      {activeTab === 'integrations' && (
        <form onSubmit={handleSaveIntegrations} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Meta Lead Ads */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" /> Meta Lead Ads Webhook Setup
              </h3>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Webhook Verify Token</label>
                  <input
                    type="text"
                    value={integrationsForm.meta_verify_token}
                    onChange={e => setIntegrationsForm({ ...integrationsForm, meta_verify_token: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meta Page Access Token</label>
                  <input
                    type="password"
                    value={integrationsForm.meta_page_token}
                    onChange={e => setIntegrationsForm({ ...integrationsForm, meta_page_token: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meta App Secret</label>
                  <input
                    type="password"
                    value={integrationsForm.meta_app_secret}
                    onChange={e => setIntegrationsForm({ ...integrationsForm, meta_app_secret: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp Cloud API */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600" /> WhatsApp Cloud API Settings
              </h3>
              <div className="space-y-3.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number ID</label>
                  <input
                    type="text"
                    value={integrationsForm.whatsapp_phone_id}
                    onChange={e => setIntegrationsForm({ ...integrationsForm, whatsapp_phone_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">WhatsApp Business Permanent Token</label>
                  <input
                    type="password"
                    value={integrationsForm.whatsapp_token}
                    onChange={e => setIntegrationsForm({ ...integrationsForm, whatsapp_token: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-mono text-xs outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save API Credentials'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Company Preferences */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompanyConfig} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-800" /> Company & Logistics Operational Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Organization Name
              </label>
              <input
                type="text"
                value={companyForm.company_name}
                onChange={e => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Support Hotline
              </label>
              <input
                type="text"
                value={companyForm.support_phone}
                onChange={e => setCompanyForm({ ...companyForm, support_phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Support Email
              </label>
              <input
                type="email"
                value={companyForm.support_email}
                onChange={e => setCompanyForm({ ...companyForm, support_email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Base Currency
              </label>
              <input
                type="text"
                value={companyForm.currency}
                onChange={e => setCompanyForm({ ...companyForm, currency: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> GST Tax Rate (%)
              </label>
              <input
                type="number"
                value={companyForm.gst_percentage}
                onChange={e => setCompanyForm({ ...companyForm, gst_percentage: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" /> Primary Courier Partner
              </label>
              <input
                type="text"
                value={companyForm.default_courier}
                onChange={e => setCompanyForm({ ...companyForm, default_courier: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> {savingSettings ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit logs by action, user or entity..."
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-3 py-2 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 font-bold text-slate-900 flex items-center gap-2 bg-slate-50">
              <Activity className="w-4 h-4 text-slate-800" /> Audit Trail Activity History ({filteredLogs.length} Events)
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-bold">
                <tr>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">User Account</th>
                  <th className="p-3.5">IP Address</th>
                  <th className="p-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading audit history...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">No activity logs recorded.</td></tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-emerald-700">{log.action}</td>
                      <td className="p-3.5 font-mono text-purple-700">{log.entity} #{log.entity_id || 'N/A'}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{log.user_name || 'System Admin'}</td>
                      <td className="p-3.5 text-slate-500 font-mono">{log.ip_address || '127.0.0.1'}</td>
                      <td className="p-3.5 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      <Modal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} title="Create New System User" icon={Users} maxWidth="max-w-xl">
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">USER CREDENTIALS & PERMISSIONS</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Full Name *
              </label>
              <input required type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="John Smith" className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> Email Address *
              </label>
              <input required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="john@couriercrm.com" className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Setup Password *
              </label>
              <input required type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" /> System Role *
              </label>
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
                <option value="SALES">SALES</option>
                <option value="OPERATIONS">OPERATIONS</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsAddUserOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Create Account</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
