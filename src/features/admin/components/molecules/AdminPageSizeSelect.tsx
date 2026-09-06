import styles from '../../styles/AdminShared.module.css';

type Props = {
  value: number;
  onChange: (value: number) => void;
  muted?: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const AdminPageSizeSelect = ({ value, onChange, muted = false }: Props) => (
  <label className={`${styles.controlGroupPlain} ${muted ? styles.mutedText : ''}`}>
    表示件数
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={styles.selectSmall}
    >
      {PAGE_SIZE_OPTIONS.map((n) => (
        <option key={n} value={n}>{n}件</option>
      ))}
    </select>
  </label>
);
