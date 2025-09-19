/*
 * Find the Synonym game. Given an emoji representing a word and the
 * base word, players must pick a correct synonym from multiple
 * choices. Difficulty increases vocabulary complexity and the number
 * of rounds. Session results feed into analytics and adaptivity.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function englishSynonyms(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Nav
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('gameSelect', { subject: 'english' });
  nav.appendChild(backBtn);
  container.appendChild(nav);
  // Main content
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Find the Synonym';
  main.appendChild(title);
  // Difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'english' })
    .filter(s => s.gameId === 'english-synonyms');
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
  // Synonym pools by difficulty
  const pools = [
    [
      { emoji: '🐘', base: 'big', correct: 'large', options: ['large', 'small', 'long'] },
      { emoji: '😊', base: 'happy', correct: 'joyful', options: ['joyful', 'sad', 'hungry'] },
      { emoji: '🚀', base: 'fast', correct: 'quick', options: ['quick', 'slow', 'tall'] },
    ],
    [
      { emoji: '🧊', base: 'cold', correct: 'chilly', options: ['chilly', 'hot', 'wet'] },
      { emoji: '🧠', base: 'smart', correct: 'clever', options: ['clever', 'kind', 'tall'] },
      { emoji: '😡', base: 'angry', correct: 'mad', options: ['mad', 'happy', 'sad'] },
    ],
    [
      { emoji: '🐢', base: 'slow', correct: 'sluggish', options: ['sluggish', 'rapid', 'smart'] },
      { emoji: '🥳', base: 'fun', correct: 'enjoyable', options: ['enjoyable', 'boring', 'lazy'] },
      { emoji: '🏡', base: 'home', correct: 'house', options: ['house', 'street', 'yard'] },
    ],
    [
      { emoji: '🦚', base: 'beautiful', correct: 'pretty', options: ['pretty', 'ugly', 'round'] },
      { emoji: '🧹', base: 'clean', correct: 'tidy', options: ['tidy', 'dirty', 'boring'] },
      { emoji: '🦁', base: 'brave', correct: 'courageous', options: ['courageous', 'scared', 'lazy'] },
    ],
    [
      { emoji: '🧗', base: 'climb', correct: 'ascend', options: ['ascend', 'descend', 'fall'] },
      { emoji: '🧑‍🍳', base: 'cook', correct: 'prepare', options: ['prepare', 'eat', 'destroy'] },
      { emoji: '🌈', base: 'colorful', correct: 'vibrant', options: ['vibrant', 'dull', 'dark'] },
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
    // pick random question from pool
    const idx = Math.floor(Math.random() * questions.length);
    currentQuestion = questions.splice(idx, 1)[0];
    prompt.textContent = currentQuestion.emoji;
    questionText.textContent = `Which word means the same as ${currentQuestion.base.toUpperCase()}?`;
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
    playAgain.onclick = () => engine.navigate('english-synonyms', { subject: 'english' });
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
      gameId: 'english-synonyms',
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