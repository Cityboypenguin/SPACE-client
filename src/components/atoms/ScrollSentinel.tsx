import { forwardRef } from 'react';
import styles from './ScrollSentinel.module.css';

export const ScrollSentinel = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className={styles.root} />
));

ScrollSentinel.displayName = 'ScrollSentinel';
