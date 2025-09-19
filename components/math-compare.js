/*
 * Math comparison game. Players are shown two numbers and must pick
 * which is larger. Difficulty affects the range of numbers and the
 * number of rounds. Correct answers earn points; incorrect answers
 * deduct points. Results are recorded for analytics and difficulty
 * adaptation.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathCompare(engine, params) {
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
  title.textContent = 'Which is Larger?';
  main.appendChild(title);
  // Determine difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-compare');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Rounds
  const rounds = 3 + currentDifficulty; // from 4 to 8 questions
  let currentRound = 0;
  let score = 0;
  let attempts = 0;
  let correctCount = 0;
  const startTime = new Date();
  // UI elements
  const question = document.createElement('div');
  question.style.fontSize = '1.5rem';
  question.style.margin = '1rem 0';
  main.appendChild(question);
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.gap = '1rem';
  buttonsContainer.style.marginBottom = '1rem';
  main.appendChild(buttonsContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Generate numbers based on difficulty
  function generatePair() {
    const maxVal = 10 + currentDifficulty * 10;
    const a = Math.floor(Math.random() * maxVal);
    const b = Math.floor(Math.random() * maxVal);
    return [a, b];
  }
  // Convert number to keycap emoji
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
    return num
      .toString()
      .split('')
      .map(ch => map[ch] || '')
      .join('');
  }
  let currentPair = [];
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    currentPair = generatePair();
    // Avoid equal numbers
    if (currentPair[0] === currentPair[1]) {
      currentPair[1] += 1;
    }
    question.innerHTML = `Which number is larger?`;
    // Clear old buttons
    buttonsContainer.innerHTML = '';
    const leftBtn = document.createElement('button');
    leftBtn.className = 'btn';
    leftBtn.textContent = toKeycap(currentPair[0]);
    const rightBtn = document.createElement('button');
    rightBtn.className = 'btn';
    rightBtn.textContent = toKeycap(currentPair[1]);
    leftBtn.onclick = () => handleAnswer(0);
    rightBtn.onclick = () => handleAnswer(1);
    buttonsContainer.appendChild(leftBtn);
    buttonsContainer.appendChild(rightBtn);
    info.textContent = `Question ${currentRound} of ${rounds} | Score: ${score}`;
  }
  function handleAnswer(index) {
    attempts++;
    const a = currentPair[0];
    const b = currentPair[1];
    const isCorrect = (index === 0 && a > b) || (index === 1 && b > a);
    if (isCorrect) {
      score += 10;
      correctCount++;
      engine.playSound('correct');
    } else {
      score = Math.max(0, score - 5);
      engine.playSound('wrong');
    }
    setTimeout(nextQuestion, 500);
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    // Clear question area
    question.innerHTML = '';
    buttonsContainer.innerHTML = '';
    // Summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('math-compare', { subject: 'math' });
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
      gameId: 'math-compare',
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });
    engine.playSound('success');
  }
  // Start
  nextQuestion();
  return container;
}