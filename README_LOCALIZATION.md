# AI Restaurant Battle - Localization Features

## 🌍 Multi-Language Support

The game now supports both English and Japanese languages with a complete localization system.

## 🚀 New Features Added

### 1. Opening Screen
- **File**: `opening.html`
- Beautiful animated opening screen with cherry blossom effects
- Story about Sakura Valley - a fictional town setting
- Language switcher (English/Japanese)
- Smooth transitions to main game

### 2. Language System
- **File**: `src/localization/Localization.js`
- Complete localization manager with 200+ translated strings
- Automatic language persistence in localStorage
- Dynamic text updates without page reload
- Support for placeholder text in forms

### 3. Fictional Town Story
**Sakura Valley** - A charming town where:
- Cherry blossoms bloom year-round
- Locals have incredible passion for food
- 6 restaurants compete for the "Premier Dining Establishment" title
- One week competition period
- Winner gets prestige, prime location, and townspeople's hearts

## 🎮 How to Use

### Starting the Game
1. Open `opening.html` in your browser
2. Read the story about Sakura Valley
3. Select your preferred language (English/日本語)
4. Click "Start Your Restaurant" / "レストランを始める"

### Language Switching
- **Opening Screen**: Toggle between EN/JP buttons
- **Main Game**: Use language switcher in top-right corner
- **Persistence**: Language preference saved automatically

## 🗾 Japanese Features

### Localized Content
- **Game Title**: AI レストランバトル
- **UI Elements**: All buttons, labels, and messages
- **AI Restaurants**: Japanese names (ファイアグリル, etc.)
- **Notifications**: Success/error messages in Japanese
- **Prompts**: Input dialogs in Japanese
- **Menu Items**: Localized dish names

### Typography
- Proper Japanese font support
- Hiragino Sans, Yu Gothic, Meiryo font stack
- Responsive text sizing for Japanese characters

## 📁 File Structure

```
├── opening.html              # New opening screen
├── src/localization/
│   └── Localization.js      # Complete localization system
├── src/main.js              # Updated with language initialization
├── src/ui/
│   ├── GameRenderer.js      # Localized display updates
│   └── InputHandler.js      # Localized prompts/notifications
├── src/game/
│   └── GameState.js         # Localized menu items
├── src/utils/
│   └── Constants.js         # Updated with localization keys
└── styles/
    └── main.css             # Language switcher styles + Japanese fonts
```

## 🔧 Technical Implementation

### Language Manager Features
- **Dynamic Loading**: No page refresh required
- **Nested Keys**: Support for `aiRestaurants.aggressive` syntax
- **Fallback**: Returns key if translation missing
- **Events**: Custom `languageChanged` event for components
- **Storage**: Automatic localStorage persistence

### Localization Keys
```javascript
// Example usage
localization.getText('gameTitle')                    // "AI Restaurant Battle"
localization.getText('aiRestaurants.aggressive')     // "Fire Grill"
localization.getText('startingMenuItems.burger')     // "Classic Burger"
```

### Event System
```javascript
// Listen for language changes
document.addEventListener('languageChanged', (event) => {
  console.log('Language changed to:', event.detail.language);
  // Update dynamic content
});
```

## 🎨 Design Features

### Opening Screen Animations
- **Cherry Blossoms**: Continuous falling animation
- **Gradient Background**: Beautiful purple-blue gradient
- **Glass Morphism**: Frosted glass effect containers
- **Smooth Transitions**: Fade effects and hover animations
- **Responsive Design**: Mobile-friendly layout

### Language Switcher
- **Fixed Position**: Always visible in top-right
- **Active State**: Visual feedback for current language
- **Smooth Transitions**: Hover effects and color changes
- **Compact Design**: Minimal space usage

## 🌸 Sakura Valley Story Elements

### Setting Details
- **Location**: Fictional peaceful town
- **Atmosphere**: Cherry blossoms year-round
- **Culture**: Food-passionate community
- **Competition**: 6 restaurants total (player + 5 AI)
- **Timeline**: 7-day competition period
- **Prize**: Official town recognition and prime location

### Narrative Elements
- **Background**: Player arrives from big city
- **Motivation**: Open own restaurant after years of experience
- **Challenge**: Compete against 5 ambitious AI restaurateurs
- **Goal**: Win hearts and stomachs of Sakura Valley residents
- **Stakes**: Prestige, location, and community recognition

## 🚀 Getting Started

### For Players
1. Navigate to `opening.html`
2. Enjoy the story and animations
3. Choose your language preference
4. Start your culinary adventure!

### For Developers
1. All text uses `data-i18n` attributes
2. Dynamic content uses `localization.getText()`
3. Add new languages by extending the `languages` object
4. Test with language switcher in both screens

## 🎯 Default Behavior
- **Default Language**: English (can be changed in Localization.js)
- **Language Persistence**: Saved in browser localStorage
- **Fallback**: English text if translation missing
- **Font Loading**: Automatic Japanese font selection

The game now provides a complete bilingual experience with an engaging story-driven opening that immerses players in the world of Sakura Valley! 🌸🍽️