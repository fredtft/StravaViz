
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { StravaActivity } from '../types';
import { stravaService } from '../services/stravaService';

interface MapViewProps {
  activities: StravaActivity[];
  isVisible?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ activities, isVisible = true }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<L.Map | null>(null);
  const polylineGroup = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || leafletInstance.current) return;

    // Use preferCanvas: true for high performance with thousands of polylines
    leafletInstance.current = L.map(mapRef.current, {
      center: [46.603354, 1.888334],
      zoom: 5,
      zoomControl: false,
      preferCanvas: true 
    });

    L.control.zoom({ position: 'bottomright' }).addTo(leafletInstance.current);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 20
    }).addTo(leafletInstance.current);

    polylineGroup.current = L.featureGroup().addTo(leafletInstance.current);

    return () => {
      leafletInstance.current?.remove();
      leafletInstance.current = null;
    };
  }, []);

  // Handle visibility changes for Leaflet size invalidation
  useEffect(() => {
    if (isVisible && leafletInstance.current) {
      setTimeout(() => {
        leafletInstance.current?.invalidateSize();
      }, 250); // Slight delay for the fade transition in App.tsx
    }
  }, [isVisible]);

  useEffect(() => {
    if (!leafletInstance.current || !polylineGroup.current) return;

    polylineGroup.current.clearLayers();

    const sportColors: Record<string, string> = {
      'Ride': '#FC4C02',
      'VirtualRide': '#FC4C02',
      'Run': '#3b82f6',
      'Hike': '#10b981',
      'Walk': '#f59e0b',
      'Swim': '#0ea5e9',
      'AlpineSki': '#6366f1',
    };

    const shouldBindPopup = activities.length < 500;

    activities.forEach(activity => {
      if (activity.map?.summary_polyline) {
        const points = stravaService.decodePolyline(activity.map.summary_polyline);
        if (points.length > 0) {
          const poly = L.polyline(points, {
            color: sportColors[activity.type] || '#6366f1',
            weight: activities.length > 1000 ? 1.2 : 2.5,
            opacity: 0.5,
            lineJoin: 'round'
          }).addTo(polylineGroup.current!);

          if (shouldBindPopup) {
            poly.bindPopup(`
              <div class="p-1">
                <p class="font-bold text-slate-800 m-0">${activity.name}</p>
                <p class="text-xs text-slate-500 m-0">${new Date(activity.start_date).toLocaleDateString()}</p>
              </div>
            `);
          }
        }
      }
    });

    if (activities.length > 0 && polylineGroup.current.getLayers().length > 0) {
      leafletInstance.current.fitBounds(polylineGroup.current.getBounds(), { padding: [20, 20] });
    }
  }, [activities]);

  return (
    <div className="w-full h-full relative group">
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-slate-200 pointer-events-none hidden md:block">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legend</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-[#FC4C02]"></div> <span className="text-xs font-medium text-slate-600">Cycling</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-[#3b82f6]"></div> <span className="text-xs font-medium text-slate-600">Running</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-[#10b981]"></div> <span className="text-xs font-medium text-slate-600">Hiking</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-[#f59e0b]"></div> <span className="text-xs font-medium text-slate-600">Walking</span></div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
