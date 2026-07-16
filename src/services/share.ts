export async function shareAffirmation(text: string): Promise<boolean> {
  const message = `"${text}" — AffirmEaze`;

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: message });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return false;
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(message);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
