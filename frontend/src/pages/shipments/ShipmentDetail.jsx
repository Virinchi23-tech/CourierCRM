import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { Truck, Package, MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, ArrowLeft, ShieldCheck, Scale, Upload, ExternalLink, Activity, User, FileText } from 'lucide-react';

const TRACKING_STEPS = [
  'BOOKED',
  'PICKED_UP',
  'RECEIVED_AT_OFFICE',
  'HANDED_TO_COURIER',
  'IN_TRANSIT',
  'CUSTOMS_CLEARANCE',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

export default function ShipmentDetail() {
  const { tracking_number } = useParams();
  const { user, hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Operations Modals
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);

  // Status Change Form
  const [newStatus, setNewStatus] = useState('IN_TRANSIT');
  const [statusLocation, setStatusLocation] = useState('');
  const [statusNote, setStatusNote] = useState('');

  // Package Weighing Form
  const [pkgWeight, setPkgWeight] = useState(5.2);
  const [pkgLength, setPkgLength] = useState(30);
  const [pkgWidth, setPkgWidth] = useState(20);
  const [pkgHeight, setPkgHeight] = useState(20);
  const [pkgCondition, setPkgCondition] = useState('GOOD');

  // POD Form
  const [receivedBy, setReceivedBy] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const fetchShipmentDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shipments/${tracking_number}`);
      if (res.success) {
        setData(res);
        setNewStatus(res.shipment?.current_status || 'IN_TRANSIT');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentDetail();
  }, [tracking_number]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/shipments/${data.shipment.id}/status`, {
        current_status: newStatus,
        location: statusLocation || data.shipment.destination,
        description: statusNote
      });
      setIsStatusModalOpen(false);
      fetchShipmentDetail();
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleReceivePackage = async (e) => {
    e.preventDefault();
    if (!data.packages[0]) return;
    try {
      await api.put(`/packages/${data.packages[0].id}/receive`, {
        weight: pkgWeight,
        length: pkgLength,
        width: pkgWidth,
        height: pkgHeight,
        condition: pkgCondition,
        notes: 'Weighed & inspected at hub'
      });
      setIsPackageModalOpen(false);
      fetchShipmentDetail();
    } catch (err) {
      alert(err.message || 'Package weighing update failed');
    }
  };

  const handleRecordPod = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tracking/delivery', {
        shipment_id: data.shipment.id,
        received_by: receivedBy,
        delivery_notes: deliveryNotes,
        delivery_date: new Date().toISOString().split('T')[0]
      });
      setIsPodModalOpen(false);
      fetchShipmentDetail();
    } catch (err) {
      alert(err.message || 'POD recording failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading shipment timeline...</div>;

  const ship = data?.shipment;
  const pkgs = data?.packages || [];
  const events = data?.trackingEvents || [];
  const delivery = data?.delivery;

  const currentStepIdx = TRACKING_STEPS.indexOf(ship?.current_status) !== -1
    ? TRACKING_STEPS.indexOf(ship?.current_status)
    : (ship?.current_status === 'CUSTOMS_HOLD' ? 5 : 4);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Navigation */}
      <Link to="/shipments/all" className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Shipments
      </Link>

      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-600 via-cyan-600 to-indigo-700 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-extrabold text-white">{ship?.tracking_number}</span>
            <Badge status={ship?.current_status} />
          </div>
          <h1 className="text-xl font-extrabold text-white mt-1">Origin: {ship?.origin} ➔ Destination: {ship?.destination}</h1>
          <p className="text-xs text-sky-100 font-medium mt-0.5">AWB: {ship?.awb_number || 'Pending Handover'} • Courier: {ship?.courier_name || 'DHL Express'}</p>
        </div>

        {hasRole('OPERATIONS', 'ADMIN') && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsPackageModalOpen(true)} className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" /> Weigh & Inspect Package
            </button>
            <button onClick={() => setIsStatusModalOpen(true)} className="px-3.5 py-2 rounded-xl bg-white text-sky-800 hover:bg-sky-50 font-bold text-xs shadow flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Update Status
            </button>
            <button onClick={() => setIsPodModalOpen(true)} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Record POD
            </button>
          </div>
        )}
      </div>

      {/* Visual Shipment Timeline Tracker */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Visual Live Tracking Progression</h3>
        <div className="relative flex items-center justify-between overflow-x-auto py-4">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-sky-500 to-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(currentStepIdx / (TRACKING_STEPS.length - 1)) * 100}%` }}
          />

          {TRACKING_STEPS.map((step, idx) => {
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center min-w-[90px]">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                    isDone
                      ? 'bg-sky-600 border-sky-600 text-white shadow-md shadow-sky-600/20'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase mt-2 text-center ${isCurrent ? 'text-sky-700 font-extrabold' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.replace(/_/g, ' ')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid Details: Package Information & Tracking Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Packages Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-600" /> Package Metrics & Verification
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Actual Weight</span>
              <span className="text-base font-extrabold text-slate-900">{ship?.actual_weight} kg</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Volumetric</span>
              <span className="text-base font-extrabold text-purple-700">{ship?.volumetric_weight} kg</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 block uppercase font-bold text-[10px]">Chargeable Wt</span>
              <span className="text-base font-extrabold text-emerald-700">{ship?.chargeable_weight} kg</span>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            {pkgs.map(p => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-mono font-bold text-purple-700 block">{p.package_code}</span>
                  <span className="text-slate-600 font-medium">{p.contents || 'General Goods'}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 block">{p.weight} kg</span>
                  <span className="text-[10px] text-emerald-700 font-extrabold uppercase">{p.condition} CONDITION</span>
                </div>
              </div>
            ))}
          </div>

          {/* Proof of Delivery Card */}
          {delivery && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
              <span className="text-emerald-800 font-extrabold uppercase block flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Proof of Delivery (POD) Verified
              </span>
              <p className="text-slate-800 font-medium">Received By: <strong className="text-slate-900">{delivery.received_by}</strong></p>
              <p className="text-slate-600">Delivered On: {delivery.delivery_date} at {delivery.delivery_time}</p>
              {delivery.delivery_notes && <p className="text-slate-700 italic font-medium">{delivery.delivery_notes}</p>}
            </div>
          )}
        </div>

        {/* Tracking Audit Events Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600" /> Tracking Events Log
          </h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200">
            {events.map((ev) => (
              <div key={ev.id} className="relative pl-6">
                <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-sky-600" />
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sky-700 uppercase">{ev.status.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(ev.event_date).toLocaleString()}</span>
                </div>
                <p className="text-slate-800 font-medium">{ev.description}</p>
                {ev.location && <span className="text-slate-500 block font-semibold">Location: {ev.location}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} title="Update Operational Shipment Status" icon={Truck} maxWidth="max-w-xl">
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">MILESTONE TRACKING EVENT</div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" /> New Operational Status
            </label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
              {TRACKING_STEPS.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="CUSTOMS_HOLD">CUSTOMS_HOLD</option>
              <option value="RETURNED">RETURNED</option>
              <option value="DAMAGED">DAMAGED</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> Current Location
            </label>
            <input type="text" value={statusLocation} onChange={(e) => setStatusLocation(e.target.value)} placeholder="Hub / Airport / Destination City" className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Event Remarks / Notes
            </label>
            <input type="text" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Details regarding shipment movement..." className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsStatusModalOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Save Status Event</button>
          </div>
        </form>
      </Modal>

      {/* Weigh Package Modal */}
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="Receive & Weigh Package at Hub" icon={Scale} maxWidth="max-w-xl">
        <form onSubmit={handleReceivePackage} className="space-y-4 text-xs">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">PHYSICAL AUDIT & WEIGHING</div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-slate-400" /> Actual Weight (kg)
            </label>
            <input type="number" step="0.1" value={pkgWeight} onChange={(e) => setPkgWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">L (cm)</label>
              <input type="number" value={pkgLength} onChange={(e) => setPkgLength(e.target.value)} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">W (cm)</label>
              <input type="number" value={pkgWidth} onChange={(e) => setPkgWidth(e.target.value)} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">H (cm)</label>
              <input type="number" value={pkgHeight} onChange={(e) => setPkgHeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-400" /> Package Condition
            </label>
            <select value={pkgCondition} onChange={(e) => setPkgCondition(e.target.value)} className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all">
              <option value="GOOD">GOOD (Sealed & Intact)</option>
              <option value="DAMAGED">DAMAGED BOX</option>
              <option value="REPACKAGED">REPACKAGED AT HUB</option>
            </select>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsPackageModalOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Verify Package Weight</button>
          </div>
        </form>
      </Modal>

      {/* Record POD Modal */}
      <Modal isOpen={isPodModalOpen} onClose={() => setIsPodModalOpen(false)} title="Record Proof of Delivery (POD)" icon={CheckCircle2} maxWidth="max-w-xl">
        <form onSubmit={handleRecordPod} className="space-y-4 text-xs">
          <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">RECIPIENT CONFIRMATION</div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Recipient Name *
            </label>
            <input required type="text" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Full Name of recipient who signed" className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
          </div>
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Delivery Notes
            </label>
            <input type="text" value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Signed at front reception / Mailroom..." className="w-full bg-slate-50 border border-slate-200/90 rounded-xl px-4 py-2.5 text-slate-900 font-medium outline-none focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all" />
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-end items-center gap-3">
            <button type="button" onClick={() => setIsPodModalOpen(false)} className="text-slate-700 hover:bg-slate-100 font-bold px-5 py-2.5 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition-colors">Confirm Delivery & POD</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
