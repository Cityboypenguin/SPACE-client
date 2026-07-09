import type { HashtagSuggestion } from '../../api/post';
import styles from './HashtagSuggestionList.module.css';

type Props = {
  suggestions: HashtagSuggestion[];
  activeIndex: number;
  onSelect: (tag: string) => void;
  onHover: (index: number) => void;
};

// ハッシュタグのサジェスト候補を表示するドロップダウン（表示のみ）。
export const HashtagSuggestionList = ({ suggestions, activeIndex, onSelect, onHover }: Props) => {
  if (suggestions.length === 0) return null;

  return (
    <ul className={styles.list} role="listbox">
      {suggestions.map((s, i) => (
        <li
          key={s.tag}
          role="option"
          aria-selected={i === activeIndex}
          className={`${styles.item} ${i === activeIndex ? styles.itemActive : ''}`}
          // onMouseDown を使う: textarea/input の blur より先に発火させ、選択を確実にするため。
          onMouseDown={(e) => { e.preventDefault(); onSelect(s.tag); }}
          onMouseEnter={() => onHover(i)}
        >
          <span className={styles.tag}>#{s.tag}</span>
          <span className={styles.count}>{s.count}</span>
        </li>
      ))}
    </ul>
  );
};
