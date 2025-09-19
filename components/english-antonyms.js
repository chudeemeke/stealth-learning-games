/*
 * Opposites game. Given an emoji representing a word, players must
 * choose the correct antonym from multiple options. Difficulty
 * increases vocabulary complexity and number of rounds. Results feed
 * into analytics and adaptivity.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function englishAntonyms(engine, params) {
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
  title.textContent = 'Opposites';
  main.appendChild(title);
  // Difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'english' })
    .filter(s => s.gameId === 'english-antonyms');
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
  // Antonym pools by difficulty
  const pools = [
    [
      { emoji: '🔥', base: 'hot', correct: 'cold', options: ['cold', 'warm', 'wet'] },
      { emoji: '😊', base: 'happy', correct: 'sad', options: ['sad', 'angry', 'hungry'] },
      { emoji: '🐘', base: 'big', correct: 'small', options: ['small', 'long', 'heavy'] },
    ],
    [
      { emoji: '⬆️', base: 'up', correct: 'down', options: ['down', 'over', 'under'] },
      { emoji: '🌞', base: 'day', correct: 'night', options: ['night', 'evening', 'morning'] },
      { emoji: '👆', base: 'above', correct: 'below', options: ['below', 'next', 'over'] },
    ],
    [
      { emoji: '🦓', base: 'black', correct: 'white', options: ['white', 'dark', 'grey'] },
      { emoji: '😀', base: 'smile', correct: 'frown', options: ['frown', 'laugh', 'cry'] },
      { emoji: '👴', base: 'old', correct: 'young', options: ['young', 'tall', 'tiny'] },
    ],
    [
      { emoji: '🐢', base: 'slow', correct: 'fast', options: ['fast', 'steady', 'medium'] },
      { emoji: '🎂', base: 'sweet', correct: 'sour', options: ['sour', 'spicy', 'salty'] },
      { emoji: '🥱', base: 'tired', correct: 'energetic', options: ['energetic', 'sleepy', 'hungry'] },
    ],
    [
      { emoji: '🎵', base: 'loud', correct: 'quiet', options: ['quiet', 'soft', 'noisy'] },
      { emoji: '🌊', base: 'wet', correct: 'dry', options: ['dry', 'damp', 'cool'] },
      { emoji: '🎈', base: 'light', correct: 'heavy', options: ['heavy', 'bright', 'strong'] },
    ],
  ];
  const questions = pools[currentDifficulty - 1].slice();
  function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
  }
  let currentQuestion;
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    const idx = Math.floor(Math.random() * questions.length);
    currentQuestion = questions.splice(idx, 1)[0];
    prompt.textContent = currentQuestion.emoji;
    questionText.textContent = `Which word is the opposite of ${currentQuestion.base.toUpperCase()}?`;
    const opts = currentQuestion.options.slice();
    const shuffled = shuffle(opts);
    choicesContainer.innerHTML = '';
    shuffled.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = opt.toUpperCase();
      btn.onclick = () => {
        attempts++;
        if (opt === currentQuestion.correct) {
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
    prompt.textContent = '';
    questionText.textContent = '';
    choicesContainer.innerHTML = '';
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('english-antonyms', { subject: 'english' });
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
      gameId: 'english-antonyms',
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