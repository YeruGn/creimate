const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getCreator() {
  const res = await fetch(`${API_URL}/api/creator`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateCreator(data: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/creator`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function uploadAvatarBase64(dataUrl: string): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/api/upload/avatar-base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function getApiUrl() {
  return API_URL
}

/** AI 对话：发送消息并获取助手回复（需后端配置 GROQ_API_KEY） */
export async function sendChat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<{ content: string }> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
  } catch (e) {
    const msg = e instanceof Error && e.message === 'Failed to fetch'
      ? 'サーバーに接続できません。バックエンド（server フォルダで npm run dev）が起動しているか、VITE_API_URL を確認してください。'
      : (e instanceof Error ? e.message : '接続エラー')
    throw new Error(msg)
  }
  if (!res.ok) {
    const err = await res.text()
    const friendly =
      res.status === 503
        ? 'Groq APIキーが未設定です。サーバーの .env に GROQ_API_KEY を設定してください（無料: https://console.groq.com）'
        : err || 'Chat failed'
    throw new Error(friendly)
  }
  return res.json()
}

/** 声音录入校验：上传录音与期望句子，返回是否一致 */
export async function verifyVoiceRecord(audioBlob: Blob, sentence: string): Promise<{ ok: boolean; message?: string }> {
  const form = new FormData()
  form.append('audio', audioBlob, 'record.webm')
  form.append('sentence', sentence)
  const res = await fetch(`${API_URL}/api/voice/verify`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, message: data.message || await res.text() || '校验失败' }
  return { ok: !!data.ok, message: data.message }
}

/** AI 音频：根据文本生成语音（Edge TTS，无需 API Key），返回可播放的 blob URL */
export async function getTtsAudioUrl(text: string, voice?: string): Promise<string> {
  const res = await fetch(`${API_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 1000), voice }),
  })
  if (!res.ok) throw new Error(await res.text())
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
