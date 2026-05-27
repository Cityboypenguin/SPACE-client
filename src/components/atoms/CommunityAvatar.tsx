import { Avatar } from './Avatar';

type Props = {
  name: string;
  src?: string | null;
  size?: number;
};

export const CommunityAvatar = ({ name, src, size = 40 }: Props) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          display: 'block',
          flexShrink: 0,
        }}
      />
    );
  }
  return <Avatar name={name} size={size} />;
}