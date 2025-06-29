export class LocalizationManager {
  currentLanguage = 'en';
  languages = {
    en: {
      // Opening Screen
      gameTitle: 'AI Restaurant Battle',
      welcomeTitle: 'Welcome to Sakura Valley',
      storyTitle: 'Your Culinary Journey Begins',
      storyText: `You've just arrived in the charming town of Sakura Valley, a place where cherry blossoms bloom year-round and the locals have an incredible passion for good food.

After years of working in big city restaurants, you've decided to open your own establishment in this peaceful town. But you're not alone - five other ambitious restaurateurs have had the same idea!

The mayor has announced that in one week, the town will officially recognize the most successful restaurant as "Sakura Valley's Premier Dining Establishment" - a title that comes with prestige, a prime location, and the hearts of the townspeople.

Can you build the best restaurant and win the hearts (and stomachs) of Sakura Valley? Your culinary adventure starts now!`,
      startGame: 'Start Your Restaurant',
      languageLabel: 'Language',
      
      // Game Interface
      dayCounter: 'Day',
      timeRemaining: 'Time',
      marketShareRanking: 'Market Share Ranking',
      cash: 'Cash',
      customers: 'Customers',
      satisfaction: 'Satisfaction',
      
      // AI Assistant
      aiAssistantName: 'Sakura AI Assistant',
      strategicAdvice: 'Strategic Advice',
      marketAnalysis: 'Market Analysis',
      welcomeMessage: "Welcome! I'm here to help you succeed in the restaurant business.",
      
      // Control Panel
      menuManagement: 'Menu Management',
      marketing: 'Marketing',
      operations: 'Operations',
      aiCompetitors: 'AI Competitors',
      addNewDish: 'Add New Dish',
      launchCampaign: 'Launch Campaign',
      hireStaff: 'Hire Staff',
      upgradeEquipment: 'Upgrade Equipment',
      
      // Menu Modal
      addNewMenuItem: 'Add New Menu Item',
      dishName: 'Dish Name',
      price: 'Price ($)',
      cost: 'Cost ($)',
      cookTime: 'Cook Time (seconds)',
      addItem: 'Add Item',
      cancel: 'Cancel',
      updatePrice: 'Update Price',
      remove: 'Remove',
      
      // Stats and Labels
      marketShare: 'Market Share',
      revenue: 'Revenue',
      strategy: 'Strategy',
      popularity: 'Pop',
      rating: 'Rating',
      profit: 'Profit',
      
      // Game Over
      gameOver: 'Game Over!',
      finalRankings: 'Final Rankings',
      playAgain: 'Play Again',
      score: 'Score',
      
      // Notifications
      menuItemAdded: 'Menu item added successfully!',
      priceUpdated: 'Price updated!',
      itemRemoved: 'Item removed!',
      campaignLaunched: 'Marketing campaign launched!',
      staffHired: 'New staff member hired!',
      equipmentUpgraded: 'Equipment upgraded!',
      budget: 'Budget',
      
      // AI Restaurant Names
      aiRestaurants: {
        aggressive: 'Fire Grill',
        strategic: 'Wisdom Table',
        emotional: 'Hospitality House',
        speed: 'Lightning Kitchen',
        balanced: 'Harmony Restaurant'
      },
      
      // AI Strategies
      aiStrategies: {
        aggressive: 'Aggressive pricing and marketing',
        strategic: 'Data-driven strategic decisions',
        emotional: 'Customer satisfaction and loyalty focus',
        speed: 'Fast service and high turnover',
        balanced: 'Balanced approach to all aspects'
      },
      
      // Starting Menu Items
      startingMenuItems: {
        burger: 'Classic Burger',
        salad: 'Caesar Salad',
        chicken: 'Grilled Chicken'
      },
      
      // Staff Types
      staffTypes: {
        chef: 'Chef',
        waiter: 'Waiter',
        manager: 'Manager'
      },
      
      // Prompts
      enterNewPrice: 'Enter new price:',
      enterMarketingBudget: 'Enter marketing budget ($1000-$20000):',
      confirmRemoveItem: 'Are you sure you want to remove this item?',
      hireChefOrWaiter: 'Hire a chef? (OK for chef, Cancel for waiter)',
      
      // Weather Conditions
      weather: {
        sunny: 'Sunny',
        rainy: 'Rainy',
        cloudy: 'Cloudy'
      }
    },
    
    ja: {
      // Opening Screen
      gameTitle: 'AI レストランバトル',
      welcomeTitle: '桜谷へようこそ',
      storyTitle: 'あなたの料理の旅が始まります',
      storyText: `一年中桜が咲き誇り、地元の人々が美味しい料理に情熱を注ぐ魅力的な町、桜谷にあなたは到着しました。

大都市のレストランで長年働いた後、この平和な町で自分の店を開くことを決意しました。しかし、あなただけではありません。他の5人の野心的なレストラン経営者も同じアイデアを持っていたのです！

町長は、一週間後に町が最も成功したレストランを「桜谷プレミアダイニング」として公式に認定すると発表しました。この称号には名声、一等地、そして町の人々の心が伴います。

最高のレストランを作り、桜谷の人々の心（そして胃袋）を掴むことができるでしょうか？あなたの料理の冒険が今始まります！`,
      startGame: 'レストランを始める',
      languageLabel: '言語',
      
      // Game Interface
      dayCounter: '日目',
      timeRemaining: '残り時間',
      marketShareRanking: '市場シェアランキング',
      cash: '現金',
      customers: '顧客数',
      satisfaction: '満足度',
      
      // AI Assistant
      aiAssistantName: '桜AIアシスタント',
      strategicAdvice: '戦略アドバイス',
      marketAnalysis: '市場分析',
      welcomeMessage: 'ようこそ！レストラン経営の成功をお手伝いします。',
      
      // Control Panel
      menuManagement: 'メニュー管理',
      marketing: 'マーケティング',
      operations: '運営',
      aiCompetitors: 'AI競合店',
      addNewDish: '新しい料理を追加',
      launchCampaign: 'キャンペーン開始',
      hireStaff: 'スタッフ雇用',
      upgradeEquipment: '設備アップグレード',
      
      // Menu Modal
      addNewMenuItem: '新しいメニュー項目を追加',
      dishName: '料理名',
      price: '価格（円）',
      cost: '原価（円）',
      cookTime: '調理時間（秒）',
      addItem: '項目を追加',
      cancel: 'キャンセル',
      updatePrice: '価格更新',
      remove: '削除',
      
      // Stats and Labels
      marketShare: '市場シェア',
      revenue: '売上',
      strategy: '戦略',
      popularity: '人気',
      rating: '評価',
      profit: '利益',
      
      // Game Over
      gameOver: 'ゲーム終了！',
      finalRankings: '最終ランキング',
      playAgain: 'もう一度プレイ',
      score: 'スコア',
      
      // Notifications
      menuItemAdded: 'メニュー項目が正常に追加されました！',
      priceUpdated: '価格が更新されました！',
      itemRemoved: '項目が削除されました！',
      campaignLaunched: 'マーケティングキャンペーンが開始されました！',
      staffHired: '新しいスタッフが雇用されました',
      equipmentUpgraded: '設備がアップグレードされました！',
      budget: '予算',
      
      // AI Restaurant Names
      aiRestaurants: {
        aggressive: 'ファイアグリル',
        strategic: 'ウィズダムテーブル',
        emotional: 'ホスピタリティハウス',
        speed: 'ライトニングキッチン',
        balanced: 'ハーモニーレストラン'
      },
      
      // AI Strategies
      aiStrategies: {
        aggressive: '積極的な価格設定とマーケティング',
        strategic: 'データ主導の戦略的意思決定',
        emotional: '顧客満足度とロイヤリティ重視',
        speed: '迅速なサービスと高回転率',
        balanced: '全側面にバランスの取れたアプローチ'
      },
      
      // Starting Menu Items
      startingMenuItems: {
        burger: 'クラシックバーガー',
        salad: 'シーザーサラダ',
        chicken: 'グリルチキン'
      },
      
      // Staff Types
      staffTypes: {
        chef: 'シェフ',
        waiter: 'ウェイター',
        manager: 'マネージャー'
      },
      
      // Prompts
      enterNewPrice: '新しい価格を入力してください：',
      enterMarketingBudget: 'マーケティング予算を入力してください（1000-20000円）：',
      confirmRemoveItem: 'この項目を削除してもよろしいですか？',
      hireChefOrWaiter: 'シェフを雇いますか？（OKでシェフ、キャンセルでウェイター）',
      
      // Weather Conditions
      weather: {
        sunny: '晴れ',
        rainy: '雨',
        cloudy: '曇り'
      }
    }
  };
  
  constructor() {
    this.loadLanguagePreference();
  }
  
  loadLanguagePreference() {
    const saved = localStorage.getItem('gameLanguage');
    if (saved && this.languages[saved]) {
      this.currentLanguage = saved;
    }
  }
  
  saveLanguagePreference() {
    localStorage.setItem('gameLanguage', this.currentLanguage);
  }
  
  setLanguage(lang) {
    if (this.languages[lang]) {
      this.currentLanguage = lang;
      this.saveLanguagePreference();
      this.updateAllText();
    }
  }
  
  getText(key) {
    const keys = key.split('.');
    let value = this.languages[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return value || key;
  }
  
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  getAvailableLanguages() {
    return Object.keys(this.languages);
  }
  
  updateAllText() {
    // Update all text content in the page
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const text = this.getText(key);
      
      if (element.tagName === 'INPUT' && element.type !== 'submit') {
        element.placeholder = text;
      } else {
        element.textContent = text;
      }
    });
    
    // Update placeholder text for inputs with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const text = this.getText(key);
      element.placeholder = text;
    });
    
    // Trigger custom event for components that need to update
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: this.currentLanguage }
    }));
  }
}

// Global instance
export const localization = new LocalizationManager();