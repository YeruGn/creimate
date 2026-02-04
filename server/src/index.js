import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import Groq from 'groq-sdk'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'edge-tts-node'
import { dbReady, getCreator, updateCreator } from './db/schema.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '')

const uploadsDir = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../../uploads')
const avatarsDir = path.join(uploadsDir, 'avatars')
if (!existsSync(avatarsDir)) mkdirSync(avatarsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname) || '.png'}`),
})
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10MB
const voiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }) // 5MB for voice

const app = express()
const allowedOrigins = FRONTEND_ORIGIN
  ? FRONTEND_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174']
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
      cb(null, false)
    },
  })
)
app.use(express.json({ limit: '5mb' }))
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.get('/api/creator', (req, res) => {
  try {
    const creator = getCreator(1)
    if (!creator) return res.status(404).json({ error: 'Not found' })
    res.json(creator)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/creator', (req, res) => {
  try {
    const creator = updateCreator(1, req.body)
    res.json(creator)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/upload/avatar', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' })
    const url = `${PUBLIC_URL}/uploads/avatars/${req.file.filename}`
    res.json({ url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/upload/avatar-base64', express.json({ limit: '2mb' }), (req, res) => {
  try {
    const { dataUrl } = req.body
    if (!dataUrl || !dataUrl.startsWith('data:image/')) return res.status(400).json({ error: 'Invalid dataUrl' })
    const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buf = Buffer.from(base64, 'base64')
    const filename = `${uuidv4()}.png`
    writeFileSync(path.join(avatarsDir, filename), buf)
    const url = `${PUBLIC_URL}/uploads/avatars/${filename}`
    res.json({ url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 投稿文案建议用：Fantia 风格说明（参考 https://fantia.jp/posts 等）
const FANTIA_POST_STYLE = `
あなたはファンティア（Fantia）系クリエイター支援AIです。
ユーザーが「投稿の文案建議」「写投稿的文案建议」「投稿文案建议」「投稿のコピー案」「投稿の文案をいくつか」など、投稿文案・コピーの提案を求めた場合、次のルールで答えてください：
・2〜3個の具体的な投稿文案を、箇条書き（bullet point）で出す。
・各案は「タイトル＋本文の雰囲気」を短く。ファンティアの実際の投稿のように、短いタイトルに絵文字（♡、💕等）、カジュアルな口調、〜で締める、限定感を出す。
・回答は日本語で。ユーザーが中国語で聞いても日本語で答える。
・例のトーン：「動画♡ライトアップされたカラダがえちえち💕」「1月もありがとう♡♡」「初公開〜新作お届けします」のような、ファン向けで親しみやすい文体。
`

// AI 对话：Groq（需配置 GROQ_API_KEY，免费注册 https://console.groq.com）
app.post('/api/chat', express.json({ limit: '64kb' }), async (req, res) => {
  try {
    const key = process.env.GROQ_API_KEY
    if (!key) {
      return res.status(503).json({ error: 'GROQ_API_KEY not configured. Get a free key at https://console.groq.com' })
    }
    const { messages } = req.body
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' })
    }
    const groq = new Groq({ apiKey: key })
    const withSystem = [
      { role: 'system', content: FANTIA_POST_STYLE },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ]
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: withSystem,
      max_tokens: 1024,
    })
    const content = completion.choices?.[0]?.message?.content ?? ''
    res.json({ content })
  } catch (e) {
    console.error('chat error', e)
    res.status(500).json({ error: e.message || 'Chat failed' })
  }
})

// AI 音频：Edge TTS（免费，无需 API Key）
const JA_VOICE = 'ja-JP-NanamiNeural'
app.post('/api/tts', express.json({ limit: '16kb' }), async (req, res) => {
  try {
    const { text, voice = JA_VOICE } = req.body
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' })
    }
    const safe = String(text).slice(0, 1000).replace(/[<>]/g, '')
    const tts = new MsEdgeTTS()
    await tts.setMetadata(voice, OUTPUT_FORMAT.WEBM_24KHZ_16BIT_MONO_OPUS)
    const stream = tts.toStream(safe)
    res.setHeader('Content-Type', 'audio/webm')
    stream.pipe(res)
  } catch (e) {
    console.error('tts error', e)
    res.status(500).json({ error: e.message || 'TTS failed' })
  }
})

// 声音录入校验：上传录音 + 期望句子，校验是否一致（当前为模拟，后续可接入 STT）
app.post('/api/voice/verify', voiceUpload.single('audio'), (req, res) => {
  try {
    const sentence = (req.body && req.body.sentence) ? String(req.body.sentence).trim() : ''
    if (!sentence) return res.status(400).json({ ok: false, message: 'sentence required' })
    if (!req.file || !req.file.buffer) return res.status(400).json({ ok: false, message: 'audio required' })
    // TODO: 接入语音识别对比 sentence 与识别结果，不一致时返回 { ok: false, message: '内容与句子不一致，请重新朗读' }
    setTimeout(() => {
      res.json({ ok: true, message: '音色已训练完成' })
    }, 800)
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message || '校验失败' })
  }
})

dbReady.then(() => {
  app.listen(PORT, () => {
    console.log(`Server: http://localhost:${PORT}`)
    console.log(`CORS: ${FRONTEND_ORIGIN}`)
  })
}).catch((e) => {
  console.error('DB init failed', e)
  process.exit(1)
})
