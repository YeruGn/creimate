import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import styles from './Layout.module.css'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useLocation()
  const isCreatorDashboard = pathname === '/creator' || /^\/creator\/(twin|creation|content|messages|analytics|settings|account)(\/|$)/.test(pathname)
  const fullWidth = pathname.startsWith('/chat/') || isCreatorDashboard
  return (
    <div className={styles.layout}>
      <main className={fullWidth ? styles.mainFull : styles.main}>{children}</main>
    </div>
  )
}
