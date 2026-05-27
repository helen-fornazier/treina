import { useNavigate } from 'react-router-dom'
import { ToggleLeft, ToggleRight, Copy, Download, Pencil, Trash2 } from 'lucide-react'
import { db } from '../../db'
import { exportWorkouts } from '../../utils/export'
import { cloneWorkout } from '../../utils/clone'
import type { Workout } from '../../types'
import BottomSheet from '../ui/BottomSheet'
import MenuButton from '../ui/MenuButton'

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
    const cloned = cloneWorkout(workout)
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
        <MenuButton
          onClick={handleToggleActive}
          icon={workout.isActive
            ? <ToggleRight size={16} className="text-[#4BDF93]" />
            : <ToggleLeft size={16} className="text-[#888888]" />}
        >
          {workout.isActive ? 'Marcar como inativo' : 'Marcar como ativo'}
        </MenuButton>
        <MenuButton onClick={handleClone} icon={<Copy size={16} className="text-[#888888]" />}>
          Clonar treino
        </MenuButton>
        <MenuButton onClick={handleExport} icon={<Download size={16} className="text-[#888888]" />}>
          Exportar .treino
        </MenuButton>
        <MenuButton
          onClick={() => { onClose(); navigate(`/workout/${workout.id}/edit`) }}
          icon={<Pencil size={16} className="text-[#888888]" />}
        >
          Editar treino
        </MenuButton>
        <MenuButton onClick={handleDelete} icon={<Trash2 size={16} />} variant="danger">
          Deletar treino
        </MenuButton>
      </div>
    </BottomSheet>
  )
}
