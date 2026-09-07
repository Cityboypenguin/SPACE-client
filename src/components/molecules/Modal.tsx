import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import styles from './Modal.module.css';

type Props = {
  onClose?: () => void;
  closeOnOverlayClick?: boolean;
  overlayClassName?: string;
  overlayStyle?: CSSProperties;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

export const Modal = ({
  onClose,
  closeOnOverlayClick = true,
  overlayClassName,
  overlayStyle,
  className,
  style,
  children,
}: Props) => {
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && onClose && e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={[styles.overlay, overlayClassName].filter(Boolean).join(' ')}
      style={overlayStyle}
      onClick={handleOverlayClick}
    >
      <div className={[styles.modal, className].filter(Boolean).join(' ')} style={style}>
        {children}
      </div>
    </div>
  );
};

type CloseButtonProps = {
  onClick: () => void;
  className?: string;
};

export const ModalCloseButton = ({ onClick, className }: CloseButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    className={[styles.closeButton, className].filter(Boolean).join(' ')}
    aria-label="閉じる"
  >
    ✕
  </button>
);
