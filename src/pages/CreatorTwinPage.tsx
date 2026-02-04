import { useState, useEffect } from 'react'
import AvatarCropModal from '../components/AvatarCropModal/AvatarCropModal'
import { getCreator, updateCreator, uploadAvatarBase64 } from '../api/client'
import styles from './CreatorTwinPage.module.css'

interface CatchphraseTag {
  id: string
  text: string
  editing: boolean
}

const CHAT_STYLE_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'casual', label: 'カジュアル・気軽' },
  { value: 'sweet', label: '甘い・可愛い' },
  { value: 'cool', label: 'クール・大人' },
  { value: 'mature', label: '落ち着いた・大人女性' },
  { value: 'genki', label: '元気・明るい' },
  { value: 'ottori', label: 'おっとり・優しい' },
  { value: 'tsundere', label: 'ツンデレ' },
  { value: 'onee', label: 'お姉さん系' },
  { value: 'shy', label: '恥ずかしがり・控えめ' },
  { value: 'tease', label: 'からかう・ちょっと意地悪' },
]

export default function CreatorTwinPage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)
  const [cropModalImageUrl, setCropModalImageUrl] = useState<string | null>(null)
  const [useAccountAvatar, setUseAccountAvatar] = useState(false)
  const [chatText, setChatText] = useState('')
  const [chatImageFile, setChatImageFile] = useState<File | null>(null)
  const [catchphrases, setCatchphrases] = useState<CatchphraseTag[]>([])
  const [newCatchphrase, setNewCatchphrase] = useState('')
  const [chatStyle, setChatStyle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getCreator()
      .then((data) => {
        if (cancelled) return
        if (data.use_account_avatar) setUseAccountAvatar(true)
        if (data.twin_avatar_url && !data.use_account_avatar) setAvatarDataUrl(data.twin_avatar_url)
        if (data.chat_reference_text) setChatText(data.chat_reference_text)
        if (data.chat_style) setChatStyle(data.chat_style)
        if (Array.isArray(data.catchphrases) && data.catchphrases.length > 0) {
          setCatchphrases(
            data.catchphrases.map((t: string) => ({
              id: String(Math.random()),
              text: t,
              editing: false,
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      let twinAvatarUrl: string | undefined
      if (useAccountAvatar) {
        twinAvatarUrl = undefined
        await updateCreator({
          use_account_avatar: true,
          twin_avatar_url: null,
          chat_reference_text: chatText,
          chat_style: chatStyle,
          catchphrases: catchphrases.map((c) => c.text),
        })
      } else {
        if (avatarDataUrl && avatarDataUrl.startsWith('data:')) {
          const { url } = await uploadAvatarBase64(avatarDataUrl)
          twinAvatarUrl = url
        } else if (avatarDataUrl) {
          twinAvatarUrl = avatarDataUrl
        }
        const res = await updateCreator({
          use_account_avatar: false,
          twin_avatar_url: twinAvatarUrl ?? undefined,
          chat_reference_text: chatText,
          chat_style: chatStyle,
          catchphrases: catchphrases.map((c) => c.text),
        })
        if (res.twin_avatar_url) setAvatarDataUrl(res.twin_avatar_url)
      }
      window.dispatchEvent(new CustomEvent('creator-updated'))
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const addCatchphrase = () => {
    if (!newCatchphrase.trim()) return
    setCatchphrases((prev) => [
      ...prev,
      { id: String(Date.now()), text: newCatchphrase.trim(), editing: false },
    ])
    setNewCatchphrase('')
  }

  const updateCatchphrase = (id: string, text: string) => {
    setCatchphrases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text } : c))
    )
  }

  const removeCatchphrase = (id: string) => {
    setCatchphrases((prev) => prev.filter((c) => c.id !== id))
  }

  const setEditing = (id: string, editing: boolean) => {
    setCatchphrases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, editing } : c))
    )
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>AI対話分身管理</h1>
      <p className={styles.desc}>
        ファンに届くあなたらしさを、アバター・話し方・声で集約します。できるだけ情報を登録すると、AI分身があなた本人に近い印象でファンと会話できます。
      </p>

      {/* ① チャット時のアバター */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>① ファンとのチャット時に表示するアバター</h2>
        <p className={styles.hint}>
          対話分身がファンとチャットするときのアイコン画像です。アップロードした画像がそのまま表示されます。
        </p>
        <div className={styles.avatarRow}>
          <button
            type="button"
            className={[styles.useAccountAvatarBtn, useAccountAvatar ? styles.useAccountAvatarBtnActive : ''].join(' ')}
            onClick={() => {
              setUseAccountAvatar(true)
              setAvatarFile(null)
              setAvatarDataUrl(null)
            }}
          >
            アカウントと同じアバターを使う
          </button>
          <label className={styles.uploadBox}>
            <span className={styles.uploadLabel}>新しいアバターをアップロード</span>
            <input
              type="file"
              accept="image/*"
              className={styles.uploadInput}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUseAccountAvatar(false)
                const reader = new FileReader()
                reader.onload = () => {
                  setCropModalImageUrl(reader.result as string)
                }
                reader.readAsDataURL(file)
                e.target.value = ''
              }}
            />
            {avatarDataUrl ? (
              <div className={styles.avatarPreviewWrap}>
                <img src={avatarDataUrl} alt="" className={styles.avatarPreview} />
                <span className={styles.avatarPreviewLabel}>切り取り済み</span>
              </div>
            ) : (
              <span className={styles.uploadBoxText}>
                {avatarFile ? avatarFile.name : 'クリックしてアップロード'}
              </span>
            )}
          </label>
        </div>
      </section>

      {cropModalImageUrl && (
        <AvatarCropModal
          imageUrl={cropModalImageUrl}
          onConfirm={(dataUrl) => {
            setAvatarDataUrl(dataUrl)
            setAvatarFile(null)
            setCropModalImageUrl(null)
          }}
          onCancel={() => setCropModalImageUrl(null)}
        />
      )}

      {/* ② チャットスタイル */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>② チャットの話し方・スタイル</h2>
        <p className={styles.hint}>
          AI分身がファンに返信するときの参考にします。過去のチャットをテキストで貼り付けるか、チャット記録の画像をアップロードしてください。口癖と話し方スタイルも設定できます。
        </p>
        <label className={styles.label}>
          チャット内容（テキストで貼り付け）
          <textarea
            className={styles.textarea}
            placeholder="過去のチャット内容をここに貼り付けてください。会話の流れや言い回しが参考になります。"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            rows={4}
          />
        </label>
        <label className={styles.label}>
          または：チャット記録の画像をアップロード
          <div className={styles.uploadRow}>
            <label className={styles.uploadBoxSmall}>
              <input
                type="file"
                accept="image/*"
                className={styles.uploadInput}
                onChange={(e) => setChatImageFile(e.target.files?.[0] ?? null)}
              />
              {chatImageFile ? chatImageFile.name : '画像を選択'}
            </label>
          </div>
        </label>
        <label className={styles.label}>
          口癖・よく使うフレーズ（追加すると下にタグで表示されます。各タグを編集・削除できます）
          <div className={styles.catchphraseRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="例：〜だよ♡、ありがとう〜"
              value={newCatchphrase}
              onChange={(e) => setNewCatchphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCatchphrase())}
            />
            <button type="button" className={styles.addTagBtn} onClick={addCatchphrase}>
              追加
            </button>
          </div>
          <div className={styles.tagList}>
            {catchphrases.map((c) => (
              <div key={c.id} className={styles.tag}>
                {c.editing ? (
                  <>
                    <input
                      type="text"
                      className={styles.tagInput}
                      value={c.text}
                      onChange={(e) => updateCatchphrase(c.id, e.target.value)}
                      onBlur={() => setEditing(c.id, false)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditing(c.id, false)}
                      autoFocus
                    />
                    <button type="button" className={styles.tagBtn} onClick={() => setEditing(c.id, false)}>
                      確定
                    </button>
                  </>
                ) : (
                  <>
                    <span className={styles.tagText} onClick={() => setEditing(c.id, true)}>
                      {c.text}
                    </span>
                    <button type="button" className={styles.tagDel} onClick={() => removeCatchphrase(c.id)} aria-label="削除">
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </label>
        <label className={styles.label}>
          話し方スタイル
          <select
            className={styles.select}
            value={chatStyle}
            onChange={(e) => setChatStyle(e.target.value)}
          >
            {CHAT_STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className={styles.actions}>
        {saveError && <p className={styles.saveError}>{saveError}</p>}
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}
