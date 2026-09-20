import styles from './ToggleSwitch.module.css';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
};

export const ToggleSwitch = ({ checked, onChange, disabled = false, loading = false, ariaLabel }: Props) => {
  if (loading) {
    return <span className={styles.skeleton} aria-label={ariaLabel} aria-busy="true" />;
  }

  return (
    <input
      type="checkbox"
      role="switch"
      className={styles.switch}
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
};
