type Props = {
  size?: number;
};

// 返信を示す矢印（左へ向かって折り返す形）。色は currentColor に従う。
export const ReplyArrow = ({ size = 18 }: Props) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    style={{ flexShrink: 0, display: 'block' }}
  >
    <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
  </svg>
);
