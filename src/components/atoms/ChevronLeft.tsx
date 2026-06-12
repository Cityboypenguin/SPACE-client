type Props = {
  size?: number;
  strokeWidth?: number;
};

export const ChevronLeft = ({ size = 8, strokeWidth = 2 }: Props) => (
  <span
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderLeft: `${strokeWidth}px solid currentColor`,
      borderBottom: `${strokeWidth}px solid currentColor`,
      transform: 'rotate(45deg)',
      flexShrink: 0,
    }}
  />
);
