# AI Restaurant Battle

A competitive real-time restaurant management game where you compete against 5 AI-powered opponents with distinct strategies. Build your restaurant empire in exactly 7 minutes!

## 🎮 Game Overview

**Duration:** Exactly 7 minutes (7 in-game days, 60 seconds per day)  
**Objective:** Achieve the highest market share by the end of day 7  
**Players:** 1 human player vs 5 AI opponents  

## 🤖 AI Opponents

### 1. Fire Grill (Aggressive AI)
- **Strategy:** Aggressive pricing and heavy marketing
- **Behavior:** Undercuts prices by 20%, spends 30% on advertising
- **Risk Level:** High

### 2. Wisdom Table (Strategic AI)  
- **Strategy:** Data-driven optimal pricing and efficiency
- **Behavior:** Analyzes market data, reduces waste, targeted campaigns
- **Risk Level:** Low

### 3. Hospitality House (Emotional AI)
- **Strategy:** Customer satisfaction and loyalty focus
- **Behavior:** Premium pricing, invests in service quality
- **Risk Level:** Medium

### 4. Lightning Kitchen (Speed AI)
- **Strategy:** Fast service and high turnover
- **Behavior:** Quick-cook items, technology focus
- **Risk Level:** Medium

### 5. Harmony Restaurant (Balanced AI)
- **Strategy:** Balanced approach across all metrics
- **Behavior:** Market average pricing, steady growth
- **Risk Level:** Low

## 🌸 Support AI: Sakura
Your personal AI advisor provides:
- Real-time market analysis
- Competitor movement warnings  
- Strategic optimization tips
- Risk assessments

## 🎯 Victory Conditions

### Primary Victory
- Highest market share at end of day 7

### Secondary Rankings
1. **Total Revenue Leader** - Highest total revenue generated
2. **Customer Satisfaction Champion** - Highest customer satisfaction rating  
3. **Operational Efficiency Master** - Best revenue-to-expense ratio
4. **Innovation Award** - Most menu changes and adaptations

## 🕹️ How to Play

### Menu Management
- **Add Items:** Click "Add New Dish" to create menu items
- **Price Strategy:** Balance profit margins with customer appeal
- **Remove Items:** Eliminate unpopular dishes

### Marketing Campaigns  
- **Launch Campaigns:** Invest in advertising to boost satisfaction
- **Target Audiences:** Choose campaign types for different demographics
- **Budget Management:** Balance marketing spend with cash reserves

### Operations
- **Hire Staff:** Add chefs and waiters to improve efficiency
- **Upgrade Equipment:** Invest in kitchen improvements
- **Service Quality:** Monitor and improve customer satisfaction

### Key Metrics to Monitor
- **Cash Flow:** Keep enough reserves for investments
- **Customer Count:** Track daily customer arrivals
- **Satisfaction:** Maintain high ratings for repeat business
- **Market Share:** Your slice of the total market
- **Efficiency:** Revenue per expense ratio

## 🛡️ Security Features

- **XSS Protection:** All user inputs are sanitized
- **Input Validation:** Prevents invalid data entry
- **CSP Headers:** Content Security Policy implementation
- **Type Safety:** TypeScript strict mode enabled

## 🎨 Game Features

### Real-time Elements
- Live revenue charts showing all competitors
- Animated customer flow in restaurant view
- Dynamic market events (weather, festivals, price spikes)
- Real-time AI decision making

### Visual Elements
- 3D-style restaurant visualization
- Customer satisfaction animations
- Market share ranking display
- Weather effects and ambiance

### Performance
- Optimized for 60 FPS gameplay
- Responsive design (1280x720 native, scales down)
- Canvas-based rendering for smooth animations

## 📱 Device Compatibility

### Desktop (Recommended)
- **Resolution:** 1280x720 optimal
- **Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Tablet  
- Responsive grid layout
- Touch-optimized controls
- Scaled UI elements

### Mobile
- Simplified layout
- Horizontal scrolling for competitors
- Touch-friendly buttons

## 🎮 Controls

### Keyboard Shortcuts
- **ESC:** Close modals
- **P:** Pause/Resume game

### Mouse/Touch
- Click buttons for actions
- Modal forms for detailed input
- Drag-friendly interface

## 🚀 How to Run

### Local Setup
1. Open `index.html` in a modern web browser
2. Or serve via local HTTP server for best performance:
   ```bash
   python3 -m http.server 8080
   # Then visit http://localhost:8080
   ```

### Testing
- Open `test-game.html` to run automated tests
- Checks module loading, performance, and functionality

## 🏆 Scoring System

**Final Score Calculation:**
- Market Share Points: `market_share * 1000`
- Revenue Points: `total_revenue * 0.1`  
- Satisfaction Points: `satisfaction * 100`
- Efficiency Points: `(revenue/expenses) * 50`

## 🎭 Game Events

### Weather Events
- **Sunny:** +20% customers
- **Rainy:** -20% customers  
- **Cloudy:** Normal conditions

### Market Events
- **Local Festival:** +50% customers (rare)
- **TV Feature:** +30% satisfaction (very rare)
- **Ingredient Price Spike:** +30% costs (common)

## 💡 Strategy Tips

### Early Game (Days 1-2)
- Build a solid menu foundation
- Focus on cash flow positive items
- Monitor AI competitor strategies

### Mid Game (Days 3-5)  
- Expand menu variety
- Launch marketing campaigns
- Hire additional staff

### Late Game (Days 6-7)
- Optimize for maximum revenue
- Aggressive market share grab
- React to competitor moves

### Pro Tips
- Watch Sakura's advice closely
- Monitor competitor satisfaction levels
- Balance growth with cash reserves
- Adapt pricing based on demand

## 🔧 Technical Architecture

### Game Engine
- Real-time state management
- 60 FPS rendering loop
- AI decision making system
- Market simulation

### AI System
- Strategy pattern implementation
- Personality-based behaviors  
- Dynamic decision making
- Market analysis

### Security Layer
- Input sanitization
- XSS prevention
- Type validation
- Safe HTML rendering

## 📊 Development Stats

- **Files:** 15+ TypeScript modules
- **Lines of Code:** 2000+ 
- **AI Strategies:** 5 distinct implementations
- **Security Checks:** Multiple layers
- **Performance Target:** 60 FPS sustained

---

**Ready to dominate the restaurant market? Open `index.html` and start your culinary empire!** 🍽️