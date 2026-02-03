import { useState } from 'react'
import styles from './CreatorContentPage.module.css'

export default function CreatorContentPage() {
  const [type, setType] = useState<'image' | 'video' | 'audio'>('image')
  const [prompt, setPrompt] = useState('')

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>AIコンテンツ作成</h1>
      <p className={styles.desc}>
        AIで画像・動画・音声を生成し、文案も自動で作成。コンテンツパックとして販売したり、投稿に添付できます。AIアシスタントに「画像を生成したい」と話しかけても開始できます。
      </p>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>生成タイプ</h2>
        <div className={styles.tabs}>
          {(['image', 'video', 'audio'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={[styles.tab, type === t ? styles.tabActive : ''].join(' ')}
              onClick={() => setType(t)}
            >
              {t === 'image' && '🖼 画像'}
              {t === 'video' && '🎬 動画'}
              {t === 'audio' && '🔊 音声'}
            </button>
          ))}
        </div>

        <label className={styles.label}>
          プロンプト（生成の指示）
          <textarea
            className={styles.textarea}
            placeholder={
              type === 'image'
                ? '例：海辺で白いドレスを着た女性、夕焼け'
                : type === 'video'
                  ? '例：10秒のショート動画、歩く女性'
                  : '例：甘い声のASMR、囁き'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryBtn}>
            AIで生成
          </button>
          <button type="button" className={styles.secondaryBtn}>
            文案だけ作成
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>最近の生成物</h2>
        <p className={styles.empty}>まだ生成していません。上記から生成を開始してください。</p>
      </div>
    </div>
  )
}
