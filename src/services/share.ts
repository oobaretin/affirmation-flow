import { APP_NAME } from '../constants/app';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 8);
}

export async function renderAffirmationShareCard(
  text: string,
  category?: string,
): Promise<Blob> {
  const width = 1080;
  const height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas unavailable');
  }

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1525');
  gradient.addColorStop(0.55, '#2d2640');
  gradient.addColorStop(1, '#7c5cbf');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, 72, 120, width - 144, height - 280, 48);
  ctx.fill();

  ctx.fillStyle = 'rgba(232, 168, 124, 0.95)';
  ctx.font = '600 34px Outfit, Avenir Next, sans-serif';
  ctx.fillText((category || 'Affirmation').toUpperCase(), 120, 220);

  ctx.fillStyle = '#f8f5ff';
  ctx.font = '300 64px Fraunces, Georgia, serif';
  const lines = wrapText(ctx, text, width - 260);
  let y = 340;
  for (const line of lines) {
    ctx.fillText(line, 120, y);
    y += 84;
  }

  ctx.fillStyle = 'rgba(248, 245, 255, 0.72)';
  ctx.font = '600 36px Outfit, Avenir Next, sans-serif';
  ctx.fillText(APP_NAME, 120, height - 140);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not render share card'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

export async function shareAffirmation(text: string, category?: string): Promise<boolean> {
  const message = `"${text}" — ${APP_NAME}`;

  try {
    const blob = await renderAffirmationShareCard(text, category);
    const file = new File([blob], 'affirmeaze-affirmation.png', { type: 'image/png' });
    const payload: ShareData = {
      title: APP_NAME,
      text: message,
      files: [file],
    };

    if (typeof navigator.canShare === 'function' && navigator.canShare(payload)) {
      await navigator.share(payload);
      return true;
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return false;
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: message, title: APP_NAME });
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
