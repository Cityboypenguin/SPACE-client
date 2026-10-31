import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminHeader } from '../components/organisms/AdminHeader';
import type { NgWordMatchType } from '../../../generated/graphql';
import {
  createNGWord,
  deleteNGWord,
  getNGWordStats,
  listNGWords,
  NINE_DIGITS_PATTERN,
  type NGWord,
  type NGWordStats,
} from '../api/ngWords';
import { toUserMessage } from '../../../lib/errorMessages';
import styles from '../styles/AdminShared.module.css';

const matchTypeLabel: Record<NgWordMatchType, string> = {
  WORD: '含む',
  REGEX: '正規表現',
};

const MAX_PATTERN_CHARS = 100;

const formatDate = (s: string) => s.slice(0, 10);

// 授業内チャットのNGワードの登録と、止めた回数の集計。
export const AdminNGWordsPage = () => {
  const [words, setWords] = useState<NGWord[]>([]);
  const [stats, setStats] = useState<NGWordStats | null>(null);
  const [loading, setLoading] = useState(true);
  // 取得に成功したか。失敗したときに「登録がありません」と出さないため。
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [pattern, setPattern] = useState('');
  const [matchType, setMatchType] = useState<NgWordMatchType>('WORD');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [w, s] = await Promise.all([listNGWords(), getNGWordStats()]);
      setWords(w);
      setStats(s);
      setLoaded(true);
      setError('');
    } catch (err) {
      setError(toUserMessage(err, 'NGワードの取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  // サーバーの上限は「文字数」（絵文字などは1文字）。input の maxLength は UTF-16 の単位で数えて食い違うので使わない。
  const patternTooLong = [...pattern].length > MAX_PATTERN_CHARS;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pattern.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await createNGWord(pattern, matchType);
      setPattern('');
      await load();
    } catch (err) {
      setError(toUserMessage(err, 'NGワードを追加できませんでした'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: NGWord) => {
    if (!window.confirm(`NGワード「${w.pattern}」を削除しますか？\n削除すると、この言葉を含む投稿が通るようになります（止めた回数の記録は残ります）。`)) return;
    setError('');
    try {
      await deleteNGWord(w.ID);
      await load();
    } catch (err) {
      setError(toUserMessage(err, 'NGワードを削除できませんでした'));
    }
  };

  const fillNineDigits = () => {
    setPattern(NINE_DIGITS_PATTERN);
    setMatchType('REGEX');
  };

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered} style={{ maxWidth: '900px' }}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>NGワード管理</h1>
        </div>
        <p className={styles.cellMuted} style={{ marginBottom: '16px' }}>
          授業内チャットのメッセージ・質問・回答にここの言葉が含まれていると、投稿の前に止めます（どの言葉に当たったかは本人に伝えません）。
          管理者の投稿は止めません。大文字・小文字と全角・半角は区別しません（正規表現も同じ）。
        </p>

        {error && <p className={styles.formError}>{error}</p>}

        <section className={styles.card} style={{ padding: '16px', marginBottom: '24px' }}>
          <h2 className={styles.sectionTitle}>NGワードを追加</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className={styles.input}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder={matchType === 'REGEX' ? '正規表現（例: \\d{9}）' : '例: Respon'}
              aria-label="NGワード"
            />
            <select
              className={styles.select}
              style={{ width: 'auto' }}
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as NgWordMatchType)}
              aria-label="照合のしかた"
            >
              <option value={'WORD'}>含む</option>
              <option value={'REGEX'}>正規表現</option>
            </select>
            <button type="submit" className={styles.primaryButton} disabled={saving || !pattern.trim() || patternTooLong}>
              {saving ? '追加中...' : '追加'}
            </button>
            <button type="button" className={styles.paginationButton} onClick={fillNineDigits}>
              9桁の数字（レスポンの番号）を入れる
            </button>
          </form>
          {patternTooLong && <p className={styles.formError}>NGワードは{MAX_PATTERN_CHARS}文字以内で入力してください。</p>}
        </section>

        <section style={{ marginBottom: '32px' }}>
          <h2 className={styles.sectionTitle}>登録中のNGワード（{words.length}件）</h2>
          {loading ? (
            <p className={styles.cellMuted}>読み込み中...</p>
          ) : !loaded ? null : words.length === 0 ? (
            <p className={styles.cellMuted}>まだ登録がありません。</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeaderRowStrong}>
                    <th className={styles.mutedTableHeader}>NGワード</th>
                    <th className={styles.mutedTableHeader}>照合</th>
                    <th className={styles.mutedTableHeader}>登録日</th>
                    <th className={styles.mutedTableHeader} />
                  </tr>
                </thead>
                <tbody>
                  {words.map((w) => (
                    <tr key={w.ID} className={styles.tableRow}>
                      <td className={styles.tableCellBody}><code>{w.pattern}</code></td>
                      <td className={styles.tableCellBody}>{matchTypeLabel[w.matchType]}</td>
                      <td className={styles.tableCellBody}>{formatDate(w.createdAt)}</td>
                      <td className={styles.tableCellBody}>
                        <button type="button" className={styles.dangerButton} onClick={() => void handleDelete(w)}>削除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className={styles.sectionTitle}>止めた回数{stats ? `（合計 ${stats.total} 回）` : ''}</h2>
          {loaded && stats && stats.total === 0 && <p className={styles.cellMuted}>まだ止めた投稿はありません。</p>}
          {stats && stats.total > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              <div className={styles.tableWrap}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '0.95rem' }}>言葉ごと（多い順）</h3>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRowStrong}>
                      <th className={styles.mutedTableHeader}>NGワード</th>
                      <th className={styles.mutedTableHeader}>回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byWord.map((c) => (
                      <tr key={c.pattern} className={styles.tableRow}>
                        <td className={styles.tableCellBody}><code>{c.pattern}</code></td>
                        <td className={styles.tableCellBody}>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.tableWrap}>
                <h3 className={styles.sectionTitle} style={{ fontSize: '0.95rem' }}>言った人ごと（多い順）</h3>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRowStrong}>
                      <th className={styles.mutedTableHeader}>ユーザー</th>
                      <th className={styles.mutedTableHeader}>回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byUser.map((c) => (
                      <tr key={c.userID} className={styles.tableRow}>
                        <td className={styles.tableCellBody}>
                          <Link to={`/admin/users/${c.userID}`}>{c.name}</Link>
                          <span className={styles.cellMuted}> @{c.accountID}</span>
                        </td>
                        <td className={styles.tableCellBody}>{c.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
