import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, ChevronDown, ChevronRight, MoreVertical,
  Play, CheckCircle2, Circle, Timer, Copy, Pencil, Trash2, ToggleLeft, ToggleRight, Download
} from 'lucide-react'
import { db } from '../db'
import VideoThumbnail from '../components/ui/VideoThumbnail'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import { uuid } from '../utils/uuid'

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const workout = useLiveQuery(() => id ? db.workouts.get(id) : undefined, [id])
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])

  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [sessionStarted, setSessionStarted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [commentOpen, setCommentOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [restTimer, setRestTimer] = useState<{ exerciseId: string; seconds: number; running: boolean } | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (id && !sessionStarted) {
      setSessionStarted(true)
      setStartTime(new Date())
    }
  }, [id])

  useEffect(() => {
    if (restTimer?.running) {
      timerRef.current = setInterval(() => {
        setRestTimer(prev => {
          if (!prev) return null
          if (prev.seconds <= 1) {
            clearInterval(timerRef.current!)
            playAlarm()
            return { ...prev, seconds: 0, running: false }
          }
          return { ...prev, seconds: prev.seconds - 1 }
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [restTimer?.running])

  function playAlarm() {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2)
    osc.start()
    osc.stop(ctx.currentTime + 2)
  }

  function toggleCheck(exId: string) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(exId)) next.delete(exId)
      else next.add(exId)
      return next
    })
  }

  function startRestTimer(exerciseId: string, seconds: number) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer({ exerciseId, seconds, running: true })
  }

  async function handleFinish(editedStart: Date, editedEnd: Date) {
    const duration = Math.round((editedEnd.getTime() - editedStart.getTime()) / 60000)
    const allIds = workout?.exercises.map(e => e.id) ?? []
    const completedIds = allIds.filter(id => checked.has(id))
    const isComplete = completedIds.length === allIds.length

    await db.sessions.add({
      id: uuid(),
      workoutId: workout!.id,
      startedAt: editedStart.getTime(),
      finishedAt: editedEnd.getTime(),
      duration,
      completedExerciseIds: completedIds,
      isComplete,
    })

    navigate('/')
  }

  async function handleDelete() {
    if (!workout) return
    await db.workouts.delete(workout.id)
    navigate('/')
  }

  async function handleToggleActive() {
    if (!workout) return
    await db.workouts.update(workout.id, { isActive: !workout.isActive })
    setMenuOpen(false)
  }

  async function handleClone() {
    if (!workout) return
    const cloned = {
      ...workout,
      id: uuid(),
      name: `${workout.name} (cópia)`,
      readonly: false,
      importedAt: undefined,
      originalId: workout.id,
      createdAt: Date.now(),
      isActive: false,
    }
    await db.workouts.add(cloned)
    navigate(`/workout/${cloned.id}/edit`)
  }

  if (!workout) return null

  const pending = workout.exercises.filter(e => !checked.has(e.id))
  const done = workout.exercises.filter(e => checked.has(e.id))
  const allDone = done.length === workout.exercises.length && workout.exercises.length > 0

  function getExercise(id: string) {
    return exercises?.find(e => e.id === id)
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-12 pb-4 sticky top-0 z-10 bg-[#111111]">
        <button onClick={() => navigate(-1)} className="text-[#4BDF93] p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[#F0F0F0] truncate">{workout.name}</h1>
          <p className="text-xs text-[#888888]">{workout.author}</p>
        </div>
        <button onClick={() => setMenuOpen(true)} className="p-2 text-[#888888]">
          <MoreVertical size={20} />
        </button>
      </header>

      {/* Professor comment (collapsible) */}
      {workout.comment && (
        <div className="mx-4 mb-4">
          <button
            onClick={() => setCommentOpen(v => !v)}
            className="flex items-center gap-2 text-sm text-[#888888] w-full"
          >
            <ChevronDown size={14} className={`transition-transform ${commentOpen ? '' : '-rotate-90'}`} />
            Comentário do professor
          </button>
          {commentOpen && (
            <p className="mt-2 text-sm text-[#F0F0F0] bg-[#1C1C1C] rounded-xl p-3 border border-[#2A2A2A]">
              {workout.comment}
            </p>
          )}
        </div>
      )}

      {/* Exercise list */}
      <div className="flex flex-col gap-2 px-4">
        {/* Pending */}
        {pending.map(we => {
          const ex = getExercise(we.exerciseId)
          const variant = we.selectedVariantId
            ? ex?.variants.find(v => v.id === we.selectedVariantId)
            : null
          const thumbnail = variant?.video?.thumbnail ?? ex?.video?.thumbnail
          const isTimerActive = restTimer?.exerciseId === we.id

          return (
            <div key={we.id} className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] overflow-hidden">
              <button
                onClick={() => navigate(`/workout/${id}/exercise/${we.id}`)}
                className="flex items-center gap-3 p-3 w-full text-left active:opacity-80"
              >
                <VideoThumbnail thumbnail={thumbnail} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F0F0F0] truncate">
                    {ex?.name ?? 'Exercício'}
                  </p>
                  {we.reps && <p className="text-xs text-[#888888]">{we.reps}</p>}
                  {we.restSeconds && (
                    <p className="text-xs text-[#888888]">Descanso: {we.restSeconds}s</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-[#888888] flex-shrink-0" />
              </button>

              {/* Rest timer */}
              {we.restSeconds && (
                <div className="flex items-center gap-3 px-3 pb-3">
                  {isTimerActive && restTimer ? (
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full border-2 border-[#4BDF93] flex items-center justify-center">
                        <Timer size={14} className="text-[#4BDF93]" />
                      </div>
                      <span className="text-lg font-bold text-[#4BDF93] tabular-nums">
                        {String(Math.floor(restTimer.seconds / 60)).padStart(2, '0')}:
                        {String(restTimer.seconds % 60).padStart(2, '0')}
                      </span>
                      {!restTimer.running && restTimer.seconds > 0 && (
                        <button
                          onClick={() => setRestTimer(r => r ? { ...r, running: true } : null)}
                          className="ml-auto text-xs text-[#4BDF93]"
                        >
                          Retomar
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => startRestTimer(we.id, we.restSeconds!)}
                      className="flex items-center gap-2 text-xs text-[#888888] border border-[#2A2A2A] rounded-lg px-3 py-1.5"
                    >
                      <Play size={12} />
                      Descanso {we.restSeconds}s
                    </button>
                  )}

                  <button
                    onClick={() => toggleCheck(we.id)}
                    className="ml-auto"
                  >
                    <Circle size={24} className="text-[#888888]" />
                  </button>
                </div>
              )}

              {!we.restSeconds && (
                <div className="flex justify-end px-3 pb-3">
                  <button onClick={() => toggleCheck(we.id)}>
                    <Circle size={24} className="text-[#888888]" />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* Done section */}
        {done.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-[#888888] uppercase tracking-wider mb-2">Concluídos</p>
            {done.map(we => {
              const ex = getExercise(we.exerciseId)
              const thumbnail = ex?.video?.thumbnail
              return (
                <div key={we.id} className="flex items-center gap-3 p-3 bg-[#1C1C1C]/50 rounded-2xl border border-[#2A2A2A] mb-2 opacity-50">
                  <VideoThumbnail thumbnail={thumbnail} size="sm" className="grayscale" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#888888] truncate">{ex?.name}</p>
                    {we.reps && <p className="text-xs text-[#888888]">{we.reps}</p>}
                  </div>
                  <button onClick={() => toggleCheck(we.id)}>
                    <CheckCircle2 size={24} className="text-[#4BDF93]" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* All done banner */}
        {allDone && (
          <div className="bg-[#4BDF93]/10 border border-[#4BDF93]/30 rounded-2xl p-4 text-center mt-2">
            <p className="text-[#4BDF93] font-semibold text-base">Treino concluído! 🎉</p>
            <p className="text-xs text-[#888888] mt-1">
              Iniciado às {startTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-6 pt-3 bg-[#111111] border-t border-[#2A2A2A] z-10">
        <Button
          variant={allDone ? 'primary' : 'secondary'}
          fullWidth
          size="lg"
          onClick={() => setFinishOpen(true)}
        >
          {allDone ? 'Finalizar Treino ✓' : 'Finalizar Treino'}
        </Button>
      </div>

      {/* Menu Sheet */}
      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={workout.name}>
        <div className="flex flex-col py-2">
          {!workout.readonly && (
            <button
              onClick={() => { setMenuOpen(false); navigate(`/workout/${workout.id}/edit`) }}
              className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
            >
              <Pencil size={16} className="text-[#888888]" />
              Editar treino
            </button>
          )}
          <button
            onClick={handleToggleActive}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
          >
            {workout.isActive ? <ToggleRight size={16} className="text-[#4BDF93]" /> : <ToggleLeft size={16} className="text-[#888888]" />}
            {workout.isActive ? 'Marcar como inativo' : 'Marcar como ativo'}
          </button>
          {workout.readonly && (
            <button
              onClick={() => { setMenuOpen(false); handleClone() }}
              className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
            >
              <Copy size={16} className="text-[#888888]" />
              Clonar treino
            </button>
          )}
          <button
            onClick={() => { setMenuOpen(false); /* TODO: export */ }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
          >
            <Download size={16} className="text-[#888888]" />
            Exportar .treino
          </button>
          <button
            onClick={() => { setMenuOpen(false); handleDelete() }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#FF0D5F]"
          >
            <Trash2 size={16} />
            Deletar treino
          </button>
        </div>
      </BottomSheet>

      {/* Finish Session Sheet */}
      <FinishSheet
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        startTime={startTime ?? new Date()}
        onConfirm={handleFinish}
      />
    </div>
  )
}

interface FinishSheetProps {
  open: boolean
  onClose: () => void
  startTime: Date
  onConfirm: (start: Date, end: Date) => void
}

function FinishSheet({ open, onClose, startTime, onConfirm }: FinishSheetProps) {
  const now = new Date()
  const [start, setStart] = useState(toTimeString(startTime))
  const [end, setEnd] = useState(toTimeString(now))

  function toTimeString(d: Date) {
    return d.toTimeString().slice(0, 5)
  }

  function parseTime(timeStr: string, ref: Date) {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date(ref)
    d.setHours(h, m, 0, 0)
    return d
  }

  const startDate = parseTime(start, startTime)
  const endDate = parseTime(end, now)
  const diffMin = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000))

  return (
    <BottomSheet open={open} onClose={onClose} title="Finalizar treino">
      <div className="px-4 py-4 flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-[#888888] block mb-1">Início</label>
            <input
              type="time"
              value={start}
              onChange={e => setStart(e.target.value)}
              className="w-full bg-[#252525] text-[#F0F0F0] rounded-xl px-3 py-2.5 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93]"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#888888] block mb-1">Fim</label>
            <input
              type="time"
              value={end}
              onChange={e => setEnd(e.target.value)}
              className="w-full bg-[#252525] text-[#F0F0F0] rounded-xl px-3 py-2.5 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93]"
            />
          </div>
        </div>
        <p className="text-center text-[#888888] text-sm">
          Duração: <span className="text-[#4BDF93] font-semibold">{diffMin} min</span>
        </p>
        <Button fullWidth size="lg" onClick={() => onConfirm(startDate, endDate)}>
          Confirmar
        </Button>
      </div>
    </BottomSheet>
  )
}
