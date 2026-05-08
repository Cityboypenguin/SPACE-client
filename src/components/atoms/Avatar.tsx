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
      background: 'linear-gradient(135deg,#646cff,#a78bfa)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: size * 0.4,
      flexShrink: 0,
    }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);
