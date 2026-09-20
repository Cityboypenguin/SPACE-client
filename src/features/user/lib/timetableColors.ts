export type TimetableEntryColor =
  | 'RED_VIVID' | 'ORANGE_VIVID' | 'YELLOW_VIVID' | 'GREEN_VIVID' | 'CYAN_VIVID' | 'BLUE_VIVID' | 'INDIGO_VIVID' | 'PURPLE_VIVID' | 'MAGENTA_VIVID'
  | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'CYAN' | 'BLUE' | 'INDIGO' | 'PURPLE' | 'MAGENTA'
  | 'RED_LIGHT' | 'ORANGE_LIGHT' | 'YELLOW_LIGHT' | 'GREEN_LIGHT' | 'CYAN_LIGHT' | 'BLUE_LIGHT' | 'INDIGO_LIGHT' | 'PURPLE_LIGHT' | 'MAGENTA_LIGHT'
  | 'RED_MUTED' | 'ORANGE_MUTED' | 'YELLOW_MUTED' | 'GREEN_MUTED' | 'CYAN_MUTED' | 'BLUE_MUTED' | 'INDIGO_MUTED' | 'PURPLE_MUTED' | 'MAGENTA_MUTED';

export type TimetableColorSwatch = {
  key: TimetableEntryColor;
  label: string;
  bg: string;
};

// ユーザー提示のパレット画像の2〜4行目（グレースケールの1行目は除く）に加えて、各色を
// さらに鮮やかにした0行目(_VIVID)を追加。1〜3行目=鮮やか/淡い(_LIGHT)/くすみ(_MUTED)。
// 各行とも左から右の並びは元画像の並びに対応する。コマの文字は濃淡に関わらず常に白固定。
export const TIMETABLE_COLOR_PALETTE: TimetableColorSwatch[] = [
  // 0段目: さらに鮮やか
  { key: 'RED_VIVID', label: '赤(極彩)', bg: '#ff2020' },
  { key: 'ORANGE_VIVID', label: 'オレンジ(極彩)', bg: '#ff7a00' },
  { key: 'YELLOW_VIVID', label: '黄(極彩)', bg: '#ffe600' },
  { key: 'GREEN_VIVID', label: '緑(極彩)', bg: '#00d95c' },
  { key: 'CYAN_VIVID', label: '水色(極彩)', bg: '#00d9e8' },
  { key: 'BLUE_VIVID', label: '青(極彩)', bg: '#0057ff' },
  { key: 'INDIGO_VIVID', label: '藍(極彩)', bg: '#2200f0' },
  { key: 'PURPLE_VIVID', label: '紫(極彩)', bg: '#8000ff' },
  { key: 'MAGENTA_VIVID', label: 'マゼンタ(極彩)', bg: '#ff00e0' },
  // 鮮やか
  { key: 'RED', label: '赤', bg: '#e5342a' },
  { key: 'ORANGE', label: 'オレンジ', bg: '#f0932b' },
  { key: 'YELLOW', label: '黄', bg: '#f5e94f' },
  { key: 'GREEN', label: '緑', bg: '#58d66e' },
  { key: 'CYAN', label: '水色', bg: '#52e6f0' },
  { key: 'BLUE', label: '青', bg: '#4a80e0' },
  { key: 'INDIGO', label: '藍', bg: '#2e3edb' },
  { key: 'PURPLE', label: '紫', bg: '#8e3fe0' },
  { key: 'MAGENTA', label: 'マゼンタ', bg: '#e63fdc' },
  // 淡い
  { key: 'RED_LIGHT', label: '赤(淡)', bg: '#e8a19c' },
  { key: 'ORANGE_LIGHT', label: 'オレンジ(淡)', bg: '#f0c9a0' },
  { key: 'YELLOW_LIGHT', label: '黄(淡)', bg: '#f0dfa0' },
  { key: 'GREEN_LIGHT', label: '緑(淡)', bg: '#b8d9a8' },
  { key: 'CYAN_LIGHT', label: '水色(淡)', bg: '#a8cdd0' },
  { key: 'BLUE_LIGHT', label: '青(淡)', bg: '#b0c8ea' },
  { key: 'INDIGO_LIGHT', label: '藍(淡)', bg: '#a8c0e6' },
  { key: 'PURPLE_LIGHT', label: '紫(淡)', bg: '#bcb0dc' },
  { key: 'MAGENTA_LIGHT', label: 'マゼンタ(淡)', bg: '#d0a8c0' },
  // くすみ
  { key: 'RED_MUTED', label: '赤(くすみ)', bg: '#cc6b64' },
  { key: 'ORANGE_MUTED', label: 'オレンジ(くすみ)', bg: '#dba064' },
  { key: 'YELLOW_MUTED', label: '黄(くすみ)', bg: '#dcc468' },
  { key: 'GREEN_MUTED', label: '緑(くすみ)', bg: '#8fb87a' },
  { key: 'CYAN_MUTED', label: '水色(くすみ)', bg: '#6b9ea3' },
  { key: 'BLUE_MUTED', label: '青(くすみ)', bg: '#6e93d1' },
  { key: 'INDIGO_MUTED', label: '藍(くすみ)', bg: '#7088c4' },
  { key: 'PURPLE_MUTED', label: '紫(くすみ)', bg: '#8878b8' },
  { key: 'MAGENTA_MUTED', label: 'マゼンタ(くすみ)', bg: '#b06b94' },
];

const SWATCH_BY_KEY: Record<TimetableEntryColor, TimetableColorSwatch> = Object.fromEntries(
  TIMETABLE_COLOR_PALETTE.map((s) => [s.key, s]),
) as Record<TimetableEntryColor, TimetableColorSwatch>;

export const getTimetableColorSwatch = (color: TimetableEntryColor | undefined): TimetableColorSwatch =>
  SWATCH_BY_KEY[color ?? 'BLUE'];
