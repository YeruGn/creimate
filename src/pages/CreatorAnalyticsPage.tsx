import { useState, useMemo } from 'react'
import styles from './CreatorAnalyticsPage.module.css'

type TimeRange = 'yesterday' | 'week' | 'month' | 'halfYear' | 'year'

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'yesterday', label: '昨日' },
  { value: 'week', label: '直近1週間' },
  { value: 'month', label: '直近1か月' },
  { value: 'halfYear', label: '直近半年' },
  { value: 'year', label: '直近1年' },
]

type MetricKey = 'revenue' | 'chats' | 'homeViews' | 'homeVisits' | 'likes' | 'comments'

const METRICS: Record<MetricKey, { title: string; unit: string; mockValues: Record<TimeRange, number[]> }> = {
  revenue: {
    title: '今週の収益',
    unit: '¥',
    mockValues: {
      yesterday: [1280],
      week: [1200, 1150, 1300, 1280, 1350, 1400, 1280],
      month: [1100, 1150, 1200, 1250, 1220, 1280, 1300, 1250, 1320, 1280],
      halfYear: [1000, 1050, 1100, 1150, 1200, 1250, 1280],
      year: [800, 900, 950, 1000, 1050, 1100, 1150, 1200, 1220, 1250, 1280, 1280],
    },
  },
  chats: {
    title: 'AI分身 会話数',
    unit: '',
    mockValues: {
      yesterday: [34],
      week: [30, 32, 35, 38, 40, 42, 34],
      month: [28, 30, 32, 35, 36, 38, 40, 38, 42, 34],
      halfYear: [20, 24, 28, 30, 32, 35, 34],
      year: [15, 18, 22, 25, 28, 30, 32, 34, 36, 38, 40, 34],
    },
  },
  homeViews: {
    title: 'ホーム閲覧人数',
    unit: '',
    mockValues: {
      yesterday: [180],
      week: [160, 170, 175, 180, 185, 190, 180],
      month: [140, 150, 160, 165, 170, 175, 180],
      halfYear: [100, 120, 140, 150, 160, 170, 180],
      year: [80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 180],
    },
  },
  homeVisits: {
    title: 'ホーム訪問回数',
    unit: '',
    mockValues: {
      yesterday: [520],
      week: [480, 500, 510, 520, 530, 540, 520],
      month: [400, 420, 450, 480, 500, 510, 520],
      halfYear: [300, 350, 400, 450, 480, 510, 520],
      year: [200, 250, 300, 350, 400, 450, 480, 500, 510, 520, 530, 520],
    },
  },
  likes: {
    title: '投稿いいね数',
    unit: '',
    mockValues: {
      yesterday: [128],
      week: [110, 115, 120, 125, 130, 132, 128],
      month: [90, 95, 100, 108, 115, 120, 128],
      halfYear: [60, 75, 85, 95, 105, 118, 128],
      year: [40, 50, 60, 70, 80, 90, 100, 108, 115, 120, 125, 128],
    },
  },
  comments: {
    title: 'コメント数',
    unit: '',
    mockValues: {
      yesterday: [22],
      week: [18, 20, 21, 22, 23, 24, 22],
      month: [14, 16, 18, 19, 20, 21, 22],
      halfYear: [8, 10, 12, 15, 18, 20, 22],
      year: [5, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 22],
    },
  },
}

const DISPLAY_VALUES: Record<MetricKey, string> = {
  revenue: '¥12,800',
  chats: '342',
  homeViews: '1,240',
  homeVisits: '3,680',
  likes: '892',
  comments: '156',
}

function LineChart({ values, unit, title }: { values: number[]; unit: string; title: string }) {
  if (values.length === 0) {
    return (
      <div className={styles.chartWrap}>
        <h4 className={styles.chartTitle}>{title}</h4>
        <p className={styles.chartEmpty}>データがありません</p>
      </div>
    )
  }
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const width = 400
  const height = 220
  const padding = { top: 20, right: 20, bottom: 44, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const points = values.map((v, i) => {
    const x = padding.left + (values.length === 1 ? chartWidth / 2 : (i / Math.max(values.length - 1, 1)) * chartWidth)
    const y = padding.top + chartHeight - ((v - min) / range) * chartHeight
    return `${x},${y}`
  })
  const xAxisY = padding.top + chartHeight

  return (
    <div className={styles.chartWrap}>
      <h4 className={styles.chartTitle}>{title}</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.chartSvg}>
        <polyline fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points.join(' ')} />
        {values.map((_, i) => {
          const [x, y] = points[i].split(',').map(Number)
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--accent)" />
        })}
        {/* 横坐标轴 */}
        <line x1={padding.left} y1={xAxisY} x2={width - padding.right} y2={xAxisY} stroke="var(--border)" strokeWidth="1" />
        {values.map((_, i) => {
          const x = padding.left + (values.length === 1 ? chartWidth / 2 : (i / Math.max(values.length - 1, 1)) * chartWidth)
          const label = values.length === 1 ? '1' : String(i + 1)
          return (
            <text key={i} x={x} y={xAxisY + 18} textAnchor="middle" className={styles.chartAxisLabel}>
              {label}
            </text>
          )
        })}
      </svg>
      <div className={styles.chartLegend}>
        <span>{unit}{values[values.length - 1]?.toLocaleString()}</span>
      </div>
    </div>
  )
}

type StrategySubTab = 'weekly' | 'qa'

type WeeklyReportItem = { id: string; week: string; content: string; detail: string }
type QaItem = { id: string; question: string; answer: string; detail: string }

const MOCK_WEEKLY_REPORTS: WeeklyReportItem[] = [
  {
    id: '1',
    week: '2025年第5週',
    content: '今週はチャットでファンが挙げたキーワードが増加。金曜夜〜土曜のアクセスが突出しています。',
    detail: '今週のチャット分析では、ファンから「スク水」「ビキニ」「バニーガール」などのキーワードが多く挙がっています。これらのテーマは閲覧・反応ともによい傾向です。今後のコンテンツ創作では、スクール水着・水着・バニー系の衣装やシチュエーションを意識した写真・動画を増やすと、ファンの満足度向上が期待できます。\n\nまた、金曜夜〜土曜日のアクセスが他曜日より約20%多いため、この時間帯に新規投稿や限定公開を行うとリーチが伸びやすくなります。',
  },
  {
    id: '2',
    week: '2025年第4週',
    content: 'Lv.3〜5の好感度ユーザーが増加。チャットで頻出キーワードを分析しました。',
    detail: 'Lv.3〜5の好感度ユーザーが前週比で増加しています。中級向けの報酬（写真セット・ショート動画など）を追加すると、継続率の向上が期待できます。\n\nチャットで最も頻出していたキーワードは「甘い声」「囁き」「ASMR」「耳元」などでした。ファンは嬌喘やASMR系のボイス・動画を好む傾向が強いため、創作センターの音声生成や、囁き・喘ぎ系のコンテンツを増やすと反応が良くなる可能性があります。\n\n報酬の解放条件（好感度）と内容のバランスを取ると、より長く楽しんでもらいやすくなります。',
  },
  {
    id: '3',
    week: '2025年第3週',
    content: '購入最多は写真セット。ホーム閲覧数が前週比+5%でした。',
    detail: '今週の購入分析では、写真セットタイプの商品が最も多く購入されています。同タイプの商品（テーマ違い・枚数違い）を追加すると、既存ファンのリピート購入が見込めます。\n\nホーム閲覧数は前週比+5%で、新規フォロワー経由のアクセスが増えています。トップページのサムネイルや紹介文を定期的に更新すると、初見ユーザーの興味を引きやすくなります。\n\n「〇〇シリーズ第2弾」のようにシリーズ化すると、次回作への期待感も高まり、購入につながりやすくなります。',
  },
]

const MOCK_QA_ITEMS: QaItem[] = [
  {
    id: 'q1',
    question: '今週の収益を分析して',
    answer: '今週の収益は¥12,800で、前週比+8%です。主に写真セットと限定動画の販売が寄与しています。',
    detail: '今週の収益は¥12,800で、前週比+8%の伸びです。内訳は写真セットが約60%、限定動画が約30%、その他が約10%です。\n\nファンからの要望分析では、「スク水」「ビキニ」「バニーガール」といった衣装・シチュエーションのリクエストが多く、これらに沿った写真集や動画は購入率が高めです。今後の創作では、これらのキーワードを意識したコンテンツを増やすと、収益の安定・拡大が期待できます。\n\nまた、音声・ASMR系の単品商品の問い合わせも増えているため、嬌喘や囁き系のボイスコンテンツを商品化するのも一案です。',
  },
  {
    id: 'q2',
    question: 'チャットのキーワードを教えて',
    answer: '今週のチャットで頻出のキーワードは「〇〇」「△△」です。これらをテーマにしたコンテンツが人気です。',
    detail: '今週のチャットで頻出していたキーワードは以下のとおりです。\n\n・衣装・シチュエーション：「スク水」「ビキニ」「兔女郎（バニーガール）」「メイド」「ニーソ」\n・音声・雰囲気：「甘い声」「嬌喘」「ASMR」「囁き」「耳元」\n・コンテンツ希望：「もっと見たい」「動画で」「長めで」\n\nファンは特に「甘い声」「嬌喘」「ASMR」系のボイス・動画を好む傾向が強いです。創作センターの音声生成で、囁きや喘ぎ系のコンテンツを増やしたり、好感度報酬にASMR風の音声を追加したりすると、満足度アップが期待できます。\n\n衣装系はスク水・ビキニ・バニーガールのリクエストが多く、この方向の写真・動画創作もおすすめです。',
  },
]

export default function CreatorAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week')
  const [chartModal, setChartModal] = useState<MetricKey | null>(null)
  const [strategySubTab, setStrategySubTab] = useState<StrategySubTab>('weekly')
  const [strategyDetailModal, setStrategyDetailModal] = useState<{ type: 'weekly' | 'qa'; id: string } | null>(null)

  const chartData = useMemo(() => {
    if (!chartModal) return []
    const m = METRICS[chartModal]
    return m.mockValues[timeRange] ?? []
  }, [chartModal, timeRange])

  const chartTitle = chartModal ? METRICS[chartModal].title : ''

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>データセンター</h1>
      <p className={styles.desc}>
        AIが過去の投稿データ・商品売上・購読・チャット内容などを分析し、今後のコンテンツ戦略を提案します。
      </p>

      <div className={styles.timeRangeRow}>
        <span className={styles.timeRangeLabel}>期間：</span>
        <div className={styles.timeRangeButtons}>
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={[styles.timeRangeBtn, timeRange === opt.value ? styles.timeRangeBtnActive : ''].join(' ')}
              onClick={() => setTimeRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {(Object.keys(METRICS) as MetricKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={[styles.card, styles.cardClickable].join(' ')}
            onClick={() => setChartModal(key)}
          >
            <h3 className={styles.cardTitle}>{METRICS[key].title}</h3>
            <div className={styles.bigNum}>{DISPLAY_VALUES[key]}</div>
            <p className={styles.hint}>クリックで推移を表示</p>
          </button>
        ))}
      </div>

      {chartModal && (
        <div className={styles.modalOverlay} onClick={() => setChartModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{chartTitle} 推移</h3>
              <button type="button" className={styles.modalClose} onClick={() => setChartModal(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalTimeRange}>
                {TIME_RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={[styles.timeRangeBtn, timeRange === opt.value ? styles.timeRangeBtnActive : ''].join(' ')}
                    onClick={() => setTimeRange(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <LineChart values={chartData} unit={METRICS[chartModal].unit} title={chartTitle} />
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>AI 戦略提案</h2>
        <nav className={styles.strategyTabs}>
          <button
            type="button"
            className={[styles.strategyTab, strategySubTab === 'weekly' ? styles.strategyTabActive : ''].join(' ')}
            onClick={() => setStrategySubTab('weekly')}
          >
            コンテンツ戦略週報
          </button>
          <button
            type="button"
            className={[styles.strategyTab, strategySubTab === 'qa' ? styles.strategyTabActive : ''].join(' ')}
            onClick={() => setStrategySubTab('qa')}
          >
            Q&A戦略提案
          </button>
        </nav>

        {strategySubTab === 'weekly' && (
          <div className={styles.strategyColumns}>
            {MOCK_WEEKLY_REPORTS.map((r) => (
              <button
                key={r.id}
                type="button"
                className={styles.strategyColumnClickable}
                onClick={() => setStrategyDetailModal({ type: 'weekly', id: r.id })}
              >
                <div className={styles.strategyColumnTitle}>{r.week}</div>
                <p className={styles.strategyColumnContent}>{r.content}</p>
                <span className={styles.strategyColumnHint}>クリックで詳細を表示</span>
              </button>
            ))}
          </div>
        )}

        {strategySubTab === 'qa' && (
          <div className={styles.strategyColumns}>
            {MOCK_QA_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={styles.strategyColumnClickable}
                onClick={() => setStrategyDetailModal({ type: 'qa', id: item.id })}
              >
                <div className={styles.strategyColumnTitle}>Q: {item.question}</div>
                <p className={styles.strategyColumnContent}>{item.answer}</p>
                <span className={styles.strategyColumnHint}>クリックで詳細を表示</span>
              </button>
            ))}
          </div>
        )}

        {strategyDetailModal && (() => {
          const isWeekly = strategyDetailModal.type === 'weekly'
          const weeklyItem = isWeekly ? MOCK_WEEKLY_REPORTS.find((r) => r.id === strategyDetailModal.id) : null
          const qaItem = !isWeekly ? MOCK_QA_ITEMS.find((q) => q.id === strategyDetailModal.id) : null
          const title = isWeekly ? weeklyItem?.week : (qaItem ? `Q: ${qaItem.question}` : '')
          const detail = isWeekly ? weeklyItem?.detail : qaItem?.detail ?? ''
          if (!title && !detail) return null
          return (
            <div className={styles.modalOverlay} onClick={() => setStrategyDetailModal(null)}>
              <div className={[styles.modal, styles.strategyDetailModal].join(' ')} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h3 className={styles.modalTitle}>{title}</h3>
                  <button type="button" className={styles.modalClose} onClick={() => setStrategyDetailModal(null)} aria-label="閉じる">×</button>
                </div>
                <div className={styles.modalBody}>
                  <div className={styles.strategyDetailContent}>
                    {detail.split('\n\n').map((para, i) => (
                      <p key={i} className={styles.strategyDetailParagraph}>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        })()}

        <p className={styles.hint}>
          右側のAIアシスタントで「今週の収益を分析して」「チャットのキーワードを教えて」などと指示すると、回答がここに整理されます。
        </p>
      </div>
    </div>
  )
}
