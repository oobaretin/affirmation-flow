/** Time-aware greeting for the Today screen header. */
export function getTimeAwareGreeting(name?: string): string {
  const hour = new Date().getHours();

  let timeGreeting = 'Hello';
  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    timeGreeting = 'Good evening';
  } else {
    timeGreeting = 'Good night';
  }

  const trimmed = name?.trim();
  return trimmed ? `${timeGreeting}, ${trimmed}` : 'Today';
}
