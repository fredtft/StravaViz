
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, AreaChart, Area, PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';
import L from 'leaflet';
import { StravaActivity } from '../types';
import { stravaService } from '../services/stravaService';
import { formatAdaptiveDistance, formatAdaptiveElevation } from '../App';

interface StatsViewProps {
  activities: StravaActivity[];
  selectedSports: string[];
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#FC4C02', '#ec4899', '#06b6d4'];

const MiniMap: React.FC<{ activity: StravaActivity }> = ({ activity }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || !activity.map?.summary_polyline) return;
    if (mapInstance.current) mapInstance.current.remove();

    mapInstance.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      preferCanvas: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(mapInstance.current);
    const points = stravaService.decodePolyline(activity.map.summary_polyline);
    const polyline = L.polyline(points, { color: '#FC4C02', weight: 4 }).addTo(mapInstance.current);
    mapInstance.current.fitBounds(polyline.getBounds(), { padding: [10, 10] });

    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, [activity]);

  return <div ref={mapContainerRef} className="w-full h-full rounded-lg border border-orange-200 overflow-hidden" />;
};

const StatsView: React.FC<StatsViewProps> = ({ activities, selectedSports }) => {
  const [activeTab, setActiveTab] = useState<string>('Run');
  
  useEffect(() => {
    if (selectedSports.length > 0 && !selectedSports.includes('ALL')) {
      setActiveTab(selectedSports[0]);
    }
  }, [selectedSports]);

  const filteredByTab = useMemo(() => 
    activities.filter(a => a.type === activeTab), 
  [activities, activeTab]);

  const reviewStats = useMemo(() => {
    const totalDist = activities.reduce((sum, a) => sum + a.distance, 0);
    const totalElev = activities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
    const monthCounts = activities.reduce((acc, a) => { 
      const m = new Date(a.start_date).getMonth();
      acc[m] = (acc[m] || 0) + 1; 
      return acc; 
    }, {} as Record<number, number>);
    
    const favMonthIndex = Object.entries(monthCounts).sort((a, b) => (b[1] as any) - (a[1] as any))[0]?.[0];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return {
      distance: formatAdaptiveDistance(totalDist),
      elevation: formatAdaptiveElevation(totalElev),
      count: activities.length,
      favMonth: favMonthIndex !== undefined ? monthNames[parseInt(favMonthIndex)] : 'N/A',
      longest: activities.length > 0 ? formatAdaptiveDistance(Math.max(...activities.map(a => a.distance))) : 0
    };
  }, [activities]);

  const frequencyGrid = useMemo(() => {
    const days: Record<string, number> = {};
    activities.forEach(a => {
      const d = a.start_date.split('T')[0];
      days[d] = (days[d] || 0) + 1;
    });
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 1);
    const grid = [];
    for (let i = 0; i < 366; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d > today) break;
      const dateStr = d.toISOString().split('T')[0];
      grid.push({ date: dateStr, count: days[dateStr] || 0 });
    }
    return grid;
  }, [activities]);

  const performanceData = useMemo(() => {
    let cumDist = 0;
    let cumElev = 0;
    const raw = [...filteredByTab].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return raw.map(a => {
      cumDist += a.distance / 1000;
      cumElev += a.total_elevation_gain;
      return {
        date: new Date(a.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        cumDist,
        cumElev,
        pace: a.average_speed > 0 ? (1000 / a.average_speed) / 60 : 0,
        speed: a.average_speed * 3.6,
        distance: a.distance / 1000
      };
    });
  }, [filteredByTab]);

  const longestActivity = useMemo(() => {
    if (filteredByTab.length === 0) return null;
    return filteredByTab.reduce((prev, curr) => (prev.distance > curr.distance) ? prev : curr);
  }, [filteredByTab]);

  const sportBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    const total = activities.length || 1;
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, percent: (value / total) * 100 }))
      .filter(item => item.percent >= 1); // Hide sports with less than 1% breakdown
  }, [activities]);

  const timeDistribution = useMemo(() => {
    const dist = { Morning: 0, Afternoon: 0, Evening: 0 };
    activities.forEach(a => {
      const hour = new Date(a.start_date_local).getHours();
      if (hour >= 5 && hour < 12) dist.Morning++;
      else if (hour >= 12 && hour < 17) dist.Afternoon++;
      else dist.Evening++;
    });
    const total = activities.length || 1;
    return Object.entries(dist).map(([name, value]) => ({ 
      name, 
      value, 
      percent: Math.round((value / total) * 100) 
    }));
  }, [activities]);

  return (
    <div className="space-y-12 pb-24">
      {/* Analytics Recap Section */}
      <section className="bg-blue-50/40 border border-blue-100 rounded-[2rem] p-8 md:p-12">
        <div className="flex items-center gap-3 mb-10 text-blue-900 font-black">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
           <h2 className="text-3xl tracking-tighter">Database Snapshot</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            {[
              `Total distance covered: ${reviewStats.distance} km.`,
              `Managed ${reviewStats.count} tracked sessions.`,
              `Longest single effort reached ${reviewStats.longest} km.`,
              `Your peak output month: ${reviewStats.favMonth}.`,
              `Total elevation gain: ${reviewStats.elevation} m.`
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-6">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">{i+1}</div>
                <p className="text-slate-700 font-bold text-xl leading-tight tracking-tight">{text}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-white flex flex-col justify-center text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Total Activities</p>
              <p className="text-6xl font-black text-blue-900 leading-none">{reviewStats.count}</p>
            </div>
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-white flex flex-col justify-center text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Total Distance</p>
              <p className="text-6xl font-black text-blue-900 leading-none">{reviewStats.distance}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap Grid */}
      <section>
        <h2 className="text-xl font-black text-slate-800 mb-6 px-4 uppercase tracking-[0.2em] text-[10px]">Session Frequency</h2>
        <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {frequencyGrid.map((day, i) => (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-sm transition-all duration-300 ${day.count > 0 ? 'bg-orange-400 hover:scale-150 hover:shadow-xl hover:z-10' : 'bg-slate-50'}`}
                title={`${day.date}: ${day.count} activities`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Performance Visuals */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Performance Evolution</h2>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
             {['Run', 'Ride', 'Hike', 'Swim'].map(s => (
               <button key={s} onClick={() => setActiveTab(s)}
                 className={`px-5 py-2.5 rounded-xl text-[11px] font-black transition ${activeTab === s ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {s}
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-400 text-[9px] uppercase tracking-widest mb-10">Cumulative Distance Progression</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#cbd5e1'}} />
                  <Tooltip />
                  <Area type="stepAfter" dataKey="cumDist" stroke="#3b82f6" strokeWidth={4} fill="url(#gBlue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-400 text-[9px] uppercase tracking-widest mb-10">Intensity / Volume Analysis</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="distance" name="Dist" unit="km" fontSize={9} axisLine={false} tickLine={false} />
                  <YAxis type="number" dataKey="speed" name="Speed" unit="kph" fontSize={9} axisLine={false} tickLine={false} />
                  <ZAxis range={[60, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Activities" data={performanceData} fill="#6366f1" opacity={0.4} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {longestActivity && (
          <div className="bg-orange-50/40 border border-orange-100 rounded-[2.5rem] p-12 flex flex-col lg:flex-row gap-16 items-center">
            <div className="flex-1 space-y-10">
              <div className="flex items-center gap-3 text-orange-800 font-black text-xl tracking-tighter">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"/></svg>
                Signature {activeTab} Performance
              </div>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Total Distance</p>
                  <p className="text-6xl font-black text-orange-950 tracking-tighter leading-none">{formatAdaptiveDistance(longestActivity.distance)} <span className="text-xl">km</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">Elevation Climb</p>
                  <p className="text-6xl font-black text-orange-950 tracking-tighter leading-none">{formatAdaptiveElevation(longestActivity.total_elevation_gain)} <span className="text-xl">m</span></p>
                </div>
              </div>
              <p className="text-slate-600 font-black italic text-2xl tracking-tight leading-snug border-l-4 border-orange-200 pl-6">"{longestActivity.name}"</p>
            </div>
            <div className="w-full lg:w-[500px] aspect-[16/10] shadow-2xl rounded-3xl overflow-hidden ring-[12px] ring-white">
              <MiniMap activity={longestActivity} />
            </div>
          </div>
        )}
      </section>

      {/* Distribution Comparison */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="font-black text-slate-800 text-lg mb-12 w-full uppercase tracking-tighter">Activity Breakdown (>1%)</h3>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sportBreakdown} cx="50%" cy="50%" innerRadius={90} outerRadius={140} paddingAngle={8} dataKey="value"
                  label={({ name, percent }) => `${name} ${Math.round(percent)}%`}>
                  {sportBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="font-black text-slate-800 text-lg mb-12 w-full uppercase tracking-tighter">Time of Day Optimization</h3>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={timeDistribution} cx="50%" cy="50%" outerRadius={140} dataKey="value" label={({ name, percent }) => `${name} ${percent}%`}>
                  <Cell fill="#fcd34d" /> <Cell fill="#f97316" /> <Cell fill="#7c2d12" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatsView;
