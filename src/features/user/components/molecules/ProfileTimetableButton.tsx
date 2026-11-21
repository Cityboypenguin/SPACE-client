import timetableIcon from '../../../../assets/パーツ_時間割.svg';
import { ProfilePillButton } from './ProfilePillButton';
import styles from './ProfileTimetableButton.module.css';

type Props = {
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
  title?: string;
};

export const ProfileTimetableButton = ({ onClick, compact, disabled, title }: Props) => (
  <ProfilePillButton
    icon={timetableIcon}
    label="時間割"
    onClick={onClick}
    disabled={disabled}
    title={title}
    themedIcon
    compact={compact}
    className={disabled ? styles.disabled : undefined}
  />
);
