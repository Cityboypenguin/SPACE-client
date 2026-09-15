import { forwardRef } from 'react';
import styles from './ChatUnreadSeparator.module.css';

// DM・コミュニティ・授業チャットで共通の「ここから未読」の区切り線。
// 開いた時にこの位置までスクロールさせるため、呼び出し側が ref を受け取る
// (ScrollSentinel と同じ方式)。
export const ChatUnreadSeparator = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className={styles.separator}>
    未読メッセージ
  </div>
));

ChatUnreadSeparator.displayName = 'ChatUnreadSeparator';
