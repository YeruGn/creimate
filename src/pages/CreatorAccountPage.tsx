import styles from './CreatorAccountPage.module.css'

export default function CreatorAccountPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>アカウント</h1>
      <p className={styles.desc}>
        アカウント情報・セキュリティ・Fantia連携などです。
      </p>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>アカウント情報</h2>
        <label className={styles.label}>
          表示名
          <input type="text" className={styles.input} placeholder="クリエイター名" />
        </label>
        <label className={styles.label}>
          アバター画像
          <input type="file" accept="image/*" className={styles.input} />
        </label>
      </section>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Fantia 連携</h2>
        <p className={styles.hint}>
          Fantiaアカウントと連携すると、コンテンツ管理・メッセージなどがFantiaのデータと同期されます。
        </p>
        <button type="button" className={styles.primaryBtn}>Fantiaと連携</button>
      </section>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn}>保存</button>
      </div>
    </div>
  )
}
