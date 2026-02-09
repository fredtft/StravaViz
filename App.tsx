
import React, { useState, useEffect, useMemo } from 'react';
import { ViewMode, StravaActivity } from './types';
import AuthScreen from './components/AuthScreen';
import MapView from './components/MapView';
import ListView from './components/ListView';
import StatsView from './components/StatsView';
import { stravaService } from './services/stravaService';
import { dbService } from './services/dbService';
import { RunIcon, ListIcon, MapIcon, StatsIcon, DownloadIcon } from './components/Icons';

/**
 * ADAPTIVE FORMATTING
 */
export const formatAdaptiveDistance = (m: number) => {
  const km = m / 1000;
  if (km < 1) return km.toFixed(2);
  if (km < 100) return km.toFixed(1);
  return Math.round(km).toLocaleString();
};

export const formatAdaptiveElevation = (m: number) => {
  return Math.round(m).toLocaleString();
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("Initializing...");
  const [view, setView] = useState<ViewMode>(ViewMode.MAP);
  
  // Filters
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedSports, setSelectedSports] = useState<string[]>(['ALL']);

  useEffect(() => {
    const archived = dbService.getArchivedActivities();
    if (archived.length > 0) {
      setActivities(archived);
      setIsAuthenticated(true);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) handleOAuthCallback(code);
  }, []);

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    setLoadingStatus("Exchanging authentication code...");
    try {
      const clientId = localStorage.getItem('strava_client_id') || '';
      const clientSecret = localStorage.getItem('strava_client_secret') || '';
      const data = await stravaService.exchangeToken(clientId, clientSecret, code);
      if (data.access_token) {
        await fetchActivities(data.access_token);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (err: any) {
      alert('Authentication failed');
      setLoading(false);
    }
  };

  const fetchActivities = async (token: string) => {
    setLoading(true);
    try {
      const data = await stravaService.fetchActivities(token, (progress, status) => {
        setLoadingProgress(progress);
        setLoadingStatus(status);
      });
      setActivities(data);
      setIsAuthenticated(true);
      dbService.archiveSession(data);
    } catch (err: any) {
      alert('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (data: StravaActivity[]) => {
    setActivities(data);
    setIsAuthenticated(true);
    dbService.archiveSession(data);
  };

  const toggleSport = (sport: string) => {
    if (sport === 'ALL') {
      setSelectedSports(['ALL']);
      return;
    }
    setSelectedSports(prev => {
      const filtered = prev.filter(s => s !== 'ALL');
      if (filtered.includes(sport)) {
        const next = filtered.filter(s => s !== sport);
        return next.length === 0 ? ['ALL'] : next;
      } else {
        return [...filtered, sport];
      }
    });
  };

  const years = useMemo(() => {
    const yearsArray: string[] = activities.map(a => new Date(a.start_date).getFullYear().toString());
    const y: string[] = Array.from(new Set(yearsArray));
    return ['ALL', ...y.sort((a, b) => parseInt(b) - parseInt(a))];
  }, [activities]);

  const sportsList = useMemo(() => {
    return Array.from(new Set(activities.map(a => a.type))).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const yearMatch = selectedYear === 'ALL' || new Date(a.start_date).getFullYear().toString() === selectedYear;
      const sportMatch = selectedSports.includes('ALL') || selectedSports.includes(a.type);
      return yearMatch && sportMatch;
    });
  }, [activities, selectedYear, selectedSports]);

  const statsKpi = useMemo(() => {
    const distance = filteredActivities.reduce((acc, a) => acc + a.distance, 0);
    const elevation = filteredActivities.reduce((acc, a) => acc + a.total_elevation_gain, 0);
    const time = filteredActivities.reduce((acc, a) => acc + a.moving_time, 0);
    return {
      count: filteredActivities.length,
      distance: formatAdaptiveDistance(distance),
      elevation: formatAdaptiveElevation(elevation),
      time: Math.floor(time / 3600)
    };
  }, [filteredActivities]);

  if (!isAuthenticated) {
    if (loading) return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-12">
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="absolute w-full h-full -rotate-90">
            <circle cx="112" cy="112" r="100" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
            <circle
              cx="112" cy="112" r="100" fill="transparent" stroke="#FC4C02" strokeWidth="12"
              strokeDasharray={2 * Math.PI * 100}
              strokeDashoffset={2 * Math.PI * 100 * (1 - loadingProgress / 100)}
              strokeLinecap="round"
              className="transition-all duration-700 ease-in-out"
            />
          </svg>
          <div className="flex flex-col items-center justify-center z-10">
            <div className="bg-[#FC4C02] p-5 rounded-[2.5rem] shadow-2xl shadow-orange-500/40 mb-3 transform hover:scale-105 transition">
              <RunIcon className="w-16 h-16 text-white" />
            </div>
            <span className="text-3xl font-black text-slate-800 tabular-nums tracking-tighter">{loadingProgress}%</span>
          </div>
        </div>
        <div className="mt-16 text-center max-w-sm w-full">
          <p className="text-[11px] font-black text-[#FC4C02] uppercase tracking-[0.3em] mb-4">Database Synchronization</p>
          <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-3xl shadow-sm">
            <p className="text-sm font-bold text-slate-600 animate-pulse">{loadingStatus}</p>
          </div>
          <div className="mt-10 w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-orange-400 to-[#FC4C02] transition-all duration-700 ease-in-out" style={{ width: `${loadingProgress}%` }} />
          </div>
          <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Optimized for large datasets (4000+)</p>
        </div>
      </div>
    );
    return <AuthScreen onToken={fetchActivities} onDataImport={handleImport} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden font-inter text-slate-900">
      <header className="bg-white border-b border-slate-200 px-8 h-20 flex items-center justify-between z-30 shrink-0 shadow-sm">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-[#FC4C02] p-1.5 rounded-xl shadow-lg shadow-orange-500/20 group-hover:rotate-12 transition">
              <RunIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter mr-6">Strava<span className="text-[#FC4C02]">Viz</span></h1>
          </div>

          <nav className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button onClick={() => setView(ViewMode.MAP)} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black transition ${view === ViewMode.MAP ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <MapIcon className="w-4 h-4" /> Map
            </button>
            <button onClick={() => setView(ViewMode.LIST)} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black transition ${view === ViewMode.LIST ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <ListIcon className="w-4 h-4" /> List
            </button>
            <button onClick={() => setView(ViewMode.STATS)} className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black transition ${view === ViewMode.STATS ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <StatsIcon className="w-4 h-4" /> Stats
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Year</span>
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)} className={`px-3 py-1 text-[11px] font-black rounded-lg transition ${selectedYear === y ? 'bg-[#FC4C02] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-200'}`}>
                {y}
              </button>
            ))}
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="p-3 text-slate-300 hover:text-[#FC4C02] transition" title="Logout">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-white border-r border-slate-200 p-5 flex flex-col gap-6 shrink-0 z-20">
          <div>
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Filter by Sport</h3>
            <div className="space-y-1 overflow-y-auto no-scrollbar max-h-[70vh]">
              <button 
                onClick={() => toggleSport('ALL')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-black text-[11px] border ${selectedSports.includes('ALL') ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${selectedSports.includes('ALL') ? 'bg-orange-500 animate-pulse' : 'bg-slate-200'}`}></div>
                ALL SPORTS
              </button>
              
              {sportsList.map(sport => {
                const isActive = selectedSports.includes(sport);
                return (
                  <button 
                    key={sport} 
                    onClick={() => toggleSport(sport)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition font-bold text-[11px] border group ${isActive ? 'bg-[#FC4C02] text-white border-[#FC4C02] shadow-md shadow-orange-500/10' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-slate-200 group-hover:bg-orange-400'}`}></div>
                      {sport}
                    </span>
                    {isActive && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <button onClick={() => dbService.exportToJSON(activities)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-slate-500 font-black text-[9px] uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-100 transition">
              <DownloadIcon className="w-3.5 h-3.5" /> Export JSON
            </button>
            <p className="mt-3 text-[8px] text-slate-300 font-black text-center uppercase tracking-widest leading-tight">Optimized for Large DBs<br/> 4000+ Ready</p>
          </div>
        </aside>

        <main className="flex-1 flex flex-col p-6 overflow-hidden gap-6">
          <div className="grid grid-cols-4 gap-6 shrink-0">
            {[
              { label: 'Activities', val: statsKpi.count, unit: 'units' },
              { label: 'Distance', val: statsKpi.distance, unit: 'km' },
              { label: 'Duration', val: statsKpi.time, unit: 'hrs' },
              { label: 'Elevation', val: statsKpi.elevation, unit: 'm' },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-1.5 transition hover:shadow-md cursor-default">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-800 tabular-nums tracking-tighter">{kpi.val}</span>
                  <span className="text-[10px] font-black text-slate-300 uppercase">{kpi.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* PERSISTENT MOUNTING CONTAINER: Improves fluidity significantly for thousands of activities */}
          <div className="flex-1 min-h-0 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden relative">
            <div className={`absolute inset-0 transition-opacity duration-200 ${view === ViewMode.MAP ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <MapView activities={filteredActivities} isVisible={view === ViewMode.MAP} />
            </div>
            <div className={`absolute inset-0 transition-opacity duration-200 ${view === ViewMode.LIST ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="h-full overflow-y-auto p-8 no-scrollbar">
                <ListView activities={filteredActivities} />
              </div>
            </div>
            <div className={`absolute inset-0 transition-opacity duration-200 ${view === ViewMode.STATS ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
              <div className="h-full overflow-y-auto p-8 bg-slate-50/30 no-scrollbar">
                <StatsView activities={filteredActivities} selectedSports={selectedSports} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
