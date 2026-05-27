import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Copy, Download, Trash2 } from 'lucide-react'
import { db } from '../../db'
import { exportExercises } from '../../utils/export'
import { uuid } from '../../utils/uuid'
import type { Exercise } from '../../types'
import BottomSheet from '../ui/BottomSheet'
import Button from '../ui/Button'
import MenuButton from '../ui/MenuButton'

interface Props {
  exercise: Exercise
  open: boolean
  onClose: () => void
}

export default function ExerciseContextMenu({ exercise, open, onClose }: Props) {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [affectedWorkouts, setAffectedWorkouts] = useState<string[]>([])

  async function handleClone() {
    const cloned: Exercise = { ...exercise, id: uuid(), name: `${exercise.name} (cópia)` }
    await db.exercises.add(cloned)
    onClose()
    navigate(`/exercise/${cloned.id}/edit`)
  }

  async function handleExport() {
    onClose()
    await exportExercises([exercise])
  }

  async function handleDeletePress() {
    const all = await db.workouts.toArray()
    const affected = all
      .filter(w => w.exercises.some(e => e.exerciseId === exercise.id))
      .map(w => w.name)
    if (affected.length === 0) {
      onClose()
      await db.exercises.delete(exercise.id)
    } else {
      setAffectedWorkouts(affected)
      setConfirmOpen(true)
    }
  }

  async function handleConfirmDelete() {
    const all = await db.workouts.toArray()
    const affected = all.filter(w => w.exercises.some(e => e.exerciseId === exercise.id))
    await Promise.all(
      affected.map(w =>
        db.workouts.update(w.id, {
          exercises: w.exercises.filter(e => e.exerciseId !== exercise.id),
        })
      )
    )
    await db.exercises.delete(exercise.id)
    setConfirmOpen(false)
    onClose()
  }

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title={exercise.name}>
        <div className="flex flex-col py-2">
          <MenuButton
            onClick={() => { onClose(); navigate(`/exercise/${exercise.id}/edit`) }}
            icon={<Pencil size={16} className="text-[#888888]" />}
          >
            Editar exercício
          </MenuButton>
          <MenuButton onClick={handleClone} icon={<Copy size={16} className="text-[#888888]" />}>
            Clonar exercício
          </MenuButton>
          <MenuButton onClick={handleExport} icon={<Download size={16} className="text-[#888888]" />}>
            Exportar .treino
          </MenuButton>
          <MenuButton onClick={handleDeletePress} icon={<Trash2 size={16} />} variant="danger">
            Deletar exercício
          </MenuButton>
        </div>
      </BottomSheet>

      <BottomSheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Deletar exercício?">
        <div className="px-4 py-4 flex flex-col gap-4">
          <p className="text-sm text-[#888888]">
            Este exercício está em {affectedWorkouts.length} treino{affectedWorkouts.length !== 1 ? 's' : ''}:
          </p>
          <ul className="flex flex-col gap-1">
            {affectedWorkouts.map(name => (
              <li key={name} className="text-sm text-[#F0F0F0] bg-[#252525] rounded-lg px-3 py-2">{name}</li>
            ))}
          </ul>
          <p className="text-sm text-[#888888]">Ao deletar, ele será removido desses treinos. Continuar?</p>
          <div className="flex flex-col gap-2 pb-2">
            <Button variant="danger" fullWidth onClick={handleConfirmDelete}>Deletar</Button>
            <Button variant="ghost" fullWidth onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
