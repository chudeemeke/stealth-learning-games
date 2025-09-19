/*
 * Home page component. Presents subject choices and quick-play button.
 */

export default function home(engine) {
  const container = document.createElement('div');
  // Navigation bar
  const nav = document.createElement('div');
  nav.className = 'nav';
  const logo = document.createElement('div');
  logo.className = 'logo';
  logo.textContent = '🕵️️ Stealth Learning';
  const navItems = document.createElement('div');
  navItems.className = 'nav-items';
  const analyticsBtn = document.createElement('button');
  analyticsBtn.textContent = 'Analytics';
  analyticsBtn.onclick = () => {
    // simple access control: ask parent password (optional). For prototype,
    // simply navigate.
    engine.navigate('analytics');
  };
  navItems.appendChild(analyticsBtn);
  nav.appendChild(logo);
  nav.appendChild(navItems);
  container.appendChild(nav);
  // Main content
  const main = document.createElement('div');
  main.className = 'container';
  const heading = document.createElement('h2');
  heading.textContent = 'Choose a Subject';
  main.appendChild(heading);
  const grid = document.createElement('div');
  grid.className = 'grid';
  // subject list
  // Define subject cards with obscure emoji icons instead of external images
  const subjects = [
    { id: 'math', title: 'Math', emoji: '🧮' },
    { id: 'english', title: 'English', emoji: '🪶' },
    { id: 'science', title: 'Science', emoji: '🧬' },
  ];
  subjects.forEach(sub => {
    const card = document.createElement('div');
    card.className = 'card';
    const icon = document.createElement('div');
    icon.className = 'emoji-icon';
    icon.textContent = sub.emoji;
    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = sub.title;
    card.appendChild(icon);
    card.appendChild(title);
    card.onclick = () => {
      engine.navigate('gameSelect', { subject: sub.id });
    };
    grid.appendChild(card);
  });
  main.appendChild(grid);
  // Quick play button
  const quickBtn = document.createElement('button');
  quickBtn.className = 'btn btn-primary';
  quickBtn.textContent = 'Quick Play';
  quickBtn.style.marginTop = '1rem';
  quickBtn.onclick = () => {
    // Quick Play chooses a random game across all subjects
    const gameKeys = window.GAME_KEYS || [];
    let last = localStorage.getItem('stealth-last-game');
    let candidates = gameKeys;
    if (last && gameKeys.length > 1) {
      candidates = gameKeys.filter(k => k !== last);
    }
    const randomKey = candidates[Math.floor(Math.random() * candidates.length)];
    localStorage.setItem('stealth-last-game', randomKey);
    engine.navigate(randomKey, {});
  };
  main.appendChild(quickBtn);
  container.appendChild(main);
  return container;
}