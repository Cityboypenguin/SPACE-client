type Props = {
  size?: number;
};

// 返信を示す矢印（↳）。左上から下へ降りて右へ折れる、角のある形。
// 線で描いているので fill ではなく stroke が currentColor に従う。
export const ReplyArrow = ({ size = 18 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="miter"
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <polyline points="8 5 8 15 18 15" />
    <polyline points="14 11 18 15 14 19" />
  </svg>
);
