import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import GoodwillBadges from '../components/GoodwillBadges/GoodwillBadges'
import { mockCreators, mockAiTwin, mockChatMessages } from '../data/mockData'
import type { ChatMessage } from '../types'
import styles from './FanChatPage.module.css'

export default function FanChatPage() {
  const { creatorId } = useParams<{ creatorId: string }>()
  const creator = mockCreators.find((c) => c.id === creatorId)
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages as ChatMessage[])
  const [input, setInput] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [tokens, setTokens] = useState(500)
  const [goodwill, setGoodwill] = useState(15)
  const [unlockedLevels] = useState<number[]>([1])

  if (!creator || !creator.hasAiTwin) {
    return (
      <div className={styles.page}>
        <div style={{ padding: 24 }}>
          <p>このクリエイターはAI分身を設定していません。</p>
          <Link to="/creators">クリエイターを探す</Link>
        </div>
      </div>
    )
  }

  const costPerMessage = voiceEnabled ? mockAiTwin.tokenPerVoice : mockAiTwin.tokenPerText
  const canSend = input.trim().length > 0 && tokens >= costPerMessage

  const handleSend = () => {
    if (!canSend) return
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setTokens((t) => t - costPerMessage)
    setGoodwill((g) => g + 1)

    setTimeout(() => {
      const reply: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: 'ありがとう♡ また話そうね～',
        isVoice: voiceEnabled,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, reply])
    }, 800)
  }

  return (
    <div className={styles.page}>
      <div className={styles.chatArea}>
        <header className={styles.chatHeader}>
          <Link to={`/creator/${creator.id}`} className={styles.backBtn}>
            ← 戻る
          </Link>
          <div className={styles.creatorInfo}>
            <img
              src={mockAiTwin.avatar}
              alt={creator.name}
              className={styles.creatorAvatar}
            />
            <span className={styles.creatorName}>{creator.name}（AI）</span>
          </div>
          <div className={styles.tokenInfo}>
            <span>
              トークン: <span className={styles.tokenCount}>{tokens}</span>
            </span>
            <span className={styles.goodwillInfo}>
              好感度: <span className={styles.goodwillValue}>{goodwill}</span>
            </span>
          </div>
        </header>

        <div className={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={[
                styles.message,
                msg.role === 'user' ? styles.messageUser : styles.messageAssistant,
              ].join(' ')}
            >
              {msg.role === 'assistant' && (
                <img
                  src={mockAiTwin.avatar}
                  alt=""
                  className={styles.messageAvatar}
                />
              )}
              <div>
                <div className={styles.messageBubble}>{msg.content}</div>
                <div className={styles.messageMeta}>
                  {msg.role === 'assistant' && msg.isVoice && '🔊 音声'}
                </div>
              </div>
              {msg.role === 'user' && <div className={styles.messageAvatar} />}
            </div>
          ))}
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              placeholder="メッセージを入力..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!canSend}
            >
              送信
            </button>
          </div>
          <div className={styles.costHint}>
            1回あたり {costPerMessage} トークン消費
            {voiceEnabled && '（音声読み上げ）'}
          </div>
          {mockAiTwin.voiceEnabled && (
            <label className={styles.voiceToggle}>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
              />
              返信を音声で読む（1回 20 トークン）
            </label>
          )}
        </div>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>好感度バッジ</div>
        <GoodwillBadges
          currentGoodwill={goodwill}
          unlockedLevels={unlockedLevels}
        />
      </aside>
    </div>
  )
}
