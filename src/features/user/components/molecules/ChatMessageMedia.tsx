import { useState } from 'react';
import { ImageLightbox } from '../../../../components/organisms/ImageLightbox';
import { type Media } from '../../api/message';
import { storageUrl } from '../../../../lib/storage';
import { reservedAspectRatio } from '../../../../lib/media';
import { reportDimensionsOnLoad } from '../../../../lib/reportMediaDimensions';
import styles from '../ChatRoom.module.css';

const getFileIcon = (contentType: string): string => {
  if (contentType.includes('word')) return '📝';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
  if (contentType.includes('zip') || contentType.includes('compressed')) return '🗜️';
  if (contentType.startsWith('video/')) return '🎥';
  if (contentType.startsWith('audio/')) return '🎵';
  return '📎';
};

export const MediaList = ({ mediaItems, isMine }: { mediaItems: Media[]; isMine: boolean }) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const images = mediaItems.filter((m) => m.contentType.startsWith('image/'));
  const files = mediaItems.filter((m) => !m.contentType.startsWith('image/'));

  const imageUrls = images.map((m) => storageUrl(m.url));

  return (
    <>
      {images.length > 0 && (
        <div className={[
          styles.messageMediaGrid,
          isMine ? styles.messageMediaGridMine : styles.messageMediaGridTheirs,
          images.length === 1 ? styles.messageMediaGridSingle : styles.messageMediaGridMultiple,
        ].join(' ')}>
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            // 1枚のときだけ高さが縦横比で決まる（複数枚は正方形固定）ので、そこだけ
            // ロード前に領域を確保する。これがないとロード完了時に高さが変わり、
            // 初回表示のスクロール位置がずれる。
            const aspectRatio = images.length === 1 ? reservedAspectRatio(m) : undefined;
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                onClick={() => setActiveImageIndex(i)}
                onLoad={reportDimensionsOnLoad(m)}
                className={`${styles.messageImageThumb} ${images.length === 1 ? styles.messageImageSingle : ''}`}
                style={aspectRatio ? { aspectRatio } : undefined}
              />
            );
          })}
        </div>
      )}

      {files.length > 0 && (
        <div className={`${styles.messageFileList} ${isMine ? styles.messageFileListMine : styles.messageFileListTheirs}`}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.messageFileLink}
            >
              <div
                className={`${styles.messageFileChip} ${isMine ? styles.mediaFileChipMine : styles.mediaFileChipTheirs}`}
              >
                <span className={styles.messageFileIcon}>{getFileIcon(m.contentType)}</span>
                <span>{m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}</span>
              </div>
            </a>
          ))}
        </div>
      )}

      {activeImageIndex !== null && (
        <ImageLightbox
          urls={imageUrls}
          initialIndex={activeImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      )}
    </>
  );
};
