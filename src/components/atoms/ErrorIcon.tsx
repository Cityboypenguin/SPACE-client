export type ErrorIconType =
  | 'auth'
  | 'forbidden'
  | 'rate-limit'
  | 'server'
  | 'maintenance'
  | 'network'
  | 'not-found';

type Props = {
  type: ErrorIconType;
  size?: number;
};

const ICONS: Record<ErrorIconType, string> = {
  auth: '🔐',
  forbidden: '🚫',
  'rate-limit': '⏱️',
  server: '⚠️',
  maintenance: '🔧',
  network: '📡',
  'not-found': '🔍',
};

export const ErrorIcon = ({ type, size = 64 }: Props) => (
  <span
    role="img"
    aria-label={type}
    style={{ fontSize: size, lineHeight: 1, display: 'block', userSelect: 'none' }}
  >
    {ICONS[type]}
  </span>
);
