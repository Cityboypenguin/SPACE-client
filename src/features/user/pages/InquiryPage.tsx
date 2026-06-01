import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInquiry } from '../api/inquiry';

export const InquiryPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createInquiry(name, email, subject, content);
      setSubmitted(true);
    } catch {
      setError('送信に失敗しました。しばらく時間をおいてから再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <h2>お問い合わせを受け付けました</h2>
        <p>お問い合わせありがとうございます。内容を確認次第、ご連絡いたします。</p>
        <button type="button" onClick={() => navigate(-1)}>戻る</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: '0 0 8px' }}>お問い合わせ</h2>
      {error && <p style={{ color: 'red', margin: 0 }}>{error}</p>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="お名前"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
        required
      />
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="件名"
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="お問い合わせ内容"
        required
        rows={6}
        style={{ resize: 'vertical' }}
      />
      <button type="submit" disabled={loading}>
        {loading ? '送信中...' : '送信する'}
      </button>
      <p style={{ margin: 0, textAlign: 'center' }}>
        <button type="button" onClick={() => navigate(-1)}>戻る</button>
      </p>
    </form>
  );
};
