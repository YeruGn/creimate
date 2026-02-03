import type { Creator, AiTwin, GoodwillReward } from '../types'
import { GOODWILL_LEVELS } from '../types'

export const mockCreators: Creator[] = [
  {
    id: 'c1',
    name: 'リカのえっちなところ (リカ)',
    handle: 'rika',
    avatar: 'https://placehold.co/160x160/e84a6f/fff?text=R',
    tagline:
      'リカのえっちな写真や動画をアップします♡ 新プラン〈顔出し動画プラン〉作りました♡♡♡♡♡♡♡♡',
    tags: ['総合(男性向け)', '実写 (写真・映像)', '年齢確認書類・出演同意書類提出済'],
    hasAiTwin: true,
    planCount: 4,
    postCount: 1499,
    productCount: 48,
    followerCount: 51800,
    plans: [
      {
        id: 'p1',
        name: '無料プラン',
        price: 0,
        unit: 'month',
        benefits: [
          'Twitterに載せたセクシーショットや差分',
          'Twitterに載せられなかったセクシーショット',
          'ごくたまーに動画',
        ],
        thumbnail: 'https://placehold.co/120x120/f0f0f2/888?text=Free',
      },
      {
        id: 'p2',
        name: 'スタンダードプラン',
        price: 500,
        unit: 'month',
        benefits: ['AI分身とのテキストチャット', '月10枚限定写真', '週1動画'],
        thumbnail: 'https://placehold.co/120x120/fff0f3/e84a6f?text=S',
      },
    ],
  },
  {
    id: 'c2',
    name: 'みお (Mio)',
    handle: 'mio',
    avatar: 'https://placehold.co/160x160/3b82f6/fff?text=M',
    tagline: 'イラスト・ASMR・AI分身でお相手します♪',
    tags: ['イラスト', 'ASMR', 'AI分身'],
    hasAiTwin: true,
    planCount: 3,
    postCount: 320,
    productCount: 18,
    followerCount: 12200,
    plans: [
      {
        id: 'm1',
        name: '無料',
        price: 0,
        unit: 'month',
        benefits: ['お試しコンテンツ', 'AI分身 1日3通まで'],
      },
      {
        id: 'm2',
        name: 'フルプラン',
        price: 980,
        unit: 'month',
        benefits: ['AI分身無制限', '音声返信対応', '限定ASMR'],
      },
    ],
  },
]

export const mockAiTwin: AiTwin = {
  creatorId: 'c1',
  name: 'リカのえっちなところ (リカ)',
  avatar: 'https://placehold.co/160x160/e84a6f/fff?text=R',
  voiceEnabled: true,
  tokenPerText: 10,
  tokenPerVoice: 20,
  goodwillRewards: GOODWILL_LEVELS.map(({ level, required }) => ({
    level,
    requiredGoodwill: required,
    rewards: [
      { type: 'image', title: `Lv.${level} 限定写真A` },
      { type: 'image', title: `Lv.${level} 限定写真B` },
      ...(level >= 4 ? [{ type: 'video', title: `Lv.${level} 限定動画` }] : []),
    ],
  })) as GoodwillReward[],
}

export const mockChatMessages = [
  { id: '1', role: 'user' as const, content: 'こんにちは！', timestamp: Date.now() - 60000 },
  {
    id: '2',
    role: 'assistant' as const,
    content: 'こんにちは♡ リカだよ。今日も話してくれてありがとう～',
    timestamp: Date.now() - 55000,
  },
]
