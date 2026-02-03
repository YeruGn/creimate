import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Creator } from '../../types'
import styles from './CreatorHeader.module.css'

interface CreatorHeaderProps {
  creator: Creator
  basePath: string
  children?: ReactNode
}

const tabs = [
  { key: 'home', label: 'ホーム', count: null },
  { key: 'plans', label: 'プラン', count: 'planCount' as const },
  { key: 'posts', label: '投稿', count: 'postCount' as const },
  { key: 'products', label: '商品', count: 'productCount' as const },
  { key: 'chat', label: 'AIとトーク', count: null },
  { key: 'messages', label: 'メッセージ', count: null },
]

export default function CreatorHeader({ creator, basePath, children }: CreatorHeaderProps) {
  const location = useLocation()
  const current = location.pathname.replace(basePath, '').split('/')[1] || 'home'

  return (
    <header className={styles.header}>
      <div className={styles.top}>
        <img
          src={creator.avatar}
          alt={creator.name}
          className={styles.avatar}
        />
        <div className={styles.meta}>
          <div className={styles.likeCount}>♥ {(creator.followerCount / 1000).toFixed(1)}K</div>
          <div className={styles.tags}>
            {creator.tags.map((tag) => (
              <span
                key={tag}
                className={[styles.tag, tag.includes('年齢') ? styles.tagVerified : ''].join(' ')}
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className={styles.name}>{creator.name}</h1>
          <p className={styles.tagline}>{creator.tagline}</p>
        </div>
      </div>
      {children}
      <nav className={styles.tabs}>
        {tabs.map(({ key, label, count }) => {
          const countVal = count ? (creator[count] ?? 0) : null
          const path = key === 'home' ? basePath : `${basePath}/${key}`
          const isActive = current === key
          return (
            <Link
              key={key}
              to={path}
              className={[styles.tab, isActive ? styles.tabActive : ''].join(' ')}
            >
              {label}
              {countVal != null && (
                <span className={styles.tabCount}> {countVal}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
