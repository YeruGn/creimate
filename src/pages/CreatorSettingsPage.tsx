import styles from './CreatorSettingsPage.module.css'

export default function CreatorSettingsPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>設定</h1>
      <p className={styles.desc}>
        通知・言語・プライバシーなどの共通設定です。
      </p>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>共通</h2>
        <label className={styles.label}>
          言語
          <select className={styles.input} style={{ maxWidth: 200 }}>
            <option>日本語</option>
            <option>English</option>
          </select>
        </label>
        <label className={styles.checkLabel} style={{ marginTop: 16 }}>
          <input type="checkbox" defaultChecked />
          メール通知を受け取る
        </label>
      </section>
      <div className={styles.actions}>
        <button type="button" className={styles.primaryBtn}>保存</button>
      </div>
    </div>
  )
}
