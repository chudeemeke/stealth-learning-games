/*
 * Body Facts game. Presents simple statements about the human body and
 * asks the player to determine whether they are true or false. The
 * game is similar in structure to the generic science quiz but
 * focuses specifically on anatomy and physiology. Difficulty
 * influences the number of rounds and complexity of statements.
 */

import { AnalyticsService } from '../services/analytics.js';
import { AdaptivityService } from '../services/adaptivity.js';

export default function scienceBody(engine, params) {
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
  title.textContent = 'Body Facts';
  main.appendChild(title);
  // Difficulty
  const recent = analytics
    .getSessions({ userId: engine.userId, subject: 'science' })
    .filter(s => s.gameId === 'science-body');
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
  // UI
  const statementEl = document.createElement('div');
  statementEl.style.fontSize = '1.2rem';
  statementEl.style.margin = '1rem 0';
  main.appendChild(statementEl);
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.gap = '1rem';
  main.appendChild(buttonsContainer);
  const info = document.createElement('div');
  main.appendChild(info);
  container.appendChild(main);
  // Statements by difficulty
  const pools = [
    [
      { text: 'Humans have five fingers on each hand.', answer: true },
      { text: 'The heart is in your foot.', answer: false },
      { text: 'We breathe oxygen.', answer: true },
    ],
    [
      { text: 'Bones are stronger than some metals.', answer: true },
      { text: 'Blood is blue inside your body.', answer: false },
      { text: 'Our brains never sleep.', answer: true },
    ],
    [
      { text: 'The human body has 206 bones.', answer: true },
      { text: 'Your stomach is part of your respiratory system.', answer: false },
      { text: 'Nails are made of keratin.', answer: true },
    ],
    [
      { text: 'The liver produces bile to aid digestion.', answer: true },
      { text: 'The adult human heart has five chambers.', answer: false },
      { text: 'Red blood cells live for about 120 days.', answer: true },
    ],
    [
      { text: 'The smallest bones are in the ear.', answer: true },
      { text: 'The pancreas regulates blood sugar.', answer: true },
      { text: 'Humans have two sets of ribs.', answer: false },
    ],
  ];
  const questions = pools[currentDifficulty - 1].slice();
  let currentQuestion;
  function nextQuestion() {
    if (currentRound >= rounds) {
      endGame();
      return;
    }
    currentRound++;
    const idx = Math.floor(Math.random() * questions.length);
    currentQuestion = questions.splice(idx, 1)[0];
    statementEl.textContent = currentQuestion.text;
    // Render true/false buttons
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
    info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
  }
  function handleAnswer(ans) {
    attempts++;
    if (ans === currentQuestion.answer) {
      score += 10;
      correctCount++;
      engine.playSound('correct');
    } else {
      score = Math.max(0, score - 5);
      engine.playSound('wrong');
    }
    info.textContent = `Score: ${score} | Question ${currentRound} of ${rounds}`;
    setTimeout(nextQuestion, 500);
  }
  function endGame() {
    const accuracy = attempts ? correctCount / attempts : 0;
    statementEl.textContent = '';
    buttonsContainer.innerHTML = '';
    const summary = document.createElement('div');
    summary.innerHTML = `<h3>Game Over</h3><p>Score: ${score}</p><p>Accuracy: ${(accuracy * 100).toFixed(
      1
    )}%</p>`;
    const playAgain = document.createElement('button');
    playAgain.className = 'btn btn-primary';
    playAgain.textContent = 'Play Again';
    playAgain.onclick = () => engine.navigate('science-body', { subject: 'science' });
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
      gameId: 'science-body',
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