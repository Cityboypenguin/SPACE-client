import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { UserNameLink } from '../../../components/atoms/UserNameLink';
import { RoleBadge } from '../components/atoms/RoleBadge';
import {
  getCommunityMembers,
  updateCommunityMembers,
  type Community,
  type CommunityMember,
  type CommunityMemberUpdateInput,
} from '../api/community';
import { storageUrl } from '../../../lib/storage';
import { communityMembersKey } from '../cache/communityMembers';
import { stableCacheOptions } from '../cache/swrOptions';
import { toUserMessage } from '../../../lib/errorMessages';
import { StatusText } from '../../../components/atoms/StatusText';
import styles from './CommunityMembersPage.module.css';

export const CommunityMembersPage = () => {
  const navigate = useNavigate();
  const { communityID } = useParams<{ communityID: string }>();
  const location = useLocation();
  const state = location.state as { community: Community; returnPath?: string } | null;
  const community = state?.community;
  const returnPath = state?.returnPath;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [offset, setOffset] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 詳細パネル・各モーダルと同じキャッシュを共有する。ただしここは編集画面なので
  // マウント時の再検証は残し、必ず最新から編集を始める（その結果は共有キャッシュにも入る）。
  const { data, isLoading: loading, error: loadError } = useSWR(
    communityID ? communityMembersKey(communityID, pageSize, offset) : null,
    ([, cid, limit, pageOffset]: [string, string, number, number]) => getCommunityMembers(cid, limit, pageOffset),
    stableCacheOptions,
  );

  // 編集中の下書き。null のあいだはサーバーの値をそのまま見せる。
  // 「保存前の値」は常にサーバー由来の data 側なので、差分計算の基準がぶれない。
  const [draft, setDraft] = useState<CommunityMember[] | null>(null);
  const originalMembers = useMemo(() => data?.items ?? [], [data]);
  const members = draft ?? originalMembers;

  const hasChanges = useMemo(() => {
    if (members.length !== originalMembers.length) return true;
    const currentMap = new Map(members.map((m) => [m.user.ID, m.role]));
    return originalMembers.some((m) => currentMap.get(m.user.ID) !== m.role);
  }, [members, originalMembers]);

  const handleKick = (member: CommunityMember) => {
    setDraft(members.filter((m) => m.user.ID !== member.user.ID));
  };

  const handleToggleRole = (member: CommunityMember) => {
    setDraft(members.map((m) =>
      m.user.ID === member.user.ID
        ? { ...m, role: m.role === 'owner' ? 'member' : 'owner' }
        : m,
    ));
  };

  const doNavigateBack = () => {
    if (returnPath) {
      navigate(returnPath, { state: { showDetail: true, communityID: community?.ID, community } });
    } else {
      navigate(-1);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true);
    } else {
      doNavigateBack();
    }
  };

  const handleSave = async () => {
    if (!communityID) return;
    setSaving(true);
    setError('');
    try {
      const currentIds = new Set(members.map((m) => m.user.ID));
      const updates: CommunityMemberUpdateInput[] = [];

      for (const orig of originalMembers) {
        if (!currentIds.has(orig.user.ID)) {
          updates.push({ userID: orig.user.ID, action: 'KICK' });
        }
      }
      for (const m of members) {
        const orig = originalMembers.find((o) => o.user.ID === m.user.ID);
        if (orig && orig.role !== m.role) {
          updates.push({ userID: m.user.ID, action: m.role === 'owner' ? 'PROMOTE' : 'DEMOTE' });
        }
      }

      if (updates.length > 0) {
        // updateCommunityMembers は成功時にメンバー一覧のキャッシュも捨てる。
        await updateCommunityMembers(communityID, updates);
      }
      doNavigateBack();
    } catch (err) {
      setError(toUserMessage(err, '保存に失敗しました。'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <button onClick={handleBack}>
            <ChevronLeft />
          </button>
          <h1 className={styles.title}>メンバー一覧</h1>
        </div>

        {(error || loadError) && (
          <p className={styles.errorText}>{error || 'メンバー一覧の取得に失敗しました'}</p>
        )}

        {loading ? (
          <StatusText style={{ padding: '2rem 0' }}>読み込み中...</StatusText>
        ) : members.length === 0 ? (
          <StatusText style={{ padding: '2rem 0' }}>メンバーがいません</StatusText>
        ) : (
          <>
            <ul className={styles.list}>
              {members.map((m) => (
                <li key={m.user.ID} className={styles.item}>
                  <UserAvatar
                    userId={m.user.ID}
                    name={m.user.name}
                    avatarUrl={m.user.avatarUrl ? storageUrl(m.user.avatarUrl) ?? undefined : undefined}
                    size={36}
                  />
                  <UserNameLink userId={m.user.ID} className={styles.memberName}>{m.user.name}</UserNameLink>
                  <div className={styles.itemRight}>
                    {m.role !== 'owner' && (
                      <button className={styles.kickBtn} onClick={() => handleKick(m)}>
                        キック
                      </button>
                    )}
                    <RoleBadge role={m.role} onClick={() => handleToggleRole(m)} />
                  </div>
                </li>
              ))}
            </ul>
            {(data?.total ?? 0) > pageSize && !hasChanges && (
              <div className={styles.pagination}>
                <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))}>前へ</button>
                <span>{Math.floor(offset / pageSize) + 1} / {Math.ceil((data?.total ?? 0) / pageSize)}</span>
                <button disabled={offset + pageSize >= (data?.total ?? 0)} onClick={() => setOffset(offset + pageSize)}>次へ</button>
              </div>
            )}
            <div className={styles.footer}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </>
        )}

        {showDiscardConfirm && (
          <div className={styles.discardOverlay}>
            <div className={styles.discardDialog}>
              <p className={styles.discardMessage}>変更を破棄しますか？</p>
              <div className={styles.discardActions}>
                <button className={styles.discardCancelBtn} onClick={() => setShowDiscardConfirm(false)}>
                  キャンセル
                </button>
                <button className={styles.discardConfirmBtn} onClick={doNavigateBack}>
                  破棄する
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
