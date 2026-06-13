import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { UserAvatar } from '../../../components/atoms/UserAvatar';
import { RoleBadge } from '../components/atoms/RoleBadge';
import {
  getCommunityMembers,
  updateCommunityMembers,
  type Community,
  type CommunityMember,
  type CommunityMemberUpdateInput,
} from '../api/community';
import { storageUrl } from '../../../lib/storage';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from './CommunityMembersPage.module.css';

export const CommunityMembersPage = () => {
  const navigate = useNavigate();
  const { communityID } = useParams<{ communityID: string }>();
  const location = useLocation();
  const state = location.state as { community: Community; returnPath?: string } | null;
  const returnPath = state?.returnPath;

  const [originalMembers, setOriginalMembers] = useState<CommunityMember[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!communityID) return;
    getCommunityMembers(communityID)
      .then((data) => {
        setOriginalMembers(data);
        setMembers(data);
      })
      .catch(() => setError('メンバー一覧の取得に失敗しました'))
      .finally(() => setLoading(false));
  }, [communityID]);

  const hasChanges = useMemo(() => {
    if (members.length !== originalMembers.length) return true;
    const currentMap = new Map(members.map((m) => [m.user.ID, m.role]));
    return originalMembers.some((m) => currentMap.get(m.user.ID) !== m.role);
  }, [members, originalMembers]);

  const handleKick = (member: CommunityMember) => {
    setMembers((prev) => prev.filter((m) => m.user.ID !== member.user.ID));
  };

  const handleToggleRole = (member: CommunityMember) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.user.ID === member.user.ID
          ? { ...m, role: m.role === 'owner' ? 'member' : 'owner' }
          : m,
      ),
    );
  };

  const doNavigateBack = () => {
    if (returnPath) {
      navigate(returnPath, { state: { showDetail: true } });
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
          <button className={styles.backButton} onClick={handleBack}>
            <ChevronLeft />
          </button>
          <h1 className={styles.title}>メンバー一覧</h1>
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        {loading ? (
          <p className={styles.empty}>読み込み中...</p>
        ) : members.length === 0 ? (
          <p className={styles.empty}>メンバーがいません</p>
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
                  <span className={styles.memberName}>{m.user.name}</span>
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
