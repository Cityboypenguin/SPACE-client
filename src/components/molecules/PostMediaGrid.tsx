import { useState, type CSSProperties } from 'react';
import { ImageLightbox } from '../organisms/ImageLightbox';
import { storageUrl } from '../../lib/storage';
import styles from './PostMediaGrid.module.css';

type MediaItem = {
  ID: string;
  url: string;
  contentType: string;
};

export const PostMediaGrid = ({ media, large = false }: { media: MediaItem[]; large?: boolean }) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  
  const images = media.filter((m) => m.contentType.startsWith('image/'));
  const files = media.filter((m) => !m.contentType.startsWith('image/'));
  const count = images.length;

  const mediaVars = {
    '--media-grid-gap': large ? '0.1875rem' : '0.125rem',
    '--media-grid-max-width': large ? '26.25rem' : '18.75rem',
    '--media-grid-file-gap': large ? '0.5rem' : '0.25rem',
    '--media-image-height': large ? '10rem' : '6.875rem',
    '--media-image-max-height': count === 1 ? (large ? '25rem' : '18.75rem') : large ? '10rem' : '6.875rem',
    '--media-image-radius': count === 1 ? '0.625rem' : large ? '0.5rem' : '0.375rem',
    '--media-file-gap': large ? '0.375rem' : '0.25rem',
    '--media-file-chip-gap': large ? '0.375rem' : '0.3125rem',
    '--media-file-chip-padding': large ? '0.375rem 0.75rem' : '0.25rem 0.625rem',
    '--media-file-chip-font-size': large ? '0.85rem' : '0.78rem',
  } as CSSProperties;

  const gridClassName = [
    styles.imageGrid,
    count === 1 ? styles.imageGridOne : count === 2 ? styles.imageGridTwo : count === 3 ? styles.imageGridThree : styles.imageGridFour,
    files.length > 0 ? styles.imageGridWithFiles : '',
  ].filter(Boolean).join(' ');

  const imageClassName = (i: number) => [
    styles.imageItem,
    count === 1 ? styles.imageItemSingle : '',
    count === 3 && i === 0 ? styles.imageItemThreeLead : '',
    count === 4 ? styles[`imageItemFour${i}` as keyof typeof styles] : '',
  ].filter(Boolean).join(' ');

  const imageUrls = images.map((m) => storageUrl(m.url));

  return (
    <>
      {images.length > 0 && (
        <div className={gridClassName} style={mediaVars}>
          {images.map((m, i) => {
            const url = storageUrl(m.url);
            return (
              <img
                key={m.ID}
                src={url}
                alt="添付画像"
                className={imageClassName(i)}
                onClick={(e) => { e.stopPropagation(); setActiveImageIndex(i); }}
              />
            );
          })}
        </div>
      )}
      {files.length > 0 && (
        <div className={styles.fileList} style={mediaVars}>
          {files.map((m) => (
            <a
              key={m.ID}
              href={storageUrl(m.url)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={styles.fileChip}
            >
              📎 {m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
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
