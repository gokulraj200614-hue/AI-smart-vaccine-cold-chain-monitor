import React, { useEffect, useRef } from 'react';
import { 
  Truck, 
  MapPin, 
  Thermometer, 
  Droplets, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Navigation,
  ShieldCheck
} from 'lucide-react';
import L from 'leaflet';
import { TransportJourney, VaccineBatch, TelemetryReading } from '../types';

interface TransportMapViewProps {
  transports: TransportJourney[];
  batch: VaccineBatch;
  latestTelemetry: TelemetryReading | null;
  onUpdateJourneyStatus: (journeyId: string, condition: TransportJourney['arrivalCondition']) => void;
}

export const TransportMapView: React.FC<TransportMapViewProps> = ({
  transports,
  batch,
  latestTelemetry,
  onUpdateJourneyStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const activeJourney = transports[0];
  const currentTemp = latestTelemetry ? latestTelemetry.temperature : 4.8;
  const currentHumidity = latestTelemetry ? latestTelemetry.humidity : 52;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(
        [activeJourney.currentLocation.lat, activeJourney.currentLocation.lng],
        10
      );

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Draw polyline route
      const polyline = L.polyline(activeJourney.routeCoordinates, {
        color: '#06b6d4',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      // Origin Marker
      const originIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:#10b981; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">A</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([activeJourney.origin.lat, activeJourney.origin.lng], { icon: originIcon })
        .addTo(map)
        .bindPopup(`<b>Origin:</b> ${activeJourney.origin.name}`);

      // Destination Marker
      const destIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:#3b82f6; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3);">B</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      L.marker([activeJourney.destination.lat, activeJourney.destination.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Destination:</b> ${activeJourney.destination.name}`);

      // Vehicle Current Location Marker
      const isExcursion = currentTemp > 8.0 || currentTemp < 2.0;
      const truckIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:${isExcursion ? '#ef4444' : '#06b6d4'}; color:white; border-radius:12px; padding:4px 8px; font-weight:bold; font-size:11px; display:flex; align-items:center; gap:4px; border:2px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.4); white-space:nowrap;">🚚 Reefer T-12 (${currentTemp.toFixed(1)}°C)</div>`,
        iconSize: [120, 30],
        iconAnchor: [60, 15],
      });

      L.marker([activeJourney.currentLocation.lat, activeJourney.currentLocation.lng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif; font-size:12px; color:#1e293b;">
            <b>${activeJourney.vehicleId}</b><br/>
            Cargo: ${activeJourney.batchName}<br/>
            Current Temp: <b>${currentTemp.toFixed(1)}°C</b><br/>
            Driver: ${activeJourney.driverName}
          </div>
        `);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeJourney, currentTemp]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/70 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 shadow-lg shadow-cyan-500/20">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Active Cold-Chain Logistics
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Live GPS + SHT33 Cellular Gateway
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-0.5">
              Reefer Transport Tracking & Geofence Chain of Custody
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">Vehicle Speed:</span>
          <span className="font-bold text-white font-mono">{activeJourney.speedKmH} km/h</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ETA:</span>
          <span className="font-bold text-cyan-300 font-mono">
            {new Date(activeJourney.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Map & Telemetry Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Interactive Map */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Route Telemetry: Highway 101 Southbound</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Vehicle: {activeJourney.vehicleId}
            </span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-80 sm:h-96 rounded-xl overflow-hidden border border-slate-800 z-10"
          />

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 mt-3 pt-2 border-t border-slate-800/80 px-1">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Origin: {activeJourney.origin.name}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Destination: {activeJourney.destination.name}
            </span>
          </div>
        </div>

        {/* Transport Waypoints & Handover Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Journey Information</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Certified Courier</span>
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="font-bold text-slate-100">{activeJourney.driverName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{activeJourney.driverPhone}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Compartment Temp</span>
                  <div className={`text-base font-bold font-mono mt-0.5 ${
                    currentTemp > 8 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {currentTemp.toFixed(1)}°C
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">Compartment Humidity</span>
                  <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
                    {currentHumidity.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Scheduled Handover Dock</span>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {activeJourney.handoverLocation}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Handover Verification */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">
              Receiving Facility Handover Verification:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateJourneyStatus(activeJourney.id, 'OPTIMAL')}
                className="flex-1 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition"
              >
                Accept Optimal
              </button>
              <button
                onClick={() => onUpdateJourneyStatus(activeJourney.id, 'EXCURSION_ASSESSED')}
                className="flex-1 py-2 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-bold transition"
              >
                Flag for Audit
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
