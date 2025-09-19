/*
 * AdaptivityService defines rules for adjusting game difficulty based on
 * recent player performance. It uses a Strategy pattern: different games
 * may provide their own difficulty strategies; by default we provide
 * an average-score based strategy.
 */

export class AdaptivityService {
  /**
   * Create an AdaptivityService.
   * @param {Object} options Options for adaptivity. Pass custom
   *   strategy functions if desired.
   */
  constructor(options = {}) {
    this.rules = options.rules || defaultRules;
  }

  /**
   * Determine the new difficulty for a session.
   * @param {Object[]} recentSessions List of recent session objects for the same game.
   * @param {Number} currentDifficulty Current difficulty level.
   * @returns {Number} new difficulty level.
   */
  calculateDifficulty(recentSessions, currentDifficulty) {
    const avgScore = average(recentSessions.map(s => s.score));
    let newDifficulty = currentDifficulty;
    if (avgScore >= this.rules.promoteThreshold) {
      newDifficulty = Math.min(currentDifficulty + 1, this.rules.maxLevel);
    } else if (avgScore <= this.rules.demoteThreshold) {
      newDifficulty = Math.max(currentDifficulty - 1, this.rules.minLevel);
    }
    return newDifficulty;
  }
}

const defaultRules = {
  promoteThreshold: 90, // average score ≥ 90% to level up
  demoteThreshold: 60, // average score ≤ 60% to level down
  maxLevel: 5,
  minLevel: 1,
};

function average(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
