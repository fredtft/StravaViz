
import { StravaActivity } from '../types';

export const stravaService = {
  /**
   * Decodes Google's Encoded Polyline Algorithm Format
   */
  decodePolyline(encoded: string): [number, number][] {
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;
    const coordinates: [number, number][] = [];

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
  },

  async fetchAthleteStats(accessToken: string, athleteId: number): Promise<number> {
    const response = await fetch(`https://www.strava.com/api/v3/athletes/${athleteId}/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return 0;
    const stats = await response.json();
    return (stats.all_run_totals?.count || 0) + 
           (stats.all_ride_totals?.count || 0) + 
           (stats.all_swim_totals?.count || 0);
  },

  async fetchActivities(
    accessToken: string, 
    onProgress?: (progress: number, status: string) => void
  ): Promise<StravaActivity[]> {
    let allActivities: StravaActivity[] = [];
    let page = 1;
    let hasMore = true;
    const perPage = 200;

    // Try to get total count for accurate percentage
    let totalEstimate = 0;
    try {
      const athleteResponse = await fetch('https://www.strava.com/api/v3/athlete', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (athleteResponse.ok) {
        const athlete = await athleteResponse.json();
        totalEstimate = await this.fetchAthleteStats(accessToken, athlete.id);
      }
    } catch (e) {
      console.warn("Could not fetch stats for progress estimation.");
    }

    while (hasMore) {
      const currentCount = allActivities.length;
      const status = `Fetched ${currentCount.toLocaleString()} activities...`;
      
      if (onProgress) {
        const progress = totalEstimate > 0 
          ? Math.min(98, Math.round((currentCount / totalEstimate) * 100))
          : Math.min(95, page * 5);
        onProgress(progress, status);
      }

      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.statusText}`);
      }

      const data: StravaActivity[] = await response.json();
      if (data.length === 0) {
        hasMore = false;
      } else {
        allActivities = [...allActivities, ...data];
        page++;
      }
      
      // Safety limit increased to 10,000 activities (50 pages of 200)
      if (page > 50) hasMore = false;
    }

    if (onProgress) onProgress(100, `Synchronized ${allActivities.length.toLocaleString()} total activities.`);
    return allActivities;
  },

  getAuthUrl(clientId: string, redirectUri: string): string {
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=activity:read_all&approval_prompt=force`;
  },

  async exchangeToken(clientId: string, clientSecret: string, code: string): Promise<any> {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    });
    return response.json();
  }
};
