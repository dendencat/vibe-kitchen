import { GameEngine } from '../game/GameEngine';
import { SecurityValidator } from '../utils/SecurityValidator';
import { PlayerAction } from '../types/GameTypes';

export class InputHandler {
  private gameEngine: GameEngine;
  
  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }
  
  initialize(): void {
    this.setup_menu_controls();
    this.setup_marketing_controls();
    this.setup_operations_controls();
    this.setup_modal_controls();
    this.setup_game_controls();
  }
  
  private setup_menu_controls(): void {
    // Add menu item button
    const addMenuBtn = document.getElementById('add-menu-item');
    if (addMenuBtn) {
      addMenuBtn.addEventListener('click', () => {
        document.getElementById('menu-modal')?.classList.remove('hidden');
      });
    }
    
    // Menu item form submission
    const menuForm = document.getElementById('menu-item-form');
    if (menuForm) {
      menuForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handle_add_menu_item();
      });
    }
    
    // Dynamic menu item controls
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (target.classList.contains('update-price')) {
        const itemId = target.dataset.itemId;
        if (itemId) this.handle_update_price(itemId);
      }
      
      if (target.classList.contains('remove-item')) {
        const itemId = target.dataset.itemId;
        if (itemId) this.handle_remove_item(itemId);
      }
    });
  }
  
  private setup_marketing_controls(): void {
    const launchCampaignBtn = document.getElementById('launch-campaign');
    if (launchCampaignBtn) {
      launchCampaignBtn.addEventListener('click', () => {
        this.handle_launch_campaign();
      });
    }
  }
  
  private setup_operations_controls(): void {
    const hireStaffBtn = document.getElementById('hire-staff');
    if (hireStaffBtn) {
      hireStaffBtn.addEventListener('click', () => {
        this.handle_hire_staff();
      });
    }
    
    const upgradeEquipmentBtn = document.getElementById('upgrade-equipment');
    if (upgradeEquipmentBtn) {
      upgradeEquipmentBtn.addEventListener('click', () => {
        this.handle_upgrade_equipment();
      });
    }
  }
  
  private setup_modal_controls(): void {
    const cancelMenuBtn = document.getElementById('cancel-menu');
    if (cancelMenuBtn) {
      cancelMenuBtn.addEventListener('click', () => {
        document.getElementById('menu-modal')?.classList.add('hidden');
        this.clear_menu_form();
      });
    }
    
    // Close modal on outside click
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('modal')) {
        target.classList.add('hidden');
      }
    });
  }
  
  private setup_game_controls(): void {
    const restartBtn = document.getElementById('restart-game');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Escape':
          this.close_all_modals();
          break;
        case 'p':
        case 'P':
          this.toggle_pause();
          break;
      }
    });
  }
  
  private handle_add_menu_item(): void {
    try {
      const nameInput = document.getElementById('item-name') as HTMLInputElement;
      const priceInput = document.getElementById('item-price') as HTMLInputElement;
      const costInput = document.getElementById('item-cost') as HTMLInputElement;
      const cookTimeInput = document.getElementById('item-cooktime') as HTMLInputElement;
      
      const validatedItem = SecurityValidator.validate_menu_item_input({
        name: nameInput.value,
        price: parseFloat(priceInput.value),
        cost: parseFloat(costInput.value),
        cookTime: parseInt(cookTimeInput.value)
      });
      
      const action: PlayerAction = {
        type: 'menu',
        action: 'add_item',
        parameters: validatedItem,
        timestamp: Date.now()
      };
      
      this.gameEngine.execute_action('player', action);
      
      // Close modal and clear form
      document.getElementById('menu-modal')?.classList.add('hidden');
      this.clear_menu_form();
      
      this.show_notification('Menu item added successfully!', 'success');
    } catch (error) {
      this.show_notification(error.message, 'error');
    }
  }
  
  private handle_update_price(itemId: string): void {
    const newPriceStr = prompt('Enter new price:');
    if (!newPriceStr) return;
    
    try {
      const newPrice = SecurityValidator.validate_number(parseFloat(newPriceStr), 1, 1000);
      
      const action: PlayerAction = {
        type: 'menu',
        action: 'update_price',
        parameters: { itemId, price: newPrice },
        timestamp: Date.now()
      };
      
      this.gameEngine.execute_action('player', action);
      this.show_notification('Price updated!', 'success');
    } catch (error) {
      this.show_notification(error.message, 'error');
    }
  }
  
  private handle_remove_item(itemId: string): void {
    if (confirm('Are you sure you want to remove this item?')) {
      const action: PlayerAction = {
        type: 'menu',
        action: 'remove_item',
        parameters: { itemId },
        timestamp: Date.now()
      };
      
      this.gameEngine.execute_action('player', action);
      this.show_notification('Item removed!', 'success');
    }
  }
  
  private handle_launch_campaign(): void {
    const budgetStr = prompt('Enter marketing budget ($1000-$20000):');
    if (!budgetStr) return;
    
    try {
      const budget = SecurityValidator.validate_number(parseFloat(budgetStr), 1000, 20000);
      
      const action: PlayerAction = {
        type: 'marketing',
        action: 'launch_campaign',
        parameters: {
          campaignType: 'general',
          budget,
          duration: 3
        },
        timestamp: Date.now()
      };
      
      this.gameEngine.execute_action('player', action);
      this.show_notification(`Marketing campaign launched! Budget: $${budget}`, 'success');
    } catch (error) {
      this.show_notification(error.message, 'error');
    }
  }
  
  private handle_hire_staff(): void {
    const staffType = confirm('Hire a chef? (OK for chef, Cancel for waiter)') ? 'chef' : 'waiter';
    
    const action: PlayerAction = {
      type: 'operations',
      action: 'hire_staff',
      parameters: { staffType },
      timestamp: Date.now()
    };
    
    this.gameEngine.execute_action('player', action);
    this.show_notification(`New ${staffType} hired!`, 'success');
  }
  
  private handle_upgrade_equipment(): void {
    const action: PlayerAction = {
      type: 'operations',
      action: 'upgrade_equipment',
      parameters: { equipmentType: 'kitchen' },
      timestamp: Date.now()
    };
    
    this.gameEngine.execute_action('player', action);
    this.show_notification('Equipment upgraded!', 'success');
  }
  
  private clear_menu_form(): void {
    const form = document.getElementById('menu-item-form') as HTMLFormElement;
    if (form) form.reset();
  }
  
  private close_all_modals(): void {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.add('hidden');
    });
  }
  
  private toggle_pause(): void {
    // To be implemented with game engine pause functionality
  }
  
  private show_notification(message: string, type: 'success' | 'error' | 'info'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}