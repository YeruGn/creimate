import { useState } from 'react'
import { GOODWILL_LEVELS } from '../types'
import styles from './CreatorCreationPage.module.css'

export default function CreatorCreationPage() {
  const [activeTab, setActiveTab] = useState<'assets' | 'schedule' | 'rewards'>('assets')
  const [rewardsByLevel, setRewardsByLevel] = useState<Record<number, string[]>>({})

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>創作センター</h1>
      <p className={styles.desc}>
        登録した顔・体型写真と年齢・髪型・身長などの情報で写真を生成。成果物はアセット庫に保存し、商品や投稿にまとめられます。予約投稿や好感度報酬の設定も可能です。
      </p>

      <nav className={styles.tabs}>
        {[
          { key: 'assets', label: 'アセット庫' },
          { key: 'schedule', label: '予約投稿' },
          { key: 'rewards', label: '好感度報酬' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            className={[styles.tab, activeTab === t.key ? styles.tabActive : ''].join(' ')}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {activeTab === 'assets' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>アセット庫</h2>
          <p className={styles.hint}>
            右側のAIに「白いビキニで海辺のセクシー写真を20枚生成して」などと指示すると、画像・動画・音声を出力します。選んだコンテンツはここに表示され、商品や投稿にまとめられます。
          </p>
          <div className={styles.assetGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={styles.assetSlot}>
                <span className={styles.assetPlaceholder}>+</span>
                <span className={styles.assetLabel}>未追加</span>
              </div>
            ))}
          </div>
          <p className={styles.hint}>
            年齢・髪型・身長・体型などをあらかじめ設定しておけば、会話で要望を伝えるだけで素早く出力できます。
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
            <button type="button" className={styles.secondaryBtn}>
              新規作成
            </button>
          </div>
        </section>
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
                    <ul>
                      {(rewardsByLevel[level] ?? []).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className={styles.rewardEmpty}>未設定</span>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.smallBtn}
                  onClick={() => {
                    const current = rewardsByLevel[level] ?? []
                    setRewardsByLevel({
                      ...rewardsByLevel,
                      [level]: [...current, `報酬 ${current.length + 1}`],
                    })
                  }}
                >
                  報酬を追加
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
