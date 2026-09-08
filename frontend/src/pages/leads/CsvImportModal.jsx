import React, { useState } from 'react';
import Modal from '../../components/common/Modal';
import api from '../../services/api';
import { Upload, CheckCircle, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';

export default function CsvImportModal({ isOpen, onClose, onRefresh }) {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return;

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] || '';
      });
      rows.push(obj);
    }

    setParsedRows(rows);
    setStep(2);
  };

  const handleExecuteImport = async () => {
    setLoading(true);
    try {
      const res = await api.post('/leads/import/csv', { rows: parsedRows });
      if (res.success) {
        setImportResult(res.summary);
        setStep(3);
        onRefresh && onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setCsvText('');
    setParsedRows([]);
    setImportResult(null);
    setStep(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Leads via CSV File" icon={FileSpreadsheet} maxWidth="max-w-2xl">
      <div className="space-y-6 text-xs text-slate-700">
        {step === 1 && (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
            <FileSpreadsheet className="w-12 h-12 text-slate-800 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Select or Drop CSV File</h3>
            <p className="text-slate-500 text-xs mb-4 font-medium">Supported headers: name, mobile, whatsapp, email, country, city, requirement, destination, weight, notes</p>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload-input"
            />
            <label
              htmlFor="csv-upload-input"
              aria-label="Upload CSV File"
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold cursor-pointer shadow-md inline-flex items-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4" /> Choose CSV File
            </label>

            <div className="mt-6 text-left">
              <label className="block text-slate-700 font-bold mb-1">Or paste raw CSV text:</label>
              <textarea
                rows="4"
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  parseCSV(e.target.value);
                }}
                placeholder="name,mobile,email,country,destination,weight&#10;John Doe,+919876543210,john@example.com,India,United States,10.5"
                className="w-full bg-white border border-slate-200/90 rounded-xl p-3 text-slate-900 font-mono text-[11px] outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">Previewing Parsed CSV ({parsedRows.length} Rows)</h3>
              <button onClick={resetAll} className="text-slate-900 hover:underline font-bold">Choose Different File</button>
            </div>

            <div className="max-h-60 overflow-x-auto overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Mobile</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Destination</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parsedRows.slice(0, 10).map((r, i) => (
                    <tr key={i}>
                      <td className="p-2 text-slate-400 font-medium">{i + 1}</td>
                      <td className="p-2 text-slate-900 font-bold">{r.name || r.customer_name}</td>
                      <td className="p-2 text-slate-700 font-medium">{r.mobile || r.phone}</td>
                      <td className="p-2 text-slate-500 font-medium">{r.email || 'N/A'}</td>
                      <td className="p-2 text-slate-900 font-bold">{r.destination || r.destination_country || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={resetAll} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">Back</button>
              <button
                onClick={handleExecuteImport}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-md transition-colors"
              >
                {loading ? 'Importing...' : `Confirm & Import ${parsedRows.length} Leads`}
              </button>
            </div>
          </div>
        )}

        {step === 3 && importResult && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-extrabold text-slate-900">CSV Lead Import Completed!</h3>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total</span>
                <span className="text-lg font-extrabold text-slate-900">{importResult.totalRows}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-700 block text-[10px] uppercase font-bold">Imported</span>
                <span className="text-lg font-extrabold text-emerald-700">{importResult.importedRows}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-amber-700 block text-[10px] uppercase font-bold">Duplicates</span>
                <span className="text-lg font-extrabold text-amber-700">{importResult.duplicateRows}</span>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="text-rose-700 block text-[10px] uppercase font-bold">Invalid</span>
                <span className="text-lg font-extrabold text-rose-700">{importResult.invalidRows}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button onClick={() => { resetAll(); onClose(); }} className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold shadow-md transition-colors">
                Done & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
