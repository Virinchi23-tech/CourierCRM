import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, icon: Icon, children, maxWidth = 'max-w-xl' }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className={`w-full ${maxWidth} bg-white border border-slate-100 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col my-auto`}>
        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-900 leading-normal tracking-tight flex items-center gap-2.5">
            {Icon && <Icon className="w-5 h-5 text-slate-800" />}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Body */}
        <div className="px-7 py-6 overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
