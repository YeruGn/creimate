/** 好感度レベルと必要値 */
export const GOODWILL_LEVELS: { level: number; required: number }[] = [
  { level: 1, required: 10 },
  { level: 2, required: 20 },
  { level: 3, required: 30 },
  { level: 4, required: 50 },
  { level: 5, required: 100 },
  { level: 6, required: 150 },
  { level: 7, required: 200 },
  { level: 8, required: 300 },
  { level: 9, required: 500 },
  { level: 10, required: 1000 },
]

export interface Creator {
  id: string
  name: string
  handle: string
  avatar: string
  cover?: string
  tagline: string
  tags: string[]
  hasAiTwin: boolean
  planCount: number
  postCount: number
  productCount: number
  followerCount: number
  /** プラン一覧（ファン用） */
  plans?: Plan[]
}

export interface Plan {
  id: string
  name: string
  price: number
  unit: 'month' | 'one-time'
  benefits: string[]
  thumbnail?: string
}

export interface AiTwin {
  creatorId: string
  name: string
  avatar: string
  voiceEnabled: boolean
  /** テキスト 10 トークン / 音声 20 トークン */
  tokenPerText: number
  tokenPerVoice: number
  goodwillRewards: GoodwillReward[]
}

export interface GoodwillReward {
  level: number
  requiredGoodwill: number
  /** 複数からランダムで1つ */
  rewards: { type: 'image' | 'video' | 'audio'; title: string; thumbnail?: string }[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isVoice?: boolean
  timestamp: number
}

export interface FanGoodwill {
  creatorId: string
  userId: string
  value: number
  level: number
  unlockedLevels: number[]
}
