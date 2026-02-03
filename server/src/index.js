import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { db, getCreator, updateCreator } from './db/schema.js'

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

const app = express()
app.use(cors({ origin: FRONTEND_ORIGIN }))
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

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`)
  console.log(`CORS: ${FRONTEND_ORIGIN}`)
})
