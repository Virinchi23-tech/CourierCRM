import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import AddEditLeadModal from './AddEditLeadModal';
import LeadDetailDrawer from './LeadDetailDrawer';
import CsvImportModal from './CsvImportModal';
import { useAuth } from '../../context/AuthContext';
import { Users, Search, Filter, Plus, Upload, UserCheck, Trash2, Edit, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function LeadsList({ myLeadsOnly = false }) {
  const { user, hasRole } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Modals & Drawers state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        source: sourceFilter,
        myLeadsOnly: myLeadsOnly ? 'true' : 'false'
      };

      const res = await api.get('/leads', { params });
      if (res.success) {
        setLeads(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [searchTerm, statusFilter, sourceFilter, myLeadsOnly]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(leads.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete lead ${code}?`)) return;
    try {
      await api.delete(`/leads/${id}`);
      fetchLeads(pagination.page);
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> {myLeadsOnly ? 'My Assigned Leads' : 'All Courier Leads'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage, qualify & convert incoming international courier leads</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Import CSV
          </button>
          <button
            onClick={() => { setEditingLead(null); setIsAddModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, mobile, email, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="QUALIFIED">QUALIFIED</option>
            <option value="QUOTATION_SENT">QUOTATION_SENT</option>
            <option value="BOOKED">BOOKED</option>
            <option value="LOST">LOST</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-sky-500 font-medium"
          >
            <option value="">All Sources</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Website">Website</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="CSV Import">CSV Import</option>
            <option value="Manual">Manual</option>
            <option value="Referral">Referral</option>
          </select>
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={leads.length > 0 && selectedIds.length === leads.length}
                    className="rounded bg-slate-100 border-slate-300 text-sky-600 focus:ring-0"
                  />
                </th>
                <th className="px-4 py-3.5">Lead Code</th>
                <th className="px-4 py-3.5">Customer Name</th>
                <th className="px-4 py-3.5">Mobile / WhatsApp</th>
                <th className="px-4 py-3.5">Destination</th>
                <th className="px-4 py-3.5">Source</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Assigned Agent</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500 font-medium">
                    Loading leads database...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-500 font-medium">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(lead.id)}
                        onChange={() => handleSelectOne(lead.id)}
                        className="rounded bg-slate-100 border-slate-300 text-sky-600 focus:ring-0"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-sky-700">
                      <button onClick={() => setSelectedLeadId(lead.id)} className="hover:underline">
                        {lead.lead_code}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {lead.customer_name}
                      {lead.email && <span className="block text-[10px] font-medium text-slate-400">{lead.email}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{lead.mobile}</td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {lead.destination_country || 'N/A'}
                      {lead.destination_city && <span className="text-slate-400"> ({lead.destination_city})</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{lead.source}</td>
                    <td className="px-4 py-3">
                      <Badge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-purple-700 font-bold">
                      {lead.assigned_to_name || 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          title="View Lead Timeline"
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingLead(lead); setIsAddModalOpen(true); }}
                          title="Edit Lead"
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {hasRole('ADMIN') && (
                          <button
                            onClick={() => handleDelete(lead.id, lead.lead_code)}
                            title="Delete Lead"
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Showing {leads.length} of {pagination.total} total leads (Page {pagination.page} of {pagination.totalPages})
          </span>
          <div className="flex gap-1">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchLeads(pagination.page - 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLeads(pagination.page + 1)}
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Lead Modal */}
      <AddEditLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        lead={editingLead}
        onRefresh={() => fetchLeads(pagination.page)}
      />

      {/* CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onRefresh={() => fetchLeads(1)}
      />

      {/* Lead 360 Detail Drawer */}
      {selectedLeadId && (
        <LeadDetailDrawer
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onRefresh={() => fetchLeads(pagination.page)}
        />
      )}
    </div>
  );
}
