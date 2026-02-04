#!/usr/bin/env node
/** 一次性：把演示视频复制到 public/demo-videos/demo.mp4，解决「黒いビキニを脱がせて」生成黑屏 */
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(
  process.env.USERPROFILE || '',
  'OneDrive',
  'Desktop',
  '视频',
  'grok-video-9c4ab397-6474-434a-9ca6-30b277481e33 (2).mp4'
)
const destDir = join(__dirname, '..', 'public', 'demo-videos')
const dest = join(destDir, 'demo.mp4')

if (!existsSync(src)) {
  console.warn('源文件不存在，请手动复制：', src)
  console.warn('目标：', dest)
  process.exit(1)
}
if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
copyFileSync(src, dest)
console.log('已复制到', dest)
