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

  { id: 'cf-1', text: 'I trust my ability to handle whatever comes my way.', category: 'Confidence' },
  { id: 'cf-2', text: 'I speak with clarity and stand in my truth.', category: 'Confidence' },
  { id: 'cf-3', text: 'Every challenge I face makes me stronger.', category: 'Confidence' },
  { id: 'cf-4', text: 'I belong in every room I enter.', category: 'Confidence' },
  { id: 'cf-5', text: 'I am capable of achieving my goals.', category: 'Confidence' },

  { id: 'gr-1', text: 'I am grateful for the small moments of joy today.', category: 'Gratitude' },
  { id: 'gr-2', text: 'Abundance flows to me in expected and unexpected ways.', category: 'Gratitude' },
  { id: 'gr-3', text: 'I appreciate the people who support and uplift me.', category: 'Gratitude' },
  { id: 'gr-4', text: 'My life is filled with things to be thankful for.', category: 'Gratitude' },
  { id: 'gr-5', text: 'I notice and celebrate the good around me.', category: 'Gratitude' },

  { id: 'pc-1', text: 'I release tension and welcome calm into my body.', category: 'Peace' },
  { id: 'pc-2', text: 'I am safe, grounded, and at ease in this moment.', category: 'Peace' },
  { id: 'pc-3', text: 'I let go of what I cannot control.', category: 'Peace' },
  { id: 'pc-4', text: 'Peace begins within me, and I nurture it daily.', category: 'Peace' },
  { id: 'pc-5', text: 'My breath anchors me to the present moment.', category: 'Peace' },

  { id: 'ab-1', text: 'I am open to receiving prosperity in all forms.', category: 'Abundance' },
  { id: 'ab-2', text: 'Opportunities come to me easily and naturally.', category: 'Abundance' },
  { id: 'ab-3', text: 'I create value and abundance flows back to me.', category: 'Abundance' },
  { id: 'ab-4', text: 'I deserve financial freedom and security.', category: 'Abundance' },
  { id: 'ab-5', text: 'My mindset attracts limitless possibilities.', category: 'Abundance' },

  { id: 'hl-1', text: 'My body is strong, resilient, and deserving of care.', category: 'Health' },
  { id: 'hl-2', text: 'I nourish myself with rest, movement, and good food.', category: 'Health' },
  { id: 'hl-3', text: 'Every cell in my body is healing and thriving.', category: 'Health' },
  { id: 'hl-4', text: 'I listen to my body and honor what it needs.', category: 'Health' },
  { id: 'hl-5', text: 'Vitality and energy flow through me.', category: 'Health' },
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

export function getRandomAffirmation(
  custom: Affirmation[] = [],
  focusCategories: string[] = [],
): Affirmation {
  const pool = filterByFocus([...AFFIRMATIONS, ...custom], focusCategories);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getDailyAffirmation(
  custom: Affirmation[] = [],
  focusCategories: string[] = [],
  pinned?: Affirmation | null,
): Affirmation {
  if (pinned) return pinned;

  const pool = filterByFocus([...AFFIRMATIONS, ...custom], focusCategories);
  const today = new Date().toDateString();
  const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return pool[hash % pool.length];
}
