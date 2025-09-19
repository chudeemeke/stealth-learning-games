/*
 * English rhymes game. Given a base word represented by an emoji, players
 * select which of the options rhymes with the base word. Difficulty
 * increases word complexity and the number of rounds. Audio cues
 * provide feedback for correct and incorrect selections.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function englishRhymes(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Nav bar
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('gameSelect', { subject: 'english' });
  nav.appendChild(backBtn);
  container.appendChild(nav);
  // Main area
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Rhyming Words';
  main.appendChild(title);
  // Difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'english' })
    .filter(s => s.gameId === 'english-rhymes');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Question pools by difficulty
  const pools = [
    [
      { emoji: '🐱', base: 'cat', correct: 'bat', options: ['bat', 'dog', 'sun'] },
      { emoji: '☀️', base: 'sun', correct: 'fun', options: ['fun', 'fish', 'tree'] },
      { emoji: '🌳', base: 'tree', correct: 'bee', options: ['bee', 'dog', 'ball'] },
    ],
    [
      { emoji: '🐶', base: 'dog', correct: 'frog', options: ['frog', 'book', 'chair'] },
      { emoji: '🎩', base: 'hat', correct: 'cat', options: ['cat', 'pen', 'ship'] },
      { emoji: '🍰', base: 'cake', correct: 'snake', options: ['snake', 'chair', 'leaf'] },
    ],
    [
      { emoji: '🐟', base: 'fish', correct: 'dish', options: ['dish', 'bird', 'house'] },
      { emoji: '🚗', base: 'car', correct: 'star', options: ['star', 'tree', 'chair'] },
      { emoji: '🐸', base: 'frog', correct: 'dog', options: ['dog', 'book', 'sun'] },
    ],
    [
      { emoji: '🐴', base: 'horse', correct: 'course', options: ['course', 'planet', 'chair'] },
      { emoji: '🧀', base: 'cheese', correct: 'please', options: ['please', 'plant', 'chair'] },
      { emoji: '🐦', base: 'bird', correct: 'word', options: ['word', 'fish', 'tree'] },
    ],
    [
      { emoji: '🐢', base: 'turtle', correct: 'hurdle', options: ['hurdle', 'apple', 'fish'] },
      { emoji: '🌙', base: 'moon', correct: 'spoon', options: ['spoon', 'plant', 'chair'] },
      { emoji: '🍫', base: 'chocolate', correct: 'late', options: ['late', 'tree', 'frog'] },
    ],
  ];
  // Determine rounds and clone pool
  const questions = pools[currentDifficulty - 1].slice();
  // If we need more rounds than available questions, we can reuse random
  const rounds = Math.min(3 + currentDifficulty, questions.length);
  let currentRound = 0;
  let score = 0;
  let attempts = 0;
  let correctCount = 0;
  const startTime = new Date();
  // UI elements
  const prompt = document.createElement('div');
  prompt.style.fontSize = '3rem';
  prompt.style.marginBottom = '1rem';
  main.appendChild(prompt);
  const questionText = document.createElement('div');
  questionText.style.marginBottom = '0.5rem';
  main.appendChild(questionText);
  const choicesContainer = document.createElement('div');
  choicesContainer.style.display = 'flex';
  choicesContainer.style.gap = '1rem';
  choicesContainer.style.flexWrap = 'wrap';
  main.appendChild(choicesContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Utility to shuffle an array
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    // Pick a random question from pool
    const idx = Math.floor(Math.random() * questions.length);
    const q = questions.splice(idx, 1)[0];
    prompt.textContent = q.emoji;
    questionText.textContent = `Which word rhymes with ${q.base.toUpperCase()}?`;
    // Compose choices: correct and two distractors
    const choices = q.options.slice();
    const shuffled = shuffle(choices);
    choicesContainer.innerHTML = '';
    shuffled.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = choice.toUpperCase();
      btn.onclick = () => {
        attempts++;
        if (choice === q.correct) {
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
    // Clear UI
    choicesContainer.innerHTML = '';
    prompt.textContent = '';
    questionText.textContent = '';
    // Summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('english-rhymes', { subject: 'english' });
    const back = document.createElement('button');
    back.className = 'btn';
    back.style.marginLeft = '0.5rem';
    back.textContent = 'Back to Games';
    back.onclick = () => engine.navigate('gameSelect', { subject: 'english' });
    summary.appendChild(playAgain);
    summary.appendChild(back);
    main.appendChild(summary);
    analytics.recordSession({
      userId: engine.userId,
      subject: 'english',
      gameId: 'english-rhymes',
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