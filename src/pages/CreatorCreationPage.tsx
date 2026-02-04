import { useState, useRef, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GOODWILL_LEVELS } from '../types'
import { getTtsAudioUrl, verifyVoiceRecord } from '../api/client'
import styles from './CreatorCreationPage.module.css'

// 录入声音用：约 30 字左右的日语句子（随机抽一条让用户朗读）
const VOICE_RECORD_SENTENCES = [
  '今日は良い天気ですね。一緒に散歩に行きましょう。',
  'おはようございます。今日もよろしくお願いします。',
  'この花はとても美しいです。どこで買いましたか。',
  '明日の会議は午後三時から始まります。',
  '新しいレストランが駅の近くにオープンしました。',
]
function pickRandomSentence() {
  return VOICE_RECORD_SENTENCES[Math.floor(Math.random() * VOICE_RECORD_SENTENCES.length)]
}

// 画像生成用：AI 内容策略提示词建议（随机一条展示，点击填入）
const IMAGE_PROMPT_SUGGESTIONS = [
  '白いビキニで海辺のセクシー写真、自然光、20枚',
  '部屋でくつろぐカジュアルな私服ショット、窓際、15枚',
  '和服姿で桜の下、春の雰囲気、10枚',
  'ジムでトレーニング中のスポーティー写真、8枚',
  '夕焼けのビーチでロングドレス、ドラマチック、12枚',
]
function pickImagePromptSuggestion() {
  return IMAGE_PROMPT_SUGGESTIONS[Math.floor(Math.random() * IMAGE_PROMPT_SUGGESTIONS.length)]
}

/** 演示用：当 prompt 包含「海辺で空色のビキニ」且「6枚」时，用这 6 张图作为生成结果（请将 6 张图放到 public/demo-images/1.png～6.png） */
const DEMO_IMAGE_URLS = ['/demo-images/1.png', '/demo-images/2.png', '/demo-images/3.png', '/demo-images/4.png', '/demo-images/5.png', '/demo-images/6.png']

/** 演示用：当 prompt 包含「黒いビキニを脱がせて」时，用该视频作为生成结果（请将视频放到 public/demo-videos/demo.mp4） */
const DEMO_VIDEO_URL = '/demo-videos/demo.mp4'

/** 演示用：当 prompt 包含「ビニールカーテンの間を後方へ」时，用 Video2.mp4 作为生成结果（请将视频放到 public/demo-videos/Video2.mp4） */
const DEMO_VIDEO_2_URL = '/demo-videos/Video2.mp4'

/** 演示用：好感度 Lv.1～4 的预填报酬图（public/demo-rewards/1.png～4.png） */
const DEMO_REWARDS_BY_LEVEL: Record<number, { id: string; label: string; type: 'image' }[]> = {
  1: [{ id: '/demo-rewards/1.png', label: '画像1', type: 'image' }],
  2: [{ id: '/demo-rewards/2.png', label: '画像1', type: 'image' }],
  3: [{ id: '/demo-rewards/3.png', label: '画像1', type: 'image' }],
  4: [{ id: '/demo-rewards/4.png', label: '画像1', type: 'image' }],
}

type MainTab = 'creation' | 'assets' | 'schedule' | 'rewards'
type CreationType = 'image' | 'video' | 'audio'

type VoiceModel = { id: string; recordedAt: string }
type AudioResultItem = { id: string; audioUrl: string }

function formatRecordedAt(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export default function CreatorCreationPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<MainTab>('creation')
  const [creationType, setCreationType] = useState<CreationType>('image')
  const [facePhotoUrls, setFacePhotoUrls] = useState<(string | null)[]>([null, null, null])
  const [imageCount, setImageCount] = useState('1')
  const [imageSize, setImageSize] = useState<'1:1' | '3:4' | '9:16' | '4:3' | '16:9'>('9:16')
  const [videoSize, setVideoSize] = useState<'4:3' | '16:9' | '3:4' | '9:16'>('9:16')
  const [videoDuration, setVideoDuration] = useState<5 | 10 | 15>(10)
  const [imagePrompt, setImagePrompt] = useState('')
  const [imagePromptSuggestion, setImagePromptSuggestion] = useState(() => pickImagePromptSuggestion())
  const [videoImageRef, setVideoImageRef] = useState<string | null>(null)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoEditPrompt, setVideoEditPrompt] = useState('')
  const [audioText, setAudioText] = useState('')
  const [imageGenerating, setImageGenerating] = useState(false)
  const [videoGenerating, setVideoGenerating] = useState(false)
  const [audioGenerating, setAudioGenerating] = useState(false)
  const [imageResults, setImageResults] = useState<string[]>([])
  const [videoResults, setVideoResults] = useState<string[]>([])
  const [audioResults, setAudioResults] = useState<AudioResultItem[]>([])
  /** 演示用：预填好感度 Lv.1～4 的 4 张图到资产库，便于予約投稿时选择 */
  const [savedImageIds, setSavedImageIds] = useState<string[]>(() => ['/demo-rewards/1.png', '/demo-rewards/2.png', '/demo-rewards/3.png', '/demo-rewards/4.png'])
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>([])
  const [imageViewerIndex, setImageViewerIndex] = useState<number | null>(null)
  const [videoViewerIndex, setVideoViewerIndex] = useState<number | null>(null)
  const [videoLoadError, setVideoLoadError] = useState(false)
  const [assetType, setAssetType] = useState<'image' | 'video' | 'audio'>('image')
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [scheduleDraft, setScheduleDraft] = useState({
    title: '',
    content: '',
    media: [] as string[],
    scheduleTime: '',
  })
  type RewardItem = { id: string; label: string; type?: 'image' | 'video' | 'audio' }
  const [rewardsByLevel, setRewardsByLevel] = useState<Record<number, RewardItem[]>>(() => ({ ...DEMO_REWARDS_BY_LEVEL }))
  const [rewardModalLevel, setRewardModalLevel] = useState<number | null>(null)
  /** 好感度報酬内の画像をクリックで拡大表示 */
  const [rewardImageViewerUrl, setRewardImageViewerUrl] = useState<string | null>(null)
  /** アセット庫から追加：子弹窗（予約投稿 / 好感度報酬 内で開く） */
  const [assetPickerOpen, setAssetPickerOpen] = useState(false)
  const [assetPickerContext, setAssetPickerContext] = useState<'schedule' | { type: 'reward'; level: number } | null>(null)
  const [assetPickerType, setAssetPickerType] = useState<'image' | 'video' | 'audio'>('image')

  // 声音：试听 + 录入录音弹窗 + 已训练模型列表（最多3个）
  const [voicePreviewText, setVoicePreviewText] = useState('')
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([])
  const [enabledVoiceId, setEnabledVoiceId] = useState<string | null>(null)
  const [noEnabledModalOpen, setNoEnabledModalOpen] = useState(false)
  const [deleteConfirmModelId, setDeleteConfirmModelId] = useState<string | null>(null)
  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [recordSentence, setRecordSentence] = useState('')
  const [recording, setRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'fail' | 'success'>('idle')
  const [verifyMessage, setVerifyMessage] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const state = location.state as { tab?: string; level?: number; creationType?: string; imagePrompt?: string } | null | undefined
    if (!state || typeof state !== 'object' || !('tab' in state)) return
    if (state.tab === 'rewards') {
      setActiveTab('rewards')
      if (state.level != null && GOODWILL_LEVELS.some((l) => l.level === state.level)) {
        setRewardModalLevel(state.level)
      }
      navigate(location.pathname, { replace: true, state: {} })
      return
    }
    if (state.tab === 'creation' && (state.creationType === 'image' || state.imagePrompt)) {
      setActiveTab('creation')
      if (state.creationType === 'image') setCreationType('image')
      if (typeof state.imagePrompt === 'string' && state.imagePrompt.trim()) {
        setImagePrompt(state.imagePrompt.trim())
      }
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate])

  // 動画用の参照画像オブジェクトURLのクリーンアップ
  useEffect(() => {
    return () => {
      if (videoImageRef) URL.revokeObjectURL(videoImageRef)
    }
  }, [videoImageRef])

  // 動画プレビューを開き直す／切り替えるときに読み込みエラー状態をリセット
  useEffect(() => {
    setVideoLoadError(false)
  }, [videoViewerIndex])

  const openRecordModal = useCallback(() => {
    setRecordSentence(pickRandomSentence())
    setRecordedBlob(null)
    setVerifyStatus('idle')
    setVerifyMessage('')
    setRecordModalOpen(true)
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (chunksRef.current.length) setRecordedBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
      }
      mr.start()
      setRecording(true)
    } catch (e) {
      setVerifyMessage(e instanceof Error ? e.message : '无法使用麦克风')
    }
  }, [])

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
      setRecording(false)
    }
  }, [])

  const submitRecord = useCallback(async () => {
    if (!recordedBlob || !recordSentence.trim()) return
    setVerifyStatus('verifying')
    setVerifyMessage('')
    try {
      const result = await verifyVoiceRecord(recordedBlob, recordSentence)
      if (result.ok) {
        const newModel: VoiceModel = { id: `vm_${Date.now()}`, recordedAt: new Date().toISOString() }
        setVoiceModels((prev) => [...prev, newModel].slice(-3))
        setVerifyStatus('success')
        setVerifyMessage(result.message || '音声モデルの訓練が完了しました。')
      } else {
        setVerifyStatus('fail')
        setVerifyMessage(result.message || '読み上げ内容が文章と一致しません。もう一度録音してください。')
      }
    } catch (e) {
      setVerifyStatus('fail')
      setVerifyMessage(e instanceof Error ? e.message : '検証に失敗しました。')
    }
  }, [recordedBlob, recordSentence])

  const toggleVoiceEnabled = useCallback((id: string) => {
    setEnabledVoiceId((prev) => {
      const next = prev === id ? null : id
      if (prev === id && next === null) setNoEnabledModalOpen(true)
      return next
    })
  }, [])

  const deleteVoiceModel = useCallback((id: string) => {
    const wasEnabled = enabledVoiceId === id
    setVoiceModels((prev) => prev.filter((m) => m.id !== id))
    setEnabledVoiceId((prev) => (prev === id ? null : prev))
    setDeleteConfirmModelId(null)
    if (wasEnabled) setNoEnabledModalOpen(true)
  }, [enabledVoiceId])

  const playVoicePreview = useCallback(async () => {
    if (!voicePreviewText.trim()) return
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl)
      setPreviewAudioUrl(null)
    }
    try {
      const url = await getTtsAudioUrl(voicePreviewText.trim())
      setPreviewAudioUrl(url)
    } catch {
      // ignore
    }
  }, [voicePreviewText, previewAudioUrl])

  const generateAudio = useCallback(async () => {
    if (!audioText.trim() || audioGenerating) return
    setAudioGenerating(true)
    try {
      const url = await getTtsAudioUrl(audioText.trim())
      setAudioResults((prev) => [...prev, { id: `ag_${Date.now()}`, audioUrl: url }])
    } catch {
      // ignore
    } finally {
      setAudioGenerating(false)
    }
  }, [audioText, audioGenerating])

  const removeAudioResult = useCallback((id: string) => {
    setAudioResults((prev) => {
      const item = prev.find((a) => a.id === id)
      if (item) URL.revokeObjectURL(item.audioUrl)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>創作センター</h1>
      <p className={styles.desc}>
        登録した顔・体型写真と年齢・髪型・身長などの情報で写真を生成。成果物はアセット庫に保存し、商品や投稿にまとめられます。予約投稿や好感度報酬の設定も可能です。
      </p>

      <nav className={styles.tabs}>
        {[
          { key: 'creation', label: '創作' },
          { key: 'assets', label: 'アセット庫' },
          { key: 'schedule', label: '予約投稿' },
          { key: 'rewards', label: '好感度報酬' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={[styles.tab, activeTab === t.key ? styles.tabActive : ''].join(' ')}
            onClick={() => setActiveTab(t.key as MainTab)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'creation' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>創作</h2>
          <p className={styles.hint}>
            画像・動画・音声のいずれかを選び、下の「説明入力」と「生成」でコンテンツを作成します。生成結果は各ブロックのプレビュー欄に表示され、右側のAIで追加指示することもできます。
          </p>

          <div className={styles.creationTypeTabs}>
            {[
              { key: 'image' as const, label: '画像', icon: '🖼️' },
              { key: 'video' as const, label: '動画', icon: '🎬' },
              { key: 'audio' as const, label: '音声', icon: '🔊' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={[styles.creationTypeTab, creationType === t.key ? styles.creationTypeTabActive : ''].join(' ')}
                onClick={() => setCreationType(t.key)}
              >
                <span className={styles.creationTypeIcon}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {creationType === 'image' && (
            <div className={styles.creationBlock}>
              <h3 className={styles.creationBlockTitle}>画像生成</h3>
              <p className={styles.hint}>
                本人の真人写真を生成するには、<strong>正面の顔写真を3枚</strong>アップロードしてください。AIが顔・髪型などの特徴を認識した後、下の説明に従って生成できます。
              </p>
              <div className={styles.faceUploadSection}>
                <div className={styles.faceUploadLabel}>人物参照用・正面写真（3枚）</div>
                <div className={styles.faceUploadRow}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={styles.faceUploadArea}>
                      {facePhotoUrls[i] ? (
                        <div className={styles.facePreviewWrap}>
                          <img src={facePhotoUrls[i]!} alt="" className={styles.facePreview} />
                          <span className={styles.faceStatus}>登録済み</span>
                          <button type="button" className={styles.smallBtn} onClick={() => setFacePhotoUrls((prev) => [...prev.slice(0, i), null, ...prev.slice(i + 1)])}>削除</button>
                        </div>
                      ) : (
                        <>
                          <span className={styles.faceUploadPlaceholder}>+</span>
                          <span className={styles.faceUploadText}>写真 {i + 1}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className={styles.faceUploadInput}
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) setFacePhotoUrls((prev) => [...prev.slice(0, i), URL.createObjectURL(f), ...prev.slice(i + 1)])
                              e.target.value = ''
                            }}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <p className={styles.faceUploadHint}>顔がはっきり見える正面・斜め正面を推奨。</p>
              </div>
              <div className={styles.imageOptionsRow}>
                <label className={styles.imageOptionLabel}>
                  <span className={styles.imageOptionTitle}>枚数</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className={styles.imageCountInput}
                    value={imageCount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9]/g, '')
                      setImageCount(v)
                    }}
                  />
                  <span className={styles.imageOptionHint}>最大10枚まで</span>
                </label>
                <label className={styles.imageOptionLabel}>
                  <span className={styles.imageOptionTitle}>画像サイズ</span>
                  <select
                    className={styles.imageOptionSelect}
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as '1:1' | '3:4' | '9:16' | '4:3' | '16:9')}
                  >
                    <option value="1:1">1:1</option>
                    <option value="3:4">3:4</option>
                    <option value="9:16">9:16</option>
                    <option value="4:3">4:3</option>
                    <option value="16:9">16:9</option>
                  </select>
                </label>
              </div>
              <div className={styles.promptRow}>
                <label className={styles.promptLabel}>生成用の説明</label>
                <textarea
                  className={styles.promptInput}
                  placeholder="例：白いビキニで海辺のセクシー写真、20枚"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.promptActionRow}>
                <button
                  type="button"
                  className={styles.generateBtn}
                  disabled={!imagePrompt.trim() || imageGenerating}
                  onClick={() => {
                    setImageGenerating(true)
                    setTimeout(() => {
                      const prompt = imagePrompt.trim()
                      const useDemo = /海辺で空色のビキニ/.test(prompt) && /6枚/.test(prompt)  // 例：「海辺で空色のビキニを着ている私の写真を6枚生成してください」
                      if (useDemo) {
                        setImageResults([...DEMO_IMAGE_URLS])
                      } else {
                        const countNum = Math.min(10, Math.max(1, Number(imageCount) || 1))
                        const base = Date.now()
                        const newIds = Array.from({ length: countNum }, (_, idx) => `画像_${base}_${idx}`)
                        setImageResults((prev) => [...prev, ...newIds])
                      }
                      setImageGenerating(false)
                    }, 1500)
                  }}
                >
                  {imageGenerating ? '生成中...' : '生成'}
                </button>
                <div className={styles.promptSuggestionBanner}>
                  <span className={styles.promptSuggestionLabel}>AI ヒント：</span>
                  <button
                    type="button"
                    className={styles.promptSuggestionText}
                    onClick={() => {
                      setImagePrompt(imagePromptSuggestion)
                      setImagePromptSuggestion(pickImagePromptSuggestion())
                    }}
                  >
                    {imagePromptSuggestion}
                  </button>
                  <span className={styles.promptSuggestionHint}>クリックで上の入力欄に反映</span>
                </div>
              </div>
              <div className={styles.previewSection}>
                <div className={styles.previewTitle}>生成結果</div>
                <div className={styles.previewGrid916}>
                  {imageResults.length === 0 ? (
                    <div className={styles.previewEmpty}>生成した画像がここに表示されます。説明を入力して「生成」を押してください。</div>
                  ) : (
                    imageResults.map((idOrUrl, i) => {
                      const isUrl = typeof idOrUrl === 'string' && (idOrUrl.startsWith('/') || idOrUrl.startsWith('http'))
                      return (
                        <button
                          key={idOrUrl}
                          type="button"
                          className={styles.previewSlot916}
                          onClick={() => setImageViewerIndex(i)}
                        >
                          {isUrl ? (
                            <img src={idOrUrl} alt="" className={styles.previewSlotImg} />
                          ) : (
                            <span className={styles.previewPlaceholder}>🖼️</span>
                          )}
                          <span className={styles.previewLabel}>画像 {i + 1}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {creationType === 'video' && (
            <div className={styles.creationBlock}>
              <h3 className={styles.creationBlockTitle}>動画生成</h3>
              <p className={styles.hint}>
                動画の内容・説明を入力して生成します。サイズと尺を選んでから「生成」を押してください。生成後に「内容を修正」で編集指示を追加できます。
              </p>
              <div className={styles.videoOptionsRow}>
                <label className={styles.videoOptionLabel}>
                  <span className={styles.videoOptionTitle}>動画サイズ</span>
                  <select
                    className={styles.videoOptionSelect}
                    value={videoSize}
                    onChange={(e) => setVideoSize(e.target.value as '4:3' | '16:9' | '3:4' | '9:16')}
                  >
                    <option value="4:3">4:3</option>
                    <option value="16:9">16:9</option>
                    <option value="3:4">3:4</option>
                    <option value="9:16">9:16</option>
                  </select>
                </label>
                <label className={styles.videoOptionLabel}>
                  <span className={styles.videoOptionTitle}>動画の長さ</span>
                  <select
                    className={styles.videoOptionSelect}
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value) as 5 | 10 | 15)}
                  >
                    <option value={5}>5秒</option>
                    <option value={10}>10秒</option>
                    <option value={15}>15秒</option>
                  </select>
                </label>
              </div>
              <div className={styles.videoImageRow}>
                <div className={styles.faceUploadLabel}>画像から動画（任意）</div>
                <div className={styles.faceUploadRow}>
                  <div className={styles.faceUploadArea}>
                    {videoImageRef ? (
                      <div className={styles.facePreviewWrap}>
                        <img src={videoImageRef} alt="" className={styles.facePreview} />
                        <span className={styles.faceStatus}>参照画像</span>
                        <button
                          type="button"
                          className={styles.smallBtn}
                          onClick={() => {
                            if (videoImageRef) URL.revokeObjectURL(videoImageRef)
                            setVideoImageRef(null)
                          }}
                        >
                          削除
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={styles.faceUploadPlaceholder}>+</span>
                        <span className={styles.faceUploadText}>画像を選択</span>
                        <input
                          type="file"
                          accept="image/*"
                          className={styles.faceUploadInput}
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) {
                              const url = URL.createObjectURL(f)
                              setVideoImageRef((prev) => {
                                if (prev) URL.revokeObjectURL(prev)
                                return url
                              })
                            }
                            e.target.value = ''
                          }}
                        />
                      </>
                    )}
                  </div>
                </div>
                <p className={styles.faceUploadHint}>
                  1枚の画像を指定すると、その画像をベースに動画を生成します（任意）。
                </p>
              </div>
              <div className={styles.promptRow}>
                <label className={styles.promptLabel}>動画の内容・説明</label>
                <textarea
                  className={styles.promptInput}
                  placeholder="例：海辺を歩く、白いワンピースで笑顔で振り向く"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.promptRow}>
                <label className={styles.promptLabel}>内容を修正・追加指示（任意）</label>
                <textarea
                  className={styles.promptInput}
                  placeholder="例：もっとゆっくり歩く、光を強く"
                  value={videoEditPrompt}
                  onChange={(e) => setVideoEditPrompt(e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.generateRow}>
                <button
                  type="button"
                  className={styles.generateBtn}
                  disabled={!videoPrompt.trim() || videoGenerating}
                  onClick={() => {
                    setVideoGenerating(true)
                    const prompt = videoPrompt.trim()
                    const useDemoBikini = /黒いビキニを脱がせて/.test(prompt)
                    // 演示：包含「ビニールカーテン」且「後方へ」即用 Video2.mp4（兼容粘贴时字符差异）
                    const useDemoCurtain = (prompt.includes('ビニールカーテン') && prompt.includes('後方へ')) || /ビニールカーテンの間を後方へ/.test(prompt)
                    setTimeout(() => {
                      if (useDemoCurtain) {
                        setVideoResults((prev) => [...prev, DEMO_VIDEO_2_URL])
                      } else if (useDemoBikini) {
                        setVideoResults((prev) => [...prev, DEMO_VIDEO_URL])
                      } else {
                        setVideoResults((prev) => [...prev, `動画_${Date.now()}`])
                      }
                      setVideoGenerating(false)
                    }, 2000)
                  }}
                >
                  {videoGenerating ? '生成中...' : '生成'}
                </button>
              </div>
              <div className={styles.previewSection}>
                <div className={styles.previewTitle}>生成結果</div>
                <div className={styles.previewGrid916}>
                  {videoResults.length === 0 ? (
                    <div className={styles.previewEmpty}>生成した動画がここに表示されます。説明を入力して「生成」を押してください。</div>
                  ) : (
                    videoResults.map((idOrUrl, i) => {
                      const isUrl = typeof idOrUrl === 'string' && (idOrUrl.startsWith('/') || idOrUrl.startsWith('http'))
                      return (
                        <button
                          key={idOrUrl}
                          type="button"
                          className={styles.previewSlot916}
                          onClick={() => setVideoViewerIndex(i)}
                        >
                          {isUrl ? (
                            <video
                              src={idOrUrl}
                              className={styles.previewSlotImg}
                              muted
                              preload="metadata"
                              playsInline
                              style={{ pointerEvents: 'none' }}
                            />
                          ) : (
                            <span className={styles.previewPlaceholder}>🎬</span>
                          )}
                          <span className={styles.previewLabel}>動画 {i + 1}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {creationType === 'audio' && (
            <div className={styles.creationBlock}>
              <h3 className={styles.creationBlockTitle}>音声</h3>
              <p className={styles.hint}>
                まず音色を登録（マイクで文章を読み上げ）し、試聴で確認できます。その後、下のテキストで音声を生成しアセットに保存できます。
              </p>
              <p className={styles.voiceNotice}>
                ご自身の声の複刻のみ対応しています。
              </p>

              <h4 className={styles.voiceSectionTitle}>音色登録</h4>
              <p className={styles.hint}>
                「録音」を押すとマイクが有効になり、表示された文章を読み上げてください。内容が一致すると音色モデルが訓練されます。
              </p>
              <button type="button" className={styles.primaryBtn} onClick={openRecordModal}>
                録音
              </button>

              {voiceModels.length > 0 && (
                <div className={styles.voiceModelsList}>
                  <div className={styles.voiceModelsTitle}>登録済み音声モデル（最大3件）</div>
                  {voiceModels.map((m) => (
                    <div key={m.id} className={styles.voiceModelRow}>
                      <span className={styles.voiceModelDate}>{formatRecordedAt(m.recordedAt)}</span>
                      <button
                        type="button"
                        className={[styles.voiceModelToggle, enabledVoiceId === m.id ? styles.voiceModelToggleOn : ''].join(' ')}
                        onClick={() => toggleVoiceEnabled(m.id)}
                        title={enabledVoiceId === m.id ? 'オフにする' : 'オンにする'}
                        aria-pressed={enabledVoiceId === m.id}
                      >
                        <span className={styles.voiceModelToggleKnob} />
                      </button>
                      <button
                        type="button"
                        className={styles.voiceModelDelete}
                        onClick={() => setDeleteConfirmModelId(m.id)}
                        aria-label="削除"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <h4 className={styles.voiceSectionTitle}>試聴</h4>
              <p className={styles.hint}>
                文章を入力して「再生」を押すと、登録した音色で読み上げます。再度「再生」を押すと前の音声は上書きされます。
              </p>
              <div className={styles.voicePreviewRow}>
                <input
                  type="text"
                  className={styles.voiceInput}
                  placeholder="例：こんにちは、ありがとうね♡"
                  value={voicePreviewText}
                  onChange={(e) => setVoicePreviewText(e.target.value)}
                />
                <button
                  type="button"
                  className={styles.voicePlayBtn}
                  onClick={playVoicePreview}
                  disabled={!voicePreviewText.trim()}
                >
                  再生
                </button>
              </div>
              {previewAudioUrl && (
                <div className={styles.audioPlayerBlock}>
                  <audio
                    ref={previewAudioRef}
                    src={previewAudioUrl}
                    controls
                    className={styles.audioPlayer}
                    onEnded={() => {}}
                  />
                </div>
              )}

              <h4 className={styles.voiceSectionTitle}>音声生成</h4>
              <p className={styles.hint}>
                登録した音色で、テキストを音声に変換します。生成結果はアセット庫に保存できます。
              </p>
              <div className={styles.promptRow}>
                <label className={styles.promptLabel}>読み上げるテキスト</label>
                <textarea
                  className={styles.promptInput}
                  placeholder="例：こんにちは、ありがとうね♡"
                  value={audioText}
                  onChange={(e) => setAudioText(e.target.value)}
                  rows={3}
                />
                <button
                  type="button"
                  className={styles.generateBtn}
                  disabled={!audioText.trim() || audioGenerating}
                  onClick={generateAudio}
                >
                  {audioGenerating ? '生成中...' : '生成'}
                </button>
              </div>
              <div className={styles.previewSection}>
                <div className={styles.previewTitle}>生成結果</div>
                <div className={styles.previewList}>
                  {audioResults.length === 0 ? (
                    <div className={styles.previewEmpty}>生成した音声がここに表示されます。テキストを入力して「生成」を押してください。</div>
                  ) : (
                    audioResults.map((item, i) => (
                      <div key={item.id} className={styles.audioResultRow}>
                        <div className={styles.audioPlayerBlock}>
                          <audio src={item.audioUrl} controls className={styles.audioPlayer} />
                        </div>
                        <div className={styles.audioResultActions}>
                          <button type="button" className={styles.secondaryBtn} onClick={() => { /* 保存到资产库 */ }}>
                            保存
                          </button>
                          <button type="button" className={styles.voiceModelDelete} onClick={() => removeAudioResult(item.id)}>
                            削除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {noEnabledModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setNoEnabledModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>お知らせ</h3>
              <button type="button" className={styles.modalClose} onClick={() => setNoEnabledModalOpen(false)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.noEnabledMessage}>
                現在、有効な音声モデルがありません。AIアシスタントの音声機能に影響する場合があります。設定をご確認ください。
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.primaryBtn} onClick={() => setNoEnabledModalOpen(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmModelId && (
        <div className={styles.modalOverlay} onClick={() => setDeleteConfirmModelId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>削除の確認</h3>
              <button type="button" className={styles.modalClose} onClick={() => setDeleteConfirmModelId(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.deleteConfirmMessage}>削除すると元に戻せません。削除してもよろしいですか？</p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setDeleteConfirmModelId(null)}>キャンセル</button>
              <button type="button" className={styles.primaryBtn} onClick={() => deleteVoiceModel(deleteConfirmModelId)}>削除する</button>
            </div>
          </div>
        </div>
      )}

      {recordModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setRecordModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>録音</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setRecordModalOpen(false)}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.recordHint}>以下の文章をそのまま読み上げてください。（約30字）</p>
              <div className={styles.recordSentence}>{recordSentence}</div>
              {verifyStatus === 'fail' && <p className={styles.voiceVerifyFail}>{verifyMessage}</p>}
              {verifyStatus === 'success' && <p className={styles.voiceVerifySuccess}>{verifyMessage}</p>}
              <div className={styles.recordActions}>
                {!recording && !recordedBlob && (
                  <button type="button" className={styles.primaryBtn} onClick={startRecording}>
                    開始録音
                  </button>
                )}
                {recording && (
                  <button type="button" className={styles.voicePlayBtn} onClick={stopRecording}>
                    停止録音
                  </button>
                )}
                {recordedBlob && verifyStatus === 'idle' && (
                  <>
                    <button type="button" className={styles.secondaryBtn} onClick={() => { setRecordedBlob(null); setRecordSentence(pickRandomSentence()); }}>
                      やり直す
                    </button>
                    <button type="button" className={styles.primaryBtn} onClick={submitRecord}>
                      送信して確認
                    </button>
                  </>
                )}
                {recordedBlob && verifyStatus === 'verifying' && (
                  <span className={styles.recordVerifying}>確認中...</span>
                )}
                {verifyStatus === 'success' && (
                  <button type="button" className={styles.primaryBtn} onClick={() => setRecordModalOpen(false)}>
                    閉じる
                  </button>
                )}
                {verifyStatus === 'fail' && (
                  <>
                    <button type="button" className={styles.secondaryBtn} onClick={() => { setRecordedBlob(null); setVerifyStatus('idle'); setRecordSentence(pickRandomSentence()); }}>
                      もう一度読む
                    </button>
                    <button type="button" className={styles.primaryBtn} onClick={() => setRecordModalOpen(false)}>
                      閉じる
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assets' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>アセット庫</h2>
          <p className={styles.hint}>
            創作で生成した画像・動画・音声はここに保存されます。種類別に表示し、商品や投稿にまとめられます。
          </p>
          <div className={styles.assetTypeTabs}>
            {[
              { key: 'image' as const, label: '画像', icon: '🖼️' },
              { key: 'video' as const, label: '動画', icon: '🎬' },
              { key: 'audio' as const, label: '音声', icon: '🔊' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                className={[styles.assetTypeTab, assetType === t.key ? styles.assetTypeTabActive : ''].join(' ')}
                onClick={() => setAssetType(t.key)}
              >
                <span className={styles.assetTypeIcon}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
          {assetType === 'image' && (
            <div className={styles.assetTypeBlock}>
              <h3 className={styles.assetTypeTitle}>画像アセット</h3>
              <div className={styles.assetGrid}>
                {savedImageIds.length === 0 ? (
                  [1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={styles.assetSlot}>
                      <span className={styles.assetPlaceholder}>+</span>
                      <span className={styles.assetLabel}>未追加</span>
                    </div>
                  ))
                ) : (
                  <>
                    {savedImageIds.map((url, i) => (
                      <div key={url} className={styles.assetSlot}>
                        <img src={url} alt="" className={styles.assetSlotImg} />
                        <span className={styles.assetLabel}>画像 {i + 1}</span>
                      </div>
                    ))}
                    {savedImageIds.length < 6 &&
                      Array.from({ length: 6 - savedImageIds.length }, (_, i) => (
                        <div key={`empty-${i}`} className={styles.assetSlot}>
                          <span className={styles.assetPlaceholder}>+</span>
                          <span className={styles.assetLabel}>未追加</span>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          )}
          {assetType === 'video' && (
            <div className={styles.assetTypeBlock}>
              <h3 className={styles.assetTypeTitle}>動画アセット</h3>
              <div className={styles.assetGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.assetSlot}>
                    <span className={styles.assetPlaceholder}>+</span>
                    <span className={styles.assetLabel}>未追加</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {assetType === 'audio' && (
            <div className={styles.assetTypeBlock}>
              <h3 className={styles.assetTypeTitle}>音声アセット</h3>
              <div className={styles.assetList}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={styles.assetSlotRow}>
                    <span className={styles.assetPlaceholder}>🔊</span>
                    <span className={styles.assetLabel}>未追加</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className={styles.hint}>
            創作タブで生成したコンテンツをここに追加し、商品や投稿に利用できます。
          </p>
        </section>
      )}

      {activeTab === 'schedule' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>予約投稿</h2>
          <p className={styles.hint}>
            画像を選び、AIで文案を作成・整えてから、送信日時を設定します。
          </p>
          <div className={styles.scheduleList}>
            <p className={styles.empty}>予約投稿はまだありません。「新規作成」で追加できます。</p>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => setScheduleModalOpen(true)}
            >
              新規作成
            </button>
          </div>
        </section>
      )}

      {scheduleModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setScheduleModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>予約投稿</h3>
              <button type="button" className={styles.modalClose} onClick={() => setScheduleModalOpen(false)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>投稿タイトル</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  placeholder="例：週末のお知らせ"
                  value={scheduleDraft.title}
                  onChange={(e) => setScheduleDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>投稿本文</label>
                <textarea
                  className={styles.modalTextarea}
                  placeholder="本文を入力..."
                  value={scheduleDraft.content}
                  onChange={(e) => setScheduleDraft((d) => ({ ...d, content: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>画像/動画</label>
                <p className={styles.modalHint}>アセット庫から追加するか、創作で新規生成できます。</p>
                <div className={styles.modalMediaActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => { setAssetPickerContext('schedule'); setAssetPickerType('image'); setAssetPickerOpen(true); }}
                  >
                    アセット庫から追加
                  </button>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => { setActiveTab('creation'); setScheduleModalOpen(false); }}
                  >
                    新規生成
                  </button>
                </div>
                <div className={styles.modalMediaGrid}>
                  {scheduleDraft.media.length === 0 ? (
                    <span className={styles.modalMediaEmpty}>未追加</span>
                  ) : (
                    scheduleDraft.media.map((id, i) => (
                      <div key={id} className={styles.modalMediaSlot}>
                        <span className={styles.previewPlaceholder}>{i % 2 === 0 ? '🖼️' : '🎬'}</span>
                        <button type="button" className={styles.modalMediaRemove} onClick={() => setScheduleDraft((d) => ({ ...d, media: d.media.filter((_, j) => j !== i) }))}>削除</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>投稿日時</label>
                <input
                  type="datetime-local"
                  className={styles.modalInput}
                  value={scheduleDraft.scheduleTime}
                  onChange={(e) => setScheduleDraft((d) => ({ ...d, scheduleTime: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setScheduleModalOpen(false)}>キャンセル</button>
              <button type="button" className={styles.secondaryBtn} onClick={() => { setScheduleModalOpen(false); /* 存草稿 */ }}>下書き保存</button>
              <button type="button" className={styles.primaryBtn} onClick={() => { setScheduleModalOpen(false); /* 保存并投稿 */ }}>保存して投稿</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>好感度報酬コンテンツ</h2>
          <p className={styles.hint}>
            ファンがAI分身とチャットしてレベルアップすると、該当レベルの報酬を解放できます。各レベルに複数の写真・動画などを登録でき、解放時にランダムで1つが選ばれます。
          </p>
          <div className={styles.rewardsGrid}>
            {GOODWILL_LEVELS.map(({ level, required }) => (
              <div key={level} className={styles.rewardCard}>
                <div className={styles.rewardLevel}>Lv.{level}</div>
                <div className={styles.rewardRequired}>好感度 {required}</div>
                <div className={styles.rewardContent}>
                  {(rewardsByLevel[level] ?? []).length > 0 ? (
                    <span className={styles.rewardCount}>{(rewardsByLevel[level] ?? []).length}件登録</span>
                  ) : (
                    <span className={styles.rewardEmpty}>未設定</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => setRewardModalLevel(level)}
                >
                  報酬を追加
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {rewardImageViewerUrl && (
        <div className={styles.modalOverlay} onClick={() => setRewardImageViewerUrl(null)}>
          <div className={styles.viewerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>画像プレビュー</h3>
              <button type="button" className={styles.modalClose} onClick={() => setRewardImageViewerUrl(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.viewerBody}>
              <div className={styles.viewerMain} style={{ justifyContent: 'center' }}>
                <img src={rewardImageViewerUrl} alt="" className={styles.viewerMediaImg} />
              </div>
            </div>
          </div>
        </div>
      )}

      {rewardModalLevel !== null && (
        <div className={styles.modalOverlay} onClick={() => setRewardModalLevel(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Lv.{rewardModalLevel} 報酬コンテンツ</h3>
              <button type="button" className={styles.modalClose} onClick={() => setRewardModalLevel(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalHint}>アセット庫から追加するか、創作で新規生成してから1つずつ追加できます。解放時にランダムで1つが選ばれます。</p>
              <div className={styles.rewardModalList}>
                {(rewardsByLevel[rewardModalLevel] ?? []).length === 0 ? (
                  <div className={styles.rewardModalEmpty}>まだ報酬がありません。「アセット庫から追加」または「新規生成」で1つずつ追加してください。</div>
                ) : (
                  (rewardsByLevel[rewardModalLevel] ?? []).map((item) => (
                    <div key={item.id} className={styles.rewardModalItem}>
                      {item.type === 'image' && (item.id.startsWith('/') || item.id.startsWith('http')) ? (
                        <button
                          type="button"
                          className={styles.rewardModalThumbBtn}
                          onClick={() => setRewardImageViewerUrl(item.id)}
                          title="クリックで拡大"
                        >
                          <img src={item.id} alt="" className={styles.rewardModalThumb} />
                        </button>
                      ) : (
                        <span className={styles.rewardModalIcon}>{item.type === 'video' ? '🎬' : item.type === 'audio' ? '🔊' : '🖼️'}</span>
                      )}
                      {item.type === 'image' && (item.id.startsWith('/') || item.id.startsWith('http')) ? (
                        <button type="button" className={styles.rewardModalLabelBtn} onClick={() => setRewardImageViewerUrl(item.id)}>
                          {item.label}
                        </button>
                      ) : (
                        <span className={styles.rewardModalLabel}>{item.label}</span>
                      )}
                      <button type="button" className={styles.rewardModalDelete} onClick={() => setRewardsByLevel((prev) => ({ ...prev, [rewardModalLevel]: (prev[rewardModalLevel] ?? []).filter((r) => r.id !== item.id) }))}>削除</button>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.rewardModalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => { setAssetPickerContext({ type: 'reward', level: rewardModalLevel }); setAssetPickerType('image'); setAssetPickerOpen(true); }}
                >
                  アセット庫から追加
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => { setActiveTab('creation'); setRewardModalLevel(null); }}
                >
                  新規生成
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.primaryBtn} onClick={() => setRewardModalLevel(null)}>完了</button>
            </div>
          </div>
        </div>
      )}

      {imageViewerIndex !== null && imageResults.length > 0 && (
        <div className={styles.modalOverlay} onClick={() => setImageViewerIndex(null)}>
          <div className={styles.viewerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>画像プレビュー</h3>
              <button type="button" className={styles.modalClose} onClick={() => setImageViewerIndex(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.viewerBody}>
              <div className={styles.viewerMain}>
                <button
                  type="button"
                  className={styles.viewerNavBtn}
                  onClick={() =>
                    setImageViewerIndex((idx) => (idx === null ? idx : Math.max(idx - 1, 0)))
                  }
                  disabled={imageViewerIndex === 0}
                >
                  ‹
                </button>
                <div className={styles.viewerMedia}>
                  {(() => {
                    const idOrUrl = imageResults[imageViewerIndex]
                    const isUrl = typeof idOrUrl === 'string' && (idOrUrl.startsWith('/') || idOrUrl.startsWith('http'))
                    return isUrl ? (
                      <img src={idOrUrl} alt="" className={styles.viewerMediaImg} />
                    ) : (
                      <>
                        <span className={styles.viewerPlaceholder}>🖼️</span>
                        <div className={styles.viewerLabel}>画像 {imageViewerIndex + 1}</div>
                      </>
                    )
                  })()}
                </div>
                <button
                  type="button"
                  className={styles.viewerNavBtn}
                  onClick={() =>
                    setImageViewerIndex((idx) =>
                      idx === null ? idx : Math.min(idx + 1, imageResults.length - 1),
                    )
                  }
                  disabled={imageViewerIndex === imageResults.length - 1}
                >
                  ›
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {(() => {
                const id = imageResults[imageViewerIndex]
                const saved = savedImageIds.includes(id)
                return (
                  <>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      disabled={saved}
                      onClick={() => {
                        if (saved) return
                        setSavedImageIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
                      }}
                    >
                      {saved ? 'アセット庫に保存済み' : 'アセット庫に保存'}
                    </button>
                    <button
                      type="button"
                      className={styles.voiceModelDelete}
                      onClick={() => {
                        setImageResults((prev) => prev.filter((x) => x !== id))
                        setSavedImageIds((prev) => prev.filter((x) => x !== id))
                        setImageViewerIndex((idx) => {
                          if (idx === null) return null
                          if (imageResults.length <= 1) return null
                          const newLen = imageResults.length - 1
                          return Math.min(idx, newLen - 1)
                        })
                      }}
                    >
                      削除
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {videoViewerIndex !== null && videoResults.length > 0 && (
        <div className={styles.modalOverlay} onClick={() => setVideoViewerIndex(null)}>
          <div className={styles.viewerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>動画プレビュー</h3>
              <button type="button" className={styles.modalClose} onClick={() => setVideoViewerIndex(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.viewerBody}>
              <div className={styles.viewerMain}>
                <button
                  type="button"
                  className={styles.viewerNavBtn}
                  onClick={() =>
                    setVideoViewerIndex((idx) => (idx === null ? idx : Math.max(idx - 1, 0)))
                  }
                  disabled={videoViewerIndex === 0}
                >
                  ‹
                </button>
                <div className={styles.viewerMedia}>
                  {(() => {
                    const idOrUrl = videoResults[videoViewerIndex]
                    const isUrl = typeof idOrUrl === 'string' && (idOrUrl.startsWith('/') || idOrUrl.startsWith('http'))
                    if (!isUrl) {
                      return (
                        <>
                          <span className={styles.viewerPlaceholder}>🎬</span>
                          <div className={styles.viewerLabel}>動画 {videoViewerIndex + 1}</div>
                        </>
                      )
                    }
                    if (videoLoadError) {
                      return (
                        <div className={styles.viewerPlaceholderWrap}>
                          <span className={styles.viewerPlaceholder}>🎬</span>
                          <div className={styles.viewerLabel}>動画の読み込みに失敗しました</div>
                          <p className={styles.viewerErrorHint}>ファイルが public/demo-videos/ に存在するか確認してください。</p>
                        </div>
                      )
                    }
                    return (
                      <video
                        src={idOrUrl}
                        className={styles.viewerMediaVideo}
                        controls
                        autoPlay
                        playsInline
                        onLoadedData={() => setVideoLoadError(false)}
                        onError={() => setVideoLoadError(true)}
                      />
                    )
                  })()}
                </div>
                <button
                  type="button"
                  className={styles.viewerNavBtn}
                  onClick={() =>
                    setVideoViewerIndex((idx) =>
                      idx === null ? idx : Math.min(idx + 1, videoResults.length - 1),
                    )
                  }
                  disabled={videoViewerIndex === videoResults.length - 1}
                >
                  ›
                </button>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {(() => {
                const id = videoResults[videoViewerIndex]
                const saved = savedVideoIds.includes(id)
                return (
                  <>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      disabled={saved}
                      onClick={() => {
                        if (saved) return
                        setSavedVideoIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
                      }}
                    >
                      {saved ? 'アセット庫に保存済み' : 'アセット庫に保存'}
                    </button>
                    <button
                      type="button"
                      className={styles.voiceModelDelete}
                      onClick={() => {
                        setVideoResults((prev) => prev.filter((x) => x !== id))
                        setSavedVideoIds((prev) => prev.filter((x) => x !== id))
                        setVideoViewerIndex((idx) => {
                          if (idx === null) return null
                          if (videoResults.length <= 1) return null
                          const newLen = videoResults.length - 1
                          return Math.min(idx, newLen - 1)
                        })
                      }}
                    >
                      削除
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {assetPickerOpen && assetPickerContext !== null && (
        <div className={styles.pickerOverlay} onClick={() => { setAssetPickerOpen(false); setAssetPickerContext(null); }}>
          <div className={styles.pickerModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>アセットを選択</h3>
              <button type="button" className={styles.modalClose} onClick={() => { setAssetPickerOpen(false); setAssetPickerContext(null); }} aria-label="閉じる">×</button>
            </div>
            <div className={styles.pickerTabs}>
              {[
                { key: 'image' as const, label: '画像', icon: '🖼️' },
                { key: 'video' as const, label: '動画', icon: '🎬' },
                { key: 'audio' as const, label: '音声', icon: '🔊' },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className={[styles.assetTypeTab, assetPickerType === t.key ? styles.assetTypeTabActive : ''].join(' ')}
                  onClick={() => setAssetPickerType(t.key)}
                >
                  <span className={styles.assetTypeIcon}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
            <div className={styles.pickerBody}>
              {assetPickerType === 'image' && (
                savedImageIds.length === 0 ? (
                  <p className={styles.pickerEmpty}>画像アセットがありません。創作タブで画像を生成し、プレビューから「アセット庫に保存」してから選べます。</p>
                ) : (
                  <div className={styles.pickerGrid}>
                    {savedImageIds.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        className={styles.pickerSlot}
                        onClick={() => {
                          if (assetPickerContext === 'schedule') {
                            setScheduleDraft((d) => ({ ...d, media: [...d.media, url] }))
                          } else {
                            setRewardsByLevel((prev) => ({ ...prev, [assetPickerContext.level]: [...(prev[assetPickerContext.level] ?? []), { id: url, label: `画像${(prev[assetPickerContext.level] ?? []).length + 1}`, type: 'image' }] }))
                          }
                          setAssetPickerOpen(false)
                          setAssetPickerContext(null)
                        }}
                      >
                        <img src={url} alt="" className={styles.pickerSlotImg} />
                        <span className={styles.pickerSlotLabel}>選択</span>
                      </button>
                    ))}
                  </div>
                )
              )}
              {assetPickerType === 'video' && (
                videoResults.length === 0 ? (
                  <p className={styles.pickerEmpty}>動画アセットがありません。創作タブで動画を生成してから選べます。</p>
                ) : (
                  <div className={styles.pickerGrid}>
                    {videoResults.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        type="button"
                        className={styles.pickerSlot}
                        onClick={() => {
                          if (assetPickerContext === 'schedule') {
                            setScheduleDraft((d) => ({ ...d, media: [...d.media, url] }))
                          } else {
                            setRewardsByLevel((prev) => ({ ...prev, [assetPickerContext.level]: [...(prev[assetPickerContext.level] ?? []), { id: url, label: `動画${(prev[assetPickerContext.level] ?? []).length + 1}`, type: 'video' }] }))
                          }
                          setAssetPickerOpen(false)
                          setAssetPickerContext(null)
                        }}
                      >
                        <span className={styles.pickerSlotPlaceholder}>🎬</span>
                        <span className={styles.pickerSlotLabel}>選択</span>
                      </button>
                    ))}
                  </div>
                )
              )}
              {assetPickerType === 'audio' && (
                audioResults.length === 0 ? (
                  <p className={styles.pickerEmpty}>音声アセットがありません。創作タブで音声を生成してから選べます。</p>
                ) : (
                  <div className={styles.pickerList}>
                    {audioResults.map((item, i) => (
                      <button
                        key={item.id}
                        type="button"
                        className={styles.pickerSlotRow}
                        onClick={() => {
                          if (assetPickerContext === 'schedule') {
                            setScheduleDraft((d) => ({ ...d, media: [...d.media, item.audioUrl] }))
                          } else {
                            setRewardsByLevel((prev) => ({ ...prev, [assetPickerContext.level]: [...(prev[assetPickerContext.level] ?? []), { id: item.audioUrl, label: `音声${(prev[assetPickerContext.level] ?? []).length + 1}`, type: 'audio' }] }))
                          }
                          setAssetPickerOpen(false)
                          setAssetPickerContext(null)
                        }}
                      >
                        <span className={styles.pickerSlotPlaceholder}>🔊</span>
                        <span className={styles.pickerSlotLabel}>音声 {i + 1} を選択</span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => { setAssetPickerOpen(false); setAssetPickerContext(null); }}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
