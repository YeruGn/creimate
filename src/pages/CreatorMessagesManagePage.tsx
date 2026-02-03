import { useState } from 'react'
import styles from './CreatorMessagesManagePage.module.css'

const mockThreads = [
  { id: '1', user: 'ファンA', preview: 'こんにちは！', time: '10:30', aiReplied: true, unread: false },
  { id: '2', user: 'ファンB', preview: '写真ありがとう〜', time: '昨日', aiReplied: true, unread: true },
]

export default function CreatorMessagesManagePage() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>メッセージ管理</h1>
      <p className={styles.desc}>
        ファンからのメッセージとAIの返信履歴を確認できます。必要に応じて手動で返信することも可能です。
      </p>

      <div className={styles.layout}>
        <aside className={styles.threadList}>
          <div className={styles.threadListHeader}>スレッド一覧</div>
          {mockThreads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={[styles.threadItem, selected === t.id ? styles.threadActive : '', t.unread ? styles.threadUnread : ''].join(' ')}
              onClick={() => setSelected(t.id)}
            >
              <div className={styles.threadUser}>{t.user}</div>
              <div className={styles.threadPreview}>{t.preview}</div>
              <div className={styles.threadMeta}>
                {t.aiReplied && <span className={styles.badge}>AI返信済</span>}
                <span className={styles.threadTime}>{t.time}</span>
              </div>
            </button>
          ))}
        </aside>
        <main className={styles.chatArea}>
          {selected ? (
            <>
              <div className={styles.chatHeader}>
                {mockThreads.find((t) => t.id === selected)?.user}
              </div>
              <div className={styles.chatMessages}>
                <div className={styles.msgRow}>
                  <span className={styles.msgLabel}>ファン</span>
                  <div className={styles.msgBubble}>こんにちは！</div>
                </div>
                <div className={styles.msgRow}>
                  <span className={styles.msgLabel}>AI分身</span>
                  <div className={styles.msgBubble}>こんにちは♡ ありがとう〜</div>
                </div>
              </div>
              <div className={styles.chatInput}>
                <textarea placeholder="手動で返信..." rows={2} className={styles.input} />
                <button type="button" className={styles.sendBtn}>送信</button>
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>左のスレッドを選択して詳細を表示</div>
          )}
        </main>
      </div>
    </div>
  )
}
