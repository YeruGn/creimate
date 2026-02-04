import { useState, useEffect, useRef } from 'react'
import { getCreator } from '../api/client'
import styles from './CreatorMessagesManagePage.module.css'

type MsgRole = 'fan' | 'ai'

interface ChatMsg {
  role: MsgRole
  content: string
  isVoice?: boolean
  /** 音声再生用の URL（/audio/xxx.mp3） */
  voiceUrl?: string
}

const initialThreads: { id: string; user: string; fanAvatar?: string; preview: string; time: string; aiReplied: boolean; unread: boolean; messages: ChatMsg[] }[] = [
  {
    id: '1',
    user: 'ファンA',
    preview: 'わくわく！待ってるね',
    time: '10:30',
    aiReplied: true,
    unread: false,
    messages: [
      { role: 'fan', content: 'こんにちは！' },
      { role: 'ai', content: 'こんにちは♡ リカだよ。今日も話してくれてありがとう～' },
      { role: 'fan', content: '昨日の投稿すごくよかった！' },
      { role: 'ai', content: 'ありがとう〜♡ そう言ってもらえて嬉しい！また撮るね♪', isVoice: true, voiceUrl: '/audio/voice-arigatou.mp3' },
      { role: 'fan', content: '次はどんなのアップするの？' },
      { role: 'ai', content: '今度は水着の新作を準備中だよ〜。楽しみにしていてね💕' },
      { role: 'fan', content: 'わくわく！待ってるね' },
      { role: 'ai', content: 'うん、また話そうね〜♡', isVoice: true, voiceUrl: '/audio/voice-mata-ne.mp3' },
    ],
  },
  {
    id: '2',
    user: 'ファンB',
    preview: '写真ありがとう〜',
    time: '昨日',
    aiReplied: true,
    unread: true,
    messages: [
      { role: 'fan', content: '写真ありがとう〜' },
      { role: 'ai', content: 'こちらこそありがとう♡ 気に入ってもらえて嬉しい！', isVoice: false },
      { role: 'fan', content: 'もっと見たい！' },
      { role: 'ai', content: '次も頑張って撮るね〜♪ 楽しみにしていて💕', isVoice: true },
    ],
  },
  {
    id: '3',
    user: 'ファンC',
    preview: '新作いつ出る？',
    time: '11:15',
    aiReplied: true,
    unread: false,
    messages: [
      { role: 'fan', content: '新作いつ出る？' },
      { role: 'ai', content: '今週中にはアップする予定だよ〜♡' },
      { role: 'fan', content: 'やった！' },
      { role: 'ai', content: '待っててね〜♪', isVoice: true },
    ],
  },
]

export default function CreatorMessagesManagePage() {
  const [threads, setThreads] = useState(() =>
    initialThreads.map((t) => ({ ...t, messages: [...t.messages] }))
  )
  const [selected, setSelected] = useState<string | null>(null)
  const [replyInput, setReplyInput] = useState('')
  const [creatorAvatarUrl, setCreatorAvatarUrl] = useState<string | null>(null)
  /** 播放失败时用户选择的本地文件 Object URL，按 voiceUrl 区分 */
  const [localVoiceUrls, setLocalVoiceUrls] = useState<Record<string, string>>({})
  const pendingVoiceUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const voiceObjectUrlsRef = useRef<string[]>([])

  const handleSendReply = () => {
    if (!selected || !replyInput.trim()) return
    setThreads((prev) =>
      prev.map((t) =>
        t.id === selected
          ? { ...t, messages: [...t.messages, { role: 'ai', content: replyInput.trim() }] }
          : t
      )
    )
    setReplyInput('')
  }

  const playVoice = (msg: ChatMsg) => {
    if (!msg.voiceUrl) return
    const url = localVoiceUrls[msg.voiceUrl] ?? msg.voiceUrl
    const audio = new Audio(url)
    audio.onerror = () => {
      pendingVoiceUrlRef.current = msg.voiceUrl!
      fileInputRef.current?.click()
    }
    audio.play().catch(() => {
      pendingVoiceUrlRef.current = msg.voiceUrl!
      fileInputRef.current?.click()
    })
  }

  const onVoiceFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = pendingVoiceUrlRef.current
    const file = e.target.files?.[0]
    e.target.value = ''
    pendingVoiceUrlRef.current = null
    if (!key || !file) return
    const objectUrl = URL.createObjectURL(file)
    voiceObjectUrlsRef.current.push(objectUrl)
    setLocalVoiceUrls((prev) => ({ ...prev, [key]: objectUrl }))
    const audio = new Audio(objectUrl)
    audio.play().catch(() => {})
  }

  useEffect(() => {
    return () => {
      voiceObjectUrlsRef.current.forEach(URL.revokeObjectURL)
    }
  }, [])

  useEffect(() => {
    setReplyInput('')
  }, [selected])

  useEffect(() => {
    getCreator()
      .then((data) => {
        if (data.use_account_avatar && data.account_avatar_url) {
          setCreatorAvatarUrl(data.account_avatar_url)
        } else if (data.twin_avatar_url) {
          setCreatorAvatarUrl(data.twin_avatar_url)
        }
      })
      .catch(() => {})
  }, [])

  const currentThread = selected ? threads.find((t) => t.id === selected) : null

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>メッセージ管理</h1>
      <p className={styles.desc}>
        ファンからのメッセージとAIの返信履歴を確認できます。必要に応じて手動で返信することも可能です。
      </p>

      <div className={styles.layout}>
        <aside className={styles.threadList}>
          <div className={styles.threadListHeader}>スレッド一覧</div>
          {threads.map((t) => (
            <button
              key={t.id}
              type="button"
              className={[styles.threadItem, selected === t.id ? styles.threadActive : '', t.unread ? styles.threadUnread : ''].join(' ')}
              onClick={() => setSelected(t.id)}
            >
              <div className={styles.threadRow}>
                <div className={styles.threadAvatar}>
                  {t.fanAvatar ? <img src={t.fanAvatar} alt="" className={styles.threadAvatarImg} /> : <span className={styles.threadAvatarPlaceholder}>👤</span>}
                </div>
                <div className={styles.threadBody}>
                  <div className={styles.threadUser}>{t.user}</div>
                  <div className={styles.threadPreview}>{t.preview}</div>
                  <div className={styles.threadMeta}>
                    {t.aiReplied && <span className={styles.badge}>AI返信済</span>}
                    <span className={styles.threadTime}>{t.time}</span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </aside>
        <main className={styles.chatArea}>
          {currentThread ? (
            <>
              <div className={styles.chatHeader}>{currentThread.user}</div>
              <div className={styles.chatMessages}>
                {currentThread.messages.map((msg, i) => (
                  <div key={i} className={msg.role === 'fan' ? styles.msgRowFan : styles.msgRowAi}>
                    {msg.role === 'fan' ? (
                      <>
                        <div className={styles.msgAvatar}>
                          <span className={styles.msgAvatarPlaceholder}>👤</span>
                        </div>
                        <div className={styles.msgBlock}>
                          <span className={styles.msgLabel}>ファン</span>
                          <div className={styles.msgBubble}>{msg.content}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.msgBubbleAiWrap}>
                          <div className={[styles.msgBubble, styles.msgBubbleAi].join(' ')}>{msg.content}</div>
                          {msg.isVoice && (
                            <button
                              type="button"
                              className={styles.msgVoiceBadge}
                              onClick={() => playVoice(msg)}
                            >
                              🔊 音声
                            </button>
                          )}
                        </div>
                        <div className={styles.msgAiRight}>
                          <span className={styles.msgLabelAi}>AI分身</span>
                          <div className={styles.msgAvatar}>
                            {creatorAvatarUrl ? <img src={creatorAvatarUrl} alt="" className={styles.msgAvatarImg} /> : <span className={styles.msgAvatarPlaceholder}>🤖</span>}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.chatInput}>
                <textarea
                  placeholder="手動で返信..."
                  rows={2}
                  className={styles.input}
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.sendBtn}
                  onClick={handleSendReply}
                  disabled={!replyInput.trim()}
                >
                  送信
                </button>
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>左のスレッドを選択して詳細を表示</div>
          )}
        </main>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3"
        className={styles.hiddenFileInput}
        onChange={onVoiceFileSelected}
        aria-hidden
      />
    </div>
  )
}
