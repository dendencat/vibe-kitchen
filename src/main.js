import { GameEngine } from './game/GameEngine.js';
import { localization } from './localization/Localization.js';

// Initialize language switcher
function setupLanguageSwitcher() {
  const languageButtons = document.querySelectorAll('.lang-btn');
  
  languageButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      
      // Update active button
      languageButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update body language attribute
      document.body.setAttribute('data-lang', lang);
      
      // Update localization
      localization.setLanguage(lang);
    });
  });
  
  // Set initial language state
  const currentLang = localization.getCurrentLanguage();
  document.body.setAttribute('data-lang', currentLang);
  const currentBtn = document.querySelector(`[data-lang="${currentLang}"]`);
  if (currentBtn) {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    currentBtn.classList.add('active');
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Initialize localization first
    setupLanguageSwitcher();
    localization.updateAllText();
    
    const gameEngine = new GameEngine();
    console.log('AI Restaurant Battle initialized successfully!');
    
    // Add global error handling
    window.addEventListener('error', (e) => {
      console.error('Game error:', e.error);
    });
    
    // Performance monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    function monitor_performance() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        if (fps < 50) {
          console.warn(`Performance warning: ${fps} FPS`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(monitor_performance);
    }
    
    monitor_performance();
    
  } catch (error) {
    console.error('Failed to initialize game:', error);
    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a2e; color: #fff; font-family: Arial, sans-serif;">
        <div style="text-align: center; padding: 40px; background: #16213e; border-radius: 10px;">
          <h1 style="color: #e74c3c; margin-bottom: 20px;">Game Loading Error</h1>
          <p style="margin-bottom: 20px;">Failed to initialize AI Restaurant Battle.</p>
          <p style="font-size: 14px; color: #95a5a6;">Please refresh the page to try again.</p>
          <button onclick="window.location.reload()" style="
            margin-top: 20px; 
            padding: 10px 20px; 
            background: #3498db; 
            color: white; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer;
          ">Refresh Page</button>
        </div>
      </div>
    `;
  }
});