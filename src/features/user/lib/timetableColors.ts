export type TimetableEntryColor = 'BLUE' | 'GREEN' | 'PURPLE' | 'PINK' | 'ORANGE' | 'TEAL' | 'RED' | 'YELLOW';

export type TimetableColorSwatch = {
  key: TimetableEntryColor;
  label: string;
  bg: string;
  border: string;
  hoverBg: string;
  text: string;
};

// BLUE は既存の courseChip の配色と同じ値にしてあり、これがサーバー側のデフォルト値
// (model.TimetableEntryColorDefault) でもあるため、色を一度も選んでいないコマは
// これまでと見た目が変わらない。
export const TIMETABLE_COLOR_PALETTE: TimetableColorSwatch[] = [
  { key: 'BLUE', label: '青', bg: '#eef0ff', border: '#dfe1fb', hoverBg: '#e4e6ff', text: '#373ec4' },
  { key: 'GREEN', label: '緑', bg: '#ecfdf5', border: '#bbf7d0', hoverBg: '#dcfce7', text: '#15803d' },
  { key: 'PURPLE', label: '紫', bg: '#f5f3ff', border: '#ddd6fe', hoverBg: '#ede9fe', text: '#6d28d9' },
  { key: 'PINK', label: 'ピンク', bg: '#fdf2f8', border: '#fbcfe8', hoverBg: '#fce7f3', text: '#be185d' },
  { key: 'ORANGE', label: 'オレンジ', bg: '#fff7ed', border: '#fed7aa', hoverBg: '#ffedd5', text: '#c2410c' },
  { key: 'TEAL', label: '水色', bg: '#f0fdfa', border: '#99f6e4', hoverBg: '#ccfbf1', text: '#0f766e' },
  { key: 'RED', label: '赤', bg: '#fef2f2', border: '#fecaca', hoverBg: '#fee2e2', text: '#b91c1c' },
  { key: 'YELLOW', label: '黄', bg: '#fefce8', border: '#fef08a', hoverBg: '#fef9c3', text: '#a16207' },
];

const SWATCH_BY_KEY: Record<TimetableEntryColor, TimetableColorSwatch> = Object.fromEntries(
  TIMETABLE_COLOR_PALETTE.map((s) => [s.key, s]),
) as Record<TimetableEntryColor, TimetableColorSwatch>;

export const getTimetableColorSwatch = (color: TimetableEntryColor | undefined): TimetableColorSwatch =>
  SWATCH_BY_KEY[color ?? 'BLUE'];
