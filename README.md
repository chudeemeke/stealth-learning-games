# Stealth Learning Games

An educational web application that provides interactive mini-games for children to practice Math, English, and Science skills. The games adapt difficulty based on player performance and track progress through detailed analytics.

## Live Demo

Visit the application at: [https://chudeemeke.github.io/stealth-learning-games/](https://chudeemeke.github.io/stealth-learning-games/)

## Features

- **20+ Educational Games** across Math, English, and Science
- **Adaptive Difficulty** - Games adjust difficulty based on player performance
- **Progress Tracking** - Analytics dashboard shows learning progress over time
- **Quick Play Mode** - Random game selection for variety
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Sound Effects** - Audio feedback for correct/incorrect answers

## Game Categories

### Math Games
- Number Catch - Catch falling answers to arithmetic problems
- Memory Math - Match equation cards with their answers
- Number Sort - Arrange numbers in ascending order
- Compare Numbers - Choose the larger number
- Quick Calculate - Solve equations quickly
- Pattern Recognition - Complete number patterns
- Sign Selection - Choose the correct operation sign

### English Games
- Word Scramble - Unscramble letters to form words
- Spelling Bee - Spell words correctly
- Rhyme Time - Match rhyming words
- Synonyms Match - Find words with similar meanings
- Antonyms Match - Find opposite words

### Science Games
- Animal Classification - Group animals by characteristics
- Science Sequence - Order scientific processes
- Science Quiz - Answer science questions
- Weather Match - Match weather phenomena with descriptions
- Body Parts - Identify human body parts

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Styling**: Custom CSS with Google Fonts
- **Charts**: Chart.js for analytics visualization
- **Storage**: localStorage for persistent data
- **Package Manager**: pnpm
- **Deployment**: GitHub Pages with GitHub Actions

## Development

### Prerequisites
- Node.js 16+
- pnpm (install with `npm install -g pnpm`)

### Installation
```bash
# Clone the repository
git clone https://github.com/chudeemeke/stealth-learning-games.git

# Navigate to project directory
cd stealth-learning-games

# Install dependencies (for development tools)
pnpm install

# Start development server
pnpm dev

# Or use Python server
pnpm start
```

### Available Scripts
- `pnpm start` - Start local server using Python
- `pnpm dev` - Start development server with hot reload
- `pnpm format` - Format code with Prettier
- `pnpm lint` - Lint JavaScript files with ESLint

### Project Structure
```
stealth-learning-games/
├── index.html           # Entry point
├── main.js              # Application bootstrap
├── style.css            # Global styles
├── package.json         # Project configuration
├── components/          # Game and view components
│   ├── home.js          # Home page
│   ├── gameSelect.js    # Game selection
│   ├── analyticsPage.js # Analytics dashboard
│   └── [game-files].js  # Individual game components
├── services/            # Core services
│   ├── gameEngine.js    # Navigation and state management
│   ├── analytics.js     # Session tracking
│   └── adaptivity.js    # Difficulty adjustment
├── sounds/              # Audio files
│   ├── correct.wav
│   ├── wrong.wav
│   ├── success.wav
│   └── ambient.wav
└── .github/
    └── workflows/
        └── deploy.yml   # GitHub Pages deployment
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-game`)
3. Commit your changes with clear messages
4. Push to your fork
5. Open a Pull Request

### Adding New Games

1. Create component in `components/{subject}-{game-name}.js`
2. Follow existing game structure (see math-falling.js as template)
3. Import and register in main.js
4. Add to GAME_KEYS array
5. Ensure analytics integration

## License

This project is owned by Chude Emeke. All rights reserved.

## Contact

For questions or feedback, please contact Chude at chude@emeke.org
## 🤖 CI/CD Auto-Fix

This repository uses Claude AI to automatically fix CI/CD failures.
If builds fail, Claude will automatically create a fix PR.

