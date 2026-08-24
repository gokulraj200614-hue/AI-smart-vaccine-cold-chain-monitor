import React, { useState } from 'react';
import { 
  Radio, 
  Cpu, 
  Thermometer, 
  Droplets, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle,
  Battery,
  Signal,
  MapPin,
  Flame,
  Snowflake,
  Send
} from 'lucide-react';
import { 
  EdgeDevice, 
  VaccineBatch, 
  TelemetryReading, 
  DeviceConnectivity 
} from '../types';

interface SensorSimulatorViewProps {
  devices: EdgeDevice[];
  activeBatch: VaccineBatch;
  latestTelemetry: TelemetryReading | null;
  recentTelemetry: TelemetryReading[];
  deviceConnectivity: DeviceConnectivity;
  bufferCount: number;
  onToggleConnectivity: (mode: DeviceConnectivity) => void;
  onInjectManualReading: (temp: number, humidity: number) => void;
}

export const SensorSimulatorView: React.FC<SensorSimulatorViewProps> = ({
  devices,
  activeBatch,
  latestTelemetry,
  recentTelemetry,
  deviceConnectivity,
  bufferCount,
  onToggleConnectivity,
  onInjectManualReading,
}) => {
  const [manualTemp, setManualTemp] = useState<number>(
    latestTelemetry ? latestTelemetry.temperature : activeBatch.idealTemp
  );
  const [manualHumidity, setManualHumidity] = useState<number>(
    latestTelemetry ? latestTelemetry.humidity : 50
  );

  const matchedDevice = devices.find((d) => d.id === activeBatch.deviceId) || devices[0];

  const handleManualInject = () => {
    onInjectManualReading(manualTemp, manualHumidity);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-950 border border-blue-700 flex items-center justify-center text-blue-300 shadow-lg shadow-blue-500/20">
            <Radio className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Sensirion SHT33 Sensor Core
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                ±0.15°C High-Accuracy I²C
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Live Edge Node & SHT33 Telemetry Simulator
            </h1>
          </div>
        </div>

        {/* Edge Connectivity Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onToggleConnectivity('ONLINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceConnectivity === 'OFFLINE'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Buffer ({bufferCount})</span>
          </button>
          <button
            onClick={() => onToggleConnectivity('SYNCHRONIZING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              deviceConnectivity === 'SYNCHRONIZING'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Buffer</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Hardware Node Specs vs Manual Injection Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hardware Edge Node Spec Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Node Parameters</span>
            </h3>
            <span className="text-xs font-mono text-cyan-300 font-bold">{matchedDevice.id}</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-850">
              <span className="text-slate-400">Sensor Model:</span>
              <span className="font-semibold text-slate-200">{matchedDevice.model}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-850">
              <span className="text-slate-400">Assigned Unit:</span>
              <span className="font-semibold text-slate-200">{matchedDevice.assignedStorageUnit}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-850">
              <span className="text-slate-400">Firmware Build:</span>
              <span className="font-mono text-cyan-400">{matchedDevice.firmwareVersion}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-850">
              <span className="text-slate-400">Sampling Rate:</span>
              <span className="font-mono text-slate-200">{matchedDevice.samplingIntervalSec} seconds</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-850">
              <span className="text-slate-400">Edge Battery Level:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <Battery className="w-4 h-4" /> {matchedDevice.batteryPct}%
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Signal RSSI:</span>
              <span className="font-mono text-slate-200 flex items-center gap-1">
                <Signal className="w-4 h-4 text-cyan-400" /> -65 dBm (Strong)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-bold text-slate-200">Local Threshold Guard:</span> Edge firmware autonomously trips local visual beacon if temperature crosses ({activeBatch.minTemp}°C - {activeBatch.maxTemp}°C).
          </div>
        </div>

        {/* Manual SHT33 Sensor Excursion Injection Tool */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Interactive Temperature & Humidity Injection Testbed</span>
              </h3>
              <span className="text-xs text-slate-400">Real-Time SHT33 Overrides</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-2">
              {/* Temperature Slider */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-400" />
                    <span>Injected Temperature (°C)</span>
                  </span>
                  <span className="text-lg font-black font-mono text-rose-400">
                    {manualTemp.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="35"
                  step="0.1"
                  value={manualTemp}
                  onChange={(e) => setManualTemp(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>-10°C (Deep Freeze)</span>
                  <span className="text-emerald-400">Safe: 2-8°C</span>
                  <span>+35°C (Heatwave)</span>
                </div>
              </div>

              {/* Humidity Slider */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    <span>Injected Humidity (%)</span>
                  </span>
                  <span className="text-lg font-black font-mono text-blue-400">
                    {manualHumidity.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="1"
                  value={manualHumidity}
                  onChange={(e) => setManualHumidity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>10% (Desiccated)</span>
                  <span className="text-emerald-400">Safe: 30-65%</span>
                  <span>95% (Condensation)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setManualTemp(4.5); setManualHumidity(50); }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
              >
                Reset to Ideal (4.5°C)
              </button>
              <button
                onClick={() => { setManualTemp(11.8); setManualHumidity(65); }}
                className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition"
              >
                Inject Critical Climb (+11.8°C)
              </button>
              <button
                onClick={() => { setManualTemp(-2.5); setManualHumidity(45); }}
                className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-semibold transition"
              >
                Inject Sub-Zero Freeze (-2.5°C)
              </button>
            </div>

            <button
              id="btn-send-manual-telemetry"
              onClick={handleManualInject}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 transition"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast SHT33 Frame Now</span>
            </button>
          </div>
        </div>

      </div>

      {/* Raw SHT33 Telemetry Packet Feed */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Raw Ingested Sensor Telemetry Stream (CRC-16 Verified)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Showing latest {Math.min(10, recentTelemetry.length)} frames
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-2.5">Packet ID</th>
                <th className="pb-2.5">Timestamp</th>
                <th className="pb-2.5">Device ID</th>
                <th className="pb-2.5">Temperature</th>
                <th className="pb-2.5">Humidity</th>
                <th className="pb-2.5">Buffer Status</th>
                <th className="pb-2.5">Integrity Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono">
              {recentTelemetry.slice(-8).reverse().map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-2.5 text-slate-300">{r.id.slice(-12)}</td>
                  <td className="py-2.5 text-slate-400">{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td className="py-2.5 text-cyan-400">{r.deviceId}</td>
                  <td className={`py-2.5 font-bold ${
                    r.temperature > activeBatch.maxTemp ? 'text-rose-400' :
                    r.temperature < activeBatch.minTemp ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {r.temperature.toFixed(2)} °C
                  </td>
                  <td className="py-2.5 text-slate-200">{r.humidity.toFixed(1)} %</td>
                  <td className="py-2.5">
                    {r.edgeBuffered ? (
                      <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px]">
                        Buffered
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                        Live Ingest
                      </span>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="text-emerald-400 flex items-center gap-1 font-sans text-xs">
                      <ShieldCheck className="w-3.5 h-3.5" /> CRC OK
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
