import humanIcon from '../../assets/パーツ_人間.svg';
import styles from './Avatar.module.css';

type Props = {
  name: string;
  size?: number;
};

export const Avatar = ({ name, size = 40 }: Props) => (
  <div
    className={styles.wrap}
    style={{
      width: size,
      height: size,
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
