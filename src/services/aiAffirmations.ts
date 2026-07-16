import type { Category } from '../data/affirmations';

export interface GenerateOptions {
  categories: string[];
  intention?: string;
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

function generateLocal(options: GenerateOptions): string[] {
  const count = Math.min(Math.max(options.count ?? 3, 1), 10);
  const intention = options.intention?.trim() || 'my highest good';
  const pool = options.categories.length > 0 ? options.categories : ['Self-Love'];
  const results: string[] = [];
  const used = new Set<string>();

  let attempts = 0;
  while (results.length < count && attempts < count * 20) {
    attempts += 1;
    const category = pickRandom(pool) as Category;
    const templates = CATEGORY_TEMPLATES[category] ?? CATEGORY_TEMPLATES['Self-Love'];
    const template = pickRandom(templates);
    const categoryIntention = options.intention?.trim() || DEFAULT_INTENTIONS[category];
    const text = applyIntention(template, categoryIntention);

    if (!used.has(text)) {
      used.add(text);
      results.push(text);
    }
  }

  return results;
}

async function generateWithOpenAI(options: GenerateOptions): Promise<string[] | null> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) return null;

  const count = options.count ?? 3;
  const categories = options.categories.join(', ') || 'general wellness';
  const intention = options.intention?.trim() || 'personal growth';
  const prompt = `Generate ${count} unique, uplifting first-person affirmations.
Categories: ${categories}
Intention: ${intention}
Do not include the user's name. Return only a JSON array of strings, no markdown.`;

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

    const parsed = JSON.parse(content) as string[];
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim())
      .slice(0, count);
  } catch {
    return null;
  }
}

export async function generateAffirmations(options: GenerateOptions): Promise<{
  affirmations: string[];
  source: 'ai' | 'local';
}> {
  const aiResults = await generateWithOpenAI(options);
  if (aiResults && aiResults.length > 0) {
    return { affirmations: aiResults, source: 'ai' };
  }

  return { affirmations: generateLocal(options), source: 'local' };
}
