import { useState } from 'react';
import { createInquiry } from '../api/inquiry';

export const InquiryPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <div>
        <h2>お問い合わせを受け付けました</h2>
        <p>お問い合わせありがとうございます。内容を確認次第、ご連絡いたします。</p>
      </div>
    );
  }

  return (
    <div>
      <h2>お問い合わせ</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
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
        />
        <button type="submit" disabled={loading}>
          {loading ? '送信中...' : '送信する'}
        </button>
      </form>
    </div>
  );
};
