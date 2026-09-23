import { useState } from 'react';
import useSWR from 'swr';
import { getPostFavorites } from '../../api/post';
import { stableCacheOptions } from '../../cache/swrOptions';
import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../../components/atoms/UserNameLink';
import { Modal, ModalCloseButton } from '../../../../components/molecules/Modal';
import { storageUrl } from '../../../../lib/storage';
import styles from './PostFavoritesModal.module.css';

const PAGE_SIZE = 50;

type Props = {
  postId: string;
  // いいねの総数（投稿が持っている favoriteCount）。ページ送りを出すかどうかと、
  // 「次へ」で行き止まりかどうかの判定に使う。
  favoriteCount: number;
  onClose: () => void;
};

// この投稿をいいねした人の一覧。
//
// 開いてよいのは自分の投稿のときだけ。サーバー側も投稿した本人（と管理者）にしか
// 返さないので、他人の投稿で開くと読み込みに失敗する。呼び出し側（PostDetailPage）が
// 自分の投稿かどうかを見てから渡すこと。
export const PostFavoritesModal = ({ postId, favoriteCount, onClose }: Props) => {
  const [offset, setOffset] = useState(0);
  // 開き直したときは取り直す（間に付いたいいねを取りこぼさないため）。
  // 表示中は再フォーカスのたびに読み直さない。
  const { data, isLoading, error } = useSWR(
    ['post-favorites', postId, offset],
    ([, id, pageOffset]: [string, string, number]) => getPostFavorites(id, PAGE_SIZE, pageOffset),
    stableCacheOptions,
  );
  const favorites = data ?? [];

  return (
    <Modal onClose={onClose} overlayClassName={styles.overlay} className={styles.modal}>
      <div className={styles.header}>
        <h3 className={styles.title}>いいねした人 ({favoriteCount})</h3>
        <ModalCloseButton onClick={onClose} />
      </div>

      <div className={styles.body}>
        {isLoading && <p className={styles.statusText}>読み込み中...</p>}
        {error && <p className={styles.errorText}>いいねした人の取得に失敗しました</p>}

        {!isLoading && !error && (
          favorites.length === 0 ? (
            <p className={styles.statusText}>まだ誰もいいねしていません</p>
          ) : (
            <ul className={styles.userList}>
              {favorites.map((f) => (
                <li key={f.ID} className={styles.userItem}>
                  <UserAvatar
                    userId={f.user.ID}
                    name={f.user.name}
                    avatarUrl={f.user.avatarUrl ? storageUrl(f.user.avatarUrl) : undefined}
                    size={36}
                  />
                  <div className={styles.userInfo}>
                    <UserNameLink userId={f.user.ID}>
                      <div className={styles.userName}>{f.user.name}</div>
                    </UserNameLink>
                    <div className={styles.userAccountId}>@{f.user.accountID}</div>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}

        {!isLoading && !error && favoriteCount > PAGE_SIZE && (
          <div className={styles.pager}>
            <button
              className={styles.pagerButton}
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              前へ
            </button>
            <span className={styles.pagerRange}>
              {offset + 1}〜{Math.min(offset + PAGE_SIZE, favoriteCount)} / {favoriteCount}
            </span>
            <button
              className={styles.pagerButton}
              disabled={offset + PAGE_SIZE >= favoriteCount}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
