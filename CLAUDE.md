# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational web application called "Stealth Learning Games" that provides interactive mini-games for children to practice Math, English, and Science skills. The application uses vanilla JavaScript with ES6 modules and follows a component-based architecture.

## Architecture

### Core Engine Pattern
The application uses a centralized `GameEngine` (services/gameEngine.js) that acts as:
- **View Router**: Manages navigation between different pages/games
- **Event Bus**: Decouples modules through pub/sub pattern
- **Sound Manager**: Preloads and manages audio playback
- **User Context**: Maintains persistent user ID

### Service Layer
Three singleton services handle cross-cutting concerns:
- **AnalyticsService**: Records game sessions and generates performance reports
- **AdaptivityService**: Adjusts game difficulty based on player performance using configurable thresholds
- **GameEngine**: Coordinates navigation, events, and shared resources

### Component Structure
Each game/view is a self-contained module that:
1. Exports a default function receiving the engine instance
2. Returns a DOM element to be rendered
3. Manages its own game loop, state, and cleanup
4. Records analytics on completion
5. Uses the engine for navigation and sound effects

### Game Registration Pattern
All games must be:
1. Imported in main.js
2. Registered with the engine using `engine.registerView(key, component)`
3. Added to the `GAME_KEYS` array for random selection

## Development Commands

**Package Manager**: Always use pnpm (never npm or yarn)

```bash
# Install dependencies
pnpm install

# Start development server with hot reload
pnpm dev

# Start Python HTTP server
pnpm start

# Format code
pnpm format

# Lint code
pnpm lint
```

## Key Conventions

### Adding New Games
1. Create component in `components/{subject}-{game-name}.js`
2. Follow existing game structure (see math-falling.js as template)
3. Import and register in main.js
4. Add to GAME_KEYS array

### Analytics Integration
Games should record sessions with:
```javascript
analytics.recordSession({
  userId: engine.userId,
  subject: 'math|english|science',
  gameId: 'unique-game-id',
  startTime: new Date(),
  endTime: new Date(),
  score: 0-100,
  accuracy: 0-100,
  difficulty: 1-5,
  hintsUsed: count
});
```

### Sound Effects
Use engine's preloaded sounds:
```javascript
engine.playSound('correct'); // For right answers
engine.playSound('wrong');   // For wrong answers
engine.playSound('success'); // For game completion
```

### Difficulty Adaptation
Games fetch recent sessions and calculate difficulty:
```javascript
const recentSessions = analytics.getSessions({userId, subject})
  .filter(s => s.gameId === 'current-game');
const difficulty = adaptivity.calculateDifficulty(
  recentSessions.slice(-3),
  lastDifficulty
);
```

## Storage

All data persists to localStorage:
- User ID: `stealth-user-id`
- Analytics: `stealth-analytics`
- Last played game: `stealth-last-game`

## Git Workflow

- **Author**: Always use `Chude <chude@emeke.org>` for commits
- **Branches**: main (production), develop (staging), feature/* (new features)
- **No emojis** in commit messages - use clear, professional language

## Deployment

The project deploys automatically to GitHub Pages when pushing to main branch via GitHub Actions.