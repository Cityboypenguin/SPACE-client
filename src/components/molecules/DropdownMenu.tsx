import { useState, type CSSProperties, type ReactNode } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './DropdownMenu.module.css';

type Props = {
  trigger?: ReactNode;
  triggerClassName?: string;
  wrapClassName?: string;
  wrapStyle?: CSSProperties;
  dropdownClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
  /** Controlled open state — pass together with onOpenChange when a caller needs to
   *  close the menu from outside the item click handlers (e.g. from within an async action). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: (close: () => void) => ReactNode;
};

export const DropdownMenu = ({
  trigger = '···',
  triggerClassName,
  wrapClassName,
  wrapStyle,
  dropdownClassName,
  ariaLabel = 'メニュー',
  disabled,
  open: openProp,
  onOpenChange,
  children,
}: Props) => {
  const [openState, setOpenState] = useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openState;
  const setOpen = (next: boolean) => {
    if (!isControlled) setOpenState(next);
    onOpenChange?.(next);
  };
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className={[styles.wrap, wrapClassName].filter(Boolean).join(' ')} style={wrapStyle} ref={ref}>
      <button
        type="button"
        className={[styles.trigger, triggerClassName].filter(Boolean).join(' ')}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {trigger}
      </button>
      {open && (
        <div className={[styles.dropdown, dropdownClassName].filter(Boolean).join(' ')} onClick={(e) => e.stopPropagation()}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
};

type ItemProps = {
  onClick: () => void;
  icon?: string;
  iconAlt?: string;
  themedIcon?: boolean;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export const DropdownMenuItem = ({
  onClick,
  icon,
  iconAlt = '',
  themedIcon,
  danger,
  disabled,
  className,
  children,
}: ItemProps) => (
  <button
    type="button"
    className={[styles.item, danger && styles.itemDanger, className].filter(Boolean).join(' ')}
    onClick={onClick}
    disabled={disabled}
  >
    {icon && <img src={icon} alt={iconAlt} className={[styles.itemIcon, themedIcon && 'themed-icon'].filter(Boolean).join(' ')} />}
    {children}
  </button>
);
