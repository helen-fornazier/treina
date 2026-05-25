import { useNavigate } from 'react-router-dom'
import { ToggleLeft, ToggleRight, Copy, Download, Pencil, Trash2 } from 'lucide-react'
import { db } from '../../db'
import { exportWorkouts } from '../../utils/export'
import { uuid } from '../../utils/uuid'
import type { Workout } from '../../types'
import BottomSheet from '../ui/BottomSheet'

interface Props {
  workout: Workout
  open: boolean
  onClose: () => void
}

export default function WorkoutContextMenu({ workout, open, onClose }: Props) {
  const navigate = useNavigate()

  async function handleToggleActive() {
    onClose()
    await db.workouts.update(workout.id, { isActive: !workout.isActive })
  }

  async function handleClone() {
    onClose()
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

  async function handleExport() {
    onClose()
    await exportWorkouts([workout])
  }

  async function handleDelete() {
    onClose()
    await db.workouts.delete(workout.id)
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={workout.name}>
      <div className="flex flex-col py-2">
        <button onClick={handleToggleActive} className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]">
          {workout.isActive
            ? <ToggleRight size={16} className="text-[#4BDF93]" />
            : <ToggleLeft size={16} className="text-[#888888]" />}
          {workout.isActive ? 'Marcar como inativo' : 'Marcar como ativo'}
        </button>
        <button onClick={handleClone} className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]">
          <Copy size={16} className="text-[#888888]" />
          Clonar treino
        </button>
        <button onClick={handleExport} className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]">
          <Download size={16} className="text-[#888888]" />
          Exportar .treino
        </button>
        {!workout.readonly && (
          <button
            onClick={() => { onClose(); navigate(`/workout/${workout.id}/edit`) }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
          >
            <Pencil size={16} className="text-[#888888]" />
            Editar treino
          </button>
        )}
        <button onClick={handleDelete} className="flex items-center gap-3 px-4 py-3 text-sm text-[#FF0D5F]">
          <Trash2 size={16} />
          Deletar treino
        </button>
      </div>
    </BottomSheet>
  )
}
