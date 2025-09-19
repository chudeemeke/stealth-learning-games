/*
 * Arithmetic Dash game. Presents simple arithmetic questions with multiple
 * choice answers. Difficulty influences the range of numbers and the
 * operations included. Scores reward correct answers and penalise
 * mistakes. Results are recorded for analytics and difficulty
 * adaptation.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function mathCalc(engine, params) {
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
  // Main area
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Arithmetic Dash';
  main.appendChild(title);
  // Determine difficulty based on recent sessions for this game
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'math' })
    .filter(s => s.gameId === 'math-calc');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Game configuration
  const rounds = 3 + currentDifficulty; // 4–8 questions
  let currentRound = 0;
  let score = 0;
  let attempts = 0;
  let correctCount = 0;
  const startTime = new Date();
  // UI elements
  const questionEl = document.createElement('div');
  questionEl.style.fontSize = '1.5rem';
  questionEl.style.margin = '1rem 0';
  main.appendChild(questionEl);
  const choicesContainer = document.createElement('div');
  choicesContainer.style.display = 'flex';
  choicesContainer.style.gap = '1rem';
  choicesContainer.style.flexWrap = 'wrap';
  main.appendChild(choicesContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Utility: convert number to keycap emoji
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
  // Generate a question object {text, correct, options}
  function generateQuestion() {
    // Determine number range and operations based on difficulty
    const maxVal = 10 + currentDifficulty * 10; // up to 60
    const operations = ['+', '-'];
    if (currentDifficulty >= 3) operations.push('×');
    if (currentDifficulty >= 5) operations.push('÷');
    // Pick two operands and an operation
    const op = operations[Math.floor(Math.random() * operations.length)];
    let a = Math.floor(Math.random() * maxVal) + 1;
    let b = Math.floor(Math.random() * maxVal) + 1;
    // Adjust operands for division to ensure integer results
    if (op === '÷') {
      // Ensure b divides a evenly
      b = Math.floor(Math.random() * (maxVal / 2)) + 1;
      const multiple = Math.floor(Math.random() * (maxVal / b)) + 1;
      a = b * multiple;
    }
    let correct;
    switch (op) {
      case '+':
        correct = a + b;
        break;
      case '-':
        correct = a - b;
        break;
      case '×':
        correct = a * b;
        break;
      case '÷':
        correct = a / b;
        break;
    }
    // Create distractor options
    const options = new Set([correct]);
    while (options.size < 4) {
      // Generate plausible wrong answers near the correct value
      const variance = Math.floor(Math.random() * (5 + currentDifficulty * 2)) + 1;
      const wrong = correct + (Math.random() < 0.5 ? -variance : variance);
      options.add(wrong);
    }
    const optionList = Array.from(options).sort(() => Math.random() - 0.5);
    return {
      text: `${toKeycap(a)} ${op} ${toKeycap(b)} = ?`,
      correct,
      options: optionList,
    };
  }
  let currentQuestion;
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    currentQuestion = generateQuestion();
    questionEl.innerHTML = currentQuestion.text;
    // Render options
    choicesContainer.innerHTML = '';
    currentQuestion.options.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = toKeycap(val);
      btn.onclick = () => {
        attempts++;
        if (val === currentQuestion.correct) {
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
    // Clear content
    questionEl.textContent = '';
    choicesContainer.innerHTML = '';
    // Summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('math-calc', { subject: 'math' });
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
      gameId: 'math-calc',
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