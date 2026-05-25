import { db } from '../db'
import type { Workout } from '../types'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function exportWorkouts(workouts: Workout[]): Promise<void> {
  const exerciseIds = [...new Set(workouts.flatMap(w => w.exercises.map(e => e.exerciseId)))]
  const rawExercises = await Promise.all(exerciseIds.map(id => db.exercises.get(id)))
  const found = rawExercises.filter(Boolean)

  const serialized = await Promise.all(found.map(async ex => {
    if (!ex) return ex
    const result: Record<string, unknown> = { ...ex }
    if (ex.video?.blob) {
      result.video = { thumbnail: ex.video.thumbnail, duration: ex.video.duration, isHD: ex.video.isHD, data: await blobToBase64(ex.video.blob) }
    } else {
      result.video = ex.video ? { thumbnail: ex.video.thumbnail, duration: ex.video.duration, isHD: ex.video.isHD } : undefined
    }
    if (ex.audio?.blob) {
      result.audio = { duration: ex.audio.duration, data: await blobToBase64(ex.audio.blob) }
    } else {
      result.audio = undefined
    }
    result.variants = await Promise.all(ex.variants.map(async v => {
      if (!v.video?.blob) return { ...v, video: v.video ? { thumbnail: v.video.thumbnail, duration: v.video.duration, isHD: v.video.isHD } : undefined }
      return { ...v, video: { thumbnail: v.video.thumbnail, duration: v.video.duration, isHD: v.video.isHD, data: await blobToBase64(v.video.blob) } }
    }))
    return result
  }))

  const payload = { version: 1, exported_at: new Date().toISOString(), workouts, exercise_library: serialized }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/x-treino' })
  const filename = workouts.length === 1
    ? `${workouts[0].name.replace(/\s+/g, '_')}.treino`
    : `treinos_${new Date().toISOString().slice(0, 10)}.treino`

  if (navigator.share) {
    // Use text/plain — Chrome's Web Share API allowlist rejects application/octet-stream
    const shareFile = new File([blob], filename, { type: 'text/plain' })
    if (navigator.canShare?.({ files: [shareFile] }) !== false) {
      try {
        await navigator.share({ files: [shareFile], title: filename })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        // Other errors: fall through to download
      }
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
