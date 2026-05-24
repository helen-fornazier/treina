import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Play, Pause, ChevronDown, RefreshCw } from 'lucide-react'
import { db } from '../db'
import type { ExerciseVariant } from '../types'
import Button from '../components/ui/Button'
import BottomSheet from '../components/ui/BottomSheet'

const SPEEDS = [1, 1.5, 2] as const

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
  const [commentOpen, setCommentOpen] = useState(true)
  const [alternativesOpen, setAlternativesOpen] = useState(false)
  const [swapSheet, setSwapSheet] = useState(false)
  const [notes, setNotes] = useState(workoutExercise?.userNotes ?? '')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const selectedVariant = workoutExercise?.selectedVariantId
    ? exercise?.variants.find(v => v.id === workoutExercise.selectedVariantId)
    : null
  const activeVideo = selectedVariant?.video ?? exercise?.video

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

  async function swapVariant(variantId: string | undefined) {
    if (!workout || !workoutExerciseId) return
    const updated = workout.exercises.map(e =>
      e.id === workoutExerciseId ? { ...e, selectedVariantId: variantId } : e
    )
    await db.workouts.update(workout.id, { exercises: updated })
    setSwapSheet(false)
  }

  if (!exercise) return null

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-3 sticky top-0 z-10 bg-[#111111]">
        <button onClick={() => navigate(-1)} className="text-[#4BDF93] p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-lg font-semibold text-[#F0F0F0] truncate">
          {exercise.name}
          {selectedVariant && <span className="text-[#888888] font-normal"> · {selectedVariant.name}</span>}
        </h1>
      </header>

      {/* Video */}
      <div className="w-full aspect-video bg-[#000] relative">
        {activeVideo?.blob ? (
          <video
            ref={videoRef}
            src={URL.createObjectURL(activeVideo.blob)}
            autoPlay
            loop
            playsInline
            muted
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#888888]">
            <Play size={48} />
          </div>
        )}
      </div>

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
              onClick={cycleSpeed}
              className="text-xs text-[#888888] border border-[#2A2A2A] rounded-lg px-2 py-1 font-mono"
            >
              {audioSpeed}x
            </button>
          </div>
        )}

        {/* Professor comment */}
        {(exercise.comment || workoutExercise?.comment) && (
          <div className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <button
              onClick={() => setCommentOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-3 w-full text-sm text-[#888888]"
            >
              <ChevronDown size={14} className={`transition-transform ${commentOpen ? '' : '-rotate-90'}`} />
              Comentário do professor
            </button>
            {commentOpen && (
              <p className="px-4 pb-4 text-sm text-[#F0F0F0]">
                {workoutExercise?.comment ?? exercise.comment}
              </p>
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

        {/* Alternatives */}
        {exercise.variants.length > 0 && (
          <div className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] overflow-hidden">
            <button
              onClick={() => setAlternativesOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-3 w-full text-sm text-[#888888]"
            >
              <ChevronDown size={14} className={`transition-transform ${alternativesOpen ? '' : '-rotate-90'}`} />
              Exercícios alternativos ({exercise.variants.length})
            </button>
            {alternativesOpen && (
              <div className="px-4 pb-4 flex flex-col gap-2">
                {exercise.variants.map(v => (
                  <AlternativeItem
                    key={v.id}
                    variant={v}
                    isSelected={workoutExercise?.selectedVariantId === v.id}
                    onSwap={() => setSwapSheet(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Swap confirmation sheet */}
      <BottomSheet open={swapSheet} onClose={() => setSwapSheet(false)} title="Trocar exercício">
        <div className="px-4 py-4 flex flex-col gap-3">
          <p className="text-sm text-[#888888]">
            Trocar temporariamente para este exercício nesta sessão?
          </p>
          {exercise.variants.map(v => (
            <button
              key={v.id}
              onClick={() => swapVariant(v.id)}
              className="flex items-center gap-3 bg-[#252525] rounded-xl p-3 text-left"
            >
              {v.video?.thumbnail && (
                <img src={v.video.thumbnail} className="w-14 h-14 rounded-lg object-cover" />
              )}
              <span className="text-sm text-[#F0F0F0]">{v.name}</span>
            </button>
          ))}
          {workoutExercise?.selectedVariantId && (
            <Button variant="ghost" fullWidth onClick={() => swapVariant(undefined)}>
              Voltar ao exercício principal
            </Button>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}

function AlternativeItem({ variant, isSelected, onSwap }: { variant: ExerciseVariant; isSelected: boolean; onSwap: () => void }) {
  return (
    <div className="flex items-center gap-3 bg-[#252525] rounded-xl p-3">
      {variant.video?.thumbnail && (
        <img src={variant.video.thumbnail} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F0F0F0] truncate">{variant.name}</p>
        {variant.comment && <p className="text-xs text-[#888888]">{variant.comment}</p>}
        {isSelected && <span className="text-xs text-[#4BDF93]">Em uso</span>}
      </div>
      <button
        onClick={onSwap}
        className="flex items-center gap-1 text-xs text-[#FF0D5F] border border-[#FF0D5F]/30 rounded-lg px-2 py-1"
      >
        <RefreshCw size={11} />
        Trocar
      </button>
    </div>
  )
}
