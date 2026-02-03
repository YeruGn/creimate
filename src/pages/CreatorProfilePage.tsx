import { useParams, Routes, Route, Navigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import CreatorHeader from '../components/CreatorHeader/CreatorHeader'
import { mockCreators } from '../data/mockData'
import styles from './CreatorProfilePage.module.css'

export default function CreatorProfilePage() {
  const { creatorId } = useParams<{ creatorId: string }>()
  const creator = mockCreators.find((c) => c.id === creatorId)

  if (!creator) {
    return <Navigate to="/creators" replace />
  }

  const basePath = `/creator/${creator.id}`

  return (
    <div className={styles.page}>
      <CreatorHeader creator={creator} basePath={basePath} />
      <div className={styles.content}>
        <Routes>
          <Route path={basePath} element={<CreatorHomeTab creator={creator} />} />
          <Route path={`${basePath}/plans`} element={<CreatorPlansTab creator={creator} />} />
          <Route path={`${basePath}/chat`} element={<Navigate to={`/chat/${creator.id}`} replace />} />
          <Route path={`${basePath}/*`} element={<div>コンテンツは準備中です。</div>} />
        </Routes>
      </div>
    </div>
  )
}

function CreatorHomeTab({ creator }: { creator: (typeof mockCreators)[0] }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>
        {creator.name}のプラン
      </h2>
      <p className={styles.homeIntro}>
        {creator.name}のプラン一覧です。加入するとAI分身との対話や限定コンテンツが楽しめます。
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.btnPrimary}>
          📝 ポスト
        </button>
        <button type="button" className={styles.btnSecondary}>
          🔗 シェア
        </button>
      </div>
      <div className={styles.notice}>
        <span className={styles.noticeIcon}>⚠️</span>
        <span>
          過去加入していた同額以上のプランに再加入することで、過去加入期間のコンテンツを閲覧できます。
          <a href="#detail">詳しくはこちら</a>
        </span>
      </div>
      {creator.plans && creator.plans.length > 0 ? (
        <div className={styles.plans}>
          {creator.plans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              {plan.thumbnail && (
                <img src={plan.thumbnail} alt="" className={styles.planThumb} />
              )}
              {!plan.thumbnail && <div className={styles.planThumb} />}
              <div className={styles.planInfo}>
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planPrice}>
                  {plan.price}円<span>（税込）/{plan.unit === 'month' ? '月' : '回'}</span>
                </div>
                <ul className={styles.benefits}>
                  {plan.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.planActions}>
                <Link to={`/chat/${creator.id}`} className={styles.btnPrimary}>
                  AIとトークする
                </Link>
                <button type="button" className={styles.btnSecondary}>
                  バックナンバーをみる
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}

function CreatorPlansTab({ creator }: { creator: (typeof mockCreators)[0] }) {
  return (
    <>
      <h2 className={styles.sectionTitle}>
        {creator.name}のプラン
      </h2>
      <p className={styles.homeIntro}>
        {creator.name}のプラン一覧です。
      </p>
      {creator.plans && creator.plans.length > 0 ? (
        <div className={styles.plans}>
          {creator.plans.map((plan) => (
            <div key={plan.id} className={styles.planCard}>
              {plan.thumbnail && (
                <img src={plan.thumbnail} alt="" className={styles.planThumb} />
              )}
              {!plan.thumbnail && <div className={styles.planThumb} />}
              <div className={styles.planInfo}>
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planPrice}>
                  {plan.price}円<span>（税込）/{plan.unit === 'month' ? '月' : '回'}</span>
                </div>
                <ul className={styles.benefits}>
                  {plan.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.planActions}>
                <Link to={`/chat/${creator.id}`} className={styles.btnPrimary}>
                  AIとトークする
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  )
}
