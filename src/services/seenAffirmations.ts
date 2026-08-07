const SEEN_KEY = 'affirmation-flow-seen-ids';
const MAX_SEEN = 48;

function loadSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveSeen(ids: string[]): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids.slice(-MAX_SEEN)));
  } catch {
    // Storage unavailable
  }
}

export function getSeenAffirmationIds(): string[] {
  return loadSeen();
}

export function markAffirmationSeen(id: string): void {
  if (!id) return;
  const next = loadSeen().filter((item) => item !== id);
  next.push(id);
  saveSeen(next);
}

export function resetSeenAffirmations(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    // Storage unavailable
  }
}

export { SEEN_KEY };
