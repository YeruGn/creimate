import { Link } from 'react-router-dom'
import styles from './TopNav.module.css'

export default function TopNav() {
  return (
    <header className={styles.nav}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          クリエ<span>メイト</span>
        </Link>
      </div>
    </header>
  )
}
