
import { StravaActivity } from '../types';

export const stravaService = {
  /**
   * Decodes Google's Encoded Polyline Algorithm Format
   * Returns an array of [lat, lng] coordinates
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

  async fetchActivities(accessToken: string): Promise<StravaActivity[]> {
    let allActivities: StravaActivity[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?page=${page}&per_page=200`,
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
      
      // Safety break for demo
      if (page > 10) hasMore = false;
    }

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
