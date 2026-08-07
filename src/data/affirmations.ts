export interface Affirmation {
  id: string;
  text: string;
  category: string;
}

export const CATEGORIES = [
  'Self-Love',
  'Confidence',
  'Gratitude',
  'Peace',
  'Abundance',
  'Health',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const AFFIRMATIONS: Affirmation[] = [
  { id: 'sl-1', text: 'I am worthy of love and respect, exactly as I am.', category: 'Self-Love' },
  { id: 'sl-2', text: 'I choose to treat myself with kindness today.', category: 'Self-Love' },
  { id: 'sl-3', text: 'My worth is not defined by what I accomplish.', category: 'Self-Love' },
  { id: 'sl-4', text: 'I forgive myself and release what no longer serves me.', category: 'Self-Love' },
  { id: 'sl-5', text: 'I am enough, and I am growing every day.', category: 'Self-Love' },
  { id: 'sl-6', text: 'I speak to myself with the same care I offer a friend.', category: 'Self-Love' },
  { id: 'sl-7', text: 'I honor my needs without apology.', category: 'Self-Love' },
  { id: 'sl-8', text: 'I am allowed to take up space and be seen.', category: 'Self-Love' },
  { id: 'sl-9', text: 'I trust the pace of my own becoming.', category: 'Self-Love' },
  { id: 'sl-10', text: 'I welcome myself home, again and again.', category: 'Self-Love' },

  { id: 'cf-1', text: 'I trust my ability to handle whatever comes my way.', category: 'Confidence' },
  { id: 'cf-2', text: 'I speak with clarity and stand in my truth.', category: 'Confidence' },
  { id: 'cf-3', text: 'Every challenge I face makes me stronger.', category: 'Confidence' },
  { id: 'cf-4', text: 'I belong in every room I enter.', category: 'Confidence' },
  { id: 'cf-5', text: 'I am capable of achieving my goals.', category: 'Confidence' },
  { id: 'cf-6', text: 'I move forward even when I feel uncertain.', category: 'Confidence' },
  { id: 'cf-7', text: 'My voice matters, and I use it with courage.', category: 'Confidence' },
  { id: 'cf-8', text: 'I trust my judgment and the wisdom I carry.', category: 'Confidence' },
  { id: 'cf-9', text: 'I show up fully, and that is enough.', category: 'Confidence' },
  { id: 'cf-10', text: 'I am becoming more resilient with every step.', category: 'Confidence' },

  { id: 'gr-1', text: 'I am grateful for the small moments of joy today.', category: 'Gratitude' },
  { id: 'gr-2', text: 'Abundance flows to me in expected and unexpected ways.', category: 'Gratitude' },
  { id: 'gr-3', text: 'I appreciate the people who support and uplift me.', category: 'Gratitude' },
  { id: 'gr-4', text: 'My life is filled with things to be thankful for.', category: 'Gratitude' },
  { id: 'gr-5', text: 'I notice and celebrate the good around me.', category: 'Gratitude' },
  { id: 'gr-6', text: 'I give thanks for the lessons that shaped me.', category: 'Gratitude' },
  { id: 'gr-7', text: 'I receive today’s gifts with an open heart.', category: 'Gratitude' },
  { id: 'gr-8', text: 'I am grateful for the body that carries me.', category: 'Gratitude' },
  { id: 'gr-9', text: 'I honor the quiet blessings I once overlooked.', category: 'Gratitude' },
  { id: 'gr-10', text: 'Gratitude softens my mind and opens my day.', category: 'Gratitude' },

  { id: 'pc-1', text: 'I release tension and welcome calm into my body.', category: 'Peace' },
  { id: 'pc-2', text: 'I am safe, grounded, and at ease in this moment.', category: 'Peace' },
  { id: 'pc-3', text: 'I let go of what I cannot control.', category: 'Peace' },
  { id: 'pc-4', text: 'Peace begins within me, and I nurture it daily.', category: 'Peace' },
  { id: 'pc-5', text: 'My breath anchors me to the present moment.', category: 'Peace' },
  { id: 'pc-6', text: 'I choose stillness over rushing today.', category: 'Peace' },
  { id: 'pc-7', text: 'I meet this moment with soft attention.', category: 'Peace' },
  { id: 'pc-8', text: 'Calm is available to me whenever I pause.', category: 'Peace' },
  { id: 'pc-9', text: 'I allow quiet to restore what noise has taken.', category: 'Peace' },
  { id: 'pc-10', text: 'I carry a steady center into whatever comes next.', category: 'Peace' },

  { id: 'ab-1', text: 'I am open to receiving prosperity in all forms.', category: 'Abundance' },
  { id: 'ab-2', text: 'Opportunities come to me easily and naturally.', category: 'Abundance' },
  { id: 'ab-3', text: 'I create value and abundance flows back to me.', category: 'Abundance' },
  { id: 'ab-4', text: 'I deserve financial freedom and security.', category: 'Abundance' },
  { id: 'ab-5', text: 'My mindset attracts limitless possibilities.', category: 'Abundance' },
  { id: 'ab-6', text: 'I welcome new doors opening in my favor.', category: 'Abundance' },
  { id: 'ab-7', text: 'There is enough for me, and I move with that trust.', category: 'Abundance' },
  { id: 'ab-8', text: 'I grow my capacity to receive and to share.', category: 'Abundance' },
  { id: 'ab-9', text: 'I am aligned with work that nourishes me.', category: 'Abundance' },
  { id: 'ab-10', text: 'Prosperity meets me where I am ready.', category: 'Abundance' },

  { id: 'hl-1', text: 'My body is strong, resilient, and deserving of care.', category: 'Health' },
  { id: 'hl-2', text: 'I nourish myself with rest, movement, and good food.', category: 'Health' },
  { id: 'hl-3', text: 'Every cell in my body is healing and thriving.', category: 'Health' },
  { id: 'hl-4', text: 'I listen to my body and honor what it needs.', category: 'Health' },
  { id: 'hl-5', text: 'Vitality and energy flow through me.', category: 'Health' },
  { id: 'hl-6', text: 'I rest without guilt and rise with clarity.', category: 'Health' },
  { id: 'hl-7', text: 'I choose habits that support my long-term wellbeing.', category: 'Health' },
  { id: 'hl-8', text: 'My body and mind work together in balance.', category: 'Health' },
  { id: 'hl-9', text: 'I treat recovery as part of my strength.', category: 'Health' },
  { id: 'hl-10', text: 'I feel more alive when I care for myself.', category: 'Health' },
];

export function filterByFocus(pool: Affirmation[], focusCategories: string[]): Affirmation[] {
  if (focusCategories.length === 0) return pool;

  const filtered = pool.filter(
    (affirmation) =>
      focusCategories.includes(affirmation.category) || affirmation.category === 'Custom',
  );

  return filtered.length > 0 ? filtered : pool;
}

export function getAffirmationsByCategory(category: Category): Affirmation[] {
  return AFFIRMATIONS.filter((a) => a.category === category);
}

function pickFromPool(pool: Affirmation[], preferUnseenIds?: Set<string>): Affirmation {
  if (preferUnseenIds && preferUnseenIds.size > 0) {
    const unseen = pool.filter((item) => !preferUnseenIds.has(item.id));
    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)];
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomAffirmation(
  custom: Affirmation[] = [],
  focusCategories: string[] = [],
  seenIds: string[] = [],
): Affirmation {
  const pool = filterByFocus([...AFFIRMATIONS, ...custom], focusCategories);
  return pickFromPool(pool, new Set(seenIds));
}

export function getDailyAffirmation(
  custom: Affirmation[] = [],
  focusCategories: string[] = [],
  pinned?: Affirmation | null,
  seenIds: string[] = [],
): Affirmation {
  if (pinned) return pinned;

  const pool = filterByFocus([...AFFIRMATIONS, ...custom], focusCategories);
  const unseen = seenIds.length > 0
    ? pool.filter((item) => !seenIds.includes(item.id))
    : pool;
  const source = unseen.length > 0 ? unseen : pool;
  const today = new Date().toDateString();
  const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return source[hash % source.length];
}
