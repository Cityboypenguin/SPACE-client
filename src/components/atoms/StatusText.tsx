import type { CSSProperties, ReactNode } from 'react';
import styles from './StatusText.module.css';

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export const StatusText = ({ children, className, style }: Props) => (
  <p className={[styles.text, className].filter(Boolean).join(' ')} style={style}>
    {children}
  </p>
);
