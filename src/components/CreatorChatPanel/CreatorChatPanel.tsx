import { useState, useEffect } from 'react'
import type { ChatMessage } from '../../types'
import { sendChat, getCreator } from '../../api/client'
import styles from './CreatorChatPanel.module.css'

const suggestions = [
  '白いビキニで海辺のセクシー写真、20枚生成して',
  '今週の収益を分析して',
  '投稿用の文案を書いて',
  '好感度Lv.3の報酬を設定したい',
]

/** 四个快捷指令对应的固定行为：跳转 + 固定回复（3 走 API 不在此列） */
const SUGGESTION_ACTIONS: Array<{
  text: string
  reply: string
  navigate?: (onNavigate: (page: string, state?: Record<string, unknown>) => void) => void
}> = [
  {
    text: suggestions[0],
    reply: '画像生成ページに移動し、プロンプトを入力欄に入力しました。',
    navigate: (onNav) => onNav('creation', { tab: 'creation', creationType: 'image', imagePrompt: '白いビキニで海辺のセクシー写真、20枚' }),
  },
  {
    text: suggestions[1],
    reply: 'データ分析ページに移動しました。',
    navigate: (onNav) => onNav('analytics'),
  },
  { text: suggestions[2], reply: '' },
  {
    text: suggestions[3],
    reply: '好感度Lv.3の報酬編集ページに移動しました。',
    navigate: (onNav) => onNav('creation', { tab: 'rewards', level: 3 }),
  },
]

/** 从用户或助手消息中识别目标页面，返回 { page, tab?, level? }，未识别则返回 null */
function getNavigateTarget(text: string): { page: string; tab?: string; level?: number } | null {
  const t = text.trim()
  const lower = t.toLowerCase()
  const hasGo = /跳转|打开|去|へ|に移動|開いて|開く|表示して|表示|設定したい|設定/.test(t) || /\bgo\s+to\b|open\s+/i.test(lower)
  if (hasGo) {
    if (/消息管理|メッセージ管理/.test(t)) return { page: 'messages' }
    if (/創作|创作|创作中心|アセット庫|资产库|予約投稿|预约投稿/.test(t)) return { page: 'creation' }
    if (/好感度.*報酬|報酬.*設定|好感度報酬|好感度报酬/.test(t)) {
      const levelMatch = t.match(/Lv\.?\s*(\d+)|レベル\s*(\d+)|level\s*(\d+)/i)
      const level = levelMatch ? parseInt(levelMatch[1] || levelMatch[2] || levelMatch[3] || '0', 10) : undefined
      return { page: 'creation', tab: 'rewards', level: level || undefined }
    }
    if (/コンテンツ管理|内容管理/.test(t)) return { page: 'content' }
    if (/データセンター|数据中心|データ|収益|分析/.test(t)) return { page: 'analytics' }
    if (/対話分身|AI分身|分身管理|分身/.test(t)) return { page: 'twin' }
    if (/設定|设置/.test(t)) return { page: 'settings' }
    if (/アカウント|账户/.test(t)) return { page: 'account' }
  }
  if (/メッセージ管理へ|メッセージ管理に移動/.test(t)) return { page: 'messages' }
  if (/好感度.*報酬|報酬.*設定|Lv\.?\d+.*報酬/.test(t)) {
    const levelMatch = t.match(/Lv\.?\s*(\d+)|レベル\s*(\d+)/i)
    const level = levelMatch ? parseInt(levelMatch[1] || levelMatch[2] || '0', 10) : undefined
    return { page: 'creation', tab: 'rewards', level: level || undefined }
  }
  return null
}

interface CreatorChatPanelProps {
  /** page: 页面 key；state: 可选，如 { tab: 'rewards', level: 3 } 用于创作页的好感度報酬标签/等级 */
  onNavigate?: (page: string, state?: Record<string, unknown>) => void
}

export default function CreatorChatPanel({ onNavigate }: CreatorChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null)

  const loadCreatorAvatar = () => {
    getCreator()
      .then((data) => {
        if (data.use_account_avatar && data.account_avatar_url) {
          setUserAvatarUrl(data.account_avatar_url)
        } else if (data.twin_avatar_url) {
          setUserAvatarUrl(data.twin_avatar_url)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadCreatorAvatar()
    window.addEventListener('focus', loadCreatorAvatar)
    const onCreatorUpdated = () => loadCreatorAvatar()
    window.addEventListener('creator-updated', onCreatorUpdated)
    return () => {
      window.removeEventListener('focus', loadCreatorAvatar)
      window.removeEventListener('creator-updated', onCreatorUpdated)
    }
  }, [])

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return
    const trimmed = text.trim()
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setError(null)
    setLoading(true)

    const action = SUGGESTION_ACTIONS.find((a) => a.text === trimmed)
    if (action && action.reply && action.navigate) {
      const replyMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: action.reply,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, replyMsg])
      if (onNavigate) action.navigate(onNavigate)
      setLoading(false)
      return
    }

    if (onNavigate && (trimmed.includes('生成') || trimmed.includes('写真') || trimmed.includes('画像'))) {
      onNavigate('creation', { tab: 'creation', creationType: 'image', imagePrompt: trimmed.replace(/生成して$/, '').replace(/を(\d+)枚/, '、$1枚').trim() || trimmed })
    }

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      const { content } = await sendChat(apiMessages)
      const reply: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: content || '（返答がありません）',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, reply])
      if (onNavigate) {
        let target = getNavigateTarget(trimmed)
        if (!target) target = getNavigateTarget(content || '')
        if (target) {
          onNavigate(target.page, target.tab || target.level != null ? { tab: target.tab, level: target.level } : undefined)
        } else {
          if (trimmed.includes('収益') || trimmed.includes('分析') || trimmed.includes('データ')) onNavigate('analytics')
          else if (trimmed.includes('報酬') || trimmed.includes('好感度')) {
            const levelMatch = trimmed.match(/Lv\.?\s*(\d+)|レベル\s*(\d+)/i)
            const level = levelMatch ? parseInt(levelMatch[1] || levelMatch[2] || '0', 10) : undefined
            onNavigate('creation', level != null ? { tab: 'rewards', level } : { tab: 'rewards' })
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AIの応答に失敗しました')
      const fallback: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: '申し訳ありません。接続エラーかAPIキー未設定の可能性があります。Groqの無料キーを設定してください。',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, fallback])
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <h2 className={styles.title}>AIアシスタント</h2>
        <p className={styles.desc}>
          コンテンツ作成・データ照会・分析など、指示に応じて該当ページを表示します。
        </p>
      </header>

      {error && <p className={styles.error}>{error}</p>}
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
              <div className={styles.avatar}>
                {msg.role === 'assistant' ? (
                  '🤖'
                ) : userAvatarUrl ? (
                  <img src={userAvatarUrl} alt="" className={styles.avatarImg} />
                ) : (
                  '👤'
                )}
              </div>
              <div className={styles.bubble}>{msg.content}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputRow}>
          <div className={styles.inputAvatar}>
            {userAvatarUrl ? <img src={userAvatarUrl} alt="" className={styles.inputAvatarImg} /> : <span className={styles.inputAvatarPlaceholder}>👤</span>}
          </div>
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
            disabled={!input.trim() || loading}
          >
            {loading ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </aside>
  )
}
