import { localization } from '../localization/Localization.js';

export class AdviceTemplates {
  static getAdviceMessages() {
    const lang = localization.getCurrentLanguage();
    
    const messages = {
      en: {
        // Financial Advice
        lowCash: [
          "Cash is running low! Consider reducing expenses or launching a marketing campaign to boost revenue.",
          "Your cash flow is concerning. Focus on high-profit menu items and efficient operations.",
          "Time to be strategic with spending. Prioritize revenue-generating activities over expansion."
        ],
        
        highCash: [
          "Great cash reserves! This is the perfect time to invest in staff or equipment upgrades.",
          "Your finances are strong. Consider expanding your menu or launching a premium marketing campaign.",
          "With this cash buffer, you can take calculated risks to outpace competitors."
        ],
        
        // Competition Advice
        dominantCompetitor: [
          "Watch out! {competitor} is dominating with {share}% market share. Time for aggressive action!",
          "{competitor} is pulling ahead. Consider undercutting their prices or improving customer satisfaction.",
          "The competition is fierce! {competitor}'s {strategy} strategy is working well."
        ],
        
        fallingBehind: [
          "You're losing market share to competitors. Focus on customer satisfaction and marketing.",
          "Time to analyze what competitors are doing better. Maybe it's time for menu optimization?",
          "Don't panic! Focus on your strengths and differentiate from the competition."
        ],
        
        leadingMarket: [
          "Excellent! You're leading the market. Maintain this advantage with consistent quality.",
          "Great job staying ahead! Keep investing in customer satisfaction to maintain your lead.",
          "You're the market leader! Now focus on defending your position from aggressive competitors."
        ],
        
        // Satisfaction Advice
        lowSatisfaction: [
          "Customer satisfaction is dropping! Consider hiring more staff or upgrading equipment.",
          "Unhappy customers won't return. Focus on service quality and menu improvements.",
          "Low satisfaction is hurting your reputation. Invest in staff training or better ingredients."
        ],
        
        highSatisfaction: [
          "Customers love your restaurant! This is great for word-of-mouth marketing.",
          "Excellent satisfaction scores! Happy customers will recommend you to others.",
          "Your service quality is outstanding. Consider premium pricing for high-quality items."
        ],
        
        // Strategic Advice
        menuOptimization: [
          "Some menu items aren't performing well. Consider removing low-popularity dishes.",
          "Your menu needs optimization. Focus on profitable, popular items.",
          "Too many similar items? Diversify your menu or remove underperformers."
        ],
        
        pricingStrategy: [
          "Your pricing seems aggressive. Make sure you're not sacrificing profit margins.",
          "Consider dynamic pricing - adjust based on demand and competition.",
          "Price psychology matters! Try pricing at .99 instead of round numbers."
        ],
        
        marketingTiming: [
          "Perfect timing for a marketing push! Your competitors seem vulnerable.",
          "Consider launching a campaign now - your satisfaction scores will amplify the effect.",
          "Marketing during competitors' weak periods can steal significant market share."
        ],
        
        // Daily Operations
        staffingAdvice: [
          "Your kitchen seems overwhelmed. Consider hiring another chef to improve efficiency.",
          "Customer service could be better. More waiters might help with satisfaction scores.",
          "Balanced staffing is key. Maintain a good ratio of chefs to waiters."
        ],
        
        equipmentAdvice: [
          "Equipment upgrades could boost your efficiency significantly.",
          "Modern kitchen equipment pays for itself through faster service and happier customers.",
          "Consider upgrading your most-used equipment first for maximum impact."
        ],
        
        // Market Events
        weatherAdvice: [
          "Rainy weather is reducing foot traffic. Focus on delivery or takeout options.",
          "Beautiful weather means more customers! Make sure you're adequately staffed.",
          "Weather affects customer mood. Adjust your service style accordingly."
        ],
        
        eventAdvice: [
          "The local festival is bringing more customers! Increase staffing if possible.",
          "Price spikes are affecting your costs. Consider temporary menu adjustments.",
          "Market events create opportunities. Adapt your strategy to take advantage."
        ],
        
        // End Game Advice
        finalPush: [
          "Final day approaches! Make every decision count for maximum market share.",
          "This is your last chance to overtake the leaders. Go all-in on marketing!",
          "Focus on maintaining your current position while looking for opportunities to advance."
        ]
      },
      
      ja: {
        // Financial Advice (資金管理アドバイス)
        lowCash: [
          "現金が不足しています！支出を削減するか、マーケティングキャンペーンで売上向上を図りましょう。",
          "キャッシュフローが心配です。利益率の高いメニューと効率的な運営に集中しましょう。",
          "支出を戦略的に管理する時です。拡張よりも収益創出活動を優先しましょう。"
        ],
        
        highCash: [
          "素晴らしい資金力です！スタッフや設備のアップグレードに投資する絶好のタイミングです。",
          "財務状況が健全ですね。メニューの拡充やプレミアムマーケティングを検討してみてください。",
          "この資金力があれば、計算されたリスクを取って競合を上回ることができます。"
        ],
        
        // Competition Advice (競合分析アドバイス)
        dominantCompetitor: [
          "要注意！{competitor}が{share}%の市場シェアで独走しています。積極的な行動が必要です！",
          "{competitor}が先行しています。価格を下げるか顧客満足度を向上させることを検討しましょう。",
          "競争が激化しています！{competitor}の{strategy}戦略がうまく機能していますね。"
        ],
        
        fallingBehind: [
          "競合他社に市場シェアを奪われています。顧客満足度とマーケティングに注力しましょう。",
          "競合の優れている点を分析する時です。メニューの最適化も検討してみては？",
          "慌てずに！自分の強みに集中し、競合との差別化を図りましょう。"
        ],
        
        leadingMarket: [
          "素晴らしい！市場のトップを走っています。一貫した品質でこのアドバンテージを維持しましょう。",
          "先頭を走っていますね！顧客満足度への投資を続けてリードを保ちましょう。",
          "市場リーダーです！今度は積極的な競合からポジションを守ることに集中しましょう。"
        ],
        
        // Satisfaction Advice (顧客満足度アドバイス)
        lowSatisfaction: [
          "顧客満足度が低下しています！スタッフの増員や設備のアップグレードを検討しましょう。",
          "不満な顧客は戻ってきません。サービス品質とメニューの改善に注力しましょう。",
          "低い満足度は評判を傷つけます。スタッフ研修や良い食材への投資を検討しましょう。"
        ],
        
        highSatisfaction: [
          "お客様があなたのレストランを愛しています！口コミマーケティングに最適ですね。",
          "優秀な満足度スコアです！満足した顧客は他の人にも推薦してくれるでしょう。",
          "サービス品質が卓越しています。高品質メニューのプレミアム価格設定を検討してみてください。"
        ],
        
        // Strategic Advice (戦略アドバイス)
        menuOptimization: [
          "パフォーマンスの悪いメニューアイテムがあります。人気の低い料理の除去を検討しましょう。",
          "メニューの最適化が必要です。収益性が高く人気のあるアイテムに集中しましょう。",
          "似たようなアイテムが多すぎませんか？メニューを多様化するか、パフォーマンスの悪いものを除去しましょう。"
        ],
        
        pricingStrategy: [
          "価格設定が積極的すぎるようです。利益率を犠牲にしていないか確認しましょう。",
          "動的価格設定を検討してください。需要と競争に基づいて調整しましょう。",
          "価格心理学が重要です！端数価格（99円など）を試してみてください。"
        ],
        
        marketingTiming: [
          "マーケティング推進の絶好のタイミングです！競合が脆弱に見えます。",
          "今キャンペーンを開始することを検討しましょう。満足度スコアが効果を増幅させるでしょう。",
          "競合の弱い時期のマーケティングは大幅な市場シェア獲得につながります。"
        ],
        
        // Daily Operations (日常運営)
        staffingAdvice: [
          "厨房が手一杯のようです。効率向上のため、シェフの増員を検討しましょう。",
          "接客サービスを改善できそうです。ウェイターを増やせば満足度スコアが向上するかもしれません。",
          "バランスの取れたスタッフ配置が鍵です。シェフとウェイターの良い比率を維持しましょう。"
        ],
        
        equipmentAdvice: [
          "設備のアップグレードで効率を大幅に向上させることができます。",
          "モダンな厨房設備は、より速いサービスと満足した顧客で元を取ります。",
          "最も使用頻度の高い設備から優先的にアップグレードすることを検討しましょう。"
        ],
        
        // Market Events (市場イベント)
        weatherAdvice: [
          "雨天で客足が減っています。配達やテイクアウトのオプションに注力しましょう。",
          "美しい天気でお客様が増えています！十分なスタッフ配置を確保しましょう。",
          "天気は顧客の気分に影響します。それに応じてサービススタイルを調整しましょう。"
        ],
        
        eventAdvice: [
          "地元の祭りでお客様が増えています！可能であればスタッフを増やしましょう。",
          "価格高騰がコストに影響しています。一時的なメニュー調整を検討しましょう。",
          "市場イベントは機会を生み出します。活用するために戦略を適応させましょう。"
        ],
        
        // End Game Advice (終盤アドバイス)
        finalPush: [
          "最終日が近づいています！最大の市場シェア獲得のため、すべての決定を重要視しましょう。",
          "リーダーを追い越す最後のチャンスです。マーケティングに全力投球しましょう！",
          "現在のポジションを維持しつつ、上昇の機会を探ることに集中しましょう。"
        ]
      }
    };
    
    return messages[lang] || messages.en;
  }
  
  static getRandomMessage(category, variables = {}) {
    const messages = this.getAdviceMessages();
    const categoryMessages = messages[category];
    
    if (!categoryMessages || categoryMessages.length === 0) {
      return "Keep up the good work!";
    }
    
    const randomIndex = Math.floor(Math.random() * categoryMessages.length);
    let message = categoryMessages[randomIndex];
    
    // Replace variables in the message
    Object.keys(variables).forEach(key => {
      const placeholder = `{${key}}`;
      message = message.replace(new RegExp(placeholder, 'g'), variables[key]);
    });
    
    return message;
  }
  
  static getAdviceForGameState(gameState) {
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return "Focus on building a great restaurant!";
    
    const competitors = gameState.restaurants.filter(r => r.type === 'ai');
    const sortedCompetitors = competitors.sort((a, b) => b.marketShare - a.marketShare);
    const leadingCompetitor = sortedCompetitors[0];
    
    // Determine advice category based on game state
    let category, variables = {};
    
    // Cash flow analysis
    if (player.cash < 5000) {
      category = 'lowCash';
    } else if (player.cash > 30000) {
      category = 'highCash';
    }
    // Market position analysis
    else if (player.marketShare < 15) {
      category = 'fallingBehind';
    } else if (player.marketShare > 25) {
      category = 'leadingMarket';
    } else if (leadingCompetitor && leadingCompetitor.marketShare > player.marketShare + 10) {
      category = 'dominantCompetitor';
      variables = {
        competitor: localization.getText(`aiRestaurants.${leadingCompetitor.strategyType}`) || leadingCompetitor.name,
        share: leadingCompetitor.marketShare.toFixed(1),
        strategy: localization.getText(`aiStrategies.${leadingCompetitor.strategyType}`) || leadingCompetitor.strategyType
      };
    }
    // Satisfaction analysis
    else if (player.satisfaction < 60) {
      category = 'lowSatisfaction';
    } else if (player.satisfaction > 85) {
      category = 'highSatisfaction';
    }
    // End game analysis
    else if (gameState.currentDay >= 6) {
      category = 'finalPush';
    }
    // Strategic advice
    else if (player.menu.some(item => item.popularity < 30)) {
      category = 'menuOptimization';
    } else if (player.staff.length < 4) {
      category = 'staffingAdvice';
    }
    // Weather/events
    else if (gameState.weatherCondition === 'rainy') {
      category = 'weatherAdvice';
    }
    // Default categories
    else {
      const categories = ['pricingStrategy', 'marketingTiming', 'equipmentAdvice'];
      category = categories[Math.floor(Math.random() * categories.length)];
    }
    
    return this.getRandomMessage(category, variables);
  }
  
  static getAdviceType(gameState) {
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return 'tip';
    
    if (player.cash < 5000 || player.satisfaction < 60) {
      return 'warning';
    } else if (player.marketShare > 25 || player.cash > 30000) {
      return 'opportunity';
    } else {
      return 'tip';
    }
  }
  
  static getAdvicePriority(gameState) {
    const player = gameState.restaurants.find(r => r.type === 'player');
    if (!player) return 'medium';
    
    if (player.cash < 3000 || player.satisfaction < 50) {
      return 'high';
    } else if (player.marketShare < 15 || gameState.currentDay >= 6) {
      return 'high';
    } else {
      return 'medium';
    }
  }
}