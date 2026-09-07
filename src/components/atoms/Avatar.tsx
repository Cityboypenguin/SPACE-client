import humanIcon from '../../assets/パーツ_人間.svg';
import { AvatarFrame } from './AvatarFrame';

type Props = {
  name: string;
  size?: number;
};

export const Avatar = ({ name, size = 40 }: Props) => (
  <AvatarFrame size={size}>
    <img
      src={humanIcon}
      alt={name}
      style={{
        width: size * 1.3,
        height: size * 1.3,
        objectFit: 'contain',
      }}
    />
  </AvatarFrame>
);
