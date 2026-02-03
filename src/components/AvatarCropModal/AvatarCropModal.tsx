import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './AvatarCropModal.module.css'

const PREVIEW_SIZE = 320
const OUTPUT_SIZE = 200
const ZOOM_MIN = 0.5
const ZOOM_MAX = 3

interface AvatarCropModalProps {
  imageUrl: string
  onConfirm: (croppedDataUrl: string) => void
  onCancel: () => void
}

export default function AvatarCropModal({ imageUrl, onConfirm, onCancel }: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 1, h: 1 })
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startPos: { x: 0, y: 0 } })

  const drawToCanvas = useCallback(
    (img: HTMLImageElement, w: number, h: number, zoomVal: number, posVal: { x: number; y: number }) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const coverScale = Math.max(PREVIEW_SIZE / w, PREVIEW_SIZE / h)
      const scale = coverScale * zoomVal
      const cx = PREVIEW_SIZE / 2
      const cy = PREVIEW_SIZE / 2
      ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, cx, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.translate(cx + posVal.x, cy + posVal.y)
      ctx.scale(scale, scale)
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
      ctx.restore()
    },
    []
  )

  const drawPreview = useCallback(() => {
    const img = imgRef.current
    if (!img || !imageLoaded || imgSize.w <= 0 || imgSize.h <= 0) return
    drawToCanvas(img, imgSize.w, imgSize.h, zoom, pos)
  }, [imageLoaded, imgSize, zoom, pos, drawToCanvas])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const w = img.naturalWidth
    const h = img.naturalHeight
    if (w <= 0 || h <= 0) return
    imgRef.current = img
    setImgSize({ w, h })
    setImageLoaded(true)
    requestAnimationFrame(() => {
      drawToCanvas(img, w, h, 1, { x: 0, y: 0 })
    })
  }

  useEffect(() => {
    setImageLoaded(false)
    setZoom(1)
    setPos({ x: 0, y: 0 })
  }, [imageUrl])

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startPos: { ...pos } }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.active) return
    setPos({
      x: dragRef.current.startPos.x + (e.clientX - dragRef.current.startX),
      y: dragRef.current.startPos.y + (e.clientY - dragRef.current.startY),
    })
  }

  const handleMouseUp = () => {
    dragRef.current.active = false
  }

  const handleConfirm = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imageLoaded) return
    const out = document.createElement('canvas')
    out.width = OUTPUT_SIZE
    out.height = OUTPUT_SIZE
    const ctx = out.getContext('2d')
    if (!ctx) return
    ctx.beginPath()
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(canvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)
    const dataUrl = out.toDataURL('image/png')
    onConfirm(dataUrl)
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>アバターを切り取り</h3>
        <p className={styles.hint}>
          ドラッグで位置を調整、スライダーで拡大・縮小。円内が表示されます。
        </p>
        <div
          className={styles.previewWrap}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            className={styles.previewCanvas}
          />
        </div>
        <img
          key={imageUrl}
          ref={imgRef}
          src={imageUrl}
          alt=""
          onLoad={handleImageLoad}
          className={styles.hiddenImg}
        />
        <div className={styles.zoomRow}>
          <span className={styles.zoomLabel}>拡大・縮小</span>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={styles.zoomSlider}
          />
          <span className={styles.zoomValue}>{zoom.toFixed(1)}x</span>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            キャンセル
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
            確定
          </button>
        </div>
      </div>
    </div>
  )
}
