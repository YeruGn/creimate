import { GOODWILL_LEVELS } from '../../types'
import styles from './GoodwillBadges.module.css'

interface GoodwillBadgesProps {
  currentGoodwill: number
  unlockedLevels?: number[]
  compact?: boolean
}

export default function GoodwillBadges({
  currentGoodwill,
  unlockedLevels = [],
  compact,
}: GoodwillBadgesProps) {
  const currentLevel =
    GOODWILL_LEVELS.filter((l) => currentGoodwill >= l.required).pop()?.level ?? 0
  const nextLevel = GOODWILL_LEVELS.find((l) => l.level === currentLevel + 1)
  const nextRequired = nextLevel?.required ?? 1000

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>好感度バッジ</div>
      {!compact && (
        <p className={styles.desc}>
          チャットで1メッセージごとに好感度+1。レベルに応じてバッジが表示され、報酬コンテンツを解放できます。
        </p>
      )}
      <div className={styles.badges}>
        {GOODWILL_LEVELS.map(({ level, required }) => {
          const unlocked = currentGoodwill >= required || unlockedLevels.includes(level)
          const isCurrent = level === currentLevel
          return (
            <div key={level} className={styles.badgeItem}>
              <div
                className={[
                  styles.badge,
                  unlocked ? styles.badgeUnlocked : styles.badgeLocked,
                  isCurrent ? styles.badgeCurrent : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={`Lv.${level}（${required}）`}
              >
                {level}
              </div>
              {!compact && (
                <span className={styles.levelLabel}>{required}</span>
              )}
            </div>
          )
        })}
      </div>
      {!compact && nextLevel && currentLevel < 10 && (
        <p className={styles.desc} style={{ marginTop: 12, marginBottom: 0 }}>
          次のレベル Lv.{nextLevel.level} まであと {nextRequired - currentGoodwill} 好感度
        </p>
      )}
    </div>
  )
}
