/*
 * English scramble game (Word Builder). Players drag scrambled letters
 * into blanks to form a correct word. Difficulty increases by word length.
 * Collects analytics similar to math game.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function englishScramble(engine, params) {
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
  // Main
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Word Builder';
  main.appendChild(title);
  // Determine difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'english' })
    .filter(s => s.gameId === 'english-scramble');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Word lists by level (simple nouns)
  const wordsByLevel = [
    ['cat', 'dog', 'sun'],
    ['fish', 'bird', 'cake'],
    ['plant', 'chair', 'house'],
    ['garden', 'yellow', 'window'],
    ['elephant', 'dinosaur', 'keyboard'],
  ];
  const words = wordsByLevel[currentDifficulty - 1];
  let currentWord = '';
  let attempts = 0;
  let correctCount = 0;
  let score = 0;
  const startTime = new Date();
  // UI elements
  const prompt = document.createElement('div');
  prompt.style.marginBottom = '1rem';
  main.appendChild(prompt);
  const blanksContainer = document.createElement('div');
  blanksContainer.style.display = 'flex';
  blanksContainer.style.gap = '0.5rem';
  blanksContainer.style.marginBottom = '1rem';
  main.appendChild(blanksContainer);
  const lettersContainer = document.createElement('div');
  lettersContainer.style.display = 'flex';
  lettersContainer.style.gap = '0.5rem';
  lettersContainer.style.flexWrap = 'wrap';
  lettersContainer.style.marginBottom = '1rem';
  main.appendChild(lettersContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Start first puzzle
  newPuzzle();
  function newPuzzle() {
    if (words.length === 0) return endGame();
    currentWord = words[Math.floor(Math.random() * words.length)];
    // Remove used word from list
    const idx = words.indexOf(currentWord);
    words.splice(idx, 1);
    prompt.textContent = `Rearrange to form the word:`;
    // Clear containers
    blanksContainer.innerHTML = '';
    lettersContainer.innerHTML = '';
    // Helper to convert a lowercase letter into a regional indicator emoji.
    function toLetterEmoji(ch) {
      const base = 0x1f1e6;
      const code = ch.toLowerCase().charCodeAt(0) - 97;
      if (code >= 0 && code < 26) {
        return String.fromCodePoint(base + code);
      }
      return ch;
    }
    // Create blanks
    for (let i = 0; i < currentWord.length; i++) {
      const blank = document.createElement('div');
      blank.style.width = '40px';
      blank.style.height = '40px';
      blank.style.border = '2px dashed #78c2ff';
      blank.style.borderRadius = '0.25rem';
      blank.dataset.index = i;
      blanksContainer.appendChild(blank);
    }
    // Create scrambled letters
    const letters = currentWord.split('');
    letters.sort(() => Math.random() - 0.5);
    letters.forEach(letter => {
      const el = document.createElement('div');
      // Display letter as an emoji but store its actual character via dataset
      el.textContent = toLetterEmoji(letter);
      el.dataset.letter = letter;
      el.draggable = true;
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.lineHeight = '40px';
      el.style.textAlign = 'center';
      el.style.backgroundColor = '#ffd966';
      el.style.borderRadius = '0.25rem';
      el.style.cursor = 'grab';
      lettersContainer.appendChild(el);
      // Drag events
      el.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', el.dataset.letter);
        e.dataTransfer.effectAllowed = 'move';
      });
    });
    blanksContainer.querySelectorAll('div').forEach(blank => {
      blank.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      blank.addEventListener('drop', e => {
        e.preventDefault();
        const letter = e.dataTransfer.getData('text/plain');
        if (!blank.textContent) {
          // Insert the emoji representation into the blank and store the raw letter
          blank.textContent = toLetterEmoji(letter);
          blank.dataset.char = letter;
          blank.style.borderStyle = 'solid';
          // Remove letter from palette
          const palette = Array.from(lettersContainer.children);
          const candidate = palette.find(item => item.dataset.letter === letter);
          if (candidate) lettersContainer.removeChild(candidate);
        }
        // Check if word complete
        const filled = Array.from(blanksContainer.children).every(el => el.textContent);
        if (filled) {
          attempts++;
          const formed = Array.from(blanksContainer.children)
            .map(el => el.dataset.char || '')
            .join('');
          if (formed === currentWord) {
            score += 10;
            correctCount++;
            // Correct word formed – play positive feedback
            engine.playSound('correct');
          } else {
            score = Math.max(0, score - 5);
            // Wrong arrangement – play negative feedback
            engine.playSound('wrong');
          }
          info.textContent = `Score: ${score}`;
          setTimeout(newPuzzle, 500);
        }
      });
    });
    info.textContent = `Score: ${score}`;
  }
  // End game and record session
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    const endTime = new Date();
    // Display summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(1)}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('english-scramble', { subject: 'english' });
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
      gameId: 'english-scramble',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });

    // Play celebratory sound on completion
    engine.playSound('success');
  }
  return container;
}