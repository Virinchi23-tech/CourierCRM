import React from 'react';

export default function Badge({ status, text }) {
  const display = text || (status ? status.replace(/_/g, ' ') : 'UNKNOWN');

  const getStyle = (st) => {
    switch (st?.toUpperCase()) {
      case 'NEW':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CONTACTED':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'QUALIFIED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'QUOTATION_SENT':
      case 'QUOTED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BOOKED':
      case 'CONFIRMED':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'IN_TRANSIT':
      case 'HANDED_TO_COURIER':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CUSTOMS_HOLD':
      case 'CUSTOMS_CLEARANCE':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'OUT_FOR_DELIVERY':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'DELIVERED':
      case 'PAID':
      case 'COMPLETED':
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
      case 'PAYMENT_PENDING':
      case 'PARTIAL':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'FAILED':
      case 'CANCELLED':
      case 'REJECTED':
      case 'LOST':
      case 'DAMAGED':
      case 'RETURNED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border uppercase ${getStyle(status)}`}>
      {display}
    </span>
  );
}
