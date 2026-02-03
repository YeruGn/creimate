import styles from './CreatorAnalyticsPage.module.css'

export default function CreatorAnalyticsPage() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>データセンター</h1>
      <p className={styles.desc}>
        AIが過去の投稿データ・商品売上・購読・チャット内容などを分析し、今後のコンテンツ戦略を提案します（チャットでよく出るキーワード、ユーザーが最も購入するコンテンツタイプなど）。
      </p>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>今週の収益</h3>
          <div className={styles.bigNum}>¥12,800</div>
          <p className={styles.hint}>前週比 +8%</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>AI分身 会話数</h3>
          <div className={styles.bigNum}>342</div>
          <p className={styles.hint}>前週比 +12%</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>トークン消費</h3>
          <div className={styles.bigNum}>2,840</div>
          <p className={styles.hint}>テキスト 2,100 / 音声 740</p>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>AI 戦略提案</h2>
        <p className={styles.desc}>
          チャット内容・投稿閲覧・商品購入などのデータから生成しています。
        </p>
        <ul className={styles.list}>
          <li>「〇〇」に関する質問が今週多く、関連コンテンツの追加を推奨します。</li>
          <li>Lv.3〜5の好感度ユーザーが増加しています。中級向け報酬の追加で継続率向上が期待できます。</li>
          <li>金曜夜〜土曜のアクセスが突出しています。この時間帯の投稿を増やすと効果的です。</li>
          <li>チャットで最も頻出のキーワード：〇〇、△△。これらをテーマにしたコンテンツが人気です。</li>
          <li>購入最多のコンテンツタイプ：写真セット。同タイプの商品追加を検討してください。</li>
        </ul>
        <p className={styles.hint}>
          右側のAIアシスタントで「今週の収益を分析して」「チャットのキーワードを教えて」などと指示すると、さらに詳しく確認できます。
        </p>
      </div>
    </div>
  )
}
