import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { storageUrl } from '../../../../lib/storage';

interface Props {
  documentUrl: string;
  onScrolledToBottom?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

export const TermsContent = ({ documentUrl, onScrolledToBottom, onError, style }: Props) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const notified = useRef(false);

  useEffect(() => {
    fetch(storageUrl(documentUrl))
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.text();
      })
      .then(setContent)
      .catch(() => {
        setError(true);
        onError?.();
      })
      .finally(() => setLoading(false));
  }, [documentUrl]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (notified.current || error) return;
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      notified.current = true;
      onScrolledToBottom?.();
    }
  };

  return (
    <div onScroll={handleScroll} style={style}>
      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center' }}>読み込み中...</p>
      ) : error ? (
        <p style={{ color: '#ef4444', textAlign: 'center' }}>
          規約の読み込みに失敗しました。しばらく経ってから再度お試しください。
        </p>
      ) : (
        <ReactMarkdown>{content}</ReactMarkdown>
      )}
    </div>
  );
};
