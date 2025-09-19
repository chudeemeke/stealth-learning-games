/*
 * Math falling game (Number Catch). The player controls a basket to catch
 * falling answers to simple arithmetic questions. Difficulty increases
 * with level: larger numbers and more frequent drops. The game records
 * session analytics through AnalyticsService and adjusts difficulty using
 * AdaptivityService.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathFallingGame(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  // DOM elements
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
  // Title
  const title = document.createElement('h2');
  title.textContent = 'Number Catch';
  main.appendChild(title);
  // Score display
  const scoreDisplay = document.createElement('div');
  scoreDisplay.textContent = 'Score: 0 | Question: '; 
  scoreDisplay.style.marginBottom = '0.5rem';
  main.appendChild(scoreDisplay);
  // Canvas
  const gameArea = document.createElement('div');
  gameArea.className = 'game-canvas';
  main.appendChild(gameArea);
  container.appendChild(main);
  // Game variables
  let currentDifficulty = 1;
  const recentSessions = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-falling');
  if (recentSessions.length) {
    currentDifficulty = adaptivity.calculateDifficulty(
      recentSessions.slice(-3),
      recentSessions[recentSessions.length - 1].difficulty || 1
    );
  }
  let score = 0;
  let attempts = 0;
  let correct = 0;
  const startTime = new Date();
  // Player basket
  const basket = document.createElement('div');
  basket.style.position = 'absolute';
  basket.style.bottom = '5px';
  basket.style.left = '50%';
  basket.style.width = '80px';
  basket.style.height = '40px';
  basket.style.backgroundColor = '#a4d79c';
  basket.style.borderRadius = '40px 40px 0 0';
  gameArea.appendChild(basket);
  let basketX = gameArea.offsetWidth / 2 - 40;
  function updateBasket() {
    basket.style.left = `${basketX}px`;
  }
  updateBasket();
  // Handle keyboard input
  function handleKey(e) {
    if (e.key === 'ArrowLeft') {
      basketX = Math.max(0, basketX - 20);
    } else if (e.key === 'ArrowRight') {
      basketX = Math.min(gameArea.offsetWidth - 80, basketX + 20);
    }
    updateBasket();
  }
  window.addEventListener('keydown', handleKey);
  // Handle touch drag
  gameArea.addEventListener('touchmove', e => {
    const rect = gameArea.getBoundingClientRect();
    basketX = Math.min(
      Math.max(0, e.touches[0].clientX - rect.left - 40),
      gameArea.offsetWidth - 80
    );
    updateBasket();
  });
  // Generate arithmetic question based on difficulty
  function generateQuestion(difficulty) {
    const max = 5 + difficulty * 5;
    const a = Math.floor(Math.random() * max);
    const b = Math.floor(Math.random() * max);
    const op = Math.random() < 0.5 ? '+' : '-';
    const correctAns = op === '+' ? a + b : a - b;
    return { text: `${a} ${op} ${b}`, answer: correctAns };
  }
  // Create falling answer element
  // Convert a numeric value into a string of keycap emojis. Negative numbers
  // are prefixed with a minus sign emoji (➖).
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
    const str = Math.abs(num).toString().split('').map(ch => map[ch] || '').join('');
    return num < 0 ? '➖' + str : str;
  }

  function createAnswer(value, isCorrect) {
    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = `${Math.random() * (gameArea.offsetWidth - 50)}px`;
    el.style.top = '0px';
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.lineHeight = '50px';
    el.style.textAlign = 'center';
    el.style.backgroundColor = isCorrect ? '#ffd966' : '#ffb366';
    el.style.borderRadius = '50%';
    el.style.fontWeight = '600';
    el.textContent = toKeycap(value);
    el.dataset.correct = isCorrect;
    gameArea.appendChild(el);
    return el;
  }
  // Game loop
  let question = generateQuestion(currentDifficulty);
  scoreDisplay.textContent = `Score: ${score} | Question: ${question.text}`;
  let intervalId = null;
  const activeAnswers = [];
  function dropLoop() {
    // Remove elements out of bounds
    for (let i = activeAnswers.length - 1; i >= 0; i--) {
      const ans = activeAnswers[i];
      const y = parseFloat(ans.style.top);
      if (y > gameArea.offsetHeight) {
        gameArea.removeChild(ans);
        activeAnswers.splice(i, 1);
      }
    }
    // Move elements
    activeAnswers.forEach(ans => {
      const y = parseFloat(ans.style.top);
      ans.style.top = `${y + (2 + currentDifficulty)}px`;
      // Collision detection
      const basketRect = basket.getBoundingClientRect();
      const ansRect = ans.getBoundingClientRect();
      if (
        ansRect.bottom >= basketRect.top &&
        ansRect.left < basketRect.right &&
        ansRect.right > basketRect.left
      ) {
        attempts++;
        if (ans.dataset.correct === 'true') {
          score += 10;
          correct++;
          // Play positive feedback sound
          engine.playSound('correct');
        } else {
          score = Math.max(0, score - 5);
          // Play negative feedback sound
          engine.playSound('wrong');
        }
        gameArea.removeChild(ans);
        const idx = activeAnswers.indexOf(ans);
        if (idx >= 0) activeAnswers.splice(idx, 1);
        // When correct answer caught, next question
        if (ans.dataset.correct === 'true') {
          question = generateQuestion(currentDifficulty);
          scoreDisplay.textContent = `Score: ${score} | Question: ${question.text}`;
          spawnAnswers();
        }
      }
    });
  }
  // Spawn answers: one correct, two distractors
  function spawnAnswers() {
    // Remove existing answers
    activeAnswers.forEach(ans => gameArea.removeChild(ans));
    activeAnswers.length = 0;
    const distractors = [];
    while (distractors.length < 2) {
      const val = question.answer + Math.floor(Math.random() * 5) - 2;
      if (val !== question.answer && !distractors.includes(val)) distractors.push(val);
    }
    const values = [question.answer, ...distractors];
    values.sort(() => Math.random() - 0.5);
    values.forEach(val => {
      const isCorrect = val === question.answer;
      const ans = createAnswer(val, isCorrect);
      activeAnswers.push(ans);
    });
  }
  spawnAnswers();
  intervalId = setInterval(dropLoop, 20);
  // Timer: end after specified duration or number of questions
  let timeLeft = 60; // seconds
  const timerInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft <= 0) endGame();
  }, 1000);
  // End of game
  function endGame() {
    clearInterval(intervalId);
    clearInterval(timerInterval);
    window.removeEventListener('keydown', handleKey);
    // Remove active answers
    activeAnswers.forEach(ans => gameArea.removeChild(ans));
    activeAnswers.length = 0;
    // Compute accuracy
    const accuracy = attempts ? correct / attempts : 0;
    // Display summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(1)}%</p>`;
    const againBtn = document.createElement('button');
    againBtn.className = 'btn btn-primary';
    againBtn.textContent = 'Play Again';
    againBtn.onclick = () => engine.navigate('math-falling', { subject: 'math' });
    const backBtn2 = document.createElement('button');
    backBtn2.className = 'btn';
    backBtn2.style.marginLeft = '0.5rem';
    backBtn2.textContent = 'Back to Games';
    backBtn2.onclick = () => engine.navigate('gameSelect', { subject: 'math' });
    summary.appendChild(againBtn);
    summary.appendChild(backBtn2);
    main.appendChild(summary);
    // Record session in analytics
    const session = {
      userId: engine.userId,
      subject: 'math',
      gameId: 'math-falling',
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    };
    analytics.recordSession(session);

    // Celebrate with a success sound on completion of the game
    engine.playSound('success');
  }
  return container;
}