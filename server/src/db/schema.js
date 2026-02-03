import Database from 'better-sqlite3'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || join(__dirname, '../../data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
const dbPath = join(dataDir, 'creimate.db')

export const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS creators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    account_avatar_url TEXT,
    twin_avatar_url TEXT,
    use_account_avatar INTEGER DEFAULT 0,
    chat_reference_text TEXT,
    chat_reference_image_url TEXT,
    chat_style TEXT,
    catchphrases TEXT,
    voice_sample_url TEXT,
    voice_speed REAL DEFAULT 1,
    voice_pitch REAL DEFAULT 1,
    voice_sweetness REAL DEFAULT 0.5,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO creators (id, name) VALUES (1, 'クリエイター');
`)

export function getCreator(id = 1) {
  const row = db.prepare('SELECT * FROM creators WHERE id = ?').get(id)
  if (!row) return null
  return {
    ...row,
    use_account_avatar: Boolean(row.use_account_avatar),
    catchphrases: row.catchphrases ? JSON.parse(row.catchphrases) : [],
  }
}

export function updateCreator(id, data) {
  const allowed = [
    'name', 'account_avatar_url', 'twin_avatar_url', 'use_account_avatar',
    'chat_reference_text', 'chat_reference_image_url', 'chat_style', 'catchphrases',
    'voice_sample_url', 'voice_speed', 'voice_pitch', 'voice_sweetness',
  ]
  const updates = []
  const values = []
  for (const key of allowed) {
    if (data[key] === undefined) continue
    updates.push(`${key} = ?`)
    if (key === 'catchphrases') {
      values.push(Array.isArray(data[key]) ? JSON.stringify(data[key]) : data[key])
    } else if (key === 'use_account_avatar') {
      values.push(data[key] ? 1 : 0)
    } else {
      values.push(data[key])
    }
  }
  if (updates.length === 0) return getCreator(id)
  updates.push("updated_at = datetime('now')")
  values.push(id)
  db.prepare(`UPDATE creators SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return getCreator(id)
}
