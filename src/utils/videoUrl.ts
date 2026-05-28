export type VideoUrlType = 'youtube' | 'instagram' | 'direct'

export function detectVideoUrl(url: string): VideoUrlType | null {
  try {
    const u = new URL(url)
    if (!['http:', 'https:'].includes(u.protocol)) return null
    if (u.hostname === 'youtu.be' || u.hostname.includes('youtube.com')) return 'youtube'
    if (u.hostname.includes('instagram.com')) return 'instagram'
    return 'direct'
  } catch {
    return null
  }
}

export function youTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
      return u.searchParams.get('v')
    }
  } catch { /* ignore */ }
  return null
}

export function youTubeEmbedUrl(id: string): string {
  const p = new URLSearchParams({
    autoplay: '1', mute: '1', loop: '1',
    playlist: id, controls: '0', playsinline: '1',
  })
  return `https://www.youtube.com/embed/${id}?${p}`
}

export function youTubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}
