
import { StravaActivity, ArchiveSession } from '../types';

/**
 * ARCHIVE SERVICE
 * In a production environment with a real MariaDB/MySQL backend:
 * You would send these activities to an API endpoint like POST /api/archive
 * which would then execute: 
 * INSERT INTO activities (id, name, distance, ...) VALUES (...) ON DUPLICATE KEY UPDATE ...
 */

const ARCHIVE_KEY = 'stravaviz_archive';

export const dbService = {
  /**
   * Archives current session data.
   * Logic: Merges new activities with existing ones to create a persistent history.
   */
  async archiveSession(activities: StravaActivity[]): Promise<void> {
    const existingData = this.getArchivedActivities();
    
    // Create a map to ensure uniqueness by ID
    const activityMap = new Map<number, StravaActivity>();
    
    // Load existing
    existingData.forEach(act => activityMap.set(act.id, act));
    
    // Merge new
    activities.forEach(act => activityMap.set(act.id, act));
    
    const mergedData = Array.from(activityMap.values());
    
    // Save to "Database" (LocalStorage for this demo)
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(mergedData));
    
    // Log archival to console to simulate server-side logging
    console.log(`[Archive] Successfully synced ${activities.length} activities to database.`);
  },

  getArchivedActivities(): StravaActivity[] {
    const data = localStorage.getItem(ARCHIVE_KEY);
    return data ? JSON.parse(data) : [];
  },

  clearArchive(): void {
    localStorage.removeItem(ARCHIVE_KEY);
  },

  exportToJSON(activities: StravaActivity[]) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `stravaviz_export_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
};
