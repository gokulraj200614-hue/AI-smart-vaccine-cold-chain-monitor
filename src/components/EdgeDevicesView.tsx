import React from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Battery, 
  Signal, 
  Layers, 
  Clock, 
  Sliders, 
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { EdgeDevice, DeviceConnectivity } from '../types';

interface EdgeDevicesViewProps {
  devices: EdgeDevice[];
  deviceConnectivity: DeviceConnectivity;
  bufferCount: number;
  onToggleConnectivity: (mode: DeviceConnectivity) => void;
}

export const EdgeDevicesView: React.FC<EdgeDevicesViewProps> = ({
  devices,
  deviceConnectivity,
  bufferCount,
  onToggleConnectivity,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-950 border border-indigo-700 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Hardware Fleet Topology
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                4 Active Edge Microcontrollers
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Edge Sensor Nodes & Offline Buffer Architecture
            </h1>
          </div>
        </div>

        {/* Global Connectivity Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onToggleConnectivity('ONLINE')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              deviceConnectivity === 'ONLINE'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </button>
          <button
            onClick={() => onToggleConnectivity('OFFLINE')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              deviceConnectivity === 'OFFLINE'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Simulate Disconnect (Offline Buffer)</span>
          </button>
          <button
            onClick={() => onToggleConnectivity('SYNCHRONIZING')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              deviceConnectivity === 'SYNCHRONIZING'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Flush Buffer</span>
          </button>
        </div>
      </div>

      {/* Edge Architecture Diagram Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>Lossless Offline Buffer Pipeline</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-cyan-400">1. SHT33 Sampling</span>
            <p className="text-slate-400 mt-1">
              Precision sensor captures temperature & humidity every 5 seconds over hardware I²C bus.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-amber-400">2. Local Flash Queue</span>
            <p className="text-slate-400 mt-1">
              When disconnected (e.g. transport tunnels), records are stored non-volatilely in Edge SPI Flash.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-blue-400">3. Auto Re-Sync</span>
            <p className="text-slate-400 mt-1">
              Upon link restoration, buffered frames stream in sequence with original timestamps preserved.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-bold text-emerald-400">4. AI Ingestion</span>
            <p className="text-slate-400 mt-1">
              Cloud AI Risk Engine recalculates kinetic degradation curves seamlessly without gap loss.
            </p>
          </div>
        </div>
      </div>

      {/* Devices List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((d) => (
          <div key={d.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold font-mono text-cyan-400">{d.id}</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{d.name}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 ${
                d.connectivity === 'ONLINE' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                d.connectivity === 'OFFLINE' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                'bg-blue-950 text-blue-300 border border-blue-800'
              }`}>
                {d.connectivity === 'ONLINE' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                {d.connectivity}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400">Assigned Storage:</span>
                <div className="font-semibold text-slate-200 truncate mt-0.5">{d.assignedStorageUnit}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400">Offline Backlog:</span>
                <div className="font-mono font-bold text-amber-400 mt-0.5">{d.bufferCount} records</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400">Battery Level:</span>
                <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5" /> {d.batteryPct}%
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400">Firmware Build:</span>
                <div className="font-mono text-cyan-400 mt-0.5">{d.firmwareVersion}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
