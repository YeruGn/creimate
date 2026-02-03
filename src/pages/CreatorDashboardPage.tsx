import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import CreatorSidebar from '../components/CreatorSidebar/CreatorSidebar'
import type { ChatMessage } from '../types'
import styles from './CreatorDashboardPage.module.css'

const assistantSuggestions = [
  'AI分身を作成したい',
  '今日の収益を分析して',
  '新しい画像をAIで生成したい',
  '投稿用の文案を書いてほしい',
]

export default function CreatorDashboardPage() {
  const location = useLocation()
  const isRoot = location.pathname === '/creator/dashboard'
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
          '承知しました。AI分身の作成を進めますね。まずはプロフィール（お名前・アイコン・口癖など）を教えてください。',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, reply])
    }, 1000)
  }

  return (
    <div style={{ display: 'flex', gap: 0, margin: -24 }}>
      <CreatorSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isRoot ? (
          <div className={styles.wrap}>
            <section className={styles.chatSection}>
              <header className={styles.chatHeader}>
                <h2 className={styles.chatTitle}>AIアシスタント</h2>
                <p className={styles.chatDesc}>
                  対話でAI分身の作成・コンテンツ生成・分析・投稿まで。何でも話してください。
                </p>
              </header>

              {messages.length === 0 ? (
                <div className={styles.placeholder}>
                  <div className={styles.placeholderTitle}>
                    クリエメイトAIアシスタント
                  </div>
                  <p>
                    キャラクター作成、コンテンツ生成、データ分析、投稿の下書きまで、対話形式でお手伝いします。
                  </p>
                  <div className={styles.suggestions}>
                    {assistantSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={styles.suggestion}
                        onClick={() => handleSend(s)}
                      >
                        「{s}」
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.messages}>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={[
                        styles.message,
                        msg.role === 'user' ? styles.messageUser : styles.messageAssistant,
                      ].join(' ')}
                    >
                      <div className={styles.messageAvatar}>
                        {msg.role === 'assistant' ? '🤖' : '👤'}
                      </div>
                      <div className={styles.messageBubble}>{msg.content}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.inputArea}>
                <div className={styles.inputRow}>
                  <textarea
                    className={styles.input}
                    placeholder="メッセージを入力（例：AI分身を作りたい）"
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
            </section>
          </div>
        ) : (
          <div style={{ padding: 24 }}>
            <Outlet />
          </div>
        )}
      </div>
    </div>
  )
}
