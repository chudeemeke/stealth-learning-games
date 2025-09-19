/*
 * Pattern Puzzle game. Presents numerical sequences with a missing next
 * value. Players must identify the next number in the sequence from
 * multiple choice options. Difficulty controls the complexity of
 * sequences and number of rounds. Results contribute to analytics and
 * adaptivity.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathPattern(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Nav bar
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
  title.textContent = 'Pattern Puzzle';
  main.appendChild(title);
  // Difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-pattern');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  const rounds = 3 + currentDifficulty;
  let currentRound = 0;
  let score = 0;
  let attempts = 0;
  let correctCount = 0;
  const startTime = new Date();
  const sequenceEl = document.createElement('div');
  sequenceEl.style.fontSize = '1.5rem';
  sequenceEl.style.margin = '1rem 0';
  main.appendChild(sequenceEl);
  const choicesContainer = document.createElement('div');
  choicesContainer.style.display = 'flex';
  choicesContainer.style.gap = '1rem';
  choicesContainer.style.flexWrap = 'wrap';
  main.appendChild(choicesContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // keycap conversion
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
  // Sequence pools by difficulty. Each entry: {seq: [nums], next: num, distractors: [n1,n2,n3]}
  const pools = [
    [
      { seq: [2, 4, 6, 8], next: 10, distractors: [12, 14, 16] },
      { seq: [1, 3, 5, 7], next: 9, distractors: [10, 11, 8] },
      { seq: [5, 10, 15, 20], next: 25, distractors: [30, 35, 40] },
    ],
    [
      { seq: [3, 6, 9, 12], next: 15, distractors: [18, 20, 14] },
      { seq: [4, 8, 12, 16], next: 20, distractors: [24, 22, 18] },
      { seq: [1, 4, 7, 10], next: 13, distractors: [15, 12, 11] },
    ],
    [
      { seq: [2, 4, 8, 16], next: 32, distractors: [20, 24, 28] },
      { seq: [1, 1, 2, 3], next: 5, distractors: [4, 6, 8] }, // Fibonacci-like
      { seq: [9, 7, 5, 3], next: 1, distractors: [0, -1, 2] },
    ],
    [
      { seq: [10, 20, 30, 40], next: 50, distractors: [60, 55, 45] },
      { seq: [2, 5, 10, 17], next: 26, distractors: [24, 30, 20] }, // quadratic growth
      { seq: [6, 12, 24, 48], next: 96, distractors: [72, 84, 90] },
    ],
    [
      { seq: [5, 10, 20, 40], next: 80, distractors: [70, 100, 120] },
      { seq: [3, 9, 27, 81], next: 243, distractors: [162, 200, 300] },
      { seq: [2, 3, 5, 8], next: 13, distractors: [10, 15, 18] },
    ],
  ];
  const available = pools[currentDifficulty - 1].slice();
  function generatePattern() {
    // If pool depleted, reset from original
    if (!available.length) available.push(...pools[currentDifficulty - 1]);
    const idx = Math.floor(Math.random() * available.length);
    return available.splice(idx, 1)[0];
  }
  let currentQuestion;
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    currentQuestion = generatePattern();
    // Display sequence with comma separated keycaps
    sequenceEl.innerHTML = `${currentQuestion.seq
      .map(n => toKeycap(n))
      .join(', ')} , ?`;
    // Compose options: correct next and distractors
    const opts = new Set([currentQuestion.next]);
    currentQuestion.distractors.forEach(d => opts.add(d));
    // shuffle
    const optionList = Array.from(opts).sort(() => Math.random() - 0.5);
    choicesContainer.innerHTML = '';
    optionList.forEach(num => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = toKeycap(num);
      btn.onclick = () => {
        attempts++;
        if (num === currentQuestion.next) {
          score += 10;
          correctCount++;
          engine.playSound('correct');
        } else {
          score = Math.max(0, score - 5);
          engine.playSound('wrong');
        }
        info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
        setTimeout(nextQuestion, 500);
      };
      choicesContainer.appendChild(btn);
    });
    info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    sequenceEl.innerHTML = '';
    choicesContainer.innerHTML = '';
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('math-pattern', { subject: 'math' });
    const back = document.createElement('button');
    back.className = 'btn';
    back.style.marginLeft = '0.5rem';
    back.textContent = 'Back to Games';
    back.onclick = () => engine.navigate('gameSelect', { subject: 'math' });
    summary.appendChild(playAgain);
    summary.appendChild(back);
    main.appendChild(summary);
    analytics.recordSession({
      userId: engine.userId,
      subject: 'math',
      gameId: 'math-pattern',
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });
    engine.playSound('success');
  }
  nextQuestion();
  return container;
}