import { GameState, Restaurant } from '../types/GameTypes.js';
import { ChartData, CustomerSprite } from '../types/UITypes.js';
import { GAME_CONSTANTS } from '../utils/Constants.js';
import { SecurityValidator } from '../utils/SecurityValidator.js';

export class GameRenderer {
  revenueChartCanvas;
  restaurantCanvas;
  revenueChartCtx;
  restaurantCtx;
  customerSprites [];
  revenueHistory new Map();
  lastRenderTime 0;
  
  constructor() {
    this.revenueChartCanvas = document.getElementById('revenue-chart-canvas');
    this.restaurantCanvas = document.getElementById('restaurant-canvas');
    this.revenueChartCtx = this.revenueChartCanvas.getContext('2d')!;
    this.restaurantCtx = this.restaurantCanvas.getContext('2d')!;
    
    this.initialize_revenue_history();
  }
  
  initialize_revenue_history(){
    // Initialize empty revenue history for all restaurants
    for (let i = 0; i  b.marketShare - a.marketShare);
    
    rankingList.innerHTML = sortedRestaurants.map((restaurant, index) => `
      
        #${index + 1}
        ${SecurityValidator.escape_html(restaurant.name)}
        ${restaurant.marketShare.toFixed(1)}%
      
    `).join('');
  }
  
  update_restaurant_stats(gameState){
    const player = gameState.restaurants.find(r => r.type === 'player')!;
    
    document.getElementById('cash-display')!.textContent = `$${player.cash.toFixed(2)}`;
    document.getElementById('customer-count')!.textContent = player.customerCount.toString();
    document.getElementById('satisfaction-display')!.textContent = `${player.satisfaction.toFixed(0)}%`;
  }
  
  update_competitor_cards(gameState){
    const competitorGrid = document.getElementById('competitor-grid')!;
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    
    competitorGrid.innerHTML = competitors.map(competitor => `
      
        ${SecurityValidator.escape_html(competitor.name)}

            Market Share:
            ${competitor.marketShare.toFixed(1)}%

            Revenue:
            $${competitor.revenue.toFixed(0)}

            Satisfaction:
            ${competitor.satisfaction.toFixed(0)}%

            Strategy:
            ${competitor.strategyType}

    `).join('');
  }
  
  update_menu_display(gameState){
    const player = gameState.restaurants.find(r => r.type === 'player')!;
    const menuList = document.getElementById('menu-items')!;
    
    menuList.innerHTML = player.menu.map(item => `

          ${SecurityValidator.escape_html(item.name)}
          $${item.price.toFixed(2)}

          Pop: ${item.popularity.toFixed(0)}%
          ★${item.customerRating.toFixed(1)}
          Profit: ${item.profitMargin.toFixed(0)}%

          Update Price
  Remove;
    `).join('');
  }
  
  render_revenue_chart(gameState){
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
    
    gameState.restaurants.forEach((restaurant, index) => {
      const history = this.revenueHistory.get(`restaurant-${index}`) || [];
      ctx.strokeStyle = colors[index];
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
  
  render_restaurant_view(gameState, deltaTime){
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
      { x, y: 150 },
      { x, y: 150 },
      { x, y: 150 },
      { x, y: 250 },
      { x, y: 250 },
      { x, y: 250 }
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
    const player = gameState.restaurants.find(r => r.type === 'player')!;
    
    // Add new customers based on arrival rate
    if (Math.random()  {
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
              sprite.targetX = 550;
              sprite.targetY = 350;
            }
            break;
          case 'leaving':
            if (sprite.x > 540) {
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
    const adviceContent = document.getElementById('advice-content')!;
    adviceContent.innerHTML = SecurityValidator.escape_html(advice.message);
    adviceContent.className = `advice-content ${advice.type} ${advice.priority}`;
  }
  
  show_game_over(results){
    const gameOverScreen = document.getElementById('game-over')!;
    const finalResults = document.getElementById('final-results')!;
    
    finalResults.innerHTML = `
      Final Rankings
      ${results.map((result, index) => `
        
          #${index + 1}
          ${SecurityValidator.escape_html(result.name)}
          Score: ${result.score}
          
            Market Share: ${result.marketShare.toFixed(1)}%
            Revenue: $${result.revenue.toFixed(0)}
            Satisfaction: ${result.satisfaction.toFixed(0)}%

      `).join('')}
    `;
    
    gameOverScreen.classList.remove('hidden');
  }
}