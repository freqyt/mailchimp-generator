// Rough approximation of Gmail iOS dark mode, matched against how real test sends rendered:
// - background colors are inverted, unless locked with a background-image (see bg() in generateMailchimpHtml)
// - border colors are inverted
// - neutral text that's already light is left alone, dark neutral text is inverted
// - colored text has its hue flipped (e.g. #0078D4 blue turns orange)
// - images are untouched

type Hsl = [number, number, number];

function parseColor(value: string): [number, number, number] | null {
  const v = value.trim().toLowerCase();
  const rgb = v.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (!hex) return null;
  const h = hex[1].length === 3 ? hex[1].split('').map(c => c + c).join('') : hex[1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function toHsl([r, g, b]: [number, number, number]): Hsl {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function toHex([h, s, l]: Hsl): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
}

function invertLightness(value: string): string {
  const rgb = parseColor(value);
  if (!rgb) return value;
  const [h, s, l] = toHsl(rgb);
  return toHex([h, s, 1 - l]);
}

function adaptText(value: string): string {
  const rgb = parseColor(value);
  if (!rgb) return value;
  const [h, s, l] = toHsl(rgb);
  if (s < 0.15) return l < 0.5 ? toHex([h, s, 1 - l]) : value;
  return toHex([(h + 180) % 360, s, l]);
}

const BORDER_PROPS = ['borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'] as const;

export function simulateGmailDark(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll<HTMLElement>('*').forEach(el => {
    const s = el.style;
    const locked = Boolean(s.backgroundImage) && s.backgroundImage !== 'none';
    if (!locked) {
      if (s.backgroundColor) s.backgroundColor = invertLightness(s.backgroundColor);
      const attr = el.getAttribute('bgcolor');
      if (attr) el.setAttribute('bgcolor', invertLightness(attr));
    }
    if (s.color) s.color = adaptText(s.color);
    for (const prop of BORDER_PROPS) {
      if (s[prop]) s[prop] = invertLightness(s[prop]);
    }
  });
  return doc.documentElement.outerHTML;
}
