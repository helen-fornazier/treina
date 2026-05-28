import { useState, useRef, useMemo, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Play, Pause, ChevronDown, Check } from 'lucide-react'
import { db } from '../db'
import type { ExerciseVideo } from '../types'

const SPEEDS = [1, 1.5, 2] as const

interface Option {
  id: string | undefined  // undefined = main exercise
  name: string
  video: ExerciseVideo | undefined
  comment: string | undefined
}

function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!blob) { setUrl(undefined); return }
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export default function ExercisePage() {
  const { id: workoutId, exerciseId: workoutExerciseId } = useParams<{ id: string; exerciseId: string }>()
  const navigate = useNavigate()

  const workout = useLiveQuery(() => workoutId ? db.workouts.get(workoutId) : undefined, [workoutId])
  const workoutExercise = workout?.exercises.find(e => e.id === workoutExerciseId)
  const exercise = useLiveQuery(
    () => workoutExercise?.exerciseId ? db.exercises.get(workoutExercise.exerciseId) : undefined,
    [workoutExercise?.exerciseId]
  )

  const [audioSpeed, setAudioSpeed] = useState<1 | 1.5 | 2>(1)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [commentOpen, setCommentOpen] = useState(false)
  const [alternativesOpen, setAlternativesOpen] = useState(false)
  const [notes, setNotes] = useState(workoutExercise?.userNotes ?? '')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const options = useMemo<Option[]>(() => {
    if (!exercise) return []
    return [
      { id: undefined, name: exercise.name, video: exercise.video, comment: exercise.comment },
      ...exercise.variants.map(v => ({ id: v.id, name: v.name, video: v.video, comment: v.comment })),
    ]
  }, [exercise])

  const selectedId = workoutExercise?.selectedVariantId
  const activeOption = options.find(o => o.id === selectedId) ?? options[0]

  // Stable blob URLs — only recreated when the actual blob changes
  const videoSrc = useBlobUrl(activeOption?.video?.blob)
  const audioSrc = useBlobUrl(exercise?.audio?.blob)

  function toggleAudio() {
    if (!audioRef.current) return
    if (audioPlaying) {
      audioRef.current.pause()
      setAudioPlaying(false)
    } else {
      audioRef.current.playbackRate = audioSpeed
      audioRef.current.play()
      setAudioPlaying(true)
    }
  }

  function cycleSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(audioSpeed) + 1) % SPEEDS.length]
    setAudioSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  async function saveNotes() {
    if (!workout || !workoutExerciseId) return
    const updated = workout.exercises.map(e =>
      e.id === workoutExerciseId ? { ...e, userNotes: notes } : e
    )
    await db.workouts.update(workout.id, { exercises: updated })
  }

  async function selectOption(optionId: string | undefined) {
    if (!workout || !workoutExerciseId) return
    const updated = workout.exercises.map(e =>
      e.id === workoutExerciseId ? { ...e, selectedVariantId: optionId } : e
    )
    await db.workouts.update(workout.id, { exercises: updated })
  }

  if (!exercise) return (
    <div className="flex flex-col min-h-svh bg-[#111111] items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#4BDF93] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const activeComment = workoutExercise?.comment ?? activeOption?.comment

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-3 sticky top-0 z-10 bg-[#111111]">
        <button type="button" onClick={() => navigate(-1)} className="text-[#4BDF93] p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-[#F0F0F0] truncate">
          {activeOption?.name ?? exercise.name}
        </h1>
      </header>

      {/* Video */}
      <VideoPlayer video={activeOption?.video} videoSrc={videoSrc} />

      <div className="flex flex-col gap-4 px-4 mt-4">
        {/* Stats */}
        {(workoutExercise?.reps || workoutExercise?.restSeconds) && (
          <div className="flex gap-4">
            {workoutExercise.reps && (
              <div className="bg-[#1C1C1C] rounded-xl px-4 py-3 flex-1 text-center border border-[#2A2A2A]">
                <p className="text-lg font-bold text-[#F0F0F0]">{workoutExercise.reps}</p>
                <p className="text-xs text-[#888888]">repetições</p>
              </div>
            )}
            {workoutExercise.restSeconds && (
              <div className="bg-[#1C1C1C] rounded-xl px-4 py-3 flex-1 text-center border border-[#2A2A2A]">
                <p className="text-lg font-bold text-[#F0F0F0]">{workoutExercise.restSeconds}s</p>
                <p className="text-xs text-[#888888]">descanso</p>
              </div>
            )}
          </div>
        )}

        {/* Audio player */}
        {exercise.audio && (
          <div className="bg-[#1C1C1C] rounded-2xl p-4 border border-[#2A2A2A] flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAudio}
              className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center flex-shrink-0"
            >
              {audioPlaying ? <Pause size={18} className="text-[#4BDF93]" /> : <Play size={18} className="text-[#4BDF93] ml-0.5" />}
            </button>
            <div className="flex-1">
              <p className="text-xs text-[#888888]">Áudio do professor</p>
              <div className="h-1 bg-[#252525] rounded-full mt-1.5 w-full" />
            </div>
            <button
              type="button"
              onClick={cycleSpeed}
              className="text-xs text-[#888888] border border-[#2A2A2A] rounded-lg px-2 py-1 font-mono"
            >
              {audioSpeed}x
            </button>
            <audio ref={audioRef} src={audioSrc} onEnded={() => setAudioPlaying(false)} className="hidden" />
          </div>
        )}

        {/* Professor comment */}
        {activeComment && (
          <div className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <button
              type="button"
              onPointerDown={e => e.preventDefault()}
              onClick={() => setCommentOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-3 w-full text-sm text-[#888888]"
            >
              <ChevronDown size={14} className={`transition-transform ${commentOpen ? '' : '-rotate-90'}`} />
              Comentário do professor
            </button>
            {commentOpen && (
              <p className="px-4 pb-4 text-sm text-[#F0F0F0]">{activeComment}</p>
            )}
          </div>
        )}

        {/* User notes */}
        <div>
          <p className="text-xs text-[#888888] mb-2">Suas anotações</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Adicione anotações sobre este exercício..."
            rows={3}
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl p-3 text-sm border border-[#2A2A2A] resize-none focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        {/* Alternatives (includes main) */}
        {options.length > 1 && (
          <div className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <button
              type="button"
              onPointerDown={e => e.preventDefault()}
              onClick={() => setAlternativesOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-3 w-full text-sm text-[#888888]"
            >
              <ChevronDown size={14} className={`transition-transform ${alternativesOpen ? '' : '-rotate-90'}`} />
              Exercícios ({options.length})
            </button>
            {alternativesOpen && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {options.map(opt => (
                  <OptionItem
                    key={opt.id ?? 'main'}
                    option={opt}
                    isActive={opt.id === selectedId || (opt.id === undefined && selectedId === undefined)}
                    onSelect={() => selectOption(opt.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface VideoPlayerProps {
  video: ExerciseVideo | undefined
  videoSrc: string | undefined
}

function VideoPlayer({ video, videoSrc }: VideoPlayerProps) {
  if (!video) {
    return (
      <div className="w-full flex items-center justify-center text-[#555555]" style={{ height: '30svh' }}>
        <div className="flex flex-col items-center gap-2">
          <Play size={40} />
          <span className="text-xs">Sem vídeo</span>
        </div>
      </div>
    )
  }

  const isYouTube = video.url?.includes('youtube.com/embed')
  const tapUrl = videoSrc ?? video.url

  if (isYouTube) {
    return (
      <div className="relative w-full bg-[#000]" style={{ aspectRatio: '16/9', maxHeight: '50svh' }}>
        <iframe
          src={video.url}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
        <a href={video.url} target="_blank" rel="noopener" className="absolute inset-0" aria-label="Abrir vídeo" />
      </div>
    )
  }

  const src = videoSrc ?? video.url
  return (
    <a href={tapUrl} target="_blank" rel="noopener" className="block w-full bg-[#000]">
      <video src={src} autoPlay loop playsInline muted className="w-full object-contain" style={{ maxHeight: '50svh' }} />
    </a>
  )
}

function OptionItem({ option, isActive, onSelect }: { option: Option; isActive: boolean; onSelect: () => void }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-3 border ${isActive ? 'bg-[#4BDF93]/10 border-[#4BDF93]/30' : 'bg-[#252525] border-transparent'}`}>
      {option.video?.thumbnail ? (
        <img src={option.video.thumbnail} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-[#333333] flex items-center justify-center flex-shrink-0">
          <Play size={18} className="text-[#555555]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F0F0F0] truncate">{option.name}</p>
        {option.comment && <p className="text-xs text-[#888888] line-clamp-1">{option.comment}</p>}
        {isActive && <span className="text-xs text-[#4BDF93] font-medium">Em uso</span>}
      </div>
      {!isActive && (
        <button
          type="button"
          onClick={onSelect}
          className="flex items-center gap-1 text-xs text-[#4BDF93] border border-[#4BDF93]/30 rounded-lg px-2 py-1 flex-shrink-0"
        >
          <Check size={11} />
          Usar
        </button>
      )}
    </div>
  )
}
