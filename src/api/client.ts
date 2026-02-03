const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function getCreator() {
  const res = await fetch(`${API_URL}/api/creator`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateCreator(data: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/creator`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function uploadAvatarBase64(dataUrl: string): Promise<{ url: string }> {
  const res = await fetch(`${API_URL}/api/upload/avatar-base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export function getApiUrl() {
  return API_URL
}
