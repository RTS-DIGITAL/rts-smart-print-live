export const A4_MM = { w: 210, h: 297 };
export const DPI_300_SCALE = 11.8110236; // 300 / 25.4 -> 2480 x 3508 px
export const A4_300DPI_PX = {
  w: Math.round(A4_MM.w * DPI_300_SCALE), // 2480 px
  h: Math.round(A4_MM.h * DPI_300_SCALE), // 3508 px
};
export const MM_TO_PT = 72 / 25.4; // PDF points (595.28 x 841.89 pt)

export type Slot = { x: number; y: number; w: number; h: number };

export function buildGrid(
  cols: number,
  rows: number,
  w: number,
  h: number,
  gap: number,
  topMarginMm?: number
): Slot[] {
  const totalW = cols * w + (cols - 1) * gap;
  const totalH = rows * h + (rows - 1) * gap;
  const x0 = Number(((A4_MM.w - totalW) / 2).toFixed(2));
  const y0 =
    topMarginMm !== undefined
      ? topMarginMm
      : Number(((A4_MM.h - totalH) / 2).toFixed(2));

  const slots: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: Number((x0 + c * (w + gap)).toFixed(2)),
        y: Number((y0 + r * (h + gap)).toFixed(2)),
        w,
        h,
      });
    }
  }
  return slots;
}

export const LAYOUTS = {
  id_card_pair: {
    label: 'ID Card Front + Back (Side by Side)',
    cropAspectRatio: 85.6 / 54,
    sizeMm: '85.6 × 54 mm',
    slots: [
      { x: 14.4, y: 30, w: 85.6, h: 54 },
      { x: 110, y: 30, w: 85.6, h: 54 },
    ],
  },
  id_card_single: {
    label: 'ID Card Single (One Side)',
    cropAspectRatio: 85.6 / 54,
    sizeMm: '85.6 × 54 mm',
    slots: [{ x: 62.2, y: 30, w: 85.6, h: 54 }],
  },
  half_page_pair: {
    label: 'Two Images Top & Bottom (½ A4 Each)',
    cropAspectRatio: 190 / 133,
    sizeMm: '190 × 133 mm',
    slots: [
      { x: 10, y: 10, w: 190, h: 133 },
      { x: 10, y: 153, w: 190, h: 133 },
    ],
  },
  grid_4: {
    label: '4 Per Page Grid (2×2)',
    cropAspectRatio: 93 / 133,
    sizeMm: '93 × 133 mm',
    slots: [
      { x: 10, y: 10, w: 93, h: 133 },
      { x: 107, y: 10, w: 93, h: 133 },
      { x: 10, y: 153, w: 93, h: 133 },
      { x: 107, y: 153, w: 93, h: 133 },
    ],
  },
  passport_4: {
    label: 'Passport Photo — 4 Per Sheet (35 × 45 mm)',
    cropAspectRatio: 35 / 45,
    sizeMm: '35 × 45 mm',
    slots: buildGrid(2, 2, 35, 45, 5, 10),
  },
  passport_8: {
    label: 'Passport Photo — 8 Per Sheet (35 × 45 mm)',
    cropAspectRatio: 35 / 45,
    sizeMm: '35 × 45 mm',
    slots: buildGrid(4, 2, 35, 45, 5, 10),
  },
  visa_2x2_4: {
    label: '2×2 Inch Photo — 4 Per Sheet (51 × 51 mm)',
    cropAspectRatio: 1,
    sizeMm: '51 × 51 mm',
    slots: buildGrid(2, 2, 51, 51, 6, 10),
  },
  fit_a4: {
    label: 'Full A4 Page (10 mm Safe Margin)',
    cropAspectRatio: NaN,
    sizeMm: '190 × 277 mm',
    slots: [{ x: 10, y: 10, w: 190, h: 277 }],
  },
} as const;
