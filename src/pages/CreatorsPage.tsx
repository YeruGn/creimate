import { Link } from 'react-router-dom'
import { mockCreators } from '../data/mockData'
import styles from './HomePage.module.css'

export default function CreatorsPage() {
  return (
    <>
      <h1 className={styles.sectionTitle}>クリエイターを探す</h1>
      <p style={{ marginBottom: 24, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
        AI分身を持つクリエイターとトークしたり、プランに加入して限定コンテンツを楽しめます。
      </p>
      <div className={styles.creators}>
        {mockCreators.map((c) => (
          <Link
            key={c.id}
            to={`/creator/${c.id}`}
            className={[styles.creatorCard, styles.link].join(' ')}
          >
            <div className={styles.creatorCover}>
              {c.cover ? (
                <img src={c.cover} alt="" />
              ) : (
                <span style={{ opacity: 0.5 }}>✨</span>
              )}
            </div>
            <div className={styles.creatorBody}>
              <img src={c.avatar} alt="" className={styles.creatorAvatar} />
              <div className={styles.creatorName}>{c.name}</div>
              <p className={styles.creatorTagline}>{c.tagline}</p>
              {c.hasAiTwin && <span className={styles.aiBadge}>🤖 AI分身</span>}
              <div className={styles.creatorMeta}>
                <span>♥ {(c.followerCount / 1000).toFixed(1)}K</span>
                <span>プラン {c.planCount}</span>
                <span>投稿 {c.postCount}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
