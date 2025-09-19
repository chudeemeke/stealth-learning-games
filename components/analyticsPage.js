/*
 * Analytics page. Displays aggregated statistics and session log for the
 * current user using the AnalyticsService. Includes a simple bar chart for
 * average scores per subject.
 */

import { AnalyticsService } from '../services/analytics.js';

export default function analyticsPage(engine) {
  const analytics = AnalyticsService.getInstance();
  const userId = engine.userId;
  const report = analytics.getReport(userId);
  const sessions = analytics.getSessions({ userId });
  const container = document.createElement('div');
  // Nav bar with back button
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('home');
  nav.appendChild(backBtn);
  container.appendChild(nav);
  const main = document.createElement('div');
  main.className = 'container';
  const heading = document.createElement('h2');
  heading.textContent = 'Your Learning Analytics';
  main.appendChild(heading);
  if (!report) {
    const noData = document.createElement('p');
    noData.textContent = 'No gameplay data found. Start playing to see analytics!';
    main.appendChild(noData);
    container.appendChild(main);
    return container;
  }
  // Overview summary
  const summary = document.createElement('div');
  summary.innerHTML = `<p><strong>Total sessions:</strong> ${report.totalSessions}</p>
    <p><strong>Total play time:</strong> ${report.totalPlayTime}</p>
    <p><strong>Average score:</strong> ${report.averageScore.toFixed(1)}</p>
    <p><strong>Average accuracy:</strong> ${(report.averageAccuracy * 100).toFixed(1)}%</p>
    <p><strong>Preferred subject:</strong> ${report.preferredSubject}</p>
    <p><strong>Improvement rate:</strong> ${(report.improvementRate * 100).toFixed(1)}%</p>`;
  main.appendChild(summary);
  // Filter control for subject selection
  const filterDiv = document.createElement('div');
  filterDiv.style.margin = '1rem 0';
  const filterLabel = document.createElement('label');
  filterLabel.textContent = 'Filter by subject: ';
  const subjectSelect = document.createElement('select');
  ['all', 'math', 'english', 'science'].forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = capitalize(sub);
    subjectSelect.appendChild(opt);
  });
  filterLabel.appendChild(subjectSelect);
  filterDiv.appendChild(filterLabel);
  main.appendChild(filterDiv);
  // Chart canvas
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 300;
  main.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let chart;
  function buildChart(subject) {
    // Filter sessions by subject
    const filtered = subject === 'all' ? sessions : sessions.filter(s => s.subject === subject);
    // Determine unique games and compute average scores
    const gameMap = {};
    filtered.forEach(s => {
      if (!gameMap[s.gameId]) gameMap[s.gameId] = [];
      gameMap[s.gameId].push(s.score);
    });
    const gameIds = Object.keys(gameMap);
    const averages = gameIds.map(gid => {
      const arr = gameMap[gid];
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      return avg;
    });
    // Colors palette: cycle through colours for variety
    const colours = ['#78c2ff', '#ffd966', '#a4d79c', '#ffab91', '#b39ddb', '#81c784', '#f06292'];
    const background = gameIds.map((_, i) => colours[i % colours.length]);
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: gameIds.map(id => id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())),
        datasets: [
          {
            label: 'Average Score',
            data: averages,
            backgroundColor: background,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              title: context => {
                // Show original game key as tooltip title
                return filtered.length ? context[0].label : '';
              },
              label: context => {
                return `Avg Score: ${context.parsed.y.toFixed(1)}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Average Score',
            },
          },
          x: {
            title: {
              display: true,
              text: 'Game',
            },
            ticks: {
              autoSkip: false,
              maxRotation: 45,
              minRotation: 0,
            },
          },
        },
      },
    });
  }
  // Initialize chart once canvas attached
  setTimeout(() => {
    buildChart('all');
  }, 10);
  subjectSelect.onchange = () => {
    buildChart(subjectSelect.value);
  };
  // Session log table
  const table = document.createElement('table');
  table.className = 'analytics-table';
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Date</th><th>Game</th><th>Subject</th><th>Score</th><th>Accuracy</th></tr>`;
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  sessions
    .slice()
    .reverse()
    .forEach(s => {
      const tr = document.createElement('tr');
      const date = new Date(s.startTime).toLocaleString();
      tr.innerHTML = `<td>${date}</td><td>${s.gameId}</td><td>${capitalize(s.subject)}</td><td>${s.score}</td><td>${(s.accuracy * 100).toFixed(1)}%</td>`;
      tbody.appendChild(tr);
    });
  table.appendChild(tbody);
  main.appendChild(table);
  container.appendChild(main);
  return container;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}