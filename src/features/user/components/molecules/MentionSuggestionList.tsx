import { Avatar } from '../../../../components/atoms/Avatar';
import { AvatarFrame } from '../../../../components/atoms/AvatarFrame';
import { storageUrl } from '../../../../lib/storage';
import { type MentionCandidate } from '../../../../lib/mentions';
import styles from './MentionSuggestionList.module.css';

const AVATAR_SIZE = 28;

type Props = {
  suggestions: MentionCandidate[];
  activeIndex: number;
  onSelect: (candidate: MentionCandidate) => void;
  onHover: (index: number) => void;
};

// メンションのサジェスト候補を表示するドロップダウン（表示のみ）。
// 構造・キー操作は HashtagSuggestionList と揃えてある。
export const MentionSuggestionList = ({ suggestions, activeIndex, onSelect, onHover }: Props) => {
  if (suggestions.length === 0) return null;

  return (
    <ul className={styles.list} role="listbox">
      {suggestions.map((s, i) => (
        <li
          key={s.ID}
          role="option"
          aria-selected={i === activeIndex}
          className={`${styles.item} ${i === activeIndex ? styles.itemActive : ''}`}
          // onMouseDown を使う: textarea/input の blur より先に発火させ、選択を確実にするため。
          onMouseDown={(e) => { e.preventDefault(); onSelect(s); }}
          onMouseEnter={() => onHover(i)}
        >
          {s.avatarUrl ? (
            <AvatarFrame size={AVATAR_SIZE}>
              <img
                src={storageUrl(s.avatarUrl) ?? undefined}
                alt=""
                className={styles.avatarImage}
                style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }}
              />
            </AvatarFrame>
          ) : (
            <Avatar name={s.name} size={AVATAR_SIZE} />
          )}
          <span className={styles.name}>{s.name}</span>
          <span className={styles.accountID}>@{s.accountID}</span>
        </li>
      ))}
    </ul>
  );
};
