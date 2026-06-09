import { db } from '../db'
import type { Exercise, Workout } from '../types'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function serializeExercise(ex: Exercise): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = { ...ex }
  if (ex.video?.blob) {
    result.video = { thumbnail: ex.video.thumbnail, duration: ex.video.duration, isHD: ex.video.isHD, data: await blobToBase64(ex.video.blob) }
  } else {
    result.video = ex.video ? { url: ex.video.url, thumbnail: ex.video.thumbnail, duration: ex.video.duration, isHD: ex.video.isHD } : undefined
  }
  if (ex.audio?.blob) {
    result.audio = { duration: ex.audio.duration, data: await blobToBase64(ex.audio.blob) }
  } else {
    result.audio = undefined
  }
  result.variants = await Promise.all(ex.variants.map(async v => {
    if (!v.video?.blob) return { ...v, video: v.video ? { url: v.video.url, thumbnail: v.video.thumbnail, duration: v.video.duration, isHD: v.video.isHD } : undefined }
    return { ...v, video: { thumbnail: v.video.thumbnail, duration: v.video.duration, isHD: v.video.isHD, data: await blobToBase64(v.video.blob) } }
  }))
  return result
}

// Build the File object (async, heavy) — call this before triggering share/download
export async function buildWorkoutsFile(workouts: Workout[]): Promise<File> {
  const exerciseIds = [...new Set(workouts.flatMap(w => w.exercises.map(e => e.exerciseId)))]
  const rawExercises = await Promise.all(exerciseIds.map(id => db.exercises.get(id)))
  const serialized = await Promise.all(rawExercises.filter(Boolean).map(ex => serializeExercise(ex!)))
  const payload = { version: 1, exported_at: new Date().toISOString(), workouts, exercise_library: serialized }
  const filename = workouts.length === 1
    ? `${workouts[0].name.replace(/\s+/g, '_')}.treino`
    : `treinos_${new Date().toISOString().slice(0, 10)}.treino`
  return new File([JSON.stringify(payload, null, 2)], filename, { type: 'application/x-treino' })
}

export async function buildExercisesFile(exercises: Exercise[]): Promise<File> {
  const serialized = await Promise.all(exercises.map(serializeExercise))
  const payload = { version: 1, exported_at: new Date().toISOString(), workouts: [], exercise_library: serialized }
  const filename = exercises.length === 1
    ? `${exercises[0].name.replace(/\s+/g, '_')}.treino`
    : `exercicios_${new Date().toISOString().slice(0, 10)}.treino`
  return new File([JSON.stringify(payload, null, 2)], filename, { type: 'application/x-treino' })
}

// Share or download — call this directly from a user gesture (button click) with a pre-built File
export async function shareOrDownload(file: File): Promise<void> {
  if (navigator.share && navigator.canShare?.({ files: [file] }) !== false) {
    try {
      await navigator.share({ files: [file], title: file.name })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      // NotAllowedError or other — fall through to download
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
