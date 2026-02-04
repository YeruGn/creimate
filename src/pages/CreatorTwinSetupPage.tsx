import { useState } from 'react'
import styles from './CreatorTwinSetupPage.module.css'

export default function CreatorTwinSetupPage() {
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [catchphrase, setCatchphrase] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>AI分身の設定</h1>
      <p className={styles.desc}>
        対話形式で設定するか、この画面から直接入力できます。AIアシスタントに「AI分身を作りたい」と話しかけるとウィザードが始まります。
      </p>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>基本情報</h2>
        <div className={styles.form}>
          <label className={styles.label}>
            表示名
            <input
              type="text"
              className={styles.input}
              placeholder="例：リカ"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            アイコンURL
            <input
              type="text"
              className={styles.input}
              placeholder="画像URL"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
            />
          </label>
          <label className={styles.label}>
            口癖・キャッチフレーズ
            <textarea
              className={styles.textarea}
              placeholder="例：〜だよ♡、ありがとう〜"
              value={catchphrase}
              onChange={(e) => setCatchphrase(e.target.value)}
              rows={3}
            />
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
            />
            音声返信を有効にする（1回 20 トークン）
          </label>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>好感度報酬</h2>
        <p className={styles.desc}>
          レベルごとに解放する報酬（写真・動画・音声）を設定できます。各レベルに複数登録すると、解放時にランダムで1つが選ばれます。
        </p>
        <div className={styles.levels}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lv) => (
            <div key={lv} className={styles.levelCard}>
              <span className={styles.levelNum}>Lv.{lv}</span>
              <button type="button" className={styles.addBtn}>
                報酬を追加
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn}>
          保存する
        </button>
      </div>
    </div>
  )
}
