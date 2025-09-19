/*
 * Math sorting game. Players arrange a set of numbers in ascending
 * order by dragging them into slots. Difficulty controls the number
 * of numbers to sort and the range of values. The game runs through
 * multiple rounds and records session analytics. Audio feedback is
 * played for correct and incorrect submissions and at the end of
 * the session.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathSort(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Navigation bar
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('gameSelect', { subject: 'math' });
  nav.appendChild(backBtn);
  container.appendChild(nav);
  // Main area
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Number Sort';
  main.appendChild(title);
  // Determine difficulty based on past sessions
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-sort');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Configuration: number of rounds and items per round
  const rounds = 2 + currentDifficulty; // from 3 to 7 rounds
  // Score tracking
  let roundIndex = 0;
  let attempts = 0;
  let correctCount = 0;
  let score = 0;
  const startTime = new Date();
  // Info display
  const info = document.createElement('div');
  info.style.marginBottom = '0.5rem';
  main.appendChild(info);
  // Containers for slots and items
  const slotsContainer = document.createElement('div');
  slotsContainer.style.display = 'flex';
  slotsContainer.style.gap = '0.5rem';
  slotsContainer.style.marginBottom = '1rem';
  const itemsContainer = document.createElement('div');
  itemsContainer.style.display = 'flex';
  itemsContainer.style.gap = '0.5rem';
  itemsContainer.style.marginBottom = '1rem';
  main.appendChild(slotsContainer);
  main.appendChild(itemsContainer);
  // Helper to generate numbers for a round
  function generateNumbers(count) {
    const numbers = new Set();
    const maxVal = 5 + currentDifficulty * 5;
    while (numbers.size < count) {
      const num = Math.floor(Math.random() * maxVal) + 1;
      numbers.add(num);
    }
    return Array.from(numbers);
  }
  // Convert number to keycap emoji string
  function toKeycap(num) {
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
    const str = Math.abs(num)
      .toString()
      .split('')
      .map(ch => map[ch] || '')
      .join('');
    return num < 0 ? '➖' + str : str;
  }
  // Start new round
  function newRound() {
    // Clear previous elements
    slotsContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    if (roundIndex >= rounds) {
      endGame();
      return;
    }
    // Determine number of items: increases with difficulty
    const count = 3 + currentDifficulty; // 4 to 8 items
    const nums = generateNumbers(count);
    const correctOrder = nums.slice().sort((a, b) => a - b);
    // Create slots
    correctOrder.forEach((value, idx) => {
      const slot = document.createElement('div');
      slot.style.width = '60px';
      slot.style.height = '60px';
      slot.style.border = '2px dashed #78c2ff';
      slot.style.borderRadius = '0.5rem';
      slot.dataset.expected = value.toString();
      slot.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      slot.addEventListener('drop', e => {
        e.preventDefault();
        const num = e.dataTransfer.getData('text/plain');
        if (!slot.textContent) {
          slot.textContent = toKeycap(parseInt(num));
          slot.dataset.value = num;
          // Remove from items
          const candidate = Array.from(itemsContainer.children).find(
            el => el.dataset.num === num
          );
          if (candidate) itemsContainer.removeChild(candidate);
        }
        checkCompletion();
      });
      slotsContainer.appendChild(slot);
    });
    // Create draggable number tiles
    nums
      .slice()
      .sort(() => Math.random() - 0.5)
      .forEach(num => {
        const el = document.createElement('div');
        el.textContent = toKeycap(num);
        el.dataset.num = num.toString();
        el.style.width = '60px';
        el.style.height = '60px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.backgroundColor = '#ffd966';
        el.style.borderRadius = '0.5rem';
        el.style.cursor = 'grab';
        el.draggable = true;
        el.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', el.dataset.num);
          e.dataTransfer.effectAllowed = 'move';
        });
        itemsContainer.appendChild(el);
      });
    info.textContent = `Round ${roundIndex + 1} of ${rounds} | Score: ${score}`;
  }
  // Check if all slots filled and evaluate order
  function checkCompletion() {
    const filled = Array.from(slotsContainer.children).every(el => el.textContent);
    if (!filled) return;
    attempts++;
    // Compare each slot value with expected
    const isCorrect = Array.from(slotsContainer.children).every(
      el => el.dataset.value === el.dataset.expected
    );
    if (isCorrect) {
      score += 10;
      correctCount++;
      engine.playSound('correct');
    } else {
      score = Math.max(0, score - 5);
      engine.playSound('wrong');
    }
    roundIndex++;
    setTimeout(newRound, 600);
  }
  // End of game summary
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    // Clear UI
    slotsContainer.innerHTML = '';
    itemsContainer.innerHTML = '';
    // Summary UI
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('math-sort', { subject: 'math' });
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
      gameId: 'math-sort',
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });
    // Play success sound
    engine.playSound('success');
  }
  main.appendChild(info);
  container.appendChild(main);
  // Start first round
  newRound();
  return container;
}