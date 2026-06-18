import searchIconSvg from '../../../../assets/パーツ_検索.svg';
import styles from './IconSearchBar.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
};

export const IconSearchBar = ({ value, onChange, onSubmit, placeholder = 'Search', disabled = false }: Props) => {
  const inner = (
    <div className={styles.searchWrap}>
      <img src={searchIconSvg} alt="" className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );

  if (onSubmit) {
    return <form onSubmit={onSubmit}>{inner}</form>;
  }
  return inner;
};
