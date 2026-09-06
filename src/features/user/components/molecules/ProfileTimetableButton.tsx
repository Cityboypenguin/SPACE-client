import timetableIcon from '../../../../assets/パーツ_時間割.svg';
import styles from './ProfileTimetableButton.module.css';

type Props = {
  onClick: () => void;
};

export const ProfileTimetableButton = ({ onClick }: Props) => (
  <button type="button" className={styles.button} onClick={onClick}>
    <img src={timetableIcon} alt="" className={`${styles.icon} themed-icon`} />
    時間割
  </button>
);
