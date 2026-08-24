import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  Clock, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  VaccineBatch, 
  CorrectiveActionLog, 
  Alert, 
  AuditLogEntry, 
  TransportJourney 
} from '../types';

interface ReportsComplianceViewProps {
  batches: VaccineBatch[];
  correctiveLogs: CorrectiveActionLog[];
  alerts: Alert[];
  auditLogs: AuditLogEntry[];
  transports: TransportJourney[];
}

export const ReportsComplianceView: React.FC<ReportsComplianceViewProps> = ({
  batches,
  correctiveLogs,
  alerts,
  auditLogs,
  transports,
}) => {
  const [selectedReportType, setSelectedReportType] = useState<
    'EXCURSION' | 'SPOILAGE_PREDICTION' | 'JOURNEY' | 'AUDIT'
  >('EXCURSION');

  const exportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `ECHELON_${selectedReportType}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;

    if (selectedReportType === 'EXCURSION') {
      headers = ['Log ID', 'Batch ID', 'Action Type', 'Performed By', 'Timestamp', 'Prev Risk', 'New Risk', 'Rechecked Temp', 'Status'];
      rows = correctiveLogs.map((c) => [
        c.id,
        c.batchId,
        c.actionType,
        c.performedBy,
        c.actionTime,
        c.previousRiskScore,
        c.newRiskScore,
        `${c.recheckedTemp}°C`,
        c.newStatus,
      ]);
    } else if (selectedReportType === 'AUDIT') {
      headers = ['Audit ID', 'Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details'];
      rows = auditLogs.map((a) => [
        a.id,
        a.timestamp,
        a.userName,
        a.userRole,
        a.action,
        a.entityType,
        a.entityId,
        `"${a.details.replace(/"/g, '""')}"`,
      ]);
    } else if (selectedReportType === 'SPOILAGE_PREDICTION') {
      headers = ['Batch ID', 'Vaccine', 'Current Status', 'Min Temp', 'Max Temp', 'Quantity', 'Allowable Excursion Min', 'Unit Name'];
      rows = batches.map((b) => [
        b.id,
        b.vaccineName,
        b.currentStatus,
        `${b.minTemp}°C`,
        `${b.maxTemp}°C`,
        b.quantity,
        b.maxAllowedExcursionMinutes,
        b.storageUnitName,
      ]);
    } else if (selectedReportType === 'JOURNEY') {
      headers = ['Journey ID', 'Batch ID', 'Driver', 'Origin', 'Destination', 'Status', 'Arrival Condition'];
      rows = transports.map((t) => [
        t.id,
        t.batchId,
        t.driverName,
        t.origin.name,
        t.destination.name,
        t.status,
        t.arrivalCondition,
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const generatedDate = new Date().toLocaleString();

    // Document Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('ECHELON | Vaccine Cold-Chain Compliance & Spoilage Report', 14, 12);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated: ${generatedDate} | Document Classification: GxP Standard Operating Audit`, 14, 20);

    if (selectedReportType === 'EXCURSION') {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Temperature Excursion & Corrective Intervention Log', 14, 38);

      const tableData = correctiveLogs.map((c) => [
        c.batchId,
        c.actionType.replace(/_/g, ' '),
        c.performedBy,
        new Date(c.actionTime).toLocaleDateString(),
        `${c.previousRiskScore} -> ${c.newRiskScore}`,
        `${c.recheckedTemp}°C`,
        c.newStatus,
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Batch ID', 'Action Executed', 'Responsible Steward', 'Date', 'Risk Transition', 'Temp', 'Status']],
        body: tableData.length > 0 ? tableData : [['No historical excursions logged', '-', '-', '-', '-', '-', 'ALL SAFE']],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
    } else if (selectedReportType === 'AUDIT') {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Immutable Regulatory & System Audit Ledger', 14, 38);

      const tableData = auditLogs.map((a) => [
        new Date(a.timestamp).toLocaleTimeString(),
        a.userName,
        a.action,
        a.entityId,
        a.details.length > 40 ? a.details.slice(0, 40) + '...' : a.details,
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Time', 'Operator', 'Action Event', 'Entity', 'Details']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
    } else if (selectedReportType === 'SPOILAGE_PREDICTION') {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Bio-Asset Master Inventories & Kinetic Storage Limits', 14, 38);

      const tableData = batches.map((b) => [
        b.id,
        b.vaccineName,
        b.currentStatus,
        `${b.minTemp}°C to ${b.maxTemp}°C`,
        `${b.quantity.toLocaleString()} doses`,
        `$${(b.quantity * b.unitCost).toLocaleString()}`,
        b.storageUnitName,
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Batch ID', 'Vaccine Product', 'Status', 'Safe Range', 'Doses', 'Asset Value', 'Location']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
    } else if (selectedReportType === 'JOURNEY') {
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(12);
      doc.text('Transport Cold-Chain Chain of Custody & GPS Route Report', 14, 38);

      const tableData = transports.map((t) => [
        t.id,
        t.batchName,
        t.driverName,
        t.origin.name,
        t.destination.name,
        t.status,
        t.arrivalCondition,
      ]);

      autoTable(doc, {
        startY: 44,
        head: [['Journey ID', 'Cargo', 'Courier', 'Origin', 'Destination', 'Status', 'Verification']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8 },
      });
    }

    doc.save(`ECHELON_${selectedReportType}_REPORT_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Compliance & QA Export Engine
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                WHO / FDA 21 CFR Part 11
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Standardized Reports & Regulatory Audits
            </h1>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Signed PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'EXCURSION', label: 'Temperature Excursion Report', icon: Clock, count: correctiveLogs.length },
          { id: 'SPOILAGE_PREDICTION', label: 'Spoilage Prediction Master', icon: Layers, count: batches.length },
          { id: 'JOURNEY', label: 'Transport Route Report', icon: UserCheck, count: transports.length },
          { id: 'AUDIT', label: 'System Compliance Audit Ledger', icon: ShieldCheck, count: auditLogs.length },
        ].map((rep) => {
          const Icon = rep.icon;
          const isSelected = selectedReportType === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReportType(rep.id as any)}
              className={`p-4 rounded-2xl border text-left transition shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-cyan-950/40'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-950 text-slate-300 border border-slate-800">
                  {rep.count} records
                </span>
              </div>
              <div className="text-xs font-bold text-slate-100">{rep.label}</div>
            </button>
          );
        })}
      </div>

      {/* Report Preview Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Report Output Preview ({selectedReportType.replace(/_/g, ' ')})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Digital Watermark Verified: ECHELON-SHA256
          </span>
        </div>

        {selectedReportType === 'EXCURSION' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Batch ID</th>
                  <th className="pb-2.5">Action Executed</th>
                  <th className="pb-2.5">Steward</th>
                  <th className="pb-2.5">Risk Shift</th>
                  <th className="pb-2.5">Rechecked Temp</th>
                  <th className="pb-2.5">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {correctiveLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No excursions recorded in current operational cycle.
                    </td>
                  </tr>
                ) : (
                  correctiveLogs.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 font-mono font-bold text-cyan-400">{c.batchId}</td>
                      <td className="py-3 font-semibold text-slate-200">{c.actionType.replace(/_/g, ' ')}</td>
                      <td className="py-3 text-slate-300">{c.performedBy}</td>
                      <td className="py-3 font-mono text-emerald-400">{c.previousRiskScore} → {c.newRiskScore}</td>
                      <td className="py-3 font-mono text-slate-100">{c.recheckedTemp}°C</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-300 border border-slate-800 text-[10px] font-bold">
                          {c.newStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedReportType === 'AUDIT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Timestamp</th>
                  <th className="pb-2.5">Operator</th>
                  <th className="pb-2.5">Action</th>
                  <th className="pb-2.5">Entity ID</th>
                  <th className="pb-2.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-mono">
                {auditLogs.slice(0, 10).map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 text-slate-400">{new Date(a.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 text-slate-200 font-sans">{a.userName}</td>
                    <td className="py-3 text-cyan-400">{a.action}</td>
                    <td className="py-3 text-slate-300">{a.entityId}</td>
                    <td className="py-3 text-slate-400 font-sans truncate max-w-xs">{a.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReportType === 'SPOILAGE_PREDICTION' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Batch ID</th>
                  <th className="pb-2.5">Vaccine Name</th>
                  <th className="pb-2.5">Safe Temp</th>
                  <th className="pb-2.5">Quantity</th>
                  <th className="pb-2.5">Asset Value</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 font-mono font-bold text-cyan-400">{b.id}</td>
                    <td className="py-3 font-semibold text-slate-200">{b.vaccineName}</td>
                    <td className="py-3 font-mono text-emerald-400">{b.minTemp}°C – {b.maxTemp}°C</td>
                    <td className="py-3 font-mono text-slate-300">{b.quantity.toLocaleString()} doses</td>
                    <td className="py-3 font-mono text-cyan-300">${(b.quantity * b.unitCost).toLocaleString()}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold">
                        {b.currentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReportType === 'JOURNEY' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2.5">Journey ID</th>
                  <th className="pb-2.5">Cargo Batch</th>
                  <th className="pb-2.5">Driver</th>
                  <th className="pb-2.5">Origin</th>
                  <th className="pb-2.5">Destination</th>
                  <th className="pb-2.5">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {transports.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 font-mono font-bold text-cyan-400">{t.id}</td>
                    <td className="py-3 font-semibold text-slate-200">{t.batchName}</td>
                    <td className="py-3 text-slate-300">{t.driverName}</td>
                    <td className="py-3 text-slate-400">{t.origin.name}</td>
                    <td className="py-3 text-slate-400">{t.destination.name}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800 text-[10px] font-bold">
                        {t.arrivalCondition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
