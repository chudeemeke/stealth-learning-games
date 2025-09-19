/*
 * Weather Match game. Shows a weather emoji and asks the player to
 * identify the correct description (e.g., rainy, sunny). Difficulty
 * increases the variety of weather conditions and the number of
 * rounds. Results are recorded for analytics and adaptivity.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function scienceWeather(engine, params) {
  const analytics = AnalyticsService.getInstance();
  const adaptivity = new AdaptivityService();
  const container = document.createElement('div');
  // Nav bar
  const nav = document.createElement('div');
  nav.className = 'nav';
  const backBtn = document.createElement('button');
  backBtn.textContent = '← Back';
  backBtn.onclick = () => engine.navigate('gameSelect', { subject: 'science' });
  nav.appendChild(backBtn);
  container.appendChild(nav);
  // Main area
  const main = document.createElement('div');
  main.className = 'container';
  const title = document.createElement('h2');
  title.textContent = 'Weather Match';
  main.appendChild(title);
  // Difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'science' })
    .filter(s => s.gameId === 'science-weather');
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
  questionText.textContent = 'What kind of weather is this?';
  main.appendChild(questionText);
  const choicesContainer = document.createElement('div');
  choicesContainer.style.display = 'flex';
  choicesContainer.style.gap = '1rem';
  choicesContainer.style.flexWrap = 'wrap';
  main.appendChild(choicesContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Weather pools by difficulty
  const pools = [
    [
      { emoji: '☀️', correct: 'Sunny', options: ['Sunny', 'Rainy', 'Cloudy', 'Snowy'] },
      { emoji: '🌧️', correct: 'Rainy', options: ['Rainy', 'Sunny', 'Windy', 'Stormy'] },
      { emoji: '🌩️', correct: 'Stormy', options: ['Stormy', 'Snowy', 'Sunny', 'Foggy'] },
    ],
    [
      { emoji: '❄️', correct: 'Snowy', options: ['Snowy', 'Rainy', 'Sunny', 'Windy'] },
      { emoji: '🌤️', correct: 'Partly sunny', options: ['Partly sunny', 'Rainy', 'Snowy', 'Foggy'] },
      { emoji: '🌪️', correct: 'Tornado', options: ['Tornado', 'Sunny', 'Rainy', 'Stormy'] },
    ],
    [
      { emoji: '🌫️', correct: 'Foggy', options: ['Foggy', 'Sunny', 'Rainy', 'Cloudy'] },
      { emoji: '💨', correct: 'Windy', options: ['Windy', 'Snowy', 'Stormy', 'Sunny'] },
      { emoji: '⛈️', correct: 'Thunderstorm', options: ['Thunderstorm', 'Rainy', 'Sunny', 'Windy'] },
    ],
    [
      { emoji: '🌦️', correct: 'Rain shower', options: ['Rain shower', 'Snowy', 'Sunny', 'Windy'] },
      { emoji: '🌈', correct: 'Rainbow', options: ['Rainbow', 'Sunny', 'Foggy', 'Windy'] },
      { emoji: '🌡️', correct: 'Hot', options: ['Hot', 'Cold', 'Cool', 'Warm'] },
    ],
    [
      { emoji: '🌬️', correct: 'Breezy', options: ['Breezy', 'Stormy', 'Tornado', 'Snowy'] },
      { emoji: '🌨️', correct: 'Blizzard', options: ['Blizzard', 'Sunny', 'Rainy', 'Foggy'] },
      { emoji: '🌊', correct: 'Hurricane', options: ['Hurricane', 'Thunderstorm', 'Cloudy', 'Rainy'] },
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
    const opts = currentQuestion.options.slice();
    const shuffled = shuffle(opts);
    choicesContainer.innerHTML = '';
    shuffled.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = opt;
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
    choicesContainer.innerHTML = '';
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('science-weather', { subject: 'science' });
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
      gameId: 'science-weather',
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