import { useNavigate, Outlet } from 'react-router-dom'
import CreatorSidebar from '../CreatorSidebar/CreatorSidebar'
import CreatorChatPanel from '../CreatorChatPanel/CreatorChatPanel'
import styles from './CreatorLayout.module.css'

export default function CreatorLayout() {
  const navigate = useNavigate()

  const handleChatNavigate = (page: string) => {
    const path = `/creator/${page}`
    navigate(path)
  }

  return (
    <div className={styles.wrap}>
      <CreatorSidebar />
      <main className={styles.main}>
        <div className={styles.mainContent}>
          <Outlet />
        </div>
      </main>
      <CreatorChatPanel onNavigate={handleChatNavigate} />
    </div>
  )
}
