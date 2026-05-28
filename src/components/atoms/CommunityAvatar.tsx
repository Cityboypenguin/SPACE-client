import { Avatar } from './Avatar';
import { storageUrl } from '../../lib/storage';

type Props = {
  name: string;
  src?: string | null;
  size?: number;
};

export const CommunityAvatar = ({ name, src, size = 40 }: Props) => {
  const resolvedSrc = storageUrl(src);
  if (resolvedSrc) {
    return (
      <img
        src={resolvedSrc}
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