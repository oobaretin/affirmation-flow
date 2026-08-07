const STREAK_KEY = 'affirmation-flow-streak';
const MAX_HISTORY_DAYS = 28;
const DEFAULT_FREEZES = 1;

export interface StreakData {
  lastPracticeDate: string;
  currentStreak: number;
  freezesRemaining: number;
  practiceDates: string[];
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(earlier: string, later: string): number {
  const a = new Date(`${earlier}T12:00:00`);
  const b = new Date(`${later}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function loadStreak(): StreakData {
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (!stored) {
      return {
        lastPracticeDate: '',
        currentStreak: 0,
        freezesRemaining: DEFAULT_FREEZES,
        practiceDates: [],
      };
    }
    const parsed = JSON.parse(stored) as Partial<StreakData>;
    return {
      lastPracticeDate: parsed.lastPracticeDate ?? '',
      currentStreak: parsed.currentStreak ?? 0,
      freezesRemaining:
        typeof parsed.freezesRemaining === 'number' ? parsed.freezesRemaining : DEFAULT_FREEZES,
      practiceDates: Array.isArray(parsed.practiceDates) ? parsed.practiceDates : [],
    };
  } catch {
    return {
      lastPracticeDate: '',
      currentStreak: 0,
      freezesRemaining: DEFAULT_FREEZES,
      practiceDates: [],
    };
  }
}

function saveStreak(data: StreakData): void {
  localStorage.setItem(STREAK_KEY, JSON.stringify(data));
}

export function getStreak(): number {
  const data = loadStreak();
  const today = formatDate(new Date());
  if (!data.lastPracticeDate || data.currentStreak <= 0) return 0;

  const gap = daysBetween(data.lastPracticeDate, today);
  if (gap <= 1) return data.currentStreak;
  if (gap === 2 && data.freezesRemaining > 0) return data.currentStreak;
  return 0;
}

export function getFreezesRemaining(): number {
  return loadStreak().freezesRemaining;
}

/** Last 7 calendar days, oldest → newest, with practiced flag. */
export function getWeekPracticeHistory(): Array<{ date: string; practiced: boolean; isToday: boolean }> {
  const { practiceDates } = loadStreak();
  const practiced = new Set(practiceDates);
  const today = formatDate(new Date());
  const days: Array<{ date: string; practiced: boolean; isToday: boolean }> = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = formatDate(new Date(Date.now() - offset * 86400000));
    days.push({
      date,
      practiced: practiced.has(date),
      isToday: date === today,
    });
  }

  return days;
}

export function recordPractice(): {
  currentStreak: number;
  isNewDay: boolean;
  freezeUsed: boolean;
} {
  const today = formatDate(new Date());
  const data = loadStreak();
  const practiceDates = [...data.practiceDates.filter((d) => d !== today), today].slice(
    -MAX_HISTORY_DAYS,
  );

  if (data.lastPracticeDate === today) {
    saveStreak({ ...data, practiceDates });
    return { currentStreak: data.currentStreak, isNewDay: false, freezeUsed: false };
  }

  if (!data.lastPracticeDate) {
    const updated: StreakData = {
      lastPracticeDate: today,
      currentStreak: 1,
      freezesRemaining: data.freezesRemaining,
      practiceDates,
    };
    saveStreak(updated);
    return { currentStreak: 1, isNewDay: true, freezeUsed: false };
  }

  const gap = daysBetween(data.lastPracticeDate, today);
  let freezesRemaining = data.freezesRemaining;
  let freezeUsed = false;
  let newStreak: number;

  if (gap === 1) {
    newStreak = data.currentStreak + 1;
  } else if (gap === 2 && freezesRemaining > 0) {
    freezesRemaining -= 1;
    freezeUsed = true;
    newStreak = data.currentStreak + 1;
  } else {
    newStreak = 1;
    freezesRemaining = Math.max(freezesRemaining, DEFAULT_FREEZES);
  }

  // Refresh a freeze every 7 completed days (simple earn-back).
  if (newStreak > 0 && newStreak % 7 === 0 && freezesRemaining < DEFAULT_FREEZES) {
    freezesRemaining = DEFAULT_FREEZES;
  }

  const updated: StreakData = {
    lastPracticeDate: today,
    currentStreak: newStreak,
    freezesRemaining,
    practiceDates,
  };
  saveStreak(updated);
  return { currentStreak: newStreak, isNewDay: true, freezeUsed };
}
