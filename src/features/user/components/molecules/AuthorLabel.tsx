import { Avatar } from '../../../../components/atoms/Avatar';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { DELETED_ACCOUNT_ID, type MessageUser } from '../../api/message';
import styles from './AuthorLabel.module.css';

type Props = {
  user: MessageUser;
};

const AVATAR_SIZE = 20;

// 質問・回答・投票の投稿者（アイコンと名前）。
// 押すとプロフィールへ移る。カード全体が押せる場所に置いても、リンク側でクリックの
// 伝播を止めているのでカードは開かない（UserAvatar / UserNameLink 参照）。
// 退会済みのアカウントは開けるプロフィールが無いので、リンクにしない。
export const AuthorLabel = ({ user }: Props) => {
  if (user.accountID === DELETED_ACCOUNT_ID) {
    return (
      <span className={styles.row}>
        <Avatar name={user.name} size={AVATAR_SIZE} />
        <span className={styles.name}>{user.name}</span>
      </span>
    );
  }
  return (
    <span className={styles.row}>
      <UserAvatar userId={user.ID} name={user.name} avatarUrl={user.avatarUrl} size={AVATAR_SIZE} />
      <UserNameLink userId={user.ID} className={styles.name}>
        {user.name}
      </UserNameLink>
    </span>
  );
};
