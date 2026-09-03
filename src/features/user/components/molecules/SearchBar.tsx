import styles from './SearchBar.module.css';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  submitting?: boolean;
  disabled?: boolean;
};

export const SearchBar = ({ value, onChange, onSubmit, placeholder = '名前で検索', submitting = false, disabled = false }: Props) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={styles.input}
    />
    <button type="submit" disabled={submitting || disabled} className={styles.button}>
      {submitting ? '検索中...' : '検索'}
    </button>
  </form>
);
