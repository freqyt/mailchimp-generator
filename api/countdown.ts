import gifenc from 'gifenc';

const { GIFEncoder } = gifenc;

// Renders a 60-frame (one minute) animated GIF counting down to ?end=<ISO timestamp>.
// It's regenerated every time the email is opened, so it's always current.
// Drawn at 2x (960x200) and displayed at 480px wide for sharpness on phones.
const W = 960;
const H = 200;
const BG = 0, FG = 1, LABEL = 2;
const PALETTE = [[10, 10, 10], [255, 255, 255], [119, 119, 119], [10, 10, 10]]; // bg matches the #0a0a0a card

// 5x7 bitmap glyphs for the labels under each digit group
const GLYPHS: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
};

// Seven-segment layout: which of a,b,c,d,e,f,g are lit for each digit
const SEGMENTS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgedc', 'abc', 'abcdefg', 'abcdfg'];

const DIGIT_W = 70, DIGIT_H = 120, SEG = 14, GAP = 3;
const DIGIT_SPACING = 12, COLON_W = 56, TOP = 20;
const GROUP_W = DIGIT_W * 2 + DIGIT_SPACING;
const TOTAL_W = GROUP_W * 4 + COLON_W * 3;
const LEFT = Math.round((W - TOTAL_W) / 2);
const LABEL_SCALE = 4, LABEL_TOP = TOP + DIGIT_H + 18;

function fillRect(px: Uint8Array, x: number, y: number, w: number, h: number, color: number) {
  for (let yy = Math.max(0, y); yy < Math.min(H, y + h); yy++) {
    px.fill(color, yy * W + Math.max(0, x), yy * W + Math.min(W, x + w));
  }
}

function drawDigit(px: Uint8Array, x: number, y: number, digit: number) {
  const half = DIGIT_H / 2;
  const vLen = half - SEG - SEG / 2 - GAP * 2;
  const hLen = DIGIT_W - SEG * 2 - GAP * 2;
  const rects: Record<string, [number, number, number, number]> = {
    a: [x + SEG + GAP, y, hLen, SEG],
    b: [x + DIGIT_W - SEG, y + SEG + GAP, SEG, vLen],
    c: [x + DIGIT_W - SEG, y + half + SEG / 2 + GAP, SEG, vLen],
    d: [x + SEG + GAP, y + DIGIT_H - SEG, hLen, SEG],
    e: [x, y + half + SEG / 2 + GAP, SEG, vLen],
    f: [x, y + SEG + GAP, SEG, vLen],
    g: [x + SEG + GAP, y + half - SEG / 2, hLen, SEG],
  };
  for (const seg of SEGMENTS[digit]) fillRect(px, ...rects[seg], FG);
}

function drawLabel(px: Uint8Array, text: string, centerX: number) {
  const charW = 6 * LABEL_SCALE;
  let x = Math.round(centerX - (text.length * charW - LABEL_SCALE) / 2);
  for (const ch of text) {
    GLYPHS[ch]?.forEach((row, ry) => {
      [...row].forEach((bit, rx) => {
        if (bit === '1') fillRect(px, x + rx * LABEL_SCALE, LABEL_TOP + ry * LABEL_SCALE, LABEL_SCALE, LABEL_SCALE, LABEL);
      });
    });
    x += charW;
  }
}

function renderFrame(secondsLeft: number): Uint8Array {
  const px = new Uint8Array(W * H).fill(BG);
  const days = Math.min(99, Math.floor(secondsLeft / 86400));
  const values = [days, Math.floor(secondsLeft / 3600) % 24, Math.floor(secondsLeft / 60) % 60, secondsLeft % 60];
  const labels = ['DAYS', 'HOURS', 'MINS', 'SECS'];

  values.forEach((value, i) => {
    const gx = LEFT + i * (GROUP_W + COLON_W);
    drawDigit(px, gx, TOP, Math.floor(value / 10));
    drawDigit(px, gx + DIGIT_W + DIGIT_SPACING, TOP, value % 10);
    drawLabel(px, labels[i], gx + GROUP_W / 2);
    if (i < 3) {
      const cx = gx + GROUP_W + (COLON_W - SEG) / 2;
      fillRect(px, cx, TOP + Math.round(DIGIT_H * 0.3), SEG, SEG, FG);
      fillRect(px, cx, TOP + Math.round(DIGIT_H * 0.7) - SEG, SEG, SEG, FG);
    }
  });
  return px;
}

export default function handler(req: any, res: any) {
  const end = new Date(String(req.query.end || '')).getTime();
  if (Number.isNaN(end)) {
    return res.status(400).json({ error: 'Pass ?end=<ISO timestamp>' });
  }

  const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
  const frames = Math.min(60, remaining + 1);
  const gif = GIFEncoder();
  for (let i = 0; i < frames; i++) {
    gif.writeFrame(renderFrame(remaining - i), W, H, {
      palette: i === 0 ? PALETTE : undefined,
      delay: 1000,
      repeat: -1, // play once, then hold on the last frame
    });
  }
  gif.finish();

  res.setHeader('Content-Type', 'image/gif');
  // Never cache, so every open (and Gmail's image proxy) gets the current time
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.status(200).send(Buffer.from(gif.bytes()));
}
