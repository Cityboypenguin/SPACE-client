import { useState } from 'react';
import { storageUrl } from '../../lib/storage';

type MediaItem = {
  ID: string;
  url: string;
  contentType: string;
};

export const ImageLightbox = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div
    onClick={(e) => { e.stopPropagation(); onClose(); }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, cursor: 'zoom-out',
    }}
  >
    <button
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      style={{
        position: 'absolute', top: 16, right: 20,
        background: 'none', border: 'none', color: '#fff',
        fontSize: '2rem', cursor: 'pointer', lineHeight: 1,
      }}
    >✕</button>
    <img
      src={url} alt="拡大表示"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
    />
  </div>
);

export const PostMediaGrid = ({ media, large = false }: { media: MediaItem[]; large?: boolean }) => {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const images = media.filter((m) => m.contentType.startsWith('image/'));
  const files = media.filter((m) => !m.contentType.startsWith('image/'));
  const count = images.length;

  const gap = large ? 3 : 2;
  const maxWidth = large ? 420 : 300;
  const imgHeight = large ? 160 : 110;
  const imgBorderRadius = large ? 8 : 6;

  const gridStyle: React.CSSProperties =
    count === 1
      ? { display: 'block' }
      : count === 2
        ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap }
        : count === 3
          ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto auto', gap }
          : { display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap };

  const gridPos4 = [
    { gridColumn: '1', gridRow: '1' },
    { gridColumn: '2', gridRow: '1' },
    { gridColumn: '1', gridRow: '2' },
    { gridColumn: '2', gridRow: '2' },
  ];

  const imgStyle = (i: number): React.CSSProperties => ({
    width: '100%',
    height: count === 1 ? 'auto' : count === 3 && i === 0 ? imgHeight * 2 + gap : imgHeight,
    maxHeight: count === 1 ? (large ? 400 : 300) : count === 3 && i === 0 ? imgHeight * 2 + gap : imgHeight,
    objectFit: 'cover',
    borderRadius: count === 1 ? 10 : i === 0 && count === 3 ? '10px 0 0 10px' : imgBorderRadius,
    cursor: 'zoom-in',
    display: 'block',
    gridColumn: count === 3 && i === 0 ? '1 / 2' : count === 4 ? gridPos4[i].gridColumn : undefined,
    gridRow: count === 3 && i === 0 ? '1 / 3' : count === 4 ? gridPos4[i].gridRow : undefined,
  });

  return (
    <>
      {images.length > 0 && (
        <div style={{ ...gridStyle, marginBottom: files.length > 0 ? (large ? 8 : 4) : 0, maxWidth }}>
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                style={imgStyle(i)}
                onClick={(e) => { e.stopPropagation(); setLightboxUrl(url); }}
              />
            );
          })}
        </div>
      )}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: large ? 6 : 4 }}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex', alignItems: 'center', gap: large ? 6 : 5,
                padding: large ? '6px 12px' : '4px 10px', background: '#f3f4f6',
                border: '1px solid #e5e7eb', borderRadius: 8,
                fontSize: large ? '0.85rem' : '0.78rem', color: '#374151', textDecoration: 'none',
              }}
            >
              📎 {m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
            </a>
          ))}
        </div>
      )}
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </>
  );
};
