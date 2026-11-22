export const FONT_SCALE_STORAGE_KEY = 'onecoder_font_scale';

/**
 * 5 discrete, layout-safe font scale presets.
 * Stored strictly in the visitor's own browser localStorage (never sent to server,
 * never affects other users or CDN cache).
 */
export const FONT_SCALE_STEPS = [0.85, 0.92, 1, 1.08, 1.16] as const;

export type FontScaleStep = (typeof FONT_SCALE_STEPS)[number];

export const DEFAULT_FONT_SCALE: FontScaleStep = 1;

export function normalizeFontScale(raw: unknown): FontScaleStep {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  if (!Number.isFinite(num)) return DEFAULT_FONT_SCALE;
  let closest: FontScaleStep = DEFAULT_FONT_SCALE;
  let bestDiff = Infinity;
  for (const step of FONT_SCALE_STEPS) {
    const diff = Math.abs(step - num);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = step;
    }
  }
  return closest;
}

export function readStoredFontScale(): FontScaleStep {
  if (typeof window === 'undefined') return DEFAULT_FONT_SCALE;
  try {
    const raw = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (!raw) return DEFAULT_FONT_SCALE;
    return normalizeFontScale(raw);
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

export function applyFontScale(scale: number): FontScaleStep {
  const normalized = normalizeFontScale(scale);
  if (typeof window === 'undefined') return normalized;
  document.documentElement.style.setProperty('--font-scale', String(normalized));
  try {
    if (normalized === DEFAULT_FONT_SCALE) {
      window.localStorage.removeItem(FONT_SCALE_STORAGE_KEY);
    } else {
      window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(normalized));
    }
  } catch {
    // Ignore storage quota / private-mode restrictions
  }
  window.dispatchEvent(new CustomEvent('onecoder:font-scale-changed', { detail: normalized }));
  return normalized;
}

export function stepFontScale(current: number, delta: -1 | 1): FontScaleStep {
  const normalized = normalizeFontScale(current);
  const idx = FONT_SCALE_STEPS.indexOf(normalized);
  const nextIdx = Math.max(0, Math.min(FONT_SCALE_STEPS.length - 1, idx + delta));
  return FONT_SCALE_STEPS[nextIdx];
}

export function formatFontScalePercent(scale: number): string {
  return `${Math.round(normalizeFontScale(scale) * 100)}%`;
}
