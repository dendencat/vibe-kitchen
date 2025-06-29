import { GameEngine } from './game/GameEngine.js';

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    const gameEngine = new GameEngine();
    console.log('AI Restaurant Battle initialized successfully!');
    
    // Add global error handling
    window.addEventListener('error', (e) => {
      console.error('Game error, e.error);
    });
    
    // Performance monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    function monitor_performance() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        if (fps 
        
          Game Loading Error
          Failed to initialize AI Restaurant Battle.
          Please refresh the page to try again.
          Refresh Page
        
      
    `;
  }
});