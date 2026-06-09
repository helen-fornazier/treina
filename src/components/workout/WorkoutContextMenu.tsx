import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ToggleLeft, ToggleRight, Copy, Download, Pencil, Trash2, Share2 } from 'lucide-react'
import { db } from '../../db'
import { buildWorkoutsFile, shareOrDownload } from '../../utils/export'
import { cloneWorkout } from '../../utils/clone'
import type { Workout } from '../../types'
import BottomSheet from '../ui/BottomSheet'
import Button from '../ui/Button'
import MenuButton from '../ui/MenuButton'

interface Props {
  workout: Workout
  open: boolean
  onClose: () => void
}

export default function WorkoutContextMenu({ workout, open, onClose }: Props) {
  const navigate = useNavigate()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [building, setBuilding] = useState(false)

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
    setBuilding(true)
    try {
      const file = await buildWorkoutsFile([workout])
      setPendingFile(file)
    } finally {
      setBuilding(false)
    }
  }

  async function handleShare() {
    if (!pendingFile) return
    await shareOrDownload(pendingFile)
    handleClose()
  }

  function handleClose() {
    setPendingFile(null)
    setBuilding(false)
    onClose()
  }

  async function handleDelete() {
    handleClose()
    await db.workouts.delete(workout.id)
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={workout.name}>
      {pendingFile ? (
        <div className="flex flex-col items-center gap-4 px-4 py-6">
          <div className="w-12 h-12 rounded-full bg-[#4BDF93]/10 flex items-center justify-center">
            <Share2 size={22} className="text-[#4BDF93]" />
          </div>
          <p className="text-xs text-[#888888]">Arquivo pronto para compartilhar</p>
          <div className="flex gap-2 w-full pb-2">
            <Button variant="ghost" fullWidth onClick={handleClose}>Cancelar</Button>
            <Button fullWidth onClick={handleShare}>Compartilhar</Button>
          </div>
        </div>
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
          <MenuButton onClick={handleExport} icon={<Download size={16} className="text-[#888888]" />} disabled={building}>
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
