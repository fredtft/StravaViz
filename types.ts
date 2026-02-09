
export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  map?: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  average_speed: number;
  max_speed: number;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  athlete: any | null;
}

export enum ViewMode {
  MAP = 'MAP',
  LIST = 'LIST',
  STATS = 'STATS'
}

export interface ArchiveSession {
  timestamp: string;
  activitiesCount: number;
  data: StravaActivity[];
}
