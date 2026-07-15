import { storageUrl } from '../../lib/storage';
import { useState, useRef, useEffect, type TouchEvent, type MouseEvent, type WheelEvent } from 'react';

type MediaItem = {
  ID: string;
  url: string;
  contentType: string;
};

export const ImageLightbox = ({ url, onClose }: { url: string; onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const startDistance = useRef<number | null>(null);
  const startScale = useRef<number>(1);
  const startTouchPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSwipeToCloseActive = useRef(false);
  const updateDOMTransform = (s: number, x: number, y: number, disableTransition = false) => {
    if (containerRef.current) {
      containerRef.current.style.transition = disableTransition ? 'none' : 'transform 0.15s ease-out';
      containerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    }
  };

  const resetPosition = (smooth = true) => {
    positionRef.current = { x: 0, y: 0 };
    updateDOMTransform(scaleRef.current, 0, 0, !smooth);
  };

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    hasMoved.current = false;
    isSwipeToCloseActive.current = false;

    if (e.touches.length === 2) {
      startDistance.current = getDistance(e.touches);
      startScale.current = scaleRef.current;
    } else if (e.touches.length === 1) {
      startTouchPos.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };

      if (scaleRef.current <= 1 && window.innerWidth < 768) {
        isSwipeToCloseActive.current = true;
      }
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    hasMoved.current = true;

    if (e.touches.length === 2 && startDistance.current !== null) {
      const distance = getDistance(e.touches);
      const newScale = startScale.current * (distance / startDistance.current);
      const nextScale = Math.max(0.8, Math.min(newScale, 4));
      
      scaleRef.current = nextScale;
      setScale(nextScale);

      if (nextScale <= 1) {
        resetPosition(false);
      } else {
        updateDOMTransform(nextScale, positionRef.current.x, positionRef.current.y, true);
      }
    } else if (e.touches.length === 1) {
      const x = e.touches[0].clientX - startTouchPos.current.x;
      const y = e.touches[0].clientY - startTouchPos.current.y;

      if (scaleRef.current > 1) {
        positionRef.current = { x, y };
        updateDOMTransform(scaleRef.current, x, y, true);
      } else if (isSwipeToCloseActive.current) {
        positionRef.current = { x: 0, y };
        updateDOMTransform(scaleRef.current, 0, y, true);
      }
    }
  };

  const handleTouchEnd = () => {
    startDistance.current = null;

    if (isSwipeToCloseActive.current) {
      const dragY = positionRef.current.y;
      if (Math.abs(dragY) > 100) {
        onClose();
        return;
      }
    }

    if (scaleRef.current <= 1) {
      scaleRef.current = 1;
      setScale(1);
      resetPosition(true);
    }
    isSwipeToCloseActive.current = false;
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (scaleRef.current <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    hasMoved.current = false;
    startTouchPos.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || scaleRef.current <= 1) return;
    hasMoved.current = true;
    const x = e.clientX - startTouchPos.current.x;
    const y = e.clientY - startTouchPos.current.y;
    
    positionRef.current = { x, y };
    updateDOMTransform(scaleRef.current, x, y, true);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const zoomIntensity = 0.15;
    const delta = e.deltaY < 0 ? 1 : -1;
    const newScale = scaleRef.current + delta * zoomIntensity;
    const nextScale = Math.max(1, Math.min(newScale, 4));
    
    scaleRef.current = nextScale;
    setScale(nextScale);

    if (nextScale <= 1) {
      resetPosition(true);
    } else {
      updateDOMTransform(nextScale, positionRef.current.x, positionRef.current.y, true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    e.stopPropagation();
    
    if (hasMoved.current) {
      hasMoved.current = false;
      return;
    }
    if (scale > 1) return;

    onClose();
  };

  return (
    <div
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-out',
        overflow: 'hidden',
        touchAction: 'none',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '2rem',
          cursor: 'pointer',
          lineHeight: 1,
          zIndex: 10000,
        }}
      >
        ✕
      </button>

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(0px, 0px) scale(1)`,
          willChange: 'transform',
        }}
      >
        <img
          src={url}
          alt="拡大表示"
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
          style={{
            maxWidth: '95vw',
            maxHeight: '95vh',
            objectFit: 'contain',
            borderRadius: 8,
            userSelect: 'none',
          }}
        />
      </div>
    </div>
  );
};

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
