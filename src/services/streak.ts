const STREAK_KEY = 'affirmation-flow-streak';

interface StreakData {
  lastPracticeDate: string;
  currentStreak: number;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function loadStreak(): StreakData {
  try {
    const stored = localStorage.getItem(STREAK_KEY);
    if (!stored) return { lastPracticeDate: '', currentStreak: 0 };
    return JSON.parse(stored) as StreakData;
  } catch {
    return { lastPracticeDate: '', currentStreak: 0 };
  }
}

export function getStreak(): number {
  const { lastPracticeDate, currentStreak } = loadStreak();
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  if (lastPracticeDate === today || lastPracticeDate === yesterday) {
    return currentStreak;
  }

  return 0;
}

export function recordPractice(): { currentStreak: number; isNewDay: boolean } {
  const today = formatDate(new Date());
  const data = loadStreak();

  if (data.lastPracticeDate === today) {
    return { currentStreak: data.currentStreak, isNewDay: false };
  }

  const yesterday = formatDate(new Date(Date.now() - 86400000));
  const newStreak = data.lastPracticeDate === yesterday ? data.currentStreak + 1 : 1;
  const updated = { lastPracticeDate: today, currentStreak: newStreak };
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  return { currentStreak: newStreak, isNewDay: true };
}
