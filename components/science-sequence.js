/*
 * Science sequence game. Players arrange a set of emojis representing a
 * scientific sequence (e.g., life cycle) into correct order. Difficulty
 * scales number of items. Uses drag-and-drop for ordering.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function scienceSequence(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Nav
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('gameSelect', { subject: 'science' });
  nav.appendChild(backBtn);
  container.appendChild(nav);
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Sequence Builder';
  main.appendChild(title);
  // Determine difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'science' })
    .filter(s => s.gameId === 'science-sequence');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Sequences by level
  const sequences = [
    ['🌱', '🌿', '🌳'], // plant growth
    ['☁️', '🌧️', '💧'], // water cycle simplified: cloud, rain, water drop
    ['🐛', '🦋'], // caterpillar to butterfly
    ['🥚', '🐣', '🐔'], // chicken life cycle simplified
    ['🌑', '🌓', '🌕', '🌗'], // moon phases simplified
    ['🥚', '🐛', '🦋'], // longer caterpillar to butterfly with egg
  ];
  // Choose sequence depending on difficulty and random
  const available = sequences.filter(seq => seq.length <= currentDifficulty + 2);
  const seq = available[Math.floor(Math.random() * available.length)];
  const correctOrder = seq.slice();
  // Shuffle to create puzzle
  const puzzle = seq.slice().sort(() => Math.random() - 0.5);
  let attempts = 0;
  let correctCount = 0;
  let score = 0;
  const startTime = new Date();
  // Create droppable slots and draggable items
  const slotsContainer = document.createElement('div');
  slotsContainer.style.display = 'flex';
  slotsContainer.style.gap = '0.5rem';
  slotsContainer.style.marginBottom = '1rem';
  const itemsContainer = document.createElement('div');
  itemsContainer.style.display = 'flex';
  itemsContainer.style.gap = '0.5rem';
  itemsContainer.style.marginBottom = '1rem';
  puzzle.forEach(item => {
    const slot = document.createElement('div');
    slot.style.width = '60px';
    slot.style.height = '60px';
    slot.style.border = '2px dashed #78c2ff';
    slot.style.borderRadius = '0.5rem';
    slot.dataset.expected = correctOrder[slotsContainer.children.length];
    slot.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    slot.addEventListener('drop', e => {
      e.preventDefault();
      const emoji = e.dataTransfer.getData('text/plain');
      const fromContainer = e.dataTransfer.getData('text/container');
      if (!slot.textContent) {
        slot.textContent = emoji;
        // Remove item from original container
        if (fromContainer === 'items') {
          const child = Array.from(itemsContainer.children).find(
            el => el.textContent === emoji
          );
          if (child) itemsContainer.removeChild(child);
        } else if (fromContainer === 'slots') {
          // moving from another slot
          const otherSlot = Array.from(slotsContainer.children).find(
            el => el.dataset.index === fromContainer
          );
          if (otherSlot) otherSlot.textContent = '';
        }
        slot.dataset.filled = 'true';
        checkCompletion();
      }
    });
    slot.dataset.index = slotsContainer.children.length.toString();
    slotsContainer.appendChild(slot);
  });
  puzzle.forEach(item => {
    const el = document.createElement('div');
    el.textContent = item;
    el.style.width = '60px';
    el.style.height = '60px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = '2rem';
    el.style.backgroundColor = '#ffd966';
    el.style.borderRadius = '0.5rem';
    el.style.cursor = 'grab';
    el.draggable = true;
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item);
      e.dataTransfer.setData('text/container', 'items');
      e.dataTransfer.effectAllowed = 'move';
    });
    itemsContainer.appendChild(el);
  });
  const info = document.createElement('div');
  info.textContent = `Arrange the sequence in the correct order`;
  info.style.marginBottom = '0.5rem';
  main.appendChild(info);
  main.appendChild(slotsContainer);
  main.appendChild(itemsContainer);
  container.appendChild(main);
  function checkCompletion() {
    // Check if all slots filled
    const filled = Array.from(slotsContainer.children).every(el => el.textContent);
    if (!filled) return;
    attempts++;
    // Evaluate order
    const userOrder = Array.from(slotsContainer.children).map(el => el.textContent);
    const isCorrect = userOrder.every((v, i) => v === correctOrder[i]);
    if (isCorrect) {
      score += 10;
      correctCount++;
      // Play success feedback for correct arrangement
      engine.playSound('correct');
    } else {
      score = Math.max(0, score - 5);
      // Play negative feedback for wrong arrangement
      engine.playSound('wrong');
    }
    info.textContent = `Score: ${score}`;
    setTimeout(endGame, 500);
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    const endTime = new Date();
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(1)}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('science-sequence', { subject: 'science' });
    const back = document.createElement('button');
    back.className = 'btn';
    back.style.marginLeft = '0.5rem';
    back.textContent = 'Back to Games';
    back.onclick = () => engine.navigate('gameSelect', { subject: 'science' });
    summary.appendChild(playAgain);
    summary.appendChild(back);
    main.appendChild(summary);
    analytics.recordSession({
      userId: engine.userId,
      subject: 'science',
      gameId: 'science-sequence',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });

    // Play celebratory sound when sequence game concludes
    engine.playSound('success');
  }
  return container;
}