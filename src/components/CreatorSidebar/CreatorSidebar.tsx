import { Link, NavLink } from 'react-router-dom'
import styles from './CreatorSidebar.module.css'

const mainNav = [
  { to: '/creator/creation', label: '創作センター', icon: '🎨' },
  { to: '/creator/twin', label: 'AI対話分身管理', icon: '👤' },
  { to: '/creator/content', label: 'コンテンツ管理', icon: '📦' },
  { to: '/creator/messages', label: 'メッセージ管理', icon: '💬' },
  { to: '/creator/analytics', label: 'データセンター', icon: '📊' },
]

const footerNav = [
  { to: '/creator/settings', label: '設定', icon: '⚙️' },
  { to: '/creator/account', label: 'アカウント', icon: '👤' },
]

export default function CreatorSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}>
        <Link to="/" className={styles.logo}>
          クリエ<span>メイト</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionTitle}>コア機能</div>
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.divider} />
        {footerNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ')
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
