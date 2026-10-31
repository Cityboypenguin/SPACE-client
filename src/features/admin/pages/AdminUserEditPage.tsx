import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserByID, adminUpdateUser, type User } from '../api/users';
import { AdminHeader } from '../components/organisms/AdminHeader';
import { ChevronLeft } from '../../../components/atoms/ChevronLeft';
import styles from '../styles/AdminShared.module.css';

export const AdminUserEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [accountID, setAccountID] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!id) return;
    getUserByID(id)
      .then((data) => {
        const u = data.getUserByID;
        if (!u) {
          setError('ユーザーが見つかりません');
          return;
        }
        setUser(u);
        setAccountID(u.accountID);
        setName(u.name);
        setEmail(u.email);
      })
      .catch(() => setError('ユーザー情報の取得に失敗しました'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!id || !user) return;

    if (!accountID.trim()) { setError('ユーザーIDは必須です'); return; }
    if (!name.trim()) { setError('名前は必須です'); return; }
    if (!email.trim()) { setError('メールアドレスは必須です'); return; }

    try {
      const input: { accountID: string; name: string; email: string; password?: string } = {
        accountID,
        name,
        email,
      };
      if (password) input.password = password;

      const data = await adminUpdateUser(id, input);
      setUser(data.adminUpdateUser);
      setPassword('');
      setSuccess('更新しました');
    } catch {
      setError('更新に失敗しました');
    }
  };

  if (!user) return <p className={styles.pageCentered}>{error || '読み込み中...'}</p>;

  return (
    <div>
      <AdminHeader />
      <main className={styles.pageCentered}>
        <div className={styles.pageHeader}>
          <h1 className={styles.titleLarge}>ユーザー情報の編集</h1>
        </div>

        {error && <p className={styles.centerError}>{error}</p>}
        {success && <p className={styles.centerError} style={{ color: '#10b981' }}>{success}</p>}
        <button
            type="button"
            onClick={() => navigate(`/admin/users/${id}`)}
            className={styles.paginationButton}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft /> 詳細に戻る
          </button>

        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} className={styles.tablePanelPlain} style={{ padding: '24px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                ユーザーID
              </label>
              <input
                type="text"
                value={accountID}
                onChange={(e) => setAccountID(e.target.value)}
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                名前
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                新しいパスワード（変更する場合のみ）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="変更しない場合は空欄"
                className={styles.select}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => navigate(`/admin/users/${id}`)}
                className={styles.paginationButton}
              >
                キャンセル
              </button>
              <button type="submit" className={styles.primaryButton}>
                保存
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
