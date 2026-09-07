import type { ReactNode } from 'react';
import styles from './AvatarFrame.module.css';

type Props = {
  size: number;
  children: ReactNode;
};

export const AvatarFrame = ({ size, children }: Props) => (
  <div className={styles.wrap} style={{ width: size, height: size }}>
    {children}
  </div>
);
