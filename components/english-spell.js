/*
 * English spelling game. Displays an emoji representing a word and the word
 * with a missing letter. The player chooses the correct letter from
 * multiple options. Difficulty scales number of questions and word lengths.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function englishSpell(engine, params) {
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
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Spelling Challenge';
  main.appendChild(title);
  // Determine difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'english' })
    .filter(s => s.gameId === 'english-spell');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Words list with emoji and missing letter; difficulty selects longer words
  const wordPool = [
    { emoji: '🐱', word: 'cat' },
    { emoji: '🐶', word: 'dog' },
    { emoji: '☀️', word: 'sun' },
    { emoji: '🐟', word: 'fish' },
    { emoji: '🌳', word: 'tree' },
    { emoji: '📖', word: 'book' },
    { emoji: '🍎', word: 'apple' },
    { emoji: '🌹', word: 'rose' },
    { emoji: '🍇', word: 'grape' },
    { emoji: '🐘', word: 'elephant' },
    { emoji: '🌷', word: 'flower' },
    { emoji: '🍪', word: 'cookie' },
  ];
  // Choose question count based on difficulty
  const rounds = 3 + currentDifficulty; // 4 to 8 questions
  let score = 0;
  let attempts = 0;
  let correctCount = 0;
  const startTime = new Date();
  // UI elements
  const prompt = document.createElement('div');
  prompt.style.fontSize = '2rem';
  prompt.style.marginBottom = '1rem';
  main.appendChild(prompt);
  const wordDisplay = document.createElement('div');
  wordDisplay.style.fontSize = '1.5rem';
  wordDisplay.style.marginBottom = '1rem';
  main.appendChild(wordDisplay);
  const choicesContainer = document.createElement('div');
  choicesContainer.style.display = 'flex';
  choicesContainer.style.gap = '1rem';
  choicesContainer.style.flexWrap = 'wrap';
  choicesContainer.style.marginBottom = '1rem';
  main.appendChild(choicesContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  let currentRound = 0;
  nextQuestion();
  function nextQuestion() {
    if (currentRound >= rounds) return endGame();
    currentRound++;
    // Pick a word appropriate for difficulty length
    const candidates = wordPool.filter(w => w.word.length <= currentDifficulty + 2);
    const idx = Math.floor(Math.random() * candidates.length);
    const selected = candidates[idx];
    const word = selected.word;
    // Determine missing letter index randomly
    const missingIndex = Math.floor(Math.random() * word.length);
    const correctLetter = word[missingIndex];
    const displayWord = word
      .split('')
      .map((ch, i) => (i === missingIndex ? '_' : ch))
      .join('');
    prompt.textContent = selected.emoji;
    wordDisplay.textContent = displayWord;
    // Generate choices: include correct letter and two distractors
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const choices = new Set([correctLetter]);
    while (choices.size < 3) {
      const letter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!choices.has(letter)) choices.add(letter);
    }
    const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);
    // Clear previous choices
    choicesContainer.innerHTML = '';
    shuffled.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = choice.toUpperCase();
      btn.onclick = () => {
        attempts++;
        if (choice === correctLetter) {
          score += 10;
          correctCount++;
          engine.playSound('correct');
        } else {
          score = Math.max(0, score - 5);
          engine.playSound('wrong');
        }
        info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
        setTimeout(nextQuestion, 300);
      };
      choicesContainer.appendChild(btn);
    });
    info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    const endTime = new Date();
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(1)}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('english-spell', { subject: 'english' });
    const backBtn2 = document.createElement('button');
    backBtn2.className = 'btn';
    backBtn2.style.marginLeft = '0.5rem';
    backBtn2.textContent = 'Back to Games';
    backBtn2.onclick = () => engine.navigate('gameSelect', { subject: 'english' });
    summary.appendChild(playAgain);
    summary.appendChild(backBtn2);
    main.appendChild(summary);
    // Record session
    analytics.recordSession({
      userId: engine.userId,
      subject: 'english',
      gameId: 'english-spell',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });

    // Play success sound once the quiz is complete
    engine.playSound('success');
  }
  return container;
}