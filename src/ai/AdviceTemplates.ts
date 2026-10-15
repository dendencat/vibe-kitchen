import type { AdviceTarget, SupportAIAdvice } from '../types/AITypes';
import type { Language } from '../types/UITypes';

/** Advice categories, each with a priority/type and the control tab it relates to. */
export const ADVICE_CATEGORIES = {
  lowCash: { type: 'warning', priority: 'high', target: 'menu' },
  capacityOverflow: { type: 'warning', priority: 'high', target: 'operations' },
  lowSatisfaction: { type: 'warning', priority: 'high', target: 'operations' },
  dominantCompetitor: { type: 'analysis', priority: 'medium', target: 'marketing' },
  fallingBehind: { type: 'warning', priority: 'medium', target: 'marketing' },
  leadingMarket: { type: 'opportunity', priority: 'low', target: null },
  priceTooHigh: { type: 'tip', priority: 'medium', target: 'menu' },
  smallMenu: { type: 'tip', priority: 'medium', target: 'menu' },
  menuOptimization: { type: 'tip', priority: 'medium', target: 'menu' },
  highCash: { type: 'opportunity', priority: 'low', target: 'operations' },
  finalPush: { type: 'tip', priority: 'high', target: 'marketing' },
  weatherAdvice: { type: 'tip', priority: 'low', target: 'marketing' },
  highSatisfaction: { type: 'opportunity', priority: 'low', target: 'menu' },
  marketingTiming: { type: 'tip', priority: 'low', target: 'marketing' },
} as const satisfies Record<
  string,
  { type: SupportAIAdvice['type']; priority: SupportAIAdvice['priority']; target: AdviceTarget }
>;

export type AdviceCategory = keyof typeof ADVICE_CATEGORIES;

type MessageTable = Record<AdviceCategory, string[]>;

const EN: MessageTable = {
  lowCash: [
    'Cash is running low! Hold off on big campaigns and lean on high-margin dishes.',
    'Careful with spending — prioritize what brings revenue in today.',
  ],
  capacityOverflow: [
    'Guests are leaving because you are full! Hire a chef or upgrade the kitchen.',
    'We are turning people away at the door. More capacity = more market share.',
  ],
  lowSatisfaction: [
    'Satisfaction is dropping. More waiters and fairer prices will win guests back.',
    'Unhappy guests do not return. Invest in service before it snowballs.',
  ],
  dominantCompetitor: [
    'Watch out! {competitor} holds {share}% of the market. Time for a bold move!',
    '{competitor} is pulling ahead with its “{strategy}” play. Counter with a campaign.',
  ],
  fallingBehind: [
    'We are losing share. A campaign plus slightly lower prices can turn it around.',
    'Rivals are out-drawing us. Make some noise — buzz brings guests in fast.',
  ],
  leadingMarket: [
    'We are leading the market! Keep quality steady and defend the lead.',
    'Top of the plaza! Watch the aggressive rivals — they will try to undercut us.',
  ],
  priceTooHigh: [
    'Our prices are {percent}% above the market. Try trimming a few dishes.',
    'Guests compare prices across the plaza. Ours look steep right now.',
  ],
  smallMenu: [
    'A bigger menu attracts more kinds of guests. Try adding a dish or two.',
    'Variety matters! Rivals with more dishes pull in more walk-ins.',
  ],
  menuOptimization: [
    '“{dish}” is not selling. Lower its price or replace it.',
    'Some dishes are dead weight. Prune or reprice the least popular ones.',
  ],
  highCash: [
    'Plenty of cash on hand — a great moment to invest in staff or the kitchen.',
    'Money in the bank does not win share. Put it to work!',
  ],
  finalPush: [
    'Final stretch! Every guest counts toward the crown — go all in.',
    'Last day energy! A TV commercial now could seal the deal.',
  ],
  weatherAdvice: [
    'Rain keeps people indoors. Buzz helps us stand out on slow days.',
    'Fewer people out today. Make sure the ones who come choose us.',
  ],
  highSatisfaction: [
    'Guests love us! We can afford slightly higher prices on popular dishes.',
    'Excellent satisfaction — word of mouth is working in our favor.',
  ],
  marketingTiming: [
    'Rush hour is coming. A campaign before the peak maximizes its effect.',
    'Buzz fades over time — stagger campaigns instead of stacking them.',
  ],
};

const JA: MessageTable = {
  lowCash: [
    '現金が少なくなっています！大型キャンペーンは控え、利益率の高い料理で稼ぎましょう。',
    '支出に注意。今日の売上につながることを優先しましょう。',
  ],
  capacityOverflow: [
    '満席でお客様が帰っています！シェフを雇うか厨房を強化しましょう。',
    '入口でお断りが発生中。処理能力アップがそのままシェアにつながります。',
  ],
  lowSatisfaction: [
    '満足度が下がっています。ホールスタッフの増員と適正価格で取り戻しましょう。',
    '不満なお客様は戻ってきません。手遅れになる前にサービスに投資を。',
  ],
  dominantCompetitor: [
    '要注意！{competitor}が市場の{share}%を握っています。大胆な一手を！',
    '{competitor}が「{strategy}」で先行中。キャンペーンで対抗しましょう。',
  ],
  fallingBehind: [
    'シェアが落ちています。キャンペーンと少しの値下げで巻き返せます。',
    'ライバルに客を取られています。話題度を上げれば一気に集客できます。',
  ],
  leadingMarket: [
    '市場トップです！品質を保ってリードを守りましょう。',
    '広場で一番人気！攻撃型のライバルの値下げ攻勢に注意。',
  ],
  priceTooHigh: [
    '価格が市場平均より{percent}%高めです。いくつか値下げしてみては？',
    'お客様は広場中の価格を比べています。今はうちが割高に見えます。',
  ],
  smallMenu: [
    'メニューが多いほど幅広いお客様を呼べます。1〜2品追加してみましょう。',
    '品揃えは大事！料理が多いライバルほど来客が増えています。',
  ],
  menuOptimization: [
    '「{dish}」が売れていません。値下げか入れ替えを検討しましょう。',
    '足を引っ張っている料理があります。人気の低いものを整理しましょう。',
  ],
  highCash: [
    '資金に余裕があります。スタッフや厨房に投資する好機です。',
    '貯金ではシェアは取れません。資金を活用しましょう！',
  ],
  finalPush: [
    'ラストスパート！一人ひとりのお客様が優勝につながります。',
    '最終日です！今テレビCMを打てば決定打になるかも。',
  ],
  weatherAdvice: [
    '雨で人出が少なめ。こんな日こそ話題度で差をつけましょう。',
    '今日は客足が鈍い日。来てくれたお客様に選ばれる工夫を。',
  ],
  highSatisfaction: [
    'お客様に大好評！人気料理は少し値上げしても大丈夫そうです。',
    '満足度が最高です。口コミが追い風になっています。',
  ],
  marketingTiming: [
    'もうすぐピークタイム。ピーク前のキャンペーンが最も効果的です。',
    '話題度は時間とともに薄れます。キャンペーンは重ねずに間隔をあけて。',
  ],
};

const TABLES: Record<Language, MessageTable> = { en: EN, ja: JA };

/**
 * Picks a message variant for a category and fills `{placeholders}`.
 * Successive variant numbers rotate through the pool, so tips do not repeat verbatim.
 * @param language - Output language.
 * @param category - Advice category.
 * @param variables - Placeholder values.
 * @param variant - Variant number (wraps around the pool).
 */
export function advice_message(
  language: Language,
  category: AdviceCategory,
  variables: Record<string, string> = {},
  variant = 0
): string {
  const pool = TABLES[language][category];
  const template = pool[variant % pool.length];
  return template.replace(/\{(\w+)\}/g, (match, key: string) => variables[key] ?? match);
}

/** All message pools (for tests and tooling). */
export const ADVICE_TABLES = TABLES;
