import { Link } from 'react-router-dom';
import styles from './ProfilePillButton.module.css';

type BaseProps = {
  icon: string;
  iconAlt?: string;
  label?: string;
  disabled?: boolean;
  iconOnly?: boolean;
  themedIcon?: boolean;
  compact?: boolean;
  className?: string;
  iconClassName?: string;
  ariaLabel?: string;
  title?: string;
};

type Props =
  | (BaseProps & { onClick: () => void; to?: undefined })
  | (BaseProps & { to: string; onClick?: undefined });

export const ProfilePillButton = (props: Props) => {
  const {
    icon,
    iconAlt = '',
    label,
    disabled,
    iconOnly = false,
    themedIcon = false,
    compact = false,
    className,
    iconClassName,
    ariaLabel,
    title,
  } = props;

  const classes = [styles.button, iconOnly && styles.iconOnly, compact && styles.compact, className].filter(Boolean).join(' ');
  const iconEl = (
    <img
      src={icon}
      alt={iconAlt}
      className={[
        iconOnly ? styles.iconOnlyImg : styles.icon,
        themedIcon && 'themed-icon',
        iconClassName,
      ].filter(Boolean).join(' ')}
    />
  );

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={classes} aria-label={ariaLabel} title={title}>
        {iconEl}
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={props.onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {iconEl}
      {label}
    </button>
  );
};
