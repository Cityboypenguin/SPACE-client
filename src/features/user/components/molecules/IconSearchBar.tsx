import searchIconSvg from '../../../../assets/パーツ_検索.svg';
import styles from './IconSearchBar.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClear?: () => void;
};

export const IconSearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search',
  disabled = false,
  onFocus,
  onBlur,
  onKeyDown,
  onClear,
}: Props) => {
  const inner = (
    <div className={styles.searchWrap}>
      <img src={searchIconSvg} alt="" className={`${styles.searchIcon} themed-icon`} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {value && onClear && (
        <button type="button" className={styles.clearButton} onClick={onClear} aria-label="クリア">
          x
        </button>
      )}
    </div>
  );

  if (onSubmit) {
    return <form onSubmit={onSubmit}>{inner}</form>;
  }
  return inner;
};
