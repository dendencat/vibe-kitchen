# AI Restaurant Battle - Instruction Manual

## 🎮 Game Controls & Interface Guide

This comprehensive manual explains every component, control, and feature in AI Restaurant Battle.

---

## 📱 Main Interface Components

### 🔝 Header Bar (Game Status)

#### Day Counter
- **Location**: Top-left corner
- **Display**: "Day X / 7" format
- **Function**: Shows current game day and total progression
- **Color Coding**: Orange text for visibility

#### Time Remaining
- **Location**: Below day counter
- **Display**: "MM:SS" format (minutes:seconds)
- **Function**: Countdown timer for current day
- **Color Coding**: Blue text, turns red when under 10 seconds

#### Revenue Chart Canvas
- **Location**: Center of header
- **Size**: 300×100 pixels
- **Function**: Real-time line graph showing all restaurants' revenue
- **Features**:
  - Your restaurant: Thick blue line
  - AI competitors: Thinner colored lines
  - Auto-scaling based on highest performer
  - Updates every second

#### Market Share Ranking
- **Location**: Top-right corner
- **Display**: Live leaderboard
- **Function**: Shows current competitive standings
- **Format**:
  ```
  #1 Restaurant Name    25.3%
  #2 Restaurant Name    18.7%
  #3 Restaurant Name    16.2%
  ```
- **Highlighting**: Your restaurant highlighted in blue

---

### 🏢 Main Game Area

#### Restaurant Canvas
- **Location**: Center-left of screen
- **Size**: 600×400 pixels
- **Function**: Visual representation of your restaurant
- **Elements**:
  - **Kitchen Area**: Gray rectangle (top-left)
  - **Dining Area**: Brown rectangle (main area)
  - **Tables**: Six brown squares arranged in 2×3 grid
  - **Customer Sprites**: Colored circles representing customers
  - **Weather Effects**: Visual overlays for rain/clouds

#### Customer Animation System
- **Customer States**:
  - **Entering**: Moving from entrance to table
  - **Ordering**: Stationary with thought bubble (💭)
  - **Eating**: Stationary with fork/knife icon (🍴)
  - **Leaving**: Moving from table to exit
- **Color Coding**:
  - **Green**: High satisfaction (80%+)
  - **Orange**: Medium satisfaction (50-80%)
  - **Red**: Low satisfaction (below 50%)

#### Restaurant Stats Panel
- **Location**: Below restaurant canvas
- **Layout**: Three stat boxes side-by-side

##### Cash Display
- **Label**: "Cash:"
- **Color**: Green text
- **Format**: "$XX,XXX.XX"
- **Function**: Shows available money
- **Warning**: Turns red when below $5,000

##### Customer Count
- **Label**: "Customers:"
- **Color**: Blue text
- **Format**: Whole numbers
- **Function**: Total customers served today
- **Updates**: Real-time as customers complete orders

##### Satisfaction Display
- **Label**: "Satisfaction:"
- **Color**: Orange text
- **Format**: "XX%"
- **Function**: Average customer satisfaction rating
- **Range**: 0-100%

---

### 🤖 AI Competitors Section

#### Competitor Grid
- **Location**: Bottom-left of main area
- **Layout**: Responsive grid (auto-fit, minimum 180px width)
- **Function**: Shows all 5 AI restaurants' performance

#### Individual Competitor Cards
Each card displays:
- **Restaurant Name**: AI restaurant identifier
- **Market Share**: Current percentage of market
- **Revenue**: Total money earned
- **Satisfaction**: Customer satisfaction percentage
- **Strategy Type**: AI behavior pattern (aggressive, strategic, etc.)

**Card Interactions**:
- **Hover Effect**: Blue border and slight upward movement
- **Color Coding**: Background changes based on performance

---

### 🌸 AI Assistant Sidebar

#### Sakura Avatar
- **Icon**: Cherry blossom emoji (🌸)
- **Name**: "Sakura AI Assistant"
- **Function**: Visual representation of your advisor
- **Styling**: Pink highlight color

#### Strategic Advice Panel
- **Header**: "Strategic Advice"
- **Content**: Dynamic advice based on game state
- **Message Types**:
  - **Warning** (Red border): Financial alerts, competitive threats
  - **Opportunity** (Orange border): Growth suggestions, market openings
  - **Tip** (Blue border): General strategy advice, optimization suggestions

#### Advice Categories
- **Financial Warnings**: Low cash alerts, expense warnings
- **Market Threats**: Dominant competitor alerts, market share loss
- **Satisfaction Issues**: Customer service problems, quality concerns
- **Growth Opportunities**: Expansion suggestions, pricing optimization
- **Contextual Tips**: Situation-specific strategic advice

---

## 🎛️ Control Panel (Bottom Interface)

### 🍽️ Menu Management

#### Menu Items Display
- **Location**: Left section of control panel
- **Scroll Area**: Maximum height 100px with scrollbar
- **Function**: Shows all current menu items

#### Menu Item Cards
Each item displays:
- **Header Row**:
  - Item name (left)
  - Item price (right)
- **Stats Row**:
  - **Pop**: Popularity percentage
  - **★Rating**: Customer rating (1-5 stars)
  - **Profit**: Profit margin percentage
- **Action Buttons**:
  - **Update Price**: Modify item cost
  - **Remove**: Delete item from menu

#### Add New Dish Button
- **Label**: "Add New Dish"
- **Style**: Primary blue button
- **Function**: Opens menu item creation modal

---

### 📢 Marketing Controls

#### Launch Campaign Button
- **Label**: "Launch Campaign"
- **Style**: Secondary gray button
- **Function**: Prompts for marketing budget input
- **Budget Range**: $1,000 - $20,000
- **Effect**: Increases customer satisfaction (~1% per $1,000)
- **Duration**: Benefits last 3 days

#### Campaign Status Display
- **Location**: Below launch button
- **Function**: Shows active campaign information
- **Content**: Campaign type, remaining duration, current effect

---

### ⚙️ Operations Panel

#### Hire Staff Button
- **Label**: "Hire Staff"
- **Style**: Secondary gray button
- **Function**: Adds new employee to restaurant
- **Staff Types**:
  - **Chef**: Improves cooking speed and food quality
  - **Waiter**: Enhances customer service and satisfaction
- **Costs**: Chefs $3,000/day, Waiters $2,500/day
- **Limits**: Maximum 5 of each type

#### Upgrade Equipment Button
- **Label**: "Upgrade Equipment"
- **Style**: Secondary gray button
- **Function**: Improves restaurant efficiency
- **Equipment Types**:
  - **Kitchen**: Basic efficiency boost (+30%)
  - **Oven**: Professional-grade cooking (+40%)
  - **Grill**: High-quality grilling (+35%)
  - **Fryer**: Commercial frying (+25%)
  - **Dishwasher**: Automated cleaning (+20%)

---

## 🔧 Modal Windows & Forms

### 📝 Add Menu Item Modal

#### Modal Structure
- **Background**: Semi-transparent dark overlay
- **Content Box**: Centered, rounded rectangle
- **Title**: "Add New Menu Item"
- **Close Methods**: Cancel button or click outside

#### Form Fields

##### Dish Name Input
- **Type**: Text field
- **Placeholder**: "Dish Name"
- **Validation**: Required, maximum 50 characters
- **Security**: HTML sanitization to prevent XSS

##### Price Input
- **Type**: Number field
- **Placeholder**: "Price ($)"
- **Range**: $1.00 - $1,000.00
- **Step**: $0.01 increments
- **Validation**: Required, positive numbers only

##### Cost Input
- **Type**: Number field
- **Placeholder**: "Cost ($)"
- **Range**: $0.10 - $500.00
- **Step**: $0.01 increments
- **Function**: Ingredient and preparation cost

##### Cook Time Input
- **Type**: Number field
- **Placeholder**: "Cook Time (seconds)"
- **Range**: 1 - 60 seconds
- **Function**: Time required to prepare dish
- **Impact**: Affects customer wait time and satisfaction

#### Action Buttons
- **Add Item**: Submit form and create menu item
- **Cancel**: Close modal without saving

---

### 💰 Price Update Dialog
- **Trigger**: Click "Update Price" on menu item
- **Type**: Browser prompt dialog
- **Input**: New price value
- **Validation**: Same as price input field
- **Effect**: Immediately updates item price

---

### 🗑️ Remove Item Confirmation
- **Trigger**: Click "Remove" on menu item  
- **Type**: Browser confirmation dialog
- **Message**: "Are you sure you want to remove this item?"
- **Actions**: OK (removes item) or Cancel (no action)

---

## 🎯 Game Over Screen

### 📊 Final Results Display

#### Game Over Modal
- **Trigger**: End of Day 7 or early game termination
- **Background**: Full-screen dark overlay (90% opacity)
- **Position**: Centered modal window
- **Z-Index**: 2000 (top layer)

#### Results Content
- **Title**: "Game Over!" in large orange text
- **Final Rankings**: Complete performance breakdown
- **Result Items**: Each restaurant's final statistics

#### Restaurant Result Cards
Each result displays:
- **Rank**: Position (#1, #2, etc.)
- **Name**: Restaurant identifier
- **Score**: Calculated final score
- **Details**:
  - Market Share percentage
  - Total Revenue earned
  - Customer Satisfaction rating

#### Winner Highlighting
- **First Place**: Green background and border
- **Special Styling**: Larger text, trophy indicators
- **Celebration**: Visual emphasis for victory

#### Restart Option
- **Button**: "Play Again"
- **Style**: Primary blue button
- **Function**: Reload page to start new game

---

## 🔔 Notification System

### 📢 Notification Types

#### Success Notifications
- **Background**: Green (#2ecc71)
- **Text**: White
- **Examples**: "Menu item added!", "Price updated!", "Campaign launched!"

#### Error Notifications
- **Background**: Red (#e74c3c)
- **Text**: White
- **Examples**: "Invalid price range", "Not enough cash", "Maximum items reached"

#### Info Notifications
- **Background**: Blue (#3498db)
- **Text**: White
- **Examples**: General information, tips, updates

### 📍 Notification Behavior
- **Position**: Top-right corner of screen
- **Animation**: Slide in from right
- **Duration**: Auto-remove after 3 seconds
- **Z-Index**: 3000 (highest layer)
- **Stacking**: Multiple notifications stack vertically

---

## ⌨️ Keyboard Controls

### 🔤 Keyboard Shortcuts

#### Universal Controls
- **Escape Key**: Close all open modal windows
- **P Key**: Pause/unpause game (if implemented)

#### Form Navigation
- **Tab**: Move between form fields
- **Enter**: Submit active form
- **Escape**: Cancel form input

---

## 📱 Responsive Design

### 💻 Screen Size Adaptations

#### Desktop Layout (1280×720 minimum)
- **Grid System**: CSS Grid with fixed dimensions
- **Optimal Size**: 1280px width, 720px height
- **Scaling**: Fixed aspect ratio, centered on larger screens

#### Component Flexibility
- **Competitor Grid**: Auto-fit columns based on available space
- **Menu Items**: Scrollable area prevents overflow
- **Modal Windows**: Responsive to content size

---

## 🔒 Security Features

### 🛡️ Input Validation

#### Client-Side Validation
- **Number Ranges**: All numeric inputs have min/max constraints
- **Text Length**: String inputs limited to prevent overflow
- **HTML Sanitization**: User content escaped to prevent XSS
- **Type Checking**: Input types enforced at form level

#### Server-Side Security
- **No Server Communication**: Game runs entirely client-side
- **Local Storage**: Browser localStorage for game saves
- **Sandboxed Execution**: No external API calls or file access

---

## 💾 Data Management

### 📁 Game State Storage

#### Auto-Save System
- **Frequency**: Every 30 seconds
- **Storage**: Browser localStorage
- **Data**: Complete game state including progress
- **Recovery**: Automatic restoration on page reload

#### Saved Data Includes
- Current day and time remaining
- Restaurant financial state
- Menu items and configurations
- Staff and equipment levels
- AI competitor states
- Market events and conditions

---

## 🔧 Technical Specifications

### ⚡ Performance Settings

#### Update Frequencies
- **Game Logic**: 1-second intervals (1 FPS)
- **Visual Rendering**: 60 FPS for smooth animation
- **UI Updates**: Real-time response to user input

#### Browser Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 14+
- **JavaScript**: ES6+ features required
- **Canvas Support**: HTML5 Canvas API required
- **Storage**: localStorage API required

---

## 🎨 Visual Design Elements

### 🎯 Color Scheme

#### Primary Colors
- **Background**: Dark navy (#1a1a2e)
- **Panels**: Medium blue (#16213e)
- **Text**: Light gray (#eee)
- **Accents**: Various bright colors for categories

#### Status Colors
- **Success/Money**: Green (#2ecc71)
- **Customers**: Blue (#3498db)
- **Satisfaction**: Orange (#f39c12)
- **Warnings**: Red (#e74c3c)

#### AI Strategy Colors
- **Aggressive**: Red (#e74c3c)
- **Strategic**: Blue (#3498db)
- **Emotional**: Pink (#e91e63)
- **Speed**: Orange (#f39c12)
- **Balanced**: Green (#2ecc71)

### 🖼️ Animation Effects

#### Smooth Transitions
- **Button Hover**: Color change and slight elevation
- **Modal Appearance**: Fade in with scale animation
- **Notifications**: Slide in from right edge
- **Chart Updates**: Smooth line drawing

#### Customer Movement
- **Pathfinding**: Smooth movement between restaurant areas
- **State Transitions**: Visual indicators for customer actions
- **Satisfaction Display**: Color changes based on service quality

---

This instruction manual covers every interactive element and display component in AI Restaurant Battle. Use this reference to understand exactly how each feature works and how to use them effectively in your restaurant management strategy!