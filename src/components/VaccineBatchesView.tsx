import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  Thermometer, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  X, 
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import { VaccineBatch, UserProfile, BatchStatus } from '../types';

interface VaccineBatchesViewProps {
  batches: VaccineBatch[];
  activeBatchId: string;
  onSelectBatch: (id: string) => void;
  onAddNewBatch: (batch: Partial<VaccineBatch>) => void;
  onUpdateBatchStatus: (batchId: string, status: BatchStatus, notes?: string) => void;
  currentUser: UserProfile;
}

export const VaccineBatchesView: React.FC<VaccineBatchesViewProps> = ({
  batches,
  activeBatchId,
  onSelectBatch,
  onAddNewBatch,
  onUpdateBatchStatus,
  currentUser,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STORAGE' | 'TRANSPORT'>('ALL');

  // New Batch Form State
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('Moderna Therapeutics');
  const [minTemp, setMinTemp] = useState<number>(2.0);
  const [maxTemp, setMaxTemp] = useState<number>(8.0);
  const [idealTemp, setIdealTemp] = useState<number>(4.5);
  const [quantity, setQuantity] = useState<number>(2000);
  const [unitCost, setUnitCost] = useState<number>(35.0);
  const [maxAllowedExcursionMinutes, setMaxAllowedExcursionMinutes] = useState<number>(120);
  const [criticalExcursionMinutes, setCriticalExcursionMinutes] = useState<number>(45);
  const [expiryDate, setExpiryDate] = useState('2027-06-30');
  const [storageUnitName, setStorageUnitName] = useState('Central Ultra-Cold Vault #3');
  const [isTransport, setIsTransport] = useState(false);

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    onAddNewBatch({
      id: `BATCH-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      vaccineName: name,
      manufacturer,
      minTemp: Number(minTemp),
      maxTemp: Number(maxTemp),
      idealTemp: Number(idealTemp),
      minHumidity: 30,
      maxHumidity: 65,
      maxAllowedExcursionMinutes: Number(maxAllowedExcursionMinutes),
      criticalExcursionMinutes: Number(criticalExcursionMinutes),
      criticalUpperTemp: Number(maxTemp) + 4.0,
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      expiryDate,
      storageUnitId: isTransport ? 'REEFER-CARRIER-UNIT' : 'COLD-ROOM-CUSTOM',
      storageUnitName,
      deviceId: `SHT33-EDGE-0${batches.length + 1}`,
      isTransport,
    });
    setIsAddModalOpen(false);
    setName('');
  };

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.vaccineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'STORAGE') return matchesSearch && !b.isTransport;
    if (filterType === 'TRANSPORT') return matchesSearch && b.isTransport;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <Boxes className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Bio-Repository Inventory
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                WHO PQS Compliant Profiles
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Vaccine Batch Master Profiles & Storage Limits
            </h1>
          </div>
        </div>

        {currentUser.role === 'ADMINISTRATOR' && (
          <button
            id="btn-register-batch-modal"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Vaccine Batch</span>
          </button>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by vaccine name, batch ID, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'ALL'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Batches ({batches.length})
          </button>
          <button
            onClick={() => setFilterType('STORAGE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'STORAGE'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Stationary Cold Rooms
          </button>
          <button
            onClick={() => setFilterType('TRANSPORT')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'TRANSPORT'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Reefer Transport
          </button>
        </div>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredBatches.map((b) => {
          const isSelected = b.id === activeBatchId;
          const totalVal = (b.quantity * b.unitCost).toLocaleString();

          return (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border transition shadow-lg ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-cyan-950/30'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{b.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.currentStatus === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      b.currentStatus === 'EARLY_WARNING' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      b.currentStatus === 'QUARANTINED' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {b.currentStatus}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{b.vaccineName}</h3>
                  <span className="text-xs text-slate-400">{b.manufacturer}</span>
                </div>

                <button
                  onClick={() => onSelectBatch(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isSelected
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isSelected ? 'Currently Monitored' : 'Select Unit'}
                </button>
              </div>

              {/* Specific Storage Limits */}
              <div className="grid grid-cols-3 gap-2.5 my-3.5 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Safe Temp Range</span>
                  <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {b.minTemp}°C – {b.maxTemp}°C
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Allowable Excursion</span>
                  <div className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {b.maxAllowedExcursionMinutes} mins
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Asset Value</span>
                  <div className="text-sm font-bold font-mono text-cyan-300 mt-0.5">
                    ${totalVal}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Storage / Transport Unit:</span>
                  <span className="font-semibold text-slate-200">{b.storageUnitName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Total Available Stock:</span>
                  <span className="font-mono text-slate-200">{b.quantity.toLocaleString()} doses</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="font-mono text-slate-300">{b.expiryDate}</span>
                </div>
              </div>

              {/* Status Action Controls (Quarantine / Release) */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400">Regulatory State Control:</span>
                <div className="flex items-center gap-2">
                  {b.currentStatus !== 'QUARANTINED' ? (
                    <button
                      onClick={() => onUpdateBatchStatus(b.id, 'QUARANTINED', 'Quarantined by clinical steward.')}
                      className="px-2.5 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 border border-purple-800 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Quarantine</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateBatchStatus(b.id, 'SAFE', 'Release authorized following shake test & monograph review.')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Release Quarantine</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-cyan-400" />
                <span>Register New Vaccine Batch</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-200 mb-1">Vaccine Name & Formula</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Comirnaty BNT162b2 or Rhabdovirus Rabies"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Storage Location Name</label>
                  <input
                    type="text"
                    required
                    value={storageUnitName}
                    onChange={(e) => setStorageUnitName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Min Safe Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={minTemp}
                    onChange={(e) => setMinTemp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Max Safe Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={maxTemp}
                    onChange={(e) => setMaxTemp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Ideal Setpoint (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={idealTemp}
                    onChange={(e) => setIdealTemp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Doses Quantity</label>
                  <input
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-200 mb-1">Unit Cost ($ USD)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is-transport-check"
                  checked={isTransport}
                  onChange={(e) => setIsTransport(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-600 focus:ring-0 w-4 h-4"
                />
                <label htmlFor="is-transport-check" className="text-slate-300 font-medium">
                  This batch is in active transport / cold-carrier vehicle
                </label>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                >
                  Save Batch Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
