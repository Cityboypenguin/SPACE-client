import humanIcon from '../../assets/パーツ_人間.svg';

type Props = {
  name: string;
  size?: number;
};

export const Avatar = ({ name, size = 40 }: Props) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
    }}
  >
    <img
      src={humanIcon}
      alt={name}
      style={{
        width: size * 1.3,
        height: size * 1.3,
        objectFit: 'contain',
      }}
    />
  </div>
);
