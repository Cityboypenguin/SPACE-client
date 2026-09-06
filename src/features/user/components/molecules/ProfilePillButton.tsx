import styles from './ProfilePillButton.module.css';

type Props = {
  icon: string;
  iconAlt?: string;
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
  themedIcon?: boolean;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  title?: string;
};

export const ProfilePillButton = ({
  icon,
  iconAlt = '',
  label,
  onClick,
  disabled,
  iconOnly = false,
  themedIcon = false,
  className,
  iconClassName,
  ariaLabel,
  title,
}: Props) => (
  <button
    type="button"
    className={[styles.button, iconOnly && styles.iconOnly, className].filter(Boolean).join(' ')}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    title={title}
  >
    <img
      src={icon}
      alt={iconAlt}
      className={[
        iconOnly ? styles.iconOnlyImg : styles.icon,
        themedIcon && 'themed-icon',
        iconClassName,
      ].filter(Boolean).join(' ')}
    />
    {label}
  </button>
);
