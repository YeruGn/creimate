import { Link } from 'react-router-dom'
import { mockCreators } from '../data/mockData'
import styles from './HomePage.module.css'

export default function HomePage() {
  const featured = mockCreators.slice(0, 3)

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          クリエ<span>メイト</span>
        </h1>
        <p className={styles.heroDesc}>
          FantiaクリエイターのためのAIツール。AI分身でファンと対話し、AIでコンテンツを作成・分析し、すべてを対話で完結させます。
        </p>
        <Link to="/creator" className={styles.heroCta}>
          AIアシスタントで始める →
        </Link>
      </section>

      <h2 className={styles.sectionTitle}>主な機能</h2>
      <div className={styles.features}>
        <div className={styles.card}>
          <div className={styles.cardIcon}>👤</div>
          <h3 className={styles.cardTitle}>AI数字分身</h3>
          <p className={styles.cardDesc}>
            顔・声・口癖・趣味などを登録してAI分身を作成。ファンはトークンで対話でき、好感度に応じて報酬コンテンツを解放。
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>🎨</div>
          <h3 className={styles.cardTitle}>AIコンテンツ作成</h3>
          <p className={styles.cardDesc}>
            AIで画像・動画・音声を生成し、文案も自動で作成。コンテンツパックとして販売可能。
          </p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon}>📊</div>
          <h3 className={styles.cardTitle}>AIデータ分析</h3>
          <p className={styles.cardDesc}>
            収益・消費傾向・投稿閲覧数を分析し、コンテンツ戦略の提案をAIがサポート。
          </p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>AI分身を持つクリエイター</h2>
      <div className={styles.creators}>
        {featured.map((c) => (
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
              <img
                src={c.avatar}
                alt=""
                className={styles.creatorAvatar}
              />
              <div className={styles.creatorName}>{c.name}</div>
              <p className={styles.creatorTagline}>{c.tagline}</p>
              {c.hasAiTwin && (
                <span className={styles.aiBadge}>🤖 AI分身</span>
              )}
              <div className={styles.creatorMeta}>
                <span>♥ {(c.followerCount / 1000).toFixed(1)}K</span>
                <span>プラン {c.planCount}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <p style={{ marginTop: 16 }}>
        <Link to="/creators" className={styles.heroCta} style={{ display: 'inline-flex' }}>
          もっと見る
        </Link>
      </p>
    </>
  )
}
