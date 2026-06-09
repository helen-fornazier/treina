import { useNavigate } from 'react-router-dom'
import { ToggleLeft, ToggleRight, Copy, Download, Pencil, Trash2 } from 'lucide-react'
import { db } from '../../db'
import { buildWorkoutsFile } from '../../utils/export'
import { cloneWorkout } from '../../utils/clone'
import { usePendingExport } from '../../hooks/useExport'
import type { Workout } from '../../types'
import BottomSheet from '../ui/BottomSheet'
import ShareReadyPanel from '../ui/ShareReadyPanel'
import MenuButton from '../ui/MenuButton'

interface Props {
  workout: Workout
  open: boolean
  onClose: () => void
}

export default function WorkoutContextMenu({ workout, open, onClose }: Props) {
  const navigate = useNavigate()
  const { pendingFile, building, build, share, clear } = usePendingExport(buildWorkoutsFile)

  function handleClose() {
    clear()
    onClose()
  }

  async function handleToggleActive() {
    handleClose()
    await db.workouts.update(workout.id, { isActive: !workout.isActive })
  }

  async function handleClone() {
    handleClose()
    const cloned = cloneWorkout(workout)
    await db.workouts.add(cloned)
    navigate(`/workout/${cloned.id}/edit`)
  }

  async function handleDelete() {
    handleClose()
    await db.workouts.delete(workout.id)
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={workout.name}>
      {pendingFile ? (
        <ShareReadyPanel
          onShare={async () => { await share(); handleClose() }}
          onCancel={handleClose}
        />
      ) : (
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
          <MenuButton onClick={() => build([workout])} icon={<Download size={16} className="text-[#888888]" />} disabled={building}>
            {building ? 'Preparando...' : 'Exportar .treino'}
          </MenuButton>
          <MenuButton
            onClick={() => { handleClose(); navigate(`/workout/${workout.id}/edit`) }}
            icon={<Pencil size={16} className="text-[#888888]" />}
          >
            Editar treino
          </MenuButton>
          <MenuButton onClick={handleDelete} icon={<Trash2 size={16} />} variant="danger">
            Deletar treino
          </MenuButton>
        </div>
      )}
    </BottomSheet>
  )
}
