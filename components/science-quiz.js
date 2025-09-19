/*
 * Science quiz game. Players are presented with a series of true/false
 * statements about the natural world. They respond by selecting
 * whether the statement is correct. Difficulty scales the complexity
 * of the statements and the number of rounds. Correct and incorrect
 * responses trigger audio feedback and results are recorded for
 * analytics.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function scienceQuiz(engine, params) {
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
  title.textContent = 'Science Quiz';
  main.appendChild(title);
  // Determine difficulty from analytics
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'science' })
    .filter(s => s.gameId === 'science-quiz');
  let currentDifficulty = recent.length
    ? adaptivity.calculateDifficulty(
        recent.slice(-3),
        recent[recent.length - 1].difficulty || 1
      )
    : 1;
  currentDifficulty = Math.min(currentDifficulty, 5);
  // Questions by difficulty (true means statement is correct)
  const pools = [
    [
      { text: 'The Earth revolves around the Sun.', answer: true },
      { text: 'Humans have 100 bones in their bodies.', answer: false },
      { text: 'Plants make food via photosynthesis.', answer: true },
      { text: 'Fish breathe underwater with lungs.', answer: false },
      { text: 'The sun is a star.', answer: true },
    ],
    [
      { text: 'Water freezes at 0°C.', answer: true },
      { text: 'Jupiter is a gas giant.', answer: true },
      { text: 'Sound travels faster than light.', answer: false },
      { text: 'Whales are mammals.', answer: true },
      { text: 'Venus is the closest planet to the Sun.', answer: false },
    ],
    [
      { text: 'The human heart has four chambers.', answer: true },
      { text: 'Saturn has more than 20 moons.', answer: true },
      { text: 'The smallest bone in the human body is in the ear.', answer: true },
      { text: 'Electrons are found inside the nucleus.', answer: false },
      { text: 'Photosynthesis occurs in mitochondria.', answer: false },
    ],
    [
      { text: 'DNA stands for Deoxyribonucleic Acid.', answer: true },
      { text: 'The speed of light is about 300,000 km/s.', answer: true },
      { text: 'All bacteria cause disease.', answer: false },
      { text: 'The chemical symbol for sodium is Na.', answer: true },
      { text: 'Spiders have six legs.', answer: false },
    ],
    [
      { text: 'The second law of thermodynamics says entropy of a closed system always decreases.', answer: false },
      { text: 'Energy cannot be created or destroyed.', answer: true },
      { text: 'The densest planet in the solar system is Earth.', answer: true },
      { text: 'The pH of neutral water is 7.', answer: true },
      { text: 'Sound cannot travel in a vacuum.', answer: true },
    ],
  ];
  const questionPool = pools[currentDifficulty - 1].slice();
  const rounds = Math.min(4 + currentDifficulty, questionPool.length);
  let currentRound = 0;
  let score = 0;
  let attempts = 0;
  let correctCount = 0;
  const startTime = new Date();
  // UI elements
  const questionText = document.createElement('div');
  questionText.style.margin = '1rem 0';
  questionText.style.fontSize = '1.2rem';
  main.appendChild(questionText);
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.gap = '1rem';
  buttonsContainer.style.marginBottom = '1rem';
  main.appendChild(buttonsContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Helper to draw next question
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    // Pick a random question
    const idx = Math.floor(Math.random() * questionPool.length);
    const q = questionPool.splice(idx, 1)[0];
    currentQuestion = q;
    questionText.textContent = q.text;
    // Buttons
    buttonsContainer.innerHTML = '';
    const trueBtn = document.createElement('button');
    trueBtn.className = 'btn';
    trueBtn.textContent = '👍 True';
    trueBtn.onclick = () => handleAnswer(true);
    const falseBtn = document.createElement('button');
    falseBtn.className = 'btn';
    falseBtn.textContent = '👎 False';
    falseBtn.onclick = () => handleAnswer(false);
    buttonsContainer.appendChild(trueBtn);
    buttonsContainer.appendChild(falseBtn);
    info.textContent = `Question ${currentRound} of ${rounds} | Score: ${score}`;
  }
  let currentQuestion;
  function handleAnswer(ans) {
    attempts++;
    const isCorrect = ans === currentQuestion.answer;
    if (isCorrect) {
      score += 10;
      correctCount++;
      engine.playSound('correct');
    } else {
      score = Math.max(0, score - 5);
      engine.playSound('wrong');
    }
    setTimeout(nextQuestion, 500);
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    // Clear UI
    questionText.textContent = '';
    buttonsContainer.innerHTML = '';
    // Summary
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('science-quiz', { subject: 'science' });
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
      gameId: 'science-quiz',
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString(),
      score,
      accuracy,
      difficulty: currentDifficulty,
      hintsUsed: 0,
    });
    engine.playSound('success');
  }
  // Kick off
  nextQuestion();
  return container;
}