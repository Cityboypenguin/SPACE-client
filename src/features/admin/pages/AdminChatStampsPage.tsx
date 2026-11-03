import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminHeader } from '../components/organisms/AdminHeader';
import {
  listChatStamps,
  saveChatStamp,
  reorderChatStamps,
  uploadStampImage,
  type ChatStamp,
  type StampInput,
} from '../api/chatStamps';
import { refreshChatStamps } from '../../user/hooks/useChatStamps';
import { storageUrl } from '../../../lib/storage';
import { toUserMessage } from '../../../lib/errorMessages';
import { GraphQLRequestError } from '../../../lib/graphql';
import styles from '../styles/AdminChatStamps.module.css';
import shared from '../styles/AdminShared.module.css';

const stampErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof GraphQLRequestError) {
    const input = err.errors.find(
      (e) =>
        e.extensions?.code === 'INVALID_INPUT' ||
        e.extensions?.code === 'CONFLICT',
    );
    if (input) return input.message;
  }
  return toUserMessage(err, fallback);
};

const fresh = (): StampInput => ({
  label: '',
  displaySize: 'standard',
  status: 'draft',
  allowMessage: true,
  allowReaction: true,
  messageOrder: 0,
  reactionOrder: 0,
  version: 0,
});
const statusName: Record<string, string> = {
  draft: '下書き',
  active: '公開中',
  inactive: '利用停止',
};
export const AdminChatStampsPage = () => {
  const [items, setItems] = useState<ChatStamp[]>([]),
    [form, setForm] = useState<StampInput>(fresh);
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState('');
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false);
  const previewObjectUrl = useRef('');
  const [fileKey, setFileKey] = useState(0);
  const [reaction, setReaction] = useState(false),
    [dragged, setDragged] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setItems(await listChatStamps());
      setLoaded(true);
    } catch (e) {
      setError(stampErrorMessage(e, '一覧の取得に失敗しました'));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  useEffect(
    () => () => {
      if (previewObjectUrl.current)
        URL.revokeObjectURL(previewObjectUrl.current);
    },
    [],
  );
  const select = (s?: ChatStamp) => {
    if (previewObjectUrl.current) {
      URL.revokeObjectURL(previewObjectUrl.current);
      previewObjectUrl.current = '';
    }
    setFileKey((k) => k + 1);
    setFile(null);
    setError('');
    setNotice('');
    setPreview(s?.imageUrl ? storageUrl(s.imageUrl) : '');
    if (s) {
      const { imageUrl: _, ...input } = s;
      void _;
      setForm(input);
    } else setForm(fresh());
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const input = { ...form };
      if (file) input.uploadKey = await uploadStampImage(file);
      const saved = await saveChatStamp(input);
      await load();
      select(saved);
      setNotice('保存しました');
      void refreshChatStamps();
    } catch (e) {
      setError(stampErrorMessage(e, '保存に失敗しました'));
    } finally {
      setBusy(false);
    }
  };
  const ordered = [...items].sort(
    (a, b) =>
      (reaction
        ? a.reactionOrder - b.reactionOrder
        : a.messageOrder - b.messageOrder) || a.id.localeCompare(b.id),
  );
  const move = async (from: number, to: number) => {
    if (busy || from === to || to < 0 || to >= ordered.length) return;
    setBusy(true);
    setError('');
    const next = [...ordered];
    next.splice(to, 0, next.splice(from, 1)[0]);
    try {
      await reorderChatStamps(next, reaction);
      await load();
      setNotice('表示順を更新しました。編集中の内容は選び直してください');
      void refreshChatStamps();
    } catch (e) {
      setError(stampErrorMessage(e, '並べ替えに失敗しました'));
      await load();
    } finally {
      setBusy(false);
    }
  };
  const chooseFile = (value: File | null) => {
    if (
      value &&
      (!/\.(png|svg)$/i.test(value.name) || value.size > 20 * 1024 * 1024)
    ) {
      setError('PNG／SVG、20MiB以下の画像を選んでください');
      return;
    }
    if (previewObjectUrl.current) URL.revokeObjectURL(previewObjectUrl.current);
    previewObjectUrl.current = value ? URL.createObjectURL(value) : '';
    setPreview(previewObjectUrl.current);
    setFile(value);
    setError('');
  };
  return (
    <div className={styles.layout}>
      <AdminHeader />
      <main className={`${shared.pageCentered} ${styles.main}`}>
        <h1 className={shared.titleLarge}>スタンプ・リアクション</h1>
        <p>
          画像と公開状態を管理します。利用停止後も過去の投稿には表示されます。
        </p>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        <div className={styles.columns}>
          <section aria-label="登録済みのスタンプ">
            <div className={styles.toolbar}>
              <button disabled={busy} onClick={() => select()}>
                新規登録
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setError('');
                  void load();
                }}
              >
                再取得
              </button>
              <label>
                表示順{' '}
                <select
                  value={reaction ? 'reaction' : 'message'}
                  onChange={(e) => setReaction(e.target.value === 'reaction')}
                >
                  <option value="message">スタンプ送信</option>
                  <option value="reaction">リアクション</option>
                </select>
              </label>
            </div>
            <p>ドラッグ、または上下ボタンで並べ替えできます。</p>
            {loading ? (
              <p>読み込み中…</p>
            ) : loaded && items.length === 0 ? (
              <p>登録済みのスタンプはありません。</p>
            ) : null}
            <ul className={styles.list}>
              {ordered.map((s, i) => (
                <li
                  key={s.id}
                  draggable={!busy}
                  onDragStart={() => setDragged(s.id)}
                  onDragEnd={() => setDragged(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = ordered.findIndex((s) => s.id === dragged);
                    if (from >= 0) void move(from, i);
                    setDragged(null);
                  }}
                >
                  <button
                    disabled={busy}
                    className={styles.item}
                    onClick={() => select(s)}
                  >
                    {s.imageUrl && <img src={storageUrl(s.imageUrl)} alt="" />}
                    <span>
                      <strong>{s.label}</strong>
                      <br />
                      {statusName[s.status]} · {s.allowMessage ? '送信 ' : ''}
                      {s.allowReaction ? 'リアクション' : ''}
                    </span>
                  </button>
                  <button
                    disabled={busy || i === 0}
                    onClick={() => void move(i, i - 1)}
                    aria-label={`${s.label}を上へ`}
                  >
                    ↑
                  </button>
                  <button
                    disabled={busy || i === ordered.length - 1}
                    onClick={() => void move(i, i + 1)}
                    aria-label={`${s.label}を下へ`}
                  >
                    ↓
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2>{form.id ? 'スタンプを編集' : '新しいスタンプ'}</h2>
            <form onSubmit={(e) => void save(e)}>
              <fieldset disabled={busy || !loaded} className={styles.form}>
                <label>
                  名前
                  <input
                    required
                    value={form.label}
                    onChange={(e) =>
                      setForm({ ...form, label: e.target.value })
                    }
                  />
                </label>
                <small>1〜50文字。読み上げにも使われます。</small>
                <label>
                  画像
                  <input
                    key={fileKey}
                    type="file"
                    accept="image/png,image/svg+xml,.png,.svg"
                    onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <small>
                  静止画PNG／SVG、元画像は20MiB以下。大きい画像は縦横比を保って長辺1024px以内に自動縮小します。SVGはviewBoxが必要です。文字はパス化を推奨します。
                </small>
                <label>
                  スタンプの表示サイズ
                  <select
                    aria-label="スタンプの表示サイズ"
                    value={form.displaySize}
                    onChange={(e) =>
                      setForm({ ...form, displaySize: e.target.value })
                    }
                  >
                    <option value="small">小</option>
                    <option value="standard">標準</option>
                    <option value="large">大</option>
                  </select>
                </label>
                <small>
                  リアクションはこの設定にかかわらず小さく表示します。
                </small>
                <label>
                  <input
                    type="checkbox"
                    checked={form.allowMessage}
                    onChange={(e) =>
                      setForm({ ...form, allowMessage: e.target.checked })
                    }
                  />
                  スタンプとして送信できる
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={form.allowReaction}
                    onChange={(e) =>
                      setForm({ ...form, allowReaction: e.target.checked })
                    }
                  />
                  リアクションに使用できる
                </label>
                <label>
                  状態
                  <select
                    aria-label="状態"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    {(!form.id || form.status === 'draft') && (
                      <option value="draft">下書き</option>
                    )}
                    {form.id && (
                      <>
                        <option value="active">公開中</option>
                        <option value="inactive">利用停止</option>
                      </>
                    )}
                  </select>
                </label>
                {!form.id && (
                  <small>
                    まず下書きとして保存し、プレビューを確認してから公開してください。
                  </small>
                )}
                {form.id && (
                  <p>
                    名前・画像の変更は、過去に使われた同じスタンプにも反映されます。
                  </p>
                )}
                <button type="submit" className={shared.primaryButton}>
                  {busy ? '保存中…' : '保存する'}
                </button>
              </fieldset>
            </form>
            {preview && (
              <div className={styles.previews}>
                <h3>表示プレビュー</h3>
                <p>単体送信</p>
                <img
                  src={preview}
                  alt={form.label || 'スタンプ'}
                  style={{
                    width:
                      { small: 108, standard: 168, large: 240 }[
                        form.displaySize
                      ] ?? 168,
                    height:
                      { small: 72, standard: 112, large: 160 }[
                        form.displaySize
                      ] ?? 112,
                  }}
                />
                <p>リアクション</p>
                <span className={styles.chip}>
                  <img src={preview} alt="" />
                  12
                </span>
                <p>選択一覧</p>
                <img src={preview} alt="" width={64} height={48} />
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
