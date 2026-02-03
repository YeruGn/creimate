import { useState } from 'react'
import styles from './CreatorContentManagePage.module.css'

const mockPosts = [
  { id: '1', title: '週末の写真', date: '2025-02-01', views: 320, status: '公開中' },
  { id: '2', title: '新作お知らせ', date: '2025-01-28', views: 580, status: '公開中' },
]
const mockProducts = [
  { id: 'p1', name: '写真集セット', price: 500, sales: 12, status: '販売中' },
  { id: 'p2', name: '限定動画', price: 300, sales: 28, status: '販売中' },
]

export default function CreatorContentManagePage() {
  const [tab, setTab] = useState<'posts' | 'products'>('posts')

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>コンテンツ管理</h1>
      <p className={styles.desc}>
        投稿・商品を一覧で確認・管理できます（Fantia データ連携）。編集・削除などの操作が可能です。
      </p>

      <nav className={styles.tabs}>
        <button
          type="button"
          className={[styles.tab, tab === 'posts' ? styles.tabActive : ''].join(' ')}
          onClick={() => setTab('posts')}
        >
          投稿
        </button>
        <button
          type="button"
          className={[styles.tab, tab === 'products' ? styles.tabActive : ''].join(' ')}
          onClick={() => setTab('products')}
        >
          商品
        </button>
      </nav>

      {tab === 'posts' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>投稿一覧</h2>
          <ul className={styles.list}>
            {mockPosts.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{p.title}</span>
                  <span className={styles.itemMeta}>{p.date} · 閲覧 {p.views}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" className={styles.smallBtn}>編集</button>
                  <button type="button" className={styles.smallBtnDanger}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'products' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>商品一覧</h2>
          <ul className={styles.list}>
            {mockProducts.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{p.name}</span>
                  <span className={styles.itemMeta}>¥{p.price} · 販売 {p.sales}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" className={styles.smallBtn}>編集</button>
                  <button type="button" className={styles.smallBtnDanger}>販売停止</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
