import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import { Avatar } from '../../../components/atoms/Avatar';
import { AvatarFrame } from '../../../components/atoms/AvatarFrame';
import { UserSidebar } from '../components/organisms/UserSidebar';
import { InvitationExpiry } from '../components/molecules/InvitationExpiry';
import { useAuth } from '../context/useAuth';
import {
  createInvitationLink, inviteCandidates, inviteCommunityUsers, revokeInvitation, sentInvitations,
  type InviteCandidate, type InviteLinkOptions, type SentInvitation,
} from '../api/communityInvitations';
import { refreshInvitationCaches, sharedInvitationPath } from '../lib/communityInvitationLinks';
import { toUserMessage } from '../../../lib/errorMessages';
import { storageUrl } from '../../../lib/storage';
import { AppSwal } from '../../../lib/swal';
import mailIcon from '../../../assets/パーツ_メール.svg';
import styles from './CommunityInvitationsPage.module.css';

const pageSize = 20;
const maxSelection = 20;
const messageMaxLength = 200;

const lifetimeOptions = [
  { hours: 1, label: '1時間' },
  { hours: 24, label: '1日' },
  { hours: 72, label: '3日' },
  { hours: 168, label: '7日' },
  { hours: 720, label: '30日' },
];

const candidateTag: Record<string, string> = {
  member: '参加済み',
  invited: '招待中',
  unavailable: '招待できません',
};

const historyStatus: Record<string, { label: string; tone: 'success' | 'muted' | 'danger' }> = {
  accepted: { label: '参加済み', tone: 'success' },
  pending: { label: '参加済み', tone: 'success' }, // 宛先が自分で参加した個別の招待
  declined: { label: '辞退', tone: 'muted' },
  revoked: { label: '取り消し', tone: 'danger' },
  expired: { label: '期限切れ', tone: 'muted' },
};

type CandidateUser = InviteCandidate['user'];

// 顔アイコン。UserAvatar はプロフィールへのリンクになり、押すと選択中の状態が消えて
// しまうので、ここでは表示だけにする。
const PlainAvatar = ({ user, size = 36 }: { user: CandidateUser; size?: number }) => {
  const src = user.avatarUrl ? storageUrl(user.avatarUrl) : null;
  if (!src) return <Avatar name={user.name} size={size} />;
  return (
    <AvatarFrame size={size}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </AvatarFrame>
  );
};

const formatDate = (value: string) => new Date(value).toLocaleString('ja-JP', {
  month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

const linkUsage = (invite: Pick<SentInvitation, 'useCount'>) => `${invite.useCount}人が参加`;

export const CommunityInviteSendPage = () => {
  const { communityID, roomID } = useParams<{ communityID: string; roomID: string }>();
  const { userId } = useAuth();
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Map<string, CandidateUser>>(() => new Map());
  const [message, setMessage] = useState('');
  const [linkOptions, setLinkOptions] = useState<InviteLinkOptions>({ expiresInHours: 168, message: '' });
  const [link, setLink] = useState<{ id: string; url: string; expiresAt: string } | null>(null);
  const [tab, setTab] = useState<'active' | 'history'>('active');
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [failures, setFailures] = useState<{ name: string; reason: string }[]>([]);

  // 検索結果の「招待中・参加済み」はサーバーが判定する。SWR に載せておけば、
  // 招待の状態が変わったとき（refreshInvitationCaches）に一緒に取り直される。
  const { data: candidates, error: searchError, isValidating: searching } = useSWR(
    communityID && keyword ? ['community-invite-candidates', communityID, keyword] : null,
    () => inviteCandidates(communityID!, keyword),
    { revalidateOnFocus: true, keepPreviousData: true },
  );
  // 送った招待。相手の参加・辞退はサーバーから community_invitations_changed で知らされる。
  const { data: sent, error: sentError, isLoading, mutate } = useSWR(
    userId && roomID ? ['sent-community-invitations', userId, roomID, tab, page] : null,
    () => sentInvitations(roomID!, tab === 'history', pageSize + 1, page * pageSize),
    { revalidateOnFocus: true, keepPreviousData: true },
  );

  const run = async (action: () => Promise<void>, fallback: string) => {
    if (busy) return;
    setBusy(true);
    setNotice('');
    setError('');
    setFailures([]);
    try {
      await action();
    } catch (err) {
      setError(toUserMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const search = (e: FormEvent) => {
    e.preventDefault();
    setKeyword(query.trim());
  };

  const toggle = (user: CandidateUser) => {
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(user.ID)) next.delete(user.ID);
      else if (next.size < maxSelection) next.set(user.ID, user);
      return next;
    });
  };

  const send = () => {
    if (!communityID || selected.size === 0) return;
    void run(async () => {
      const targets = [...selected.values()];
      const results = await inviteCommunityUsers(communityID, targets.map((user) => user.ID), message.trim());
      const names = new Map(targets.map((user) => [user.ID, user.name]));
      const succeeded = results.filter((result) => !result.error);
      const failed = results.filter((result) => result.error);
      if (succeeded.length === 1) setNotice(`${names.get(succeeded[0].userID)}さんに招待を送りました。`);
      else if (succeeded.length > 1) setNotice(`${succeeded.length}人に招待を送りました。`);
      setFailures(failed.map((result) => ({ name: names.get(result.userID) ?? '', reason: result.error ?? '' })));
      setSelected(new Map(targets.filter((user) => failed.some((result) => result.userID === user.ID)).map((user) => [user.ID, user])));
      if (succeeded.length > 0) setMessage('');
      setTab('active');
      setPage(0);
      void refreshInvitationCaches();
    }, '招待を送れませんでした。');
  };

  const create = () => {
    if (!communityID) return;
    void run(async () => {
      const data = await createInvitationLink(communityID, linkOptions);
      setLink({
        id: data.invitation.id,
        url: new URL(sharedInvitationPath(data.token), window.location.origin).href,
        expiresAt: data.invitation.expiresAt,
      });
      setTab('active');
      setPage(0);
      void mutate();
    }, '招待リンクを作成できませんでした。');
  };

  const revoke = async (id: string, label: string) => {
    const confirmed = await AppSwal.fire({
      text: `${label}を取り消しますか？取り消した招待からは参加できなくなります。`,
      confirmButtonText: '取り消す',
      cancelButtonText: 'やめる',
      showCancelButton: true,
    });
    if (!confirmed.isConfirmed) return;
    void run(async () => {
      await revokeInvitation(id);
      if (id === link?.id) setLink(null);
      setNotice('招待を取り消しました。');
      void refreshInvitationCaches();
    }, '招待を取り消せませんでした。');
  };

  const copy = () => {
    if (!link) return;
    void run(async () => {
      await navigator.clipboard.writeText(link.url);
      setNotice('リンクをコピーしました。');
    }, 'リンクをコピーできませんでした。表示されたURLを選択してコピーしてください。');
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const share = async () => {
    if (!link) return;
    try {
      await navigator.share({ title: 'コミュニティへの招待', url: link.url });
    } catch (err) {
      // 共有シートを閉じただけなら何も出さない。
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError('共有できませんでした。リンクをコピーして送ってください。');
    }
  };

  const switchTab = (next: 'active' | 'history') => {
    setTab(next);
    setPage(0);
  };

  return (
    <div>
      <UserSidebar />
      <main className={styles.page}>
        <Link className={styles.backLink} to={roomID ? `/community/chat/${roomID}` : '/community'} state={{ showDetail: true }}>
          <ChevronLeft size={7} />コミュニティに戻る
        </Link>
        <div className={styles.header}>
          <h1>メンバーを招待する</h1>
        </div>
        {notice && <p className={styles.notice} role="status">{notice}</p>}
        {error && <p className={styles.alert} role="alert">{error}</p>}
        {failures.length > 0 && (
          <div className={styles.alert} role="alert">
            <div>
              <p className={styles.alertTitle}>{failures.length}人には招待を送れませんでした。</p>
              <ul className={styles.failureList}>
                {failures.map((failure) => <li key={failure.name}>{failure.name}さん：{failure.reason}</li>)}
              </ul>
            </div>
          </div>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>ユーザーを選んで招待</h2>
            <p>一度に{maxSelection}人まで選べます。招待された人には通知が届きます。</p>
          </div>
          <form onSubmit={search} className={styles.searchForm} role="search">
            <input type="search" className={styles.textInput} aria-label="名前またはアカウントID" placeholder="名前またはアカウントID"
              value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="submit" className={styles.secondaryButton} disabled={!query.trim() || (searching && query.trim() === keyword)}>検索</button>
          </form>
          {searchError && <p className={styles.muted} role="alert">ユーザーを検索できませんでした。</p>}
          {candidates && keyword && candidates.items.filter((c) => c.user.ID !== userId).length === 0 && (
            <p className={styles.muted}>該当するユーザーが見つかりませんでした。</p>
          )}
          {!!candidates?.items.length && (
            <ul className={styles.rows}>
              {candidates.items.filter((candidate) => candidate.user.ID !== userId).map(({ user, status }) => {
                const available = status === 'available';
                const checked = selected.has(user.ID);
                const full = !checked && selected.size >= maxSelection;
                return (
                  <li key={user.ID}>
                    <label className={`${styles.row} ${styles.selectRow} ${checked ? styles.selectRowChecked : ''} ${available ? '' : styles.selectRowDisabled}`}>
                      <input type="checkbox" className={styles.checkbox} checked={checked} disabled={!available || full}
                        aria-label={`${user.name}（@${user.accountID}）を選ぶ`} onChange={() => toggle(user)} />
                      <PlainAvatar user={user} />
                      <span className={styles.rowBody}>
                        <span className={styles.rowTitle}>{user.name}</span>
                        <span className={styles.rowSub}>@{user.accountID}</span>
                      </span>
                      {!available && (
                        <span className={`${styles.statusTag} ${status === 'unavailable' ? '' : styles.statusTagInfo}`}>
                          {candidateTag[status] ?? candidateTag.unavailable}
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className={styles.composer}>
            {selected.size > 0 && (
              <ul className={styles.chips} aria-label="選んだ人">
                {[...selected.values()].map((user) => (
                  <li key={user.ID} className={styles.chip}>
                    <PlainAvatar user={user} size={22} />
                    <span>{user.name}</span>
                    <button type="button" aria-label={`${user.name}を外す`} onClick={() => toggle(user)}>×</button>
                  </li>
                ))}
              </ul>
            )}
            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                一言メッセージ（任意）
                <span className={message.length > messageMaxLength ? styles.counterOver : styles.counter}>
                  {message.length}/{messageMaxLength}
                </span>
              </span>
              <textarea className={styles.textArea} rows={2} maxLength={messageMaxLength} value={message}
                placeholder="例：授業で話した〇〇のコミュニティです。気軽にどうぞ！"
                onChange={(e) => setMessage(e.target.value)} />
            </label>
            <div className={styles.composerFooter}>
              <span className={styles.muted}>{selected.size === 0 ? '検索結果から招待する人を選んでください' : `${selected.size}人を選択中`}</span>
              <button type="button" className={styles.primaryButton} onClick={send} disabled={busy || selected.size === 0}>
                {selected.size > 0 ? `${selected.size}人を招待する` : '招待する'}
              </button>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>招待リンクを作成</h2>
            <p>リンクを知っている人は誰でも参加できます。グループやSNSで気軽に共有してください。</p>
          </div>
          <div className={styles.settingsGrid}>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>有効期限</span>
              <select className={styles.select} value={linkOptions.expiresInHours}
                onChange={(e) => setLinkOptions({ ...linkOptions, expiresInHours: Number(e.target.value) })}>
                {lifetimeOptions.map((option) => <option key={option.hours} value={option.hours}>{option.label}</option>)}
              </select>
            </label>
            <label className={`${styles.field} ${styles.fieldWide}`}>
              <span className={styles.fieldLabel}>リンクを開いた人へのメッセージ（任意）</span>
              <input type="text" className={styles.textInput} maxLength={messageMaxLength} value={linkOptions.message}
                onChange={(e) => setLinkOptions({ ...linkOptions, message: e.target.value })} />
            </label>
          </div>
          <div>
            <button type="button" className={styles.secondaryButton} onClick={create} disabled={busy}>
              {link ? '新しいリンクを作成' : 'リンクを作成する'}
            </button>
          </div>
          {link && (
            <div className={styles.linkBox}>
              <div className={styles.linkField}>
                <input type="text" className={styles.textInput} aria-label="発行した招待リンク" value={link.url} readOnly
                  onFocus={(e) => e.target.select()} />
                <button type="button" className={styles.primaryButton} onClick={copy} disabled={busy}>コピー</button>
                {canShare && (
                  <button type="button" className={styles.secondaryButton} onClick={() => void share()} disabled={busy}>共有</button>
                )}
              </div>
              <div className={styles.linkMeta}>
                <span>{formatDate(link.expiresAt)}まで有効</span>
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>送った招待</h2>
          </div>
          <div className={styles.tabs} role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'active'}
              className={tab === 'active' ? styles.tabActive : styles.tab} onClick={() => switchTab('active')}>
              有効な招待
            </button>
            <button type="button" role="tab" aria-selected={tab === 'history'}
              className={tab === 'history' ? styles.tabActive : styles.tab} onClick={() => switchTab('history')}>
              履歴
            </button>
          </div>
          {isLoading && !sent && <div className={styles.skeleton} style={{ height: '3rem' }} aria-busy="true" aria-label="読み込み中" />}
          {sentError && <p className={styles.alert} role="alert">招待を読み込めませんでした。</p>}
          {sent?.length === 0 && (
            <p className={styles.muted}>{tab === 'active' ? '有効な招待はありません。' : 'まだ履歴はありません。'}</p>
          )}
          {!!sent?.length && (
            <ul className={styles.rows}>
              {sent.slice(0, pageSize).map((invite) => {
                const label = invite.isLink ? '招待リンク' : (invite.recipientName ?? 'ユーザーへの招待');
                const state = historyStatus[invite.status] ?? historyStatus.expired;
                return (
                  <li key={invite.id} className={styles.row}>
                    <span className={styles.rowIcon} aria-hidden="true">
                      {invite.isLink ? '🔗' : <img src={mailIcon} alt="" className={`${styles.mailIcon} themed-icon`} />}
                    </span>
                    <span className={styles.rowBody}>
                      <span className={styles.rowTitle}>
                        {label}
                        {!invite.isLink && invite.recipientAccountID && (
                          <small className={styles.rowSub}> @{invite.recipientAccountID}</small>
                        )}
                      </span>
                      <span className={styles.rowSub}>
                        {invite.senderName ? `${invite.senderName}さんが` : ''}{formatDate(invite.createdAt)}に作成
                        {invite.isLink && ` · ${linkUsage(invite)}`}
                        {tab === 'history' && invite.respondedAt && ` · ${formatDate(invite.respondedAt)}に${state.label}`}
                      </span>
                      {invite.message && <span className={styles.rowMessage}>「{invite.message}」</span>}
                    </span>
                    <span className={styles.rowAside}>
                      {tab === 'active' ? (
                        <>
                          <InvitationExpiry expiresAt={invite.expiresAt} />
                          <button type="button" className={styles.dangerButton} onClick={() => void revoke(invite.id, label)} disabled={busy}>
                            取り消す
                          </button>
                        </>
                      ) : (
                        <span className={`${styles.statusTag} ${state.tone === 'success' ? styles.statusTagSuccess : state.tone === 'danger' ? styles.statusTagDanger : ''}`}>
                          {state.label}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {(page > 0 || (sent && sent.length > pageSize)) && (
            <nav className={styles.pagination} aria-label="ページ">
              <button type="button" className={styles.secondaryButton} disabled={page === 0} onClick={() => setPage(page - 1)}>前へ</button>
              <span>{page + 1}ページ目</span>
              <button type="button" className={styles.secondaryButton} disabled={!sent || sent.length <= pageSize} onClick={() => setPage(page + 1)}>次へ</button>
            </nav>
          )}
        </section>
      </main>
    </div>
  );
};
