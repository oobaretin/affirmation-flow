import { getOpenAiApiKey as readOpenAiApiKey } from '../config/env';
import type { Affirmation, Category } from '../data/affirmations';

export interface GeneratedAffirmation {
  text: string;
  category: string;
}

export interface GenerateOptions {
  categories: string[];
  count?: number;
}

const CATEGORY_TEMPLATES: Record<Category, string[]> = {
  'Self-Love': [
    'I am worthy of love and respect, especially when I focus on {intention}.',
    'I choose to treat myself with kindness as I grow toward {intention}.',
    'My worth is not defined by outcomes — I am enough while I pursue {intention}.',
    'I forgive myself and release what no longer serves my {intention}.',
    'I honor my needs and celebrate every step toward {intention}.',
    'I speak to myself with the same compassion I offer others about {intention}.',
    'I deserve rest, joy, and patience on my path to {intention}.',
  ],
  Confidence: [
    'I trust my ability to handle whatever comes my way regarding {intention}.',
    'I speak with clarity and stand in my truth about {intention}.',
    'Every challenge around {intention} makes me stronger and wiser.',
    'I belong in every room where {intention} matters to me.',
    'I am capable of achieving my goals around {intention}.',
    'I take bold action toward {intention} with calm confidence.',
    'My voice and presence carry weight when I speak about {intention}.',
  ],
  Gratitude: [
    'I am grateful for the progress I make toward {intention}.',
    'Abundance flows to me in expected and unexpected ways as I embrace {intention}.',
    'I appreciate the people who support my journey with {intention}.',
    'My life is filled with reasons to be thankful for {intention}.',
    'I notice and celebrate the good in every step toward {intention}.',
    'Gratitude opens my heart to more opportunities around {intention}.',
    'I welcome today with appreciation for my work on {intention}.',
  ],
  Peace: [
    'I release tension and welcome calm as I focus on {intention}.',
    'I am safe, grounded, and at ease while I nurture {intention}.',
    'I let go of what I cannot control around {intention}.',
    'Peace begins within me, and I carry it into {intention}.',
    'My breath anchors me to the present moment of {intention}.',
    'I choose stillness over stress when I think about {intention}.',
    'Serenity grows in me as I trust the process of {intention}.',
  ],
  Abundance: [
    'I am open to receiving prosperity in all forms related to {intention}.',
    'Opportunities for {intention} come to me easily and naturally.',
    'I create value and abundance flows back to me through {intention}.',
    'I deserve financial freedom and security as I build {intention}.',
    'My mindset attracts limitless possibilities for {intention}.',
    'I welcome wealth, health, and joy on my path to {intention}.',
    'The universe supports my growth in {intention}.',
  ],
  Health: [
    'My body is strong, resilient, and deserving of care as I pursue {intention}.',
    'I nourish myself with rest, movement, and good food for {intention}.',
    'Every cell in my body supports my journey toward {intention}.',
    'I listen to my body and honor what it needs for {intention}.',
    'Vitality flows through me as I commit to {intention}.',
    'I choose habits that energize my progress with {intention}.',
    'Healing and strength grow in me as I focus on {intention}.',
  ],
};

const DEFAULT_INTENTIONS: Record<Category, string> = {
  'Self-Love': 'self-acceptance',
  Confidence: 'personal growth',
  Gratitude: 'daily joy',
  Peace: 'inner calm',
  Abundance: 'prosperity',
  Health: 'vibrant wellbeing',
};

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function applyIntention(text: string, intention: string): string {
  return text.replace(/\{intention\}/g, intention);
}

function normalizeCategoryPool(categories: string[]): Category[] {
  const pool = categories.filter((category): category is Category =>
    Object.prototype.hasOwnProperty.call(CATEGORY_TEMPLATES, category),
  );
  return pool.length > 0 ? pool : ['Self-Love'];
}

export function getOpenAiApiKey(): string {
  return readOpenAiApiKey();
}

export function isOpenAiConfigured(): boolean {
  return getOpenAiApiKey().length > 0;
}

function generateLocal(options: GenerateOptions): GeneratedAffirmation[] {
  const count = Math.min(Math.max(options.count ?? 3, 1), 10);
  const pool = normalizeCategoryPool(options.categories);
  const results: GeneratedAffirmation[] = [];
  const used = new Set<string>();

  let attempts = 0;
  while (results.length < count && attempts < count * 20) {
    attempts += 1;
    const category = pickRandom(pool);
    const templates = CATEGORY_TEMPLATES[category];
    const template = pickRandom(templates);
    const text = applyIntention(template, DEFAULT_INTENTIONS[category]);

    if (!used.has(text)) {
      used.add(text);
      results.push({ text, category });
    }
  }

  return results;
}

type OpenAiAffirmation = string | { text?: string; category?: string };

async function generateWithOpenAI(options: GenerateOptions): Promise<GeneratedAffirmation[] | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) return null;

  const count = options.count ?? 3;
  const categories = options.categories.join(', ') || 'general wellness';
  const prompt = `Generate ${count} unique, uplifting first-person affirmations.
Categories: ${categories}
Assign each affirmation to one of these categories.
Do not include the user's name.
Return only a JSON array. Each item may be a string or an object with "text" and "category". No markdown.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You write concise, empowering affirmations in first person.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const parsed = JSON.parse(content) as OpenAiAffirmation[];
    if (!Array.isArray(parsed)) return null;

    const pool = normalizeCategoryPool(options.categories);
    const mapped: GeneratedAffirmation[] = [];

    parsed.forEach((item, index) => {
      if (typeof item === 'string' && item.trim()) {
        mapped.push({
          text: item.trim(),
          category: pool[index % pool.length],
        });
        return;
      }

      if (typeof item === 'object' && item?.text?.trim()) {
        const category = pool.includes(item.category as Category)
          ? (item.category as string)
          : pool[index % pool.length];
        mapped.push({ text: item.text.trim(), category });
      }
    });

    return mapped.slice(0, count);
  } catch {
    return null;
  }
}

export function toAffirmation(generated: GeneratedAffirmation, idPrefix = 'ai'): Affirmation {
  return {
    id: `${idPrefix}-${Date.now()}`,
    text: generated.text,
    category: generated.category,
  };
}

export async function generateAffirmations(options: GenerateOptions): Promise<{
  affirmations: GeneratedAffirmation[];
  source: 'ai' | 'local';
}> {
  const aiResults = await generateWithOpenAI(options);
  if (aiResults && aiResults.length > 0) {
    return { affirmations: aiResults, source: 'ai' };
  }

  return { affirmations: generateLocal(options), source: 'local' };
}

export async function generateNextAffirmation(focusCategories: string[]): Promise<Affirmation> {
  const categories = focusCategories.length > 0 ? focusCategories : ['Self-Love'];
  const { affirmations } = await generateAffirmations({ categories, count: 1 });
  return toAffirmation(affirmations[0] ?? generateLocal({ categories, count: 1 })[0]);
}
