const FREE_PREVIEW_KEY = 'affirmation-flow-free-preview';

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function hasConsumedFreePreview(): boolean {
  try {
    return localStorage.getItem(FREE_PREVIEW_KEY) === '1';
  } catch {
    return false;
  }
}

export function consumeFreePreview(): void {
  try {
    localStorage.setItem(FREE_PREVIEW_KEY, '1');
  } catch {
    // Storage unavailable
  }
  emit();
}

export function resetFreePreview(): void {
  try {
    localStorage.removeItem(FREE_PREVIEW_KEY);
  } catch {
    // Storage unavailable
  }
  emit();
}

export function subscribeFreePreview(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export { FREE_PREVIEW_KEY };
