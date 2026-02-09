
import React, { memo } from 'react';
import { StravaActivity } from '../types';
import { formatAdaptiveDistance, formatAdaptiveElevation } from '../App';

interface ListViewProps {
  activities: StravaActivity[];
}

const ListView: React.FC<ListViewProps> = memo(({ activities }) => {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-slate-200">
            <tr>
              <th className="px-8 py-5">Date</th>
              <th className="px-8 py-5">Activity Name</th>
              <th className="px-8 py-5">Sport</th>
              <th className="px-8 py-5">Distance</th>
              <th className="px-8 py-5">Elevation</th>
              <th className="px-8 py-5">Moving Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-24 text-center text-slate-300 font-bold italic">
                  No records found in database.
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-8 py-5 whitespace-nowrap text-slate-400 font-mono text-xs">
                    {new Date(activity.start_date).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-5 font-bold text-slate-700 group-hover:text-[#FC4C02] transition">
                    {activity.name}
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wide">
                      {activity.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 font-black text-slate-800 tabular-nums">
                    {formatAdaptiveDistance(activity.distance)} <span className="text-[10px] text-slate-300">km</span>
                  </td>
                  <td className="px-8 py-5 text-slate-500 font-bold">
                    {formatAdaptiveElevation(activity.total_elevation_gain)} <span className="text-[10px] text-slate-300 uppercase">m</span>
                  </td>
                  <td className="px-8 py-5 text-slate-400 font-medium">
                    {formatTime(activity.moving_time)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default ListView;
