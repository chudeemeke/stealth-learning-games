/*
 * Operator Picker game. Players are shown a simple equation with a missing
 * operator and must choose the correct one to make the equation true.
 * Difficulty influences the range of numbers and available operators.
 * Correct choices earn points while mistakes reduce the score. Session
 * analytics and adaptivity are handled similarly to other games.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathSign(engine, params) {
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
  // Main content
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Operator Picker';
  main.appendChild(title);
  // Determine difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-sign');
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
  // UI elements
  const equationEl = document.createElement('div');
  equationEl.style.fontSize = '1.5rem';
  equationEl.style.margin = '1rem 0';
  main.appendChild(equationEl);
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.gap = '1rem';
  buttonsContainer.style.flexWrap = 'wrap';
  main.appendChild(buttonsContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Operator emojis mapping
  const opEmoji = {
    '+': '➕',
    '-': '➖',
    '×': '✖️',
    '÷': '➗',
  };
  // Generate question
  function generateEquation() {
    const maxVal = 10 + currentDifficulty * 10;
    // Determine allowed operators
    const ops = ['+', '-'];
    if (currentDifficulty >= 3) ops.push('×');
    if (currentDifficulty >= 5) ops.push('÷');
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * maxVal) + 1;
    let b = Math.floor(Math.random() * maxVal) + 1;
    let result;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '×':
        result = a * b;
        break;
      case '÷':
        // ensure division yields integer
        b = Math.floor(Math.random() * (maxVal / 2)) + 1;
        const multiple = Math.floor(Math.random() * (maxVal / b)) + 1;
        a = b * multiple;
        result = a / b;
        break;
    }
    return { a, b, result, op };
  }
  let currentQuestion;
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    currentQuestion = generateEquation();
    const { a, b, result } = currentQuestion;
    equationEl.innerHTML = `${a} _ ${b} = ${result}`;
    // Render operator buttons
    buttonsContainer.innerHTML = '';
    const candidateOps = ['+', '-'];
    if (currentDifficulty >= 3) candidateOps.push('×');
    if (currentDifficulty >= 5) candidateOps.push('÷');
    candidateOps.forEach(op => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = opEmoji[op];
      btn.onclick = () => {
        attempts++;
        if (op === currentQuestion.op) {
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
      buttonsContainer.appendChild(btn);
    });
    info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    equationEl.innerHTML = '';
    buttonsContainer.innerHTML = '';
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('math-sign', { subject: 'math' });
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
      gameId: 'math-sign',
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