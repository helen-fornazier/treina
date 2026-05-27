import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, GripVertical, Trash2, ChevronRight, Search } from 'lucide-react'
import { db, getSettings } from '../db'
import type { WorkoutExercise } from '../types'
import { uuid } from '../utils/uuid'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import BottomSheet from '../components/ui/BottomSheet'
import VideoThumbnail from '../components/ui/VideoThumbnail'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const DRAFT_KEY = 'wk_draft'
const NEW_EX_KEY = 'wk_new_ex'

export default function CreateWorkoutPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const existingWorkout = useLiveQuery(() => id ? db.workouts.get(id) : undefined, [id])
  const allExercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])

  const [name, setName] = useState('')
  const [author, setAuthor] = useState('')
  const [comment, setComment] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [addExSheet, setAddExSheet] = useState(false)
  const [exSearch, setExSearch] = useState('')
  const didRestoreRef = useRef(false)

  useEffect(() => {
    getSettings().then(s => setAuthor(s.userName))
  }, [])

  // On mount: restore draft + auto-add newly created exercise (returning from CreateExercisePage)
  useEffect(() => {
    if (isEdit || didRestoreRef.current) return
    didRestoreRef.current = true
    const rawDraft = sessionStorage.getItem(DRAFT_KEY)
    const newExId = sessionStorage.getItem(NEW_EX_KEY)
    sessionStorage.removeItem(DRAFT_KEY)
    sessionStorage.removeItem(NEW_EX_KEY)
    if (!rawDraft) return
    try {
      const draft = JSON.parse(rawDraft) as { name: string; author: string; comment: string; exercises: WorkoutExercise[] }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(draft.name)
      setComment(draft.comment)
      const base = draft.exercises
      if (newExId) {
        const we: WorkoutExercise = { id: uuid(), exerciseId: newExId, reps: '', restSeconds: undefined, comment: '', order: base.length }
        setExercises([...base, we])
      } else {
        setExercises(base)
      }
      // Author: prefer draft if filled, otherwise will be set by settings effect
      if (draft.author) setAuthor(draft.author)
    } catch { /* ignore */ }
  }, [isEdit])

  useEffect(() => {
    if (existingWorkout) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(existingWorkout.name)
      setAuthor(existingWorkout.author)
      setComment(existingWorkout.comment ?? '')
      const base = existingWorkout.exercises
      const newExId = sessionStorage.getItem(NEW_EX_KEY)
      if (newExId) {
        sessionStorage.removeItem(NEW_EX_KEY)
        const we: WorkoutExercise = { id: uuid(), exerciseId: newExId, reps: '', restSeconds: undefined, comment: '', order: base.length }
        setExercises([...base, we])
      } else {
        setExercises(base)
      }
    }
  }, [existingWorkout])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = exercises.findIndex(e => e.id === active.id)
    const newIdx = exercises.findIndex(e => e.id === over.id)
    setExercises(arr => arrayMove(arr, oldIdx, newIdx).map((e, i) => ({ ...e, order: i })))
  }

  function addExercise(exerciseId: string) {
    const ex: WorkoutExercise = {
      id: uuid(),
      exerciseId,
      reps: '',
      restSeconds: undefined,
      comment: '',
      order: exercises.length,
    }
    setExercises(prev => [...prev, ex])
    setAddExSheet(false)
  }

  function updateExercise(id: string, patch: Partial<WorkoutExercise>) {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
  }

  function removeExercise(id: string) {
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  async function handleSave() {
    if (!name.trim()) return

    const workoutCount = await db.workouts.count()
    const payload = {
      name: name.trim(),
      author: author.trim(),
      comment: comment.trim(),
      exercises: exercises.map((e, i) => ({ ...e, order: i })),
      isActive: existingWorkout?.isActive ?? true,
      order: existingWorkout?.order ?? workoutCount,
      createdAt: existingWorkout?.createdAt ?? Date.now(),
    }

    if (isEdit && id) {
      await db.workouts.update(id, payload)
    } else {
      await db.workouts.add({ ...payload, id: uuid(), readonly: false })
    }
    navigate(-1)
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      <PageHeader title={isEdit ? 'Editar Treino' : 'Novo Treino'} />

      <div className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Nome do treino</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Treino A — Peito e Tríceps"
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        <div>
          <label className="text-xs text-[#888888] mb-1 block">Autor</label>
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="Seu nome"
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        <div>
          <label className="text-xs text-[#888888] mb-1 block">Comentário do professor (opcional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Instruções gerais para este treino..."
            rows={3}
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] resize-none focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        {/* Exercise list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#F0F0F0]">Exercícios</p>
            <button
              onClick={() => setAddExSheet(true)}
              className="flex items-center gap-1 text-sm text-[#4BDF93]"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={exercises.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-2">
                {exercises.map(we => (
                  <SortableExerciseItem
                    key={we.id}
                    we={we}
                    exercise={allExercises?.find(e => e.id === we.exerciseId)}
                    onChange={patch => updateExercise(we.id, patch)}
                    onRemove={() => removeExercise(we.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {exercises.length === 0 && (
            <div className="text-center py-8 text-sm text-[#888888]">
              Nenhum exercício adicionado
            </div>
          )}
        </div>
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-[#111111] border-t border-[#2A2A2A] z-10">
        <Button fullWidth size="lg" onClick={handleSave} disabled={!name.trim()}>
          {isEdit ? 'Salvar alterações' : 'Criar treino'}
        </Button>
      </div>

      {/* Add exercise sheet */}
      <BottomSheet open={addExSheet} onClose={() => { setAddExSheet(false); setExSearch('') }} title="Adicionar exercício">
        <div className="pb-4">
          {/* Create new */}
          <button
            onClick={() => {
              setAddExSheet(false)
              setExSearch('')
              sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, author, comment, exercises }))
              navigate('/exercise/new', { state: { fromWorkout: true } })
            }}
            className="flex items-center gap-3 px-4 py-3 w-full border-b border-[#2A2A2A]"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FF0D5F]/10 flex items-center justify-center">
              <Plus size={18} className="text-[#FF0D5F]" />
            </div>
            <span className="text-sm text-[#F0F0F0]">Criar novo exercício</span>
            <ChevronRight size={16} className="text-[#888888] ml-auto" />
          </button>

          {/* Search input */}
          <div className="px-4 py-3 border-b border-[#2A2A2A]">
            <div className="flex items-center gap-2 bg-[#252525] rounded-xl px-3 py-2 border border-[#2A2A2A]">
              <Search size={15} className="text-[#888888] flex-shrink-0" />
              <input
                value={exSearch}
                onChange={e => setExSearch(e.target.value)}
                placeholder="Buscar exercício..."
                className="flex-1 bg-transparent text-sm text-[#F0F0F0] placeholder-[#888888] focus:outline-none"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Exercise list */}
          {(() => {
            const q = exSearch.toLowerCase()
            const filtered = allExercises?.filter(ex => ex.name.toLowerCase().includes(q)) ?? []
            if (filtered.length === 0) return (
              <p className="text-center text-sm text-[#888888] py-8">Nenhum exercício encontrado</p>
            )
            return filtered.map(ex => (
              <button
                key={ex.id}
                onClick={() => { addExercise(ex.id); setExSearch('') }}
                className="flex items-center gap-3 px-4 py-3 w-full border-b border-[#2A2A2A] last:border-0"
              >
                <VideoThumbnail thumbnail={ex.video?.thumbnail} size="sm" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm text-[#F0F0F0]">{ex.name}</p>
                  {ex.variants.length > 0 && (
                    <p className="text-xs text-[#888888]">{ex.variants.length} alternativa(s)</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-[#888888]" />
              </button>
            ))
          })()}
        </div>
      </BottomSheet>
    </div>
  )
}

interface SortableItemProps {
  we: WorkoutExercise
  exercise: { name: string; video?: { thumbnail: string } } | undefined
  onChange: (patch: Partial<WorkoutExercise>) => void
  onRemove: () => void
}

function SortableExerciseItem({ we, exercise, onChange, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: we.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="bg-[#1C1C1C] rounded-2xl border border-[#2A2A2A] overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <button {...attributes} {...listeners} className="drag-handle text-[#888888] p-1" style={{ touchAction: 'none' }}>
          <GripVertical size={18} />
        </button>
        <VideoThumbnail thumbnail={exercise?.video?.thumbnail} size="sm" />
        <p className="flex-1 text-sm font-semibold text-[#F0F0F0] truncate">
          {exercise?.name ?? 'Exercício'}
        </p>
        <button onClick={onRemove} className="p-1 text-[#888888]">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2 px-3 pb-3">
        <div>
          <label className="text-xs text-[#888888] block mb-1">Repetições</label>
          <input
            value={we.reps ?? ''}
            onChange={e => onChange({ reps: e.target.value })}
            placeholder="Ex: 3x12"
            className="w-full bg-[#252525] text-[#F0F0F0] rounded-lg px-3 py-2 text-xs border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>
        <div>
          <label className="text-xs text-[#888888] block mb-1">Descanso (seg)</label>
          <input
            type="number"
            value={we.restSeconds ?? ''}
            onChange={e => onChange({ restSeconds: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="Ex: 60"
            className="w-full bg-[#252525] text-[#F0F0F0] rounded-lg px-3 py-2 text-xs border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-[#888888] block mb-1">Comentário do professor</label>
          <input
            value={we.comment ?? ''}
            onChange={e => onChange({ comment: e.target.value })}
            placeholder="Instruções específicas..."
            className="w-full bg-[#252525] text-[#F0F0F0] rounded-lg px-3 py-2 text-xs border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>
      </div>
    </div>
  )
}
