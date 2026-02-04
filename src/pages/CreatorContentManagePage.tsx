import { type ReactNode, useState } from 'react'
import styles from './CreatorContentManagePage.module.css'

export type PostItem = {
  id: string
  title: string
  date: string
  views: number
  status: string
  content: string
}

// 一行が画像URLかどうか（拡張子 or 画像系クエリ）
const isImageUrl = (line: string) => /^https?:\/\//i.test(line.trim()) && /\.(png|jpg|jpeg|gif|webp)(\?|$)/i.test(line.trim())
const isLinkUrl = (line: string) => /^https?:\/\//i.test(line.trim())

const mockPosts: PostItem[] = [
  {
    id: '1',
    title: '初公開♡新バニーガール',
    date: '2025-02-01',
    views: 320,
    status: '公開中',
    content: 'https://picsum.photos/800/600?random=1\n\nこんにちは〜♪\n\n今回の投稿は初公開のバニーガールです✨\n\n撮影の雰囲気や衣装にこだわってみました❤️ みんなで仲良くパシャリ👯‍♀️\n\n気に入ってもらえたら嬉しいです🥺 コメントもお待ちしてます😋\n\nよろしくお願いします💖🐰\n\nhttps://fantia.jp/posts/3867582',
  },
  {
    id: '2',
    title: '新作お知らせ',
    date: '2025-01-28',
    views: 580,
    status: '公開中',
    content: '新作コンテンツのお知らせです。\n\n近日中に公開予定なので、お楽しみに〜！',
  },
]
const mockProducts = [
  { id: 'p1', name: '写真集セット', price: 500, introduction: '限定写真集10枚セットです。', sales: 12, status: '販売中' },
  { id: 'p2', name: '限定動画', price: 300, introduction: '特別編集の動画コンテンツです。', sales: 28, status: '販売中' },
]

export default function CreatorContentManagePage() {
  const [tab, setTab] = useState<'posts' | 'products'>('posts')
  const [posts, setPosts] = useState(mockPosts)
  const [products, setProducts] = useState(mockProducts)
  const [postEditId, setPostEditId] = useState<string | null>(null)
  const [productEditId, setProductEditId] = useState<string | null>(null)
  const [postDraft, setPostDraft] = useState({ title: '', content: '' })
  const [postPreviewId, setPostPreviewId] = useState<string | null>(null)
  const [productDraft, setProductDraft] = useState({ name: '', price: '', introduction: '' })

  const openPostEdit = (id: string) => {
    const p = posts.find((x) => x.id === id)
    if (p) {
      setPostEditId(id)
      setPostDraft({ title: p.title, content: p.content })
    }
  }
  const openPostPreview = (id: string) => setPostPreviewId(id)
  const closePostPreview = () => setPostPreviewId(null)
  const openProductEdit = (id: string) => {
    const p = products.find((x) => x.id === id)
    if (p) {
      setProductEditId(id)
      setProductDraft({ name: p.name, price: String(p.price), introduction: p.introduction })
    }
  }
  const savePost = () => {
    if (postEditId) {
      setPosts((prev) => prev.map((p) => (p.id === postEditId ? { ...p, title: postDraft.title, content: postDraft.content } : p)))
      setPostEditId(null)
    }
  }

  const saveProduct = () => {
    if (productEditId) {
      const price = Number(productDraft.price) || 0
      setProducts((prev) => prev.map((p) => (p.id === productEditId ? { ...p, name: productDraft.name, price, introduction: productDraft.introduction } : p)))
      setProductEditId(null)
    }
  }

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
            {posts.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{p.title}</span>
                  <span className={styles.itemMeta}>{p.date} · 閲覧 {p.views}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" className={styles.smallBtn} onClick={() => openPostPreview(p.id)}>プレビュー</button>
                  <button type="button" className={styles.smallBtn} onClick={() => openPostEdit(p.id)}>編集</button>
                  <button type="button" className={styles.smallBtnDanger}>削除</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {postPreviewId && (() => {
        const p = posts.find((x) => x.id === postPreviewId)
        if (!p) return null
        const lines = p.content.split('\n')
        const nodes: ReactNode[] = []
        let textBuf: string[] = []
        const flushText = () => {
          if (textBuf.length > 0) {
            nodes.push(
              <div key={nodes.length} className={styles.postParagraph}>
                {textBuf.map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < textBuf.length - 1 && <br />}
                  </span>
                ))}
              </div>
            )
            textBuf = []
          }
        }
        lines.forEach((line) => {
          const t = line.trim()
          if (isImageUrl(line)) {
            flushText()
            nodes.push(
              <div key={nodes.length} className={styles.postImageWrap}>
                <img src={t} alt="" className={styles.postImage} />
              </div>
            )
          } else if (isLinkUrl(line)) {
            flushText()
            nodes.push(
              <div key={nodes.length} className={styles.postLinkWrap}>
                <a href={t} target="_blank" rel="noopener noreferrer" className={styles.postLink}>
                  {t}
                </a>
              </div>
            )
          } else {
            if (t === '') flushText()
            else textBuf.push(line)
          }
        })
        flushText()
        return (
          <div className={styles.modalOverlay} onClick={closePostPreview}>
            <div className={[styles.modal, styles.postPreviewModal].join(' ')} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>{p.title}</h3>
                <button type="button" className={styles.modalClose} onClick={closePostPreview} aria-label="閉じる">×</button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.postBody}>{nodes}</div>
                <div className={styles.postPreviewMeta}>
                  {p.date} · 閲覧 {p.views} · コメント 20 · リアクション 78
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {tab === 'products' && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>商品一覧</h2>
          <ul className={styles.list}>
            {products.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <div>
                  <span className={styles.itemTitle}>{p.name}</span>
                  <span className={styles.itemMeta}>¥{p.price} · 販売 {p.sales}</span>
                </div>
                <div className={styles.itemActions}>
                  <button type="button" className={styles.smallBtn} onClick={() => openProductEdit(p.id)}>編集</button>
                  <button type="button" className={styles.smallBtnDanger}>販売停止</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {postEditId !== null && (
        <div className={styles.modalOverlay} onClick={() => setPostEditId(null)}>
          <div className={[styles.modal, styles.postEditModal].join(' ')} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>投稿を編集</h3>
              <button type="button" className={styles.modalClose} onClick={() => setPostEditId(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>タイトル</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={postDraft.title}
                  onChange={(e) => setPostDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>本文</label>
                <textarea
                  className={styles.modalTextarea}
                  value={postDraft.content}
                  onChange={(e) => setPostDraft((d) => ({ ...d, content: e.target.value }))}
                  rows={14}
                  placeholder="文字・改行はそのまま反映。画像は画像URLを1行で貼る（.png/.jpg等）。リンクはURLを1行で貼るとプレビューでリンク表示になります。"
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setPostEditId(null)}>キャンセル</button>
              <button type="button" className={styles.primaryBtn} onClick={savePost}>保存</button>
            </div>
          </div>
        </div>
      )}

      {productEditId !== null && (
        <div className={styles.modalOverlay} onClick={() => setProductEditId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>商品を編集</h3>
              <button type="button" className={styles.modalClose} onClick={() => setProductEditId(null)} aria-label="閉じる">×</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>商品名</label>
                <input
                  type="text"
                  className={styles.modalInput}
                  value={productDraft.name}
                  onChange={(e) => setProductDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>価格（円）</label>
                <input
                  type="number"
                  className={styles.modalInput}
                  min={0}
                  value={productDraft.price}
                  onChange={(e) => setProductDraft((d) => ({ ...d, price: e.target.value }))}
                />
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>紹介文</label>
                <textarea
                  className={styles.modalTextarea}
                  value={productDraft.introduction}
                  onChange={(e) => setProductDraft((d) => ({ ...d, introduction: e.target.value }))}
                  rows={4}
                  placeholder="商品の説明を入力..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setProductEditId(null)}>キャンセル</button>
              <button type="button" className={styles.primaryBtn} onClick={saveProduct}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
