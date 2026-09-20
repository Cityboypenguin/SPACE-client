import { useEffect, useRef, useState, type MouseEvent, type TouchEvent, type WheelEvent } from 'react';
import styles from './ImageLightbox.module.css';

type Props = {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
};

export const ImageLightbox = ({ urls, initialIndex, onClose }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const positionRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const startDistance = useRef<number | null>(null);
  const startScale = useRef(1);
  const startTouchPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSwipeToCloseActive = useRef(false);
  const isSwipeToNavActive = useRef(false);
  const swipeDirectionDetermined = useRef(false);
  const currentUrl = urls[currentIndex];

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateDOMTransform = (s: number, x: number, y: number, disableTransition = false) => {
    if (!containerRef.current) return;
    containerRef.current.style.transition = disableTransition ? 'none' : 'transform 0.15s ease-out';
    containerRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
  };

  const resetPosition = (smooth = true) => {
    positionRef.current = { x: 0, y: 0 };
    updateDOMTransform(scaleRef.current, 0, 0, !smooth);
  };

  const showPrev = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex((prev) => prev - 1);
    scaleRef.current = 1;
    setScale(1);
    resetPosition(false);
  };

  const showNext = () => {
    if (currentIndex >= urls.length - 1) return;
    setCurrentIndex((prev) => prev + 1);
    scaleRef.current = 1;
    setScale(1);
    resetPosition(false);
  };

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: TouchEvent) => {
    hasMoved.current = false;
    isSwipeToCloseActive.current = false;
    isSwipeToNavActive.current = false;
    swipeDirectionDetermined.current = false;

    if (e.touches.length === 2) {
      startDistance.current = getDistance(e.touches);
      startScale.current = scaleRef.current;
    } else if (e.touches.length === 1) {
      startTouchPos.current = {
        x: e.touches[0].clientX - positionRef.current.x,
        y: e.touches[0].clientY - positionRef.current.y,
      };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    hasMoved.current = true;

    if (e.touches.length === 2 && startDistance.current !== null) {
      const distance = getDistance(e.touches);
      const nextScale = Math.max(0.8, Math.min(startScale.current * (distance / startDistance.current), 4));
      scaleRef.current = nextScale;
      setScale(nextScale);
      if (nextScale <= 1) resetPosition(false);
      else updateDOMTransform(nextScale, positionRef.current.x, positionRef.current.y, true);
      return;
    }

    if (e.touches.length !== 1) return;
    const x = e.touches[0].clientX - startTouchPos.current.x;
    const y = e.touches[0].clientY - startTouchPos.current.y;

    if (scaleRef.current > 1) {
      positionRef.current = { x, y };
      updateDOMTransform(scaleRef.current, x, y, true);
      return;
    }

    if (!swipeDirectionDetermined.current) {
      const absX = Math.abs(x);
      const absY = Math.abs(y);
      if (absX > 5 || absY > 5) {
        swipeDirectionDetermined.current = true;
        isSwipeToNavActive.current = absX > absY * 1.5;
        isSwipeToCloseActive.current = absY > absX * 1.8;
      }
    }

    if (isSwipeToNavActive.current) {
      positionRef.current = { x, y: 0 };
      updateDOMTransform(scaleRef.current, x, 0, true);
    } else if (isSwipeToCloseActive.current) {
      positionRef.current = { x: 0, y };
      updateDOMTransform(scaleRef.current, 0, y, true);
    }
  };

  const handleTouchEnd = () => {
    startDistance.current = null;

    if (isSwipeToNavActive.current && scaleRef.current <= 1) {
      const dragX = positionRef.current.x;
      if (dragX > 80 && currentIndex > 0) {
        showPrev();
        return;
      }
      if (dragX < -80 && currentIndex < urls.length - 1) {
        showNext();
        return;
      }
    }

    if (isSwipeToCloseActive.current && scaleRef.current <= 1 && Math.abs(positionRef.current.y) > 150) {
      onClose();
      return;
    }

    if (scaleRef.current <= 1) {
      scaleRef.current = 1;
      setScale(1);
      resetPosition(true);
    }
    isSwipeToCloseActive.current = false;
    isSwipeToNavActive.current = false;
    swipeDirectionDetermined.current = false;
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

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    const nextScale = Math.max(1, Math.min(scaleRef.current + delta * 0.15, 4));
    scaleRef.current = nextScale;
    setScale(nextScale);
    if (nextScale <= 1) resetPosition(true);
    else updateDOMTransform(nextScale, positionRef.current.x, positionRef.current.y, true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') showNext();
      if (e.key === 'ArrowLeft') showPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

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

  const overlayClassName = [
    styles.overlay,
    scale > 1 ? styles.overlayZoomed : styles.overlayIdle,
    isDragging ? styles.overlayDragging : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      onClick={handleOverlayClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onWheel={handleWheel}
      className={overlayClassName}
    >
      <button type="button" className={styles.closeButton} onClick={(e) => { e.stopPropagation(); onClose(); }}>
        x
      </button>

      {isDesktop && currentIndex > 0 && scale === 1 && (
        <button type="button" className={`${styles.navButton} ${styles.prevButton}`} onClick={(e) => { e.stopPropagation(); showPrev(); }}>
          ‹
        </button>
      )}

      {isDesktop && currentIndex < urls.length - 1 && scale === 1 && (
        <button type="button" className={`${styles.navButton} ${styles.nextButton}`} onClick={(e) => { e.stopPropagation(); showNext(); }}>
          ›
        </button>
      )}

      {urls.length > 1 && <div className={styles.counter}>{currentIndex + 1} / {urls.length}</div>}

      <div ref={containerRef} className={styles.stage}>
        <img
          src={currentUrl}
          alt="拡大表示"
          className={styles.image}
          onClick={(e) => e.stopPropagation()}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
    </div>
  );
};
