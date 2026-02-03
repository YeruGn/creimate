import { useState } from 'react'
import type { ChatMessage } from '../../types'
import styles from './CreatorChatPanel.module.css'

const suggestions = [
  '白いビキニで海辺のセクシー写真を20枚生成して',
  '今週の収益を分析して',
  '投稿用の文案を書いて',
  '好感度Lv.3の報酬を設定したい',
]

interface CreatorChatPanelProps {
  onNavigate?: (page: string) => void
}

export default function CreatorChatPanel({ onNavigate }: CreatorChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  const handleSend = (text: string) => {
    if (!text.trim()) return
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      const reply: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content:
          '承知しました。該当するページを開き、処理を進めます。創作センターで画像生成を開始する場合は「創作センター」をご確認ください。データの分析は「データセンター」でご覧いただけます。',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, reply])
      if (onNavigate) {
        if (text.includes('生成') || text.includes('写真') || text.includes('画像')) onNavigate('creation')
        else if (text.includes('収益') || text.includes('分析') || text.includes('データ')) onNavigate('analytics')
        else if (text.includes('報酬') || text.includes('好感度')) onNavigate('creation')
      }
    }, 800)
  }

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>AIアシスタント</h2>
        <p className={styles.desc}>
          コンテンツ作成・データ照会・分析など、指示に応じて該当ページを表示します。
        </p>
      </header>

      {messages.length === 0 ? (
        <div className={styles.placeholder}>
          <p>指示を入力すると、AIが該当ページを開いて実行します。</p>
          <div className={styles.suggestions}>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className={styles.suggestion}
                onClick={() => handleSend(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={[styles.message, msg.role === 'user' ? styles.messageUser : ''].join(' ')}
            >
              <div className={styles.avatar}>{msg.role === 'assistant' ? '🤖' : '👤'}</div>
              <div className={styles.bubble}>{msg.content}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.input}
            placeholder="指示を入力..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(input)
              }
            }}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
          >
            送信
          </button>
        </div>
      </div>
    </aside>
  )
}
