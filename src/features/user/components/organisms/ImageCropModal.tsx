import { useState, useCallback } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { getCroppedImageFile } from '../../../../lib/cropImage';
import styles from './ImageCropModal.module.css';

interface ImageCropModalProps {
  imageSrc: string;
  fileName: string;
  mimeType: string;
  onCancel: () => void;
  onComplete: (file: File, previewUrl: string) => void;
}

export const ImageCropModal = ({ imageSrc, fileName, mimeType, onCancel, onComplete }: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCropComplete = useCallback((_croppedAreaPercent: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setIsSaving(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedArea, fileName, mimeType);
      onComplete(file, URL.createObjectURL(file));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>画像を編集</h2>

        <div className={styles.cropArea}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className={styles.zoomRow}>
          <span className={styles.zoomLabel}>ズーム</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
          />
        </div>

        <div className={styles.buttonGroup}>
          <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>
            キャンセル
          </button>
          <button type="button" className={styles.confirmButton} onClick={handleConfirm} disabled={isSaving || !croppedArea}>
            {isSaving ? '処理中...' : '設定する'}
          </button>
        </div>
      </div>
    </div>
  );
};
