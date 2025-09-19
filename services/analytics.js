/*
 * AnalyticsService implements a Singleton responsible for collecting and
 * storing session data. Data is persisted to localStorage under the
 * key 'stealth-analytics'. It provides methods to record a new session
 * and generate aggregated reports used by the analytics page.
 */

export class AnalyticsService {
  /**
   * Private constructor. Use getInstance() to obtain the singleton.
   */
  constructor() {
    const existing = localStorage.getItem('stealth-analytics');
    this._data = existing ? JSON.parse(existing) : { sessions: [] };
  }

  /**
   * Retrieve the singleton instance of AnalyticsService.
   * @returns {AnalyticsService}
   */
  static getInstance() {
    if (!AnalyticsService._instance) {
      AnalyticsService._instance = new AnalyticsService();
    }
    return AnalyticsService._instance;
  }

  /**
   * Persist current data to localStorage.
   */
  _save() {
    localStorage.setItem('stealth-analytics', JSON.stringify(this._data));
  }

  /**
   * Record a game session.
   * @param {Object} session - Session object containing userId, subject,
   *   gameId, startTime, endTime, score, accuracy, difficulty, hintsUsed.
   */
  recordSession(session) {
    this._data.sessions.push(session);
    this._save();
  }

  /**
   * Fetch all sessions optionally filtered by userId or subject.
   */
  getSessions({ userId = null, subject = null } = {}) {
    return this._data.sessions.filter(s => {
      if (userId && s.userId !== userId) return false;
      if (subject && s.subject !== subject) return false;
      return true;
    });
  }

  /**
   * Compute an aggregated report for a user.
   * @param {String} userId
   */
  getReport(userId) {
    const sessions = this.getSessions({ userId });
    if (!sessions.length) return null;
    const totalSessions = sessions.length;
    const totalPlayTimeMs = sessions.reduce((sum, s) => {
      const start = new Date(s.startTime);
      const end = new Date(s.endTime);
      return sum + (end - start);
    }, 0);
    const totalPlayTime = msToHms(totalPlayTimeMs);
    const averageScore = avg(sessions.map(s => s.score));
    const averageAccuracy = avg(sessions.map(s => s.accuracy));
    // Determine preferred subject based on number of sessions
    const subjectCounts = sessions.reduce((map, s) => {
      map[s.subject] = (map[s.subject] || 0) + 1;
      return map;
    }, {});
    const preferredSubject = Object.entries(subjectCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];
    // Determine preferred games
    const gameCounts = sessions.reduce((map, s) => {
      map[s.gameId] = (map[s.gameId] || 0) + 1;
      return map;
    }, {});
    const preferredGames = Object.entries(gameCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    // Compute improvement rate: compare last session score to first session
    let improvementRate = 0;
    if (sessions.length > 1) {
      const firstScore = sessions[0].score;
      const lastScore = sessions[sessions.length - 1].score;
      improvementRate = (lastScore - firstScore) / Math.max(firstScore, 1);
    }
    return {
      totalSessions,
      totalPlayTime,
      averageScore,
      averageAccuracy,
      preferredSubject,
      preferredGames,
      improvementRate,
    };
  }
}

// Utility functions
function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function msToHms(ms) {
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}h ${m}m ${s}s`;
}
