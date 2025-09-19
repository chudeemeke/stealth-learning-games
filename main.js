import { GameEngine } from './services/gameEngine.js';
import home from './components/home.js';
import gameSelect from './components/gameSelect.js';
import analyticsPage from './components/analyticsPage.js';
import mathFallingGame from './components/math-falling.js';
import mathMemory from './components/math-memory.js';
import englishScramble from './components/english-scramble.js';
import englishSpell from './components/english-spell.js';
import scienceClassify from './components/science-classify.js';
import scienceSequence from './components/science-sequence.js';
import mathSort from './components/math-sort.js';
import mathCompare from './components/math-compare.js';
import englishRhymes from './components/english-rhymes.js';
import scienceQuiz from './components/science-quiz.js';

// New games
import mathCalc from './components/math-calc.js';
import mathPattern from './components/math-pattern.js';
import mathSign from './components/math-sign.js';
import englishSynonyms from './components/english-synonyms.js';
import englishAntonyms from './components/english-antonyms.js';
import scienceWeather from './components/science-weather.js';
import scienceBody from './components/science-body.js';

// Initialize engine
const engine = new GameEngine();
// Register views
engine.registerView('home', home);
engine.registerView('gameSelect', gameSelect);
engine.registerView('analytics', analyticsPage);
// Register all games
engine.registerView('math-falling', mathFallingGame);
engine.registerView('math-memory', mathMemory);
engine.registerView('english-scramble', englishScramble);
engine.registerView('english-spell', englishSpell);
engine.registerView('science-classify', scienceClassify);
engine.registerView('science-sequence', scienceSequence);
engine.registerView('math-sort', mathSort);
engine.registerView('math-compare', mathCompare);
engine.registerView('english-rhymes', englishRhymes);
engine.registerView('science-quiz', scienceQuiz);
engine.registerView('math-calc', mathCalc);
engine.registerView('math-pattern', mathPattern);
engine.registerView('math-sign', mathSign);
engine.registerView('english-synonyms', englishSynonyms);
engine.registerView('english-antonyms', englishAntonyms);
engine.registerView('science-weather', scienceWeather);
engine.registerView('science-body', scienceBody);

// Define list of all game keys for random play and store globally
const GAME_KEYS = [
  'math-falling',
  'math-memory',
  'math-sort',
  'math-compare',
  'math-calc',
  'math-pattern',
  'math-sign',
  'english-scramble',
  'english-spell',
  'english-rhymes',
  'english-synonyms',
  'english-antonyms',
  'science-classify',
  'science-sequence',
  'science-quiz',
  'science-weather',
  'science-body',
];
window.GAME_KEYS = GAME_KEYS;

// Boot the app
document.addEventListener('DOMContentLoaded', () => {
  engine.navigate('home');
});