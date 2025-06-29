# CLAUDE.md


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Status

This is currently an empty repository with no source code, configuration files, or documentation. When the project is initialized with code, this file should be updated with:

- Build, test, and lint commands specific to the project type
- High-level architecture overview
- Key patterns and conventions used in the codebase


# Code Style
- Use ES6 module syntax (import/export)
- Use destructuring assignment as much as possible
- Use snake_case for function names and PascalCase for class names
- Use ESLint + Prettier
- Documentation: Always add JSDoc comments to functions and components

# Guidelines
NEVER: Do not hardcode passwords or API keys
YOU MUST: Document all public APIs
IMPORTANT: Consider the impact on performance

When initializing this project, please update this file with relevant information based on the chosen technology stack and project structure.

# Docs Reading
- After implementation is complete, leave an implementation log in the requirements definition directory `_docs/`. Save it in the format yyyy-mm-dd_feature name.md. Read it when you start up.
- Get today's date with command "now".

# Important restrictions
**Important**: Be sure to create a backup before performing database operations.
**Required**: Obtain code reviews from at least two people before merging PRs.
**Required**: Be sure to perform type checks after completing changes.
**Recommended**: Prioritize unit tests over full tests.

# Configuration Management
- Configuration values are managed by environment variables or configuration files.
- API keys and confidential information are managed using .env files or environment variables.
- Database connection information is read from configuration files.

## Configuration Management Patterns
- Database URL: Use `process.env.DATABASE_URL`
- API Key: Manage in `.env` file and load with `dotenv`
- Environment-specific settings: Utilize configuration files such as `config/production.json`

## Secure coding conventions
ALWAYS: Manage API keys with environment variables (.env)
ALWAYS: Get database connection info from configuration files
ALWAYS: Separate environment-specific values as external settings

## Recommended implementation patterns
- Configuration values: Get them in the form of `config.get(‘database.host’)`
- Environment variables: `process.env.API_KEY || config.default.apiKey`
- Sensitive information: Add `.env` to `.gitignore` and provide a template in `.env.example`

# Important restrictions
**Important**: Be sure to create a backup before performing database operations.
**Required**: Obtain code reviews from at least two people before merging PRs.
**Required**: Be sure to perform type checks after completing changes.
**Recommended**: Prioritize unit tests over full tests.

# File name: .claude/commands/fix-github-issue.md
Analyze and fix GitHub issues: $ARGUMENTS

Follow the steps below.
1. Get issue details with `gh issue view`
2. Understand the problem and analyze the cause  
3. Search for related files
4. Implement the fix
5. Run tests and verify
6. Create a commit message
7. Create a pull request




# AI Restaurant Battle

## Project Overview

Create "AI Restaurant Battle" - a real-time competitive browser game where players manage their restaurant while competing against 5 AI-powered rival restaurants with different strategies for market share.

## Technical Requirements

### Core Technologies
- **Language**: TypeScript (primary), HTML5, CSS3
- **Libraries**: Canvas API, Chart.js, DOM manipulation only
- **Architecture**: Single Page Application
- **Display**: 1280px × 720px with responsive design
- **Game Duration**: 7 minutes (7 in-game days, 60 seconds per day)

### Security Implementation
```typescript
// Required security measures
- XSS Prevention: Sanitize all user inputs
- CSP Implementation: "default-src 'self'"
- Type Safety: TypeScript strict mode enabled
- Input Validation: Validate all user inputs
```

## Game System Design

### Core Game Loop
- Real-time updates every second for sales, customers, satisfaction
- Auto-save every 30 seconds
- Market events trigger randomly
- AI opponents act autonomously with different strategies

### AI Opponent Specifications

#### 1. Aggressive AI "Fire Grill"
```typescript
class AggressiveAI implements AIStrategy {
  strategy = {
    pricing: "Below market by 20%",
    marketing: "30% of revenue on advertising",
    menuUpdate: "New dish every 2 days",
    riskLevel: "High"
  }
  
  executeStrategy() {
    // Undercut competitor prices by 20%
    // Heavy advertising spending
    // Frequent menu changes for novelty
    // Accept high risk for high reward
  }
}
```

#### 2. Strategic AI "Wisdom Table"
```typescript
class StrategicAI implements AIStrategy {
  strategy = {
    pricing: "Data-driven optimal pricing",
    marketing: "Targeted customer segments",
    menuUpdate: "Demand prediction based",
    riskLevel: "Low"
  }
  
  executeStrategy() {
    // Analyze historical data for pricing
    // Reduce food waste by 30% through prediction
    // Segmented marketing campaigns
    // Conservative, data-driven decisions
  }
}
```

#### 3. Emotional AI "Hospitality House"
```typescript
class EmotionalAI implements AIStrategy {
  strategy = {
    pricing: "Value-based premium pricing",
    marketing: "Word-of-mouth focus",
    menuUpdate: "Customer feedback driven",
    riskLevel: "Medium"
  }
  
  executeStrategy() {
    // Prioritize customer satisfaction over profit
    // Invest heavily in service quality
    // Build loyal customer base
    // Personal touch in all interactions
  }
}
```

#### 4. Speed AI "Lightning Kitchen"
```typescript
class SpeedAI implements AIStrategy {
  strategy = {
    pricing: "Efficiency-based competitive",
    marketing: "Speed and convenience focus",
    menuUpdate: "Simple, fast-cook items",
    riskLevel: "Medium"
  }
  
  executeStrategy() {
    // Minimize cooking and delivery time
    // Optimize for high customer turnover
    // Streamlined menu for efficiency
    // Technology-focused operations
  }
}
```

#### 5. Balanced AI "Harmony Restaurant"
```typescript
class BalancedAI implements AIStrategy {
  strategy = {
    pricing: "Market average pricing",
    marketing: "Balanced investment approach",
    menuUpdate: "Regular scheduled updates",
    riskLevel: "Low"
  }
  
  executeStrategy() {
    // Maintain average performance across all metrics
    // Risk-averse approach
    // Steady growth strategy
    // Diversified investments
  }
}
```

### Player Support AI

#### Support AI "Sakura"
```typescript
class SupportAI {
  functions = {
    marketAnalysis: "Analyze competitor movements",
    riskWarning: "Alert about business risks",
    optimization: "Suggest efficiency improvements",
    trendPrediction: "Predict market trends"
  }
  
  generateAdvice(gameState: GameState): string {
    // Provide real-time strategic advice
    // Analyze competitor weaknesses
    // Suggest optimal investment timing
    // Warn about market threats
  }
}
```

## Data Structures

### Core Game State
```typescript
interface GameState {
  currentDay: number;
  timeRemaining: number;
  restaurants: Restaurant[];
  marketEvents: MarketEvent[];
  weatherCondition: 'sunny' | 'rainy' | 'cloudy';
  globalMarketTrends: MarketTrend[];
}

interface Restaurant {
  id: string;
  name: string;
  type: 'player' | 'ai';
  
  // Financial metrics
  revenue: number;
  expenses: number;
  cash: number;
  dailyProfit: number;
  
  // Performance metrics
  customerCount: number;
  satisfaction: number;
  marketShare: number;
  efficiency: number;
  
  // Resources
  staff: Staff[];
  menu: MenuItem[];
  equipment: Equipment[];
  
  // AI specific
  aiStrategy?: AIStrategy;
  strategyType?: 'aggressive' | 'strategic' | 'emotional' | 'speed' | 'balanced';
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  cost: number;
  cookTime: number;
  popularity: number;
  profitMargin: number;
  customerRating: number;
}

interface MarketEvent {
  id: string;
  name: string;
  description: string;
  effect: {
    customerMultiplier?: number;
    costMultiplier?: number;
    satisfactionBonus?: number;
  };
  duration: number;
  probability: number;
}
```

## User Interface Design

### Layout Structure
```html
<div class="game-container">
  <header class="game-header">
    <div class="time-display">Day X / 7 - Time Remaining: XX:XX</div>
    <div class="revenue-chart"><!-- Real-time sales chart --></div>
    <div class="ranking-display"><!-- Current market share ranking --></div>
  </header>
  
  <main class="game-main">
    <section class="restaurant-view">
      <div class="player-restaurant"><!-- 3D-style restaurant visualization --></div>
      <div class="customer-animation"><!-- Animated customer flow --></div>
    </section>
    
    <section class="ai-competitors">
      <div class="competitor-status"><!-- Each AI restaurant status --></div>
    </section>
  </main>
  
  <aside class="ai-assistant">
    <div class="sakura-avatar"><!-- Support AI character --></div>
    <div class="advice-panel"><!-- Real-time advice display --></div>
    <div class="market-analysis"><!-- Competitor analysis --></div>
  </aside>
  
  <footer class="control-panel">
    <div class="menu-management"><!-- Add/remove/price menu items --></div>
    <div class="marketing-controls"><!-- Advertising campaigns --></div>
    <div class="operations-panel"><!-- Staff and equipment management --></div>
  </footer>
</div>
```

### Player Controls
```typescript
interface PlayerControls {
  menuManagement: {
    addMenuItem(name: string, price: number, cost: number): void;
    removeMenuItem(itemId: string): void;
    updatePrice(itemId: string, newPrice: number): void;
    toggleAvailability(itemId: string): void;
  };
  
  marketing: {
    launchCampaign(type: 'social' | 'tv' | 'radio', budget: number, duration: number): void;
    setPromotions(discount: number, conditions: string[]): void;
    sponsorEvent(eventType: string, cost: number): void;
  };
  
  operations: {
    hireStaff(type: 'chef' | 'waiter' | 'delivery', count: number): void;
    fireStaff(staffId: string): void;
    upgradeEquipment(equipmentType: string): void;
    setOperatingHours(openTime: number, closeTime: number): void;
  };
}
```

## Game Balance Configuration

```typescript
const GAME_CONFIG = {
  // Starting conditions
  startingCash: 50000,
  startingMenu: 3,
  startingStaff: 2,
  
  // Daily costs
  rentCost: 2000,
  utilityCost: 500,
  staffCostPerDay: 1000,
  
  // Market parameters
  maxDailyCustomers: 200,
  baseCustomerArrival: 50,
  satisfactionDecayRate: 0.05,
  
  // AI difficulty scaling
  aiEfficiency: {
    easy: 0.8,
    normal: 1.0,
    hard: 1.2
  },
  
  // Market events
  events: [
    {
      name: "Rainy Day",
      effect: { customerMultiplier: 0.7 },
      probability: 0.2
    },
    {
      name: "Local Festival",
      effect: { customerMultiplier: 1.5 },
      probability: 0.1
    },
    {
      name: "TV Food Show Feature",
      effect: { satisfactionBonus: 0.3 },
      probability: 0.05
    },
    {
      name: "Ingredient Price Spike",
      effect: { costMultiplier: 1.3 },
      probability: 0.15
    }
  ]
};
```

## Implementation Architecture

### Main Game Engine
```typescript
class GameEngine {
  private gameState: GameState;
  private aiControllers: AIController[];
  private renderer: GameRenderer;
  private inputHandler: InputHandler;
  private securityValidator: SecurityValidator;
  
  constructor() {
    this.initializeGame();
    this.setupEventListeners();
    this.startGameLoop();
  }
  
  private gameLoop(): void {
    // 1. Process AI decisions
    this.processAIActions();
    
    // 2. Handle player input
    this.processPlayerActions();
    
    // 3. Update game state
    this.updateGameState();
    
    // 4. Handle market events
    this.processMarketEvents();
    
    // 5. Render updates
    this.renderer.render(this.gameState);
    
    // 6. Check win/lose conditions
    this.checkGameEnd();
    
    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }
}
```

### Security Implementation
```typescript
class SecurityValidator {
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"'&]/g, '')
      .trim()
      .substring(0, 100); // Limit length
  }
  
  static validateNumber(value: any, min: number, max: number): number {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Invalid number: ${value}`);
    }
    return num;
  }
  
  static validateMenuItemInput(item: any): MenuItem {
    return {
      id: crypto.randomUUID(),
      name: this.sanitizeInput(item.name),
      price: this.validateNumber(item.price, 1, 10000),
      cost: this.validateNumber(item.cost, 0.1, 5000),
      cookTime: this.validateNumber(item.cookTime, 1, 60),
      popularity: 0,
      profitMargin: 0,
      customerRating: 5.0
    };
  }
}
```

## File Structure

```
ai-restaurant-battle/
├── index.html
├── claude.md
├── styles/
│   ├── main.css
│   ├── components.css
│   ├── responsive.css
│   └── animations.css
├── src/
│   ├── main.ts
│   ├── game/
│   │   ├── GameEngine.ts
│   │   ├── GameState.ts
│   │   ├── Restaurant.ts
│   │   └── MarketEvents.ts
│   ├── ai/
│   │   ├── AIController.ts
│   │   ├── AIStrategies.ts
│   │   └── SupportAI.ts
│   ├── ui/
│   │   ├── GameRenderer.ts
│   │   ├── ChartManager.ts
│   │   ├── InputHandler.ts
│   │   └── UIComponents.ts
│   ├── utils/
│   │   ├── SecurityValidator.ts
│   │   ├── MathUtils.ts
│   │   └── Constants.ts
│   └── types/
│       ├── GameTypes.ts
│       ├── AITypes.ts
│       └── UITypes.ts
└── assets/
    ├── images/
    │   ├── restaurants/
    │   ├── characters/
    │   └── ui/
    └── sounds/
        ├── background/
        └── effects/
```

## Victory Conditions

### Primary Victory
- Highest market share at end of day 7

### Secondary Rankings
1. Total Revenue Leader
2. Customer Satisfaction Champion  
3. Operational Efficiency Master
4. Innovation Award (most menu changes)

### Scoring System
```typescript
function calculateFinalScore(restaurant: Restaurant): number {
  const marketSharePoints = restaurant.marketShare * 1000;
  const revenuePoints = restaurant.revenue * 0.1;
  const satisfactionPoints = restaurant.satisfaction * 100;
  const efficiencyPoints = (restaurant.revenue / restaurant.expenses) * 50;
  
  return Math.round(marketSharePoints + revenuePoints + satisfactionPoints + efficiencyPoints);
}
```

## Development Instructions

### Implementation Priority
1. **Phase 1**: Core game engine and basic UI
2. **Phase 2**: AI strategy implementation and behavior
3. **Phase 3**: Player controls and Support AI advice system
4. **Phase 4**: Visual enhancements and animations
5. **Phase 5**: Game balance tuning and polish

### Quality Assurance Checklist
- [ ] All user inputs properly sanitized
- [ ] XSS protection implemented
- [ ] CSP headers configured
- [ ] TypeScript strict mode enabled
- [ ] AI behaviors clearly differentiated
- [ ] Game completes in exactly 7 minutes
- [ ] Responsive design functional
- [ ] Performance maintains 60fps
- [ ] Support AI provides useful advice
- [ ] Victory conditions clearly defined

### Browser Compatibility
- Target: Modern browsers with ES2020+ support
- Required: Canvas API, requestAnimationFrame, CSS Grid
- Testing: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

# Completion conditions

- Pass lint, prettier, typecheck, test, build, and playwright
- Achieve 100% coverage using vitest
- Complete updates to related documentation

# refactoring
Organize the new insights gained from the verification file you just created in one of the following ways.
1. Reflect in implementation
2. Test code in *.test.ts
3. Describe in docs/* documentation
4. Leave as snippets in examples/*
