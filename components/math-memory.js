/*
 * Math memory game. Players flip cards to find pairs of numbers that
 * sum to a target value. Difficulty determines number of pairs and
 * target sums. On completion, analytics are recorded.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathMemory(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Nav
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('gameSelect', { subject: 'math' });
  nav.appendChild(backBtn);
  container.appendChild(nav);
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Math Memory';
  main.appendChild(title);
  // Determine difficulty from recent sessions
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-memory');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Config based on difficulty
  const pairCount = 3 + currentDifficulty; // from 4 to 8 pairs
  const targetSum = 10 + (currentDifficulty - 1) * 5; // 10,15,20,25,30
  // Display target
  const info = document.createElement('p');
  info.textContent = `Find pairs that add up to ${targetSum}`;
  info.style.marginBottom = '0.5rem';
  main.appendChild(info);
  // Board container
  const board = document.createElement('div');
  board.className = 'memory-board';
  // Determine grid columns based on pairs
  const cols = Math.ceil(Math.sqrt(pairCount * 2));
  board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  main.appendChild(board);
  container.appendChild(main);
  // Generate pairs
  const cards = [];
  const used = new Set();
  while (cards.length < pairCount) {
    const a = Math.floor(Math.random() * (targetSum - 1)) + 1;
    const b = targetSum - a;
    if (a <= 0 || b <= 0) continue;
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (used.has(key)) continue;
    used.add(key);
    cards.push(a, b);
  }
  // Shuffle cards
  cards.sort(() => Math.random() - 0.5);
  // Game state
  let first = null;
  let second = null;
  let attempts = 0;
  let matches = 0;
  let score = 0;
  const startTime = new Date();
  // Create tiles
  cards.forEach(value => {
    const tile = document.createElement('div');
    tile.className = 'memory-tile';
    tile.dataset.value = value;
    tile.textContent = '❔';
    tile.onclick = () => flip(tile);
    board.appendChild(tile);
  });
  function flip(tile) {
    if (tile.classList.contains('flipped') || tile.classList.contains('removed')) return;
    // Flip tile
    tile.classList.add('flipped');
    // Convert number to keycap emojis for reveal
    const map = {
      '0': '0️⃣',
      '1': '1️⃣',
      '2': '2️⃣',
      '3': '3️⃣',
      '4': '4️⃣',
      '5': '5️⃣',
      '6': '6️⃣',
      '7': '7️⃣',
      '8': '8️⃣',
      '9': '9️⃣',
    };
    const valStr = tile.dataset.value.toString().split('').map(ch => map[ch] || '').join('');
    tile.textContent = valStr;
    if (!first) {
      first = tile;
    } else if (!second) {
      second = tile;
      attempts++;
      // Check for match
      const sum = parseInt(first.dataset.value) + parseInt(second.dataset.value);
      if (sum === targetSum) {
        // Correct match
        score += 10;
        matches++;
        // Play success tone for a correct pair
        engine.playSound('correct');
        setTimeout(() => {
          first.classList.add('removed');
          second.classList.add('removed');
          first = null;
          second = null;
          if (matches === pairCount) endGame();
        }, 500);
      } else {
        // Incorrect
        score = Math.max(0, score - 2);
        // Play negative feedback
        engine.playSound('wrong');
        setTimeout(() => {
          first.classList.remove('flipped');
          second.classList.remove('flipped');
          first.textContent = '❔';
          second.textContent = '❔';
          first = null;
          second = null;
        }, 800);
      }
      info.textContent = `Find pairs that add up to ${targetSum} | Score: ${score}`;
    }
  }
  function endGame() {
    // Compute accuracy
    const accuracy = attempts ? matches / attempts : 0;
    const endTime = new Date();
    // Summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Matches: ${matches} / ${pairCount}</p><p>Accuracy: ${(accuracy * 100).toFixed(1)}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('math-memory', { subject: 'math' });
    const back = document.createElement('button');
    back.className = 'btn';
    back.style.marginLeft = '0.5rem';
    back.textContent = 'Back to Games';
    back.onclick = () => engine.navigate('gameSelect', { subject: 'math' });
    summary.appendChild(playAgain);
    summary.appendChild(back);
    main.appendChild(summary);
    // Record session
    analytics.recordSession({
      userId: engine.userId,
      subject: 'math',
      gameId: 'math-memory',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });

    // Play celebratory sound when finishing the game
    engine.playSound('success');
  }
  return container;
}