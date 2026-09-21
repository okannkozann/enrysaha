import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ServiceBox, FieldTeam, FieldReport } from '@/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Fix leafet default icon issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface OperationMapProps {
  boxes: ServiceBox[];
  teams: FieldTeam[];
  reports: FieldReport[];
}

export default function OperationMap({ boxes, teams, reports }: OperationMapProps) {
  // Center of Antalya approx
  const center: [number, number] = [36.8969, 30.7133]; 

  const getMarkerColor = (days: number) => {
    if (days <= 7) return '#ef4444'; // red-500
    if (days <= 15) return '#f97316'; // orange-500
    return '#3b82f6'; // blue-500
  };

  return (
    <div className="w-full h-full z-0">
      <MapContainer 
        center={center} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Render Service Boxes as Circle Markers */}
        {boxes.map((box) => {
          if (!box.lat || !box.lng) return null;
          return (
            <CircleMarker
              key={`box-${box.id}`}
              center={[box.lat, box.lng]}
              pathOptions={{ 
                color: getMarkerColor(box.waitingDays),
                fillColor: getMarkerColor(box.waitingDays),
                fillOpacity: 0.7,
                weight: 1
              }}
              radius={6}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{box.connectionObject}</h3>
                  <p className="text-xs text-slate-500 mb-2">{box.address}</p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-red-600">{box.waitingDays} Gün Kaldı</span>
                    <span className="text-xs bg-slate-100 px-1 rounded">{box.lastStatus}</span>
                  </div>
                  <Link href={`/service-boxes/${box.id}`} className="text-xs text-blue-600 hover:underline">
                    Detaya Git →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Render Field Reports as standard markers */}
        {reports.map((report) => {
          if (!report.lat || !report.lng) return null;
          return (
            <Marker 
              key={`rep-${report.id}`}
              position={[report.lat, report.lng]}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <h3 className="font-bold text-sm mb-1">{report.teamId.replace('team-0', 'Ekip ')}</h3>
                  <p className="text-xs font-medium text-slate-900">{report.workType}</p>
                  <p className="text-xs text-slate-500 my-1">{report.address}</p>
                  {report.productionMeters && (
                    <p className="text-xs font-bold text-indigo-600 mt-1">İmalat: {report.productionMeters}m</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2">Saat: {report.time} • Durum: {report.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
