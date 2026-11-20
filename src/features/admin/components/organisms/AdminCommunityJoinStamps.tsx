import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { storageUrl } from '../../../../lib/storage';
import {
  getCommunityJoinStampSettings, saveCommunityJoinStampSettings,
  type ChatStamp, type CommunityJoinStampSettings,
} from '../../api/chatStamps';
import styles from '../../styles/AdminChatStamps.module.css';

const groups = [
  { key: 'welcomeIDs', label: '歓迎スタンプ', description: '既存メンバーが、新しく参加した人を歓迎するときに選ぶ候補です。' },
  { key: 'greetingIDs', label: 'よろしくスタンプ', description: '新しく参加した人の名前で、候補からランダムに1つを自動送信します。' },
] as const;

export const AdminCommunityJoinStamps = ({
  stamps, errorMessage,
}: {
  stamps: ChatStamp[];
  errorMessage: (err: unknown, fallback: string) => string;
}) => {
  const { data, error, isLoading, mutate } = useSWR(
    'admin-community-join-stamps', getCommunityJoinStampSettings, { revalidateOnFocus: false },
  );
  const [draft, setDraft] = useState<CommunityJoinStampSettings | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const settings = draft ?? data;
  const available = stamps.filter((s) => s.status === 'active' && s.allowMessage);
  const activeIDs = new Set(available.map((s) => s.id));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft || saving) return;
    if ([...draft.welcomeIDs, ...draft.greetingIDs].some((id) => !activeIDs.has(id))) {
      setFeedback({ message: '現在使えない候補を取り除いてから保存してください。', error: true });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await saveCommunityJoinStampSettings(draft);
      await mutate(draft, { revalidate: false });
      setDraft(null);
      setFeedback({ message: '参加時のスタンプ設定を保存しました。', error: false });
    } catch (err) {
      setFeedback({ message: errorMessage(err, '参加時のスタンプ設定を保存できませんでした。'), error: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.joinStamps}>
      <h2>コミュニティ参加時のスタンプ</h2>
      {isLoading && <p>読み込み中…</p>}
      {error && <p role="alert">スタンプ設定を取得できませんでした。</p>}
      {settings && (
        <form onSubmit={(e) => void save(e)}>
          {groups.map(({ key, label, description }) => (
            <fieldset key={key} disabled={saving}>
              <legend>{label}</legend>
              <p>{description}</p>
              {available.length === 0 && <p>メッセージ用に公開中のスタンプはありません。</p>}
              <div className={styles.joinStampOptions}>
                {available.map((stamp) => (
                  <label key={stamp.id}>
                    <input type="checkbox" checked={settings[key].includes(stamp.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDraft((previous) => {
                          const current = previous ?? settings;
                          const ids = current[key];
                          return { ...current, [key]: checked ? [...ids, stamp.id] : ids.filter((id) => id !== stamp.id) };
                        });
                      }} />
                    {stamp.imageUrl && <img alt="" src={storageUrl(stamp.imageUrl)} />}
                    {stamp.label}
                  </label>
                ))}
              </div>
              {settings[key].some((id) => !activeIDs.has(id)) && (
                <button type="button" onClick={() => setDraft({ ...settings, [key]: settings[key].filter((id) => activeIDs.has(id)) })}>
                  現在使えない候補を取り除く
                </button>
              )}
            </fieldset>
          ))}
          <button type="submit" disabled={!draft || saving}>参加時のスタンプ設定を保存</button>
        </form>
      )}
      {feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    </section>
  );
};
