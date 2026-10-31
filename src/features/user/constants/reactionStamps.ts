// スタンプ（文字で言い切るリアクション）の見た目。
//
// サーバーは "stamp:ok" のようなIDだけを許可リストで持ち（server の model/message_reaction.go）、
// 文言・色・画像はここで決める。
//
// スタンプを足す手順:
//   1. サーバーの許可リストに "stamp:xxx" を足す（世界観に合わないものを入れないための関門）。
//   2. ここに同じIDで { id, label, color, tilt } を足す。
//   3. 画像のスタンプにするときは、画像を client/public/stamps/ に置き、image に '/stamps/xxx.png'
//      のようなパスと、imageHeight（画面に出す高さ）を書く。image があればそれを描き、無い（または読み込めない）ときは
//      label と color の文字スタンプで描く。
//
// 画像の目安: 背景は透過のPNG/WebP（SVG・GIFも可）、高さは128px前後、幅は高さの4倍まで、
// 1枚あたり50KB以下。画面では高さ約28pxに縮めて出す（細かすぎる絵は潰れる）。
export type ReactionStamp = {
  id: string;
  label: string;
  // 文字・縁取り・うっすらした背景の元になる色。背景は色を薄めて使い、文字は色を
  // 濃い文字色へ寄せて使うので、明るい色でも読める（ダークモードでも同じ式で足りる）。
  color: string;
  // 傾き(度)。きっちりそろえないほうが、手書きのような温かみが出る。小さな値にすること。
  tilt: number;
  // 画像のスタンプのパス（client/public 以下。例: '/stamps/ok.png'）。省略すると文字スタンプ。
  // label は画像が読み込めなかったときの代わりの表示と、読み上げの名前にも使うので必ず付ける。
  image?: string;
  // 画像を画面に出すときの高さ(CSS px)。画像は書き出し時の約1.4倍の密度で、読みやすい大きさに縮めて出す（実際の画像の高さの0.7倍）。
  // スタンプごとに大きさが違う（2行のものや、神・任せては大きい）ので、文字の大きさがそろうよう個別に持つ。
  imageHeight?: number;
};

export const STAMP_PREFIX = 'stamp:';

export const REACTION_STAMPS: ReactionStamp[] = [
  { id: 'stamp:thanks', label: 'ありがとう', color: '#fb923c', tilt: 1.5, image: '/stamps/thanks.png', imageHeight: 46 },
  { id: 'stamp:kansha', label: '感謝', color: '#facc15', tilt: -1, image: '/stamps/kansha.png', imageHeight: 39 },
  { id: 'stamp:tasukaru', label: 'たすかる', color: '#ec4899', tilt: 1.5, image: '/stamps/tasukaru.png', imageHeight: 39 },
  { id: 'stamp:kami', label: '神', color: '#fbbf24', tilt: 0, image: '/stamps/kami.png', imageHeight: 78 },
  { id: 'stamp:naruhodo', label: 'なるほど', color: '#eab308', tilt: -1.5, image: '/stamps/naruhodo.png', imageHeight: 36 },
  { id: 'stamp:tame', label: 'ためになりました', color: '#8b5cf6', tilt: 1, image: '/stamps/tame.png', imageHeight: 69 },
  { id: 'stamp:ryokai', label: '了解です', color: '#3b82f6', tilt: -1, image: '/stamps/ryokai.png', imageHeight: 39 },
  { id: 'stamp:wakaru', label: 'わかる', color: '#22c55e', tilt: 1.5, image: '/stamps/wakaru.png', imageHeight: 50 },
  { id: 'stamp:watashi', label: '私も気になる', color: '#0ea5e9', tilt: -1, image: '/stamps/watashi.png', imageHeight: 64 },
  { id: 'stamp:shirabe', label: '調べてます', color: '#14b8a6', tilt: 1, image: '/stamps/shirabe.png', imageHeight: 39 },
  { id: 'stamp:jikan', label: '時間かかりそうです', color: '#64748b', tilt: -1.5, image: '/stamps/jikan.png', imageHeight: 52 },
  { id: 'stamp:makasete', label: '任せて', color: '#dc2626', tilt: 1, image: '/stamps/makasete.png', imageHeight: 90 },
  { id: 'stamp:kaiketsu', label: '解決しました！', color: '#84cc16', tilt: -1, image: '/stamps/kaiketsu.png', imageHeight: 56 },
  { id: 'stamp:gomen', label: 'ごめんなさい', color: '#a78bfa', tilt: 1.5, image: '/stamps/gomen.png', imageHeight: 60 },
];

export const isStampReaction = (id: string): boolean => id.startsWith(STAMP_PREFIX);

export const findStamp = (id: string): ReactionStamp | undefined =>
  REACTION_STAMPS.find((s) => s.id === id);

// 読み上げ用の名前。絵文字はそのまま、スタンプは文言。
// 画面がまだ知らないスタンプのIDでも、IDそのものは見せないよう「スタンプ」とする。
export const reactionLabel = (id: string): string => {
  if (!isStampReaction(id)) return id;
  return findStamp(id)?.label ?? 'スタンプ';
};
