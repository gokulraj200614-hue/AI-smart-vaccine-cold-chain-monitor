import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Boxes, 
  Truck, 
  Bell, 
  FileText, 
  BrainCircuit, 
  Wrench, 
  Radio, 
  History,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  Play,
  Flame,
  Snowflake,
  ShieldCheck
} from 'lucide-react';
import { UserRole, UserProfile, DemoScenario, DeviceConnectivity, Alert } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  allUsers: UserProfile[];
  activeScenario: DemoScenario;
  onSelectScenario: (scenario: DemoScenario) => void;
  deviceConnectivity: DeviceConnectivity;
  onToggleConnectivity: (mode: DeviceConnectivity) => void;
  bufferCount: number;
  alerts: Alert[];
  onOpenAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  allUsers,
  activeScenario,
  onSelectScenario,
  deviceConnectivity,
  onToggleConnectivity,
  bufferCount,
  alerts,
  onOpenAlerts,
}) => {
  const unreadAlerts = alerts.filter((a) => !a.acknowledged && !a.resolved);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'sensor', label: 'Live SHT33', icon: Radio },
    { id: 'batches', label: 'Vaccine Batches', icon: Boxes },
    { id: 'transport', label: 'Transport Route', icon: Truck },
    { id: 'ai-engine', label: 'AI Risk Engine', icon: BrainCircuit },
    { id: 'actions', label: 'Action SOP', icon: Wrench },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlerts.length },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'devices', label: 'Edge Nodes', icon: Cpu },
    { id: 'audit', label: 'Audit Logs', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-200">
      {/* Top Utility Bar with Quick Scenarios and Connectivity Controls */}
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Brand Identity & Active Scenario */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-white text-sm font-mono">ECHELON</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                  AI COLD-CHAIN v2.4
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                SHT33 Telemetry & Predictive Spoilage Prevention
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden md:block" />

          {/* Edge Connectivity State Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium hidden lg:inline">Edge Link:</span>
            {deviceConnectivity === 'ONLINE' && (
              <button
                id="btn-conn-online"
                onClick={() => onToggleConnectivity('OFFLINE')}
                title="Click to simulate Edge network disconnect (e.g. Tunnel)"
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/50 transition"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi className="w-3.5 h-3.5" />
                <span className="font-medium">Online (Live)</span>
              </button>
            )}
            {deviceConnectivity === 'OFFLINE' && (
              <button
                id="btn-conn-offline"
                onClick={() => onToggleConnectivity('SYNCHRONIZING')}
                title="Click to restore connectivity and flush buffer"
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/80 border border-amber-600 text-amber-300 hover:bg-amber-900/50 transition animate-pulse"
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="font-semibold">Offline Buffer ({bufferCount} queued)</span>
              </button>
            )}
            {deviceConnectivity === 'SYNCHRONIZING' && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-950/80 border border-blue-600 text-blue-300">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="font-medium">Synchronizing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Demo Scenarios Switcher & Role Selector */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-slate-400 font-semibold hidden md:inline">Demo Scenarios:</span>
          
          <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              id="demo-safe-btn"
              onClick={() => onSelectScenario('SAFE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                activeScenario === 'SAFE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>1. Safe (4.5°C)</span>
            </button>

            <button
              id="demo-warning-btn"
              onClick={() => onSelectScenario('WARNING')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                activeScenario === 'WARNING'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>2. Warning (8.5°C)</span>
            </button>

            <button
              id="demo-critical-btn"
              onClick={() => onSelectScenario('CRITICAL')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                activeScenario === 'CRITICAL'
                  ? 'bg-rose-600 text-white shadow animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-300" />
              <span>3. Critical (12.5°C)</span>
            </button>

            <button
              id="demo-recovery-btn"
              onClick={() => onSelectScenario('RECOVERY')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition text-[11px] font-medium ${
                activeScenario === 'RECOVERY'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
              <span>4. Recovery</span>
            </button>
          </div>

          {/* User Role Selector */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="user-role-select"
              value={currentUser.id}
              onChange={(e) => {
                const found = allUsers.find((u) => u.id === e.target.value);
                if (found) setCurrentUser(found);
              }}
              className="bg-slate-850 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <nav className="px-4 flex items-center justify-between overflow-x-auto scrollbar-none border-t border-slate-800/40">
        <div className="flex items-center gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Alert Bell button */}
        <button
          id="btn-header-alerts"
          onClick={onOpenAlerts}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title="Open Active Alerts Center"
        >
          <Bell className="w-5 h-5" />
          {unreadAlerts.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping" />
          )}
        </button>
      </nav>
    </header>
  );
};
