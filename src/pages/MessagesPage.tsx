import { useState } from 'react'
import styles from './MessagesPage.module.css'

const tabs = [
  { key: 'all', label: 'すべてのメッセージ' },
  { key: 'sent', label: '送信トレイ' },
  { key: 'notices', label: 'ファンクラブからのお知らせ', badge: true },
]

export default function MessagesPage() {
  const [active, setActive] = useState('all')

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>メッセージ</h1>
      <nav className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={[styles.tab, active === t.key ? styles.tabActive : ''].join(' ')}
            onClick={() => setActive(t.key)}
          >
            {t.label}
            {t.badge && <span className={styles.badge} aria-label="未読" />}
          </button>
        ))}
      </nav>
      <div className={styles.content}>
        <p className={styles.empty}>メッセージはまだありません。</p>
      </div>
    </div>
  )
}
