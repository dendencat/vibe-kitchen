# Screenshot Guide for AI Restaurant Battle

## 📸 Manual Screenshot Instructions

### 1. Start Your Local Server
```bash
python3 -m http.server 8080
```

### 2. Capture Opening Screen
1. Navigate to `http://localhost:8080/opening.html`
2. Take screenshot of English version
3. Click "日本語" button
4. Take screenshot of Japanese version

### 3. Capture Main Game
1. Click "Start Your Restaurant" / "レストランを始める"
2. Wait for game to load
3. Take screenshot of main game interface
4. Click "JP" button in top-right
5. Take screenshot of Japanese interface

### 4. Capture Game Features
- **Menu Modal**: Click "Add New Dish" and screenshot
- **AI Competitors**: Scroll to AI competitors section
- **Market Share Ranking**: Focus on top bar
- **Sakura AI Assistant**: Capture advice panel

## 🚀 Uploading to GitHub

### Method 1: GitHub Web Interface
1. Go to your GitHub repository
2. Navigate to where you want to add screenshots (e.g., create a `screenshots` folder)
3. Click "Add file" → "Upload files"
4. Drag and drop your screenshots
5. Add commit message: "Add game screenshots"
6. Click "Commit changes"

### Method 2: Using Git Command Line
```bash
# Create screenshots directory
mkdir screenshots

# Move your screenshots to the directory
# (Take screenshots and save them to this folder)

# Add to git
git add screenshots/

# Commit
git commit -m "Add game screenshots for English and Japanese versions"

# Push to GitHub
git push origin main
```

### Method 3: Add to README
Once uploaded, you can reference them in your README.md:

```markdown
# AI Restaurant Battle

## Screenshots

### Opening Screen
![Opening Screen English](screenshots/opening-screen-english.png)
![Opening Screen Japanese](screenshots/opening-screen-japanese.png)

### Main Game
![Game Interface English](screenshots/game-main-screen.png)
![Game Interface Japanese](screenshots/game-main-screen-japanese.png)

### Features
![Menu Modal](screenshots/menu-modal.png)
```

## 🎮 Automated Screenshot Capture (Optional)

If you have Node.js and want to automate screenshot capture:

1. Install Playwright:
```bash
npm install playwright
```

2. Run the capture script:
```bash
node capture-screenshots.js
```

This will automatically capture all screenshots and save them in a `screenshots` directory.

## 📁 Recommended Screenshot Structure

```
screenshots/
├── opening-screen-english.png
├── opening-screen-japanese.png
├── game-main-screen.png
├── game-main-screen-japanese.png
├── menu-modal.png
├── ai-competitors.png
├── market-ranking.png
└── sakura-ai-advice.png
```

## 🌟 Best Practices

1. **Resolution**: Use 1280x720 or higher for clarity
2. **Format**: PNG for best quality
3. **Naming**: Use descriptive names with language suffix
4. **Organization**: Group by feature or screen
5. **Compression**: Optimize images before uploading (use tools like TinyPNG)

## 📝 Creating a Visual README

After uploading screenshots, create an attractive README:

```markdown
<div align="center">
  <h1>🍽️ AI Restaurant Battle 🤖</h1>
  <p>Compete against AI restaurateurs in the charming town of Sakura Valley!</p>
  
  <img src="screenshots/opening-screen-english.png" width="45%" alt="Opening Screen">
  <img src="screenshots/game-main-screen.png" width="45%" alt="Game Interface">
</div>

## 🌍 Multi-Language Support

<table>
  <tr>
    <td><img src="screenshots/opening-screen-english.png" alt="English"></td>
    <td><img src="screenshots/opening-screen-japanese.png" alt="Japanese"></td>
  </tr>
  <tr>
    <td align="center">English</td>
    <td align="center">日本語</td>
  </tr>
</table>
```

This will create a professional-looking repository with visual documentation!