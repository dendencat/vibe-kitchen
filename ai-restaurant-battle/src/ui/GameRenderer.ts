import { GameState, Restaurant } from '../types/GameTypes';
import { ChartData, CustomerSprite } from '../types/UITypes';
import { GAME_CONSTANTS } from '../utils/Constants';
import { SecurityValidator } from '../utils/SecurityValidator';

export class GameRenderer {
  private revenueChartCanvas: HTMLCanvasElement;
  private restaurantCanvas: HTMLCanvasElement;
  private revenueChartCtx: CanvasRenderingContext2D;
  private restaurantCtx: CanvasRenderingContext2D;
  
  private customerSprites: CustomerSprite[] = [];
  private revenueHistory: Map<string, number[]> = new Map();
  private lastRenderTime: number = 0;
  
  constructor() {
    this.revenueChartCanvas = document.getElementById('revenue-chart-canvas') as HTMLCanvasElement;
    this.restaurantCanvas = document.getElementById('restaurant-canvas') as HTMLCanvasElement;
    this.revenueChartCtx = this.revenueChartCanvas.getContext('2d')!;
    this.restaurantCtx = this.restaurantCanvas.getContext('2d')!;
    
    this.initialize_revenue_history();
  }
  
  private initialize_revenue_history(): void {
    // Initialize empty revenue history for all restaurants
    for (let i = 0; i < 6; i++) {
      this.revenueHistory.set(`restaurant-${i}`, []);
    }
  }
  
  render(gameState: GameState): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastRenderTime;
    this.lastRenderTime = currentTime;
    
    // Update UI elements
    this.update_header(gameState);
    this.update_restaurant_stats(gameState);
    this.update_competitor_cards(gameState);
    this.update_menu_display(gameState);
    
    // Render canvases
    this.render_revenue_chart(gameState);
    this.render_restaurant_view(gameState, deltaTime);
    
    // Update FPS counter if needed
    const fps = Math.round(1000 / deltaTime);
    if (fps < 50) {
      console.warn(`Low FPS: ${fps}`);
    }
  }
  
  private update_header(gameState: GameState): void {
    // Update time display
    document.getElementById('day-counter')!.textContent = `Day ${gameState.currentDay} / 7`;
    document.getElementById('time-remaining')!.textContent = `Time: ${gameState.timeRemaining}s`;
    
    // Update ranking display
    const rankingList = document.getElementById('ranking-list')!;
    const sortedRestaurants = [...gameState.restaurants].sort((a, b) => b.marketShare - a.marketShare);
    
    rankingList.innerHTML = sortedRestaurants.map((restaurant, index) => `
      <div class="ranking-item ${restaurant.type === 'player' ? 'player-ranking' : ''}">
        <span class="rank">#${index + 1}</span>
        <span class="name">${SecurityValidator.escape_html(restaurant.name)}</span>
        <span class="share">${restaurant.marketShare.toFixed(1)}%</span>
      </div>
    `).join('');
  }
  
  private update_restaurant_stats(gameState: GameState): void {
    const player = gameState.restaurants.find(r => r.type === 'player')!;
    
    document.getElementById('cash-display')!.textContent = `$${player.cash.toFixed(2)}`;
    document.getElementById('customer-count')!.textContent = player.customerCount.toString();
    document.getElementById('satisfaction-display')!.textContent = `${player.satisfaction.toFixed(0)}%`;
  }
  
  private update_competitor_cards(gameState: GameState): void {
    const competitorGrid = document.getElementById('competitor-grid')!;
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    
    competitorGrid.innerHTML = competitors.map(competitor => `
      <div class="competitor-card ${competitor.strategyType}">
        <h4>${SecurityValidator.escape_html(competitor.name)}</h4>
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
            <span class="value strategy-${competitor.strategyType}">${competitor.strategyType}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  private update_menu_display(gameState: GameState): void {
    const player = gameState.restaurants.find(r => r.type === 'player')!;
    const menuList = document.getElementById('menu-items')!;
    
    menuList.innerHTML = player.menu.map(item => `
      <div class="menu-item" data-item-id="${item.id}">
        <div class="item-info">
          <span class="item-name">${SecurityValidator.escape_html(item.name)}</span>
          <span class="item-price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="item-stats">
          <span class="popularity">Pop: ${item.popularity.toFixed(0)}%</span>
          <span class="rating">★${item.customerRating.toFixed(1)}</span>
          <span class="profit">Profit: ${item.profitMargin.toFixed(0)}%</span>
        </div>
        <div class="item-actions">
          <button class="btn-small update-price" data-item-id="${item.id}">Update Price</button>
          <button class="btn-small remove-item" data-item-id="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');
  }
  
  private render_revenue_chart(gameState: GameState): void {
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
  
  private render_restaurant_view(gameState: GameState, deltaTime: number): void {
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
  
  private update_customer_sprites(gameState: GameState, deltaTime: number): void {
    const player = gameState.restaurants.find(r => r.type === 'player')!;
    
    // Add new customers based on arrival rate
    if (Math.random() < 0.1 && this.customerSprites.length < 20) {
      this.customerSprites.push({
        id: `customer-${Date.now()}`,
        x: 50,
        y: 350,
        targetX: 250 + Math.random() * 200,
        targetY: 150 + Math.random() * 100,
        satisfaction: player.satisfaction,
        orderTime: 0,
        state: 'entering'
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
  
  private draw_customer_sprites(ctx: CanvasRenderingContext2D): void {
    this.customerSprites.forEach(sprite => {
      // Draw customer as circle
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
  
  update_advice(advice: any): void {
    const adviceContent = document.getElementById('advice-content')!;
    adviceContent.innerHTML = SecurityValidator.escape_html(advice.message);
    adviceContent.className = `advice-content ${advice.type} ${advice.priority}`;
  }
  
  show_game_over(results: any[]): void {
    const gameOverScreen = document.getElementById('game-over')!;
    const finalResults = document.getElementById('final-results')!;
    
    finalResults.innerHTML = `
      <h3>Final Rankings</h3>
      ${results.map((result, index) => `
        <div class="final-result ${index === 0 ? 'winner' : ''}">
          <span class="rank">#${index + 1}</span>
          <span class="name">${SecurityValidator.escape_html(result.name)}</span>
          <span class="score">Score: ${result.score}</span>
          <div class="final-stats">
            <span>Market Share: ${result.marketShare.toFixed(1)}%</span>
            <span>Revenue: $${result.revenue.toFixed(0)}</span>
            <span>Satisfaction: ${result.satisfaction.toFixed(0)}%</span>
          </div>
        </div>
      `).join('')}
    `;
    
    gameOverScreen.classList.remove('hidden');
  }
}