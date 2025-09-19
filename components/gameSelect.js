/*
 * Game selection page. Lists available games for a chosen subject.
 */

export default function gameSelect(engine, params) {
  const subject = params.subject;
  const container = document.createElement('div');
  // Nav bar with back button
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('home');
  const navItems = document.createElement('div');
  navItems.className = 'nav-items';
  const analyticsBtn = document.createElement('button');
  analyticsBtn.textContent = 'Analytics';
  analyticsBtn.onclick = () => engine.navigate('analytics');
  navItems.appendChild(analyticsBtn);
  nav.appendChild(backBtn);
  nav.appendChild(navItems);
  container.appendChild(nav);
  // Main content
  const main = document.createElement('div');
  main.className = 'container';
  const heading = document.createElement('h2');
  heading.textContent = `Choose a ${capitalize(subject)} Game`;
  main.appendChild(heading);
  const grid = document.createElement('div');
  grid.className = 'grid';
  // Games definitions
  // Define games with emojis instead of external SVGs. The chosen emojis are
  // intentionally uncommon to give the interface a quirky, playful feel.
  const gamesBySubject = {
    math: [
      {
        id: 'math-falling',
        title: 'Number Catch',
        description: 'Catch the right answer while dodging obstacles.',
        emoji: '🪂',
      },
      {
        id: 'math-memory',
        title: 'Math Memory',
        description: 'Flip cards to find pairs that sum to a target.',
        emoji: '🧠',
      },
      {
        id: 'math-sort',
        title: 'Number Sort',
        description: 'Arrange numbers in ascending order.',
        emoji: '🔢',
      },
      {
        id: 'math-compare',
        title: 'Which is Larger?',
        description: 'Pick the larger number.',
        emoji: '⚖️',
      },
      {
        id: 'math-calc',
        title: 'Arithmetic Dash',
        description: 'Solve arithmetic quickly.',
        emoji: '🦔',
      },
      {
        id: 'math-pattern',
        title: 'Pattern Puzzle',
        description: 'Find the next number in a sequence.',
        emoji: '🕸️',
      },
      {
        id: 'math-sign',
        title: 'Operator Picker',
        description: 'Choose the correct operator.',
        emoji: '🧲',
      },
    ],
    english: [
      {
        id: 'english-scramble',
        title: 'Word Builder',
        description: 'Arrange letters to form words.',
        emoji: '🧩',
      },
      {
        id: 'english-spell',
        title: 'Spelling Challenge',
        description: 'Choose the correct missing letter.',
        emoji: '🪶',
      },
      {
        id: 'english-rhymes',
        title: 'Rhyming Words',
        description: 'Pick the word that rhymes.',
        emoji: '🥁',
      },
      {
        id: 'english-synonyms',
        title: 'Find the Synonym',
        description: 'Choose the synonym for a word.',
        emoji: '🦚',
      },
      {
        id: 'english-antonyms',
        title: 'Opposites',
        description: 'Pick the word with opposite meaning.',
        emoji: '🦓',
      },
    ],
    science: [
      {
        id: 'science-classify',
        title: 'Animal or Plant?',
        description: 'Sort objects into categories.',
        emoji: '🦖',
      },
      {
        id: 'science-sequence',
        title: 'Sequence Builder',
        description: 'Arrange items in the correct order.',
        emoji: '🔄',
      },
      {
        id: 'science-quiz',
        title: 'Science Quiz',
        description: 'Answer true/false questions.',
        emoji: '🧪',
      },
      {
        id: 'science-weather',
        title: 'Weather Match',
        description: 'Identify the weather.',
        emoji: '🌪️',
      },
      {
        id: 'science-body',
        title: 'Body Facts',
        description: 'True or false about our bodies.',
        emoji: '🦴',
      },
    ],
  };
  const games = gamesBySubject[subject] || [];
  games.forEach(game => {
    const card = document.createElement('div');
    card.className = 'card';
    const icon = document.createElement('div');
    icon.className = 'emoji-icon';
    icon.textContent = game.emoji;
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = game.title;
    const desc = document.createElement('div');
    desc.textContent = game.description;
    desc.style.fontSize = '0.8rem';
    card.appendChild(icon);
    card.appendChild(title);
    card.appendChild(desc);
    card.onclick = () => {
      engine.navigate(game.id, { subject });
    };
    grid.appendChild(card);
  });
  main.appendChild(grid);
  container.appendChild(main);
  return container;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}