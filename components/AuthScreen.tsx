
import React, { useState } from 'react';
import { stravaService } from '../services/stravaService';

interface AuthScreenProps {
  onToken: (token: string) => void;
  onDataImport: (data: any[]) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onToken, onDataImport }) => {
  const [tab, setTab] = useState<'oauth' | 'token' | 'file'>('oauth');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [manualToken, setManualToken] = useState('');

  const handleOAuth = () => {
    if (!clientId) return alert('Enter Client ID');
    const redirectUri = window.location.origin + window.location.pathname;
    localStorage.setItem('strava_client_id', clientId);
    localStorage.setItem('strava_client_secret', clientSecret);
    window.location.href = stravaService.getAuthUrl(clientId, redirectUri);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onDataImport(json);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 bg-[#FC4C02] rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-6">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Strava<span className="text-[#FC4C02]">Viz</span></h1>
        <p className="text-slate-500 mt-2 font-medium">Activity Analytics & Visualizer</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setTab('oauth')} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition ${tab === 'oauth' ? 'text-[#FC4C02] border-b-2 border-[#FC4C02]' : 'text-slate-400 hover:text-slate-600'}`}>
            OAuth
          </button>
          <button 
            onClick={() => setTab('token')} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition ${tab === 'token' ? 'text-[#FC4C02] border-b-2 border-[#FC4C02]' : 'text-slate-400 hover:text-slate-600'}`}>
            Token
          </button>
          <button 
            onClick={() => setTab('file')} 
            className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition ${tab === 'file' ? 'text-[#FC4C02] border-b-2 border-[#FC4C02]' : 'text-slate-400 hover:text-slate-600'}`}>
            Fichier
          </button>
        </div>

        <div className="p-8">
          {tab === 'oauth' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  <strong>Requirement:</strong> Set callback domain on Strava API to: <code className="bg-white px-1 rounded border">{window.location.hostname}</code>
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Client ID</label>
                <input 
                  type="text" 
                  value={clientId} 
                  onChange={e => setClientId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" 
                  placeholder="12345" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Client Secret</label>
                <input 
                  type="password" 
                  value={clientSecret} 
                  onChange={e => setClientSecret(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition" 
                  placeholder="••••••••••••••••" 
                />
              </div>
              <button 
                onClick={handleOAuth}
                className="w-full py-4 bg-[#FC4C02] text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 hover:bg-orange-600 transition transform active:scale-[0.98]">
                Connexion Strava
              </button>
            </div>
          )}

          {tab === 'token' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">Utilisez un jeton d'accès généré depuis votre compte développeur Strava.</p>
              <input 
                type="text" 
                value={manualToken}
                onChange={e => setManualToken(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
                placeholder="Access Token..." 
              />
              <button 
                onClick={() => manualToken && onToken(manualToken)}
                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-800/25 hover:bg-slate-900 transition transform active:scale-[0.98]">
                Accéder
              </button>
            </div>
          )}

          {tab === 'file' && (
            <div className="space-y-4">
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full py-12 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center group-hover:bg-slate-50 group-hover:border-slate-300 transition">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4 group-hover:scale-110 transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-700">Import .JSON</p>
                  <p className="text-xs text-slate-400 mt-1">Glissez votre fichier ici</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="mt-8 text-[10px] text-slate-300 font-bold uppercase tracking-widest">Built for Athletes & Explorers</p>
    </div>
  );
};

export default AuthScreen;
