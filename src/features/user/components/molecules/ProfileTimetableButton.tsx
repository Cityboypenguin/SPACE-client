import timetableIcon from '../../../../assets/パーツ_時間割.svg';
import { ProfilePillButton } from './ProfilePillButton';

type Props = {
  onClick: () => void;
};

export const ProfileTimetableButton = ({ onClick }: Props) => (
  <ProfilePillButton icon={timetableIcon} label="時間割" onClick={onClick} themedIcon />
);
