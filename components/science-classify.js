/*
 * Science classification game (Animal or Plant). Players sort items into
 * categories by dragging them into labeled bins. Difficulty increases with
 * number of items. Records analytics.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function scienceClassify(engine, params) {
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
  // Main
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Animal or Plant?';
  main.appendChild(title);
  // Determine difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'science' })
    .filter(s => s.gameId === 'science-classify');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Items pool (icon unicode names or simple emojis to avoid external images)
  const poolByLevel = [
    [
      { name: '🐶', category: 'animal' },
      { name: '🌳', category: 'plant' },
      { name: '🐱', category: 'animal' },
      { name: '🌻', category: 'plant' },
    ],
    [
      { name: '🐰', category: 'animal' },
      { name: '🌷', category: 'plant' },
      { name: '🐴', category: 'animal' },
      { name: '🌵', category: 'plant' },
      { name: '🐢', category: 'animal' },
    ],
    [
      { name: '🐮', category: 'animal' },
      { name: '🌲', category: 'plant' },
      { name: '🐔', category: 'animal' },
      { name: '🌹', category: 'plant' },
      { name: '🐟', category: 'animal' },
      { name: '🍀', category: 'plant' },
    ],
    [
      { name: '🦁', category: 'animal' },
      { name: '🌼', category: 'plant' },
      { name: '🐒', category: 'animal' },
      { name: '🍁', category: 'plant' },
      { name: '🐸', category: 'animal' },
      { name: '🌺', category: 'plant' },
      { name: '🦊', category: 'animal' },
    ],
    [
      { name: '🐘', category: 'animal' },
      { name: '🍄', category: 'plant' },
      { name: '🐳', category: 'animal' },
      { name: '🌴', category: 'plant' },
      { name: '🐍', category: 'animal' },
      { name: '🍇', category: 'plant' },
      { name: '🦓', category: 'animal' },
      { name: '🌽', category: 'plant' },
    ],
  ];
  let pool = poolByLevel[currentDifficulty - 1].slice();
  let attempts = 0;
  let correctCount = 0;
  let score = 0;
  const startTime = new Date();
  // Setup categories
  const categoriesContainer = document.createElement('div');
  categoriesContainer.style.display = 'flex';
  categoriesContainer.style.gap = '1rem';
  categoriesContainer.style.marginBottom = '1rem';
  const animalBin = createBin('Animals');
  const plantBin = createBin('Plants');
  categoriesContainer.appendChild(animalBin);
  categoriesContainer.appendChild(plantBin);
  main.appendChild(categoriesContainer);
  // Items container
  const itemsContainer = document.createElement('div');
  itemsContainer.style.display = 'flex';
  itemsContainer.style.flexWrap = 'wrap';
  itemsContainer.style.gap = '0.5rem';
  itemsContainer.style.marginBottom = '1rem';
  main.appendChild(itemsContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Populate items
  pool.forEach(item => {
    const el = document.createElement('div');
    el.textContent = item.name;
    el.draggable = true;
    el.style.fontSize = '2rem';
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.backgroundColor = '#ffd966';
    el.style.borderRadius = '0.25rem';
    el.dataset.category = item.category;
    itemsContainer.appendChild(el);
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.category);
      e.dataTransfer.setData('text/html', el.textContent);
      e.dataTransfer.effectAllowed = 'move';
    });
  });
  // Bin creation function
  function createBin(label) {
    const bin = document.createElement('div');
    bin.style.flex = '1';
    bin.style.height = '150px';
    bin.style.border = '2px solid #78c2ff';
    bin.style.borderRadius = '0.5rem';
    bin.style.display = 'flex';
    bin.style.flexDirection = 'column';
    bin.style.alignItems = 'center';
    bin.style.justifyContent = 'center';
    bin.innerHTML = `<strong>${label}</strong>`;
    bin.dataset.category = label.toLowerCase().replace('s', '').trim();
    bin.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    bin.addEventListener('drop', e => {
      e.preventDefault();
      const expected = bin.dataset.category;
      const actual = e.dataTransfer.getData('text/plain');
      const emoji = e.dataTransfer.getData('text/html');
      attempts++;
      if (expected === actual) {
        correctCount++;
        score += 10;
        // Play positive feedback sound
        engine.playSound('correct');
        // Remove emoji from items container
        const children = Array.from(itemsContainer.children);
        const target = children.find(c => c.textContent === emoji && c.dataset.category === actual);
        if (target) itemsContainer.removeChild(target);
        // Add to bin
        const placed = document.createElement('div');
        placed.textContent = emoji;
        placed.style.fontSize = '2rem';
        bin.appendChild(placed);
      } else {
        score = Math.max(0, score - 5);
        // Play negative feedback sound
        engine.playSound('wrong');
      }
      info.textContent = `Score: ${score}`;
      // Check completion
      if (!itemsContainer.children.length) {
        endGame();
      }
    });
    return bin;
  }
  info.textContent = `Score: ${score}`;
  // End game
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    const endTime = new Date();
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(1)}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('science-classify', { subject: 'science' });
    const back = document.createElement('button');
    back.className = 'btn';
    back.style.marginLeft = '0.5rem';
    back.textContent = 'Back to Games';
    back.onclick = () => engine.navigate('gameSelect', { subject: 'science' });
    summary.appendChild(playAgain);
    summary.appendChild(back);
    main.appendChild(summary);
    // Record session
    analytics.recordSession({
      userId: engine.userId,
      subject: 'science',
      gameId: 'science-classify',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });

    // Play success tone on finishing all classifications
    engine.playSound('success');
  }
  return container;
}