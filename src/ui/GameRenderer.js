import { GameState, Restaurant } from '../types/GameTypes.js';
import { ChartData, CustomerSprite } from '../types/UITypes.js';
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { SecurityValidator } from '../utils/SecurityValidator.js';

export class GameRenderer {
  revenueChartCanvas;
  restaurantCanvas;
  revenueChartCtx;
  restaurantCtx;
  customerSprites = [];
  revenueHistory = new Map();
  lastRenderTime = 0;
  
  constructor() {
    this.revenueChartCanvas = document.getElementById('revenue-chart-canvas');
    this.restaurantCanvas = document.getElementById('restaurant-canvas');
    this.revenueChartCtx = this.revenueChartCanvas?.getContext('2d');
    this.restaurantCtx = this.restaurantCanvas?.getContext('2d');
    
    this.initialize_revenue_history();
  }
  
  initialize_revenue_history(){
    // Initialize empty revenue history for all restaurants
    for (let i = 0; i < 6; i++) {
      this.revenueHistory.set(`restaurant-${i}`, []);
    }
  }
  
  render(gameState){
    // Update UI elements
    this.update_game_timer(gameState);
    this.update_ranking_display(gameState);
    this.update_restaurant_stats(gameState);
    this.update_competitor_cards(gameState);
    this.update_menu_display(gameState);
    
    // Render charts and visuals
    this.render_revenue_chart(gameState);
    this.render_restaurant_view(gameState, 16); // Assume 60 FPS
  }
  
  update_game_timer(gameState){
    const dayCounter = document.getElementById('day-counter');
    const timeRemaining = document.getElementById('time-remaining');
    
    if (dayCounter) {
      dayCounter.textContent = `Day ${gameState.currentDay}`;
    }
    
    if (timeRemaining) {
      const minutes = Math.floor(gameState.timeRemaining / 60);
      const seconds = gameState.timeRemaining % 60;
      timeRemaining.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  update_ranking_display(gameState){
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    
    const sortedRestaurants = [...gameState.restaurants].sort((a, b) => b.marketShare - a.marketShare);
    
    rankingList.innerHTML = sortedRestaurants.map((restaurant, index) => `
      <div class="ranking-item ${restaurant.type === 'player' ? 'player' : 'ai'}">
        <span class="rank">#${index + 1}</span>
        <span class="name">${SecurityValidator.escape_html(restaurant.name)}</span>
        <span class="share">${restaurant.marketShare.toFixed(1)}%</span>
      </div>
    `).join('');
  }
  
  update_restaurant_stats(gameState){
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return;
    
    const cashDisplay = document.getElementById('cash-display');
    const customerCount = document.getElementById('customer-count');
    const satisfactionDisplay = document.getElementById('satisfaction-display');
    
    if (cashDisplay) {
      cashDisplay.textContent = `$${player.cash.toFixed(2)}`;
    }
    if (customerCount) {
      customerCount.textContent = player.customerCount.toString();
    }
    if (satisfactionDisplay) {
      satisfactionDisplay.textContent = `${player.satisfaction.toFixed(0)}%`;
    }
  }
  
  update_competitor_cards(gameState){
    const competitorGrid = document.getElementById('competitor-grid');
    if (!competitorGrid) return;
    
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    
    competitorGrid.innerHTML = competitors.map(competitor => `
      <div class="competitor-card">
        <h3>${SecurityValidator.escape_html(competitor.name)}</h3>
        <div class="competitor-stats">
          <div class="stat">
            <span class="label">Market Share:</span>
            <span class="value">${competitor.marketShare.toFixed(1)}%</span>
          </div>
          <div class="stat">
            <span class="label">Revenue:</span>
            <span class="value">$${competitor.revenue.toFixed(0)}</span>
          </div>
          <div class="stat">
            <span class="label">Satisfaction:</span>
            <span class="value">${competitor.satisfaction.toFixed(0)}%</span>
          </div>
          <div class="stat">
            <span class="label">Strategy:</span>
            <span class="value">${competitor.strategyType || 'balanced'}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  update_menu_display(gameState){
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return;
    
    const menuList = document.getElementById('menu-items');
    if (!menuList) return;
    
    menuList.innerHTML = player.menu.map(item => `
      <div class="menu-item">
        <div class="item-header">
          <span class="item-name">${SecurityValidator.escape_html(item.name)}</span>
          <span class="item-price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="item-stats">
          <span>Pop: ${item.popularity.toFixed(0)}%</span>
          <span>★${item.customerRating.toFixed(1)}</span>
          <span>Profit: ${item.profitMargin.toFixed(0)}%</span>
        </div>
        <div class="item-actions">
          <button class="update-price" data-item-id="${item.id}">Update Price</button>
          <button class="remove-item" data-item-id="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');
  }
  
  render_revenue_chart(gameState){
    if (!this.revenueChartCtx) return;
    
    const ctx = this.revenueChartCtx;
    const width = this.revenueChartCanvas.width;
    const height = this.revenueChartCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Update revenue history
    gameState.restaurants.forEach((restaurant, index) => {
      const history = this.revenueHistory.get(`restaurant-${index}`) || [];
      history.push(restaurant.revenue);
      if (history.length > 60) history.shift(); // Keep last 60 seconds
      this.revenueHistory.set(`restaurant-${index}`, history);
    });
    
    // Draw chart
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    const maxRevenue = Math.max(...Array.from(this.revenueHistory.values()).flat());
    
    if (maxRevenue > 0) {
      gameState.restaurants.forEach((restaurant, index) => {
        const history = this.revenueHistory.get(`restaurant-${index}`) || [];
        ctx.strokeStyle = colors[index] || '#333';
        ctx.lineWidth = restaurant.type === 'player' ? 3 : 1;
        
        ctx.beginPath();
        history.forEach((revenue, i) => {
          const x = (i / 60) * width;
          const y = height - (revenue / maxRevenue) * height * 0.9;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    }
  }
  
  render_restaurant_view(gameState, deltaTime){
    if (!this.restaurantCtx) return;
    
    const ctx = this.restaurantCtx;
    const width = this.restaurantCanvas.width;
    const height = this.restaurantCanvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    // Draw restaurant floor
    ctx.fillStyle = '#8b6f47';
    ctx.fillRect(50, 100, 500, 250);
    
    // Draw kitchen area
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(50, 100, 150, 100);
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText('Kitchen', 100, 150);
    
    // Draw dining area
    ctx.fillStyle = '#654321';
    ctx.fillRect(200, 100, 350, 250);
    
    // Draw tables
    const tables = [
      { x: 250, y: 150 },
      { x: 350, y: 150 },
      { x: 450, y: 150 },
      { x: 250, y: 250 },
      { x: 350, y: 250 },
      { x: 450, y: 250 }
    ];
    
    tables.forEach(table => {
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(table.x - 20, table.y - 20, 40, 40);
    });
    
    // Update and draw customer sprites
    this.update_customer_sprites(gameState, deltaTime);
    this.draw_customer_sprites(ctx);
    
    // Draw weather effect
    if (gameState.weatherCondition === 'rainy') {
      ctx.fillStyle = 'rgba(100, 100, 150, 0.3)';
      ctx.fillRect(0, 0, width, height);
    }
  }
  
  update_customer_sprites(gameState, deltaTime){
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return;
    
    // Add new customers based on arrival rate
    if (Math.random() < 0.02) { // 2% chance per frame
      this.customerSprites.push({
        x: 580,
        y: 350,
        targetX: 300 + Math.random() * 200,
        targetY: 200 + Math.random() * 100,
        state: 'entering',
        satisfaction: player.satisfaction + (Math.random() - 0.5) * 20,
        orderTime: 0
      });
    }
    
    // Update existing customers
    this.customerSprites = this.customerSprites.filter(sprite => {
      // Move towards target
      const dx = sprite.targetX - sprite.x;
      const dy = sprite.targetY - sprite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 2) {
        sprite.x += (dx / distance) * 2;
        sprite.y += (dy / distance) * 2;
      } else {
        // State transitions
        switch (sprite.state) {
          case 'entering':
            sprite.state = 'ordering';
            sprite.orderTime = Date.now();
            break;
          case 'ordering':
            if (Date.now() - sprite.orderTime > 3000) {
              sprite.state = 'eating';
              sprite.orderTime = Date.now();
            }
            break;
          case 'eating':
            if (Date.now() - sprite.orderTime > 5000) {
              sprite.state = 'leaving';
              sprite.targetX = 580;
              sprite.targetY = 350;
            }
            break;
          case 'leaving':
            if (sprite.x > 560) {
              return false; // Remove sprite
            }
            break;
        }
      }
      
      return true;
    });
  }
  
  draw_customer_sprites(ctx){
    this.customerSprites.forEach(sprite => {
      // Draw customer
      ctx.beginPath();
      ctx.arc(sprite.x, sprite.y, 10, 0, Math.PI * 2);
      
      // Color based on satisfaction
      if (sprite.satisfaction > 80) {
        ctx.fillStyle = '#2ecc71';
      } else if (sprite.satisfaction > 50) {
        ctx.fillStyle = '#f39c12';
      } else {
        ctx.fillStyle = '#e74c3c';
      }
      
      ctx.fill();
      
      // Draw state indicator
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      switch (sprite.state) {
        case 'ordering':
          ctx.fillText('💭', sprite.x - 5, sprite.y - 15);
          break;
        case 'eating':
          ctx.fillText('🍴', sprite.x - 5, sprite.y - 15);
          break;
      }
    });
  }
  
  update_advice(advice){
    const adviceContent = document.getElementById('advice-content');
    if (adviceContent) {
      adviceContent.innerHTML = SecurityValidator.escape_html(advice.message);
      adviceContent.className = `advice-content ${advice.type} ${advice.priority}`;
    }
  }
  
  show_game_over(results){
    const gameOverScreen = document.getElementById('game-over');
    const finalResults = document.getElementById('final-results');
    
    if (finalResults) {
      finalResults.innerHTML = `
        <h2>Final Rankings</h2>
        ${results.map((result, index) => `
          <div class="result-item ${index === 0 ? 'winner' : ''}">
            <span class="rank">#${index + 1}</span>
            <span class="name">${SecurityValidator.escape_html(result.name)}</span>
            <span class="score">Score: ${result.score}</span>
            <div class="result-details">
              Market Share: ${result.marketShare.toFixed(1)}%
              Revenue: $${result.revenue.toFixed(0)}
              Satisfaction: ${result.satisfaction.toFixed(0)}%
            </div>
          </div>
        `).join('')}
      `;
    }
    
    if (gameOverScreen) {
      gameOverScreen.classList.remove('hidden');
    }
  }
}