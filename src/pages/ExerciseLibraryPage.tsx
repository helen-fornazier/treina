import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Upload } from 'lucide-react'
import { db } from '../db'
import { exportExercises } from '../utils/export'
import { useLongPress } from '../hooks/useLongPress'
import type { Exercise } from '../types'
import PageHeader from '../components/ui/PageHeader'
import VideoThumbnail from '../components/ui/VideoThumbnail'
import ExerciseContextMenu from '../components/exercise/ExerciseContextMenu'
import ExportSheet from '../components/ui/ExportSheet'

export default function ExerciseLibraryPage() {
  const navigate = useNavigate()
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])
  const [exportSheet, setExportSheet] = useState(false)

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    navigate('/import', { state: { file } })
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      <PageHeader title="Biblioteca de Exercícios" />

      <div className="flex flex-col px-4 pt-2">
        {exercises?.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-[#888888] text-sm">Nenhum exercício cadastrado ainda.</p>
            <button
              onClick={() => navigate('/exercise/new')}
              className="text-sm text-[#4BDF93]"
            >
              Criar primeiro exercício
            </button>
          </div>
        )}

        {exercises?.map(ex => <ExerciseItem key={ex.id} exercise={ex} />)}

        {/* Import / Export */}
        <div className="flex items-center gap-4 py-4">
          <label className="flex items-center gap-2 text-sm text-[#888888] cursor-pointer">
            <Upload size={16} />
            <span>Importar</span>
            <input
              type="file"
              accept=".treino,application/x-treino"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          {exercises && exercises.length > 0 && (
            <button
              type="button"
              onClick={() => setExportSheet(true)}
              className="flex items-center gap-2 text-sm text-[#888888]"
            >
              <Upload size={16} className="rotate-180" />
              <span>Exportar</span>
            </button>
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/exercise/new')}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#FF0D5F] flex items-center justify-center shadow-lg active:opacity-80"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Export sheet */}
      <ExportSheet
        open={exportSheet}
        onClose={() => setExportSheet(false)}
        title="Exportar exercícios"
        noun="exercício"
        items={exercises}
        onExport={exportExercises}
        renderSub={ex =>
          ex.variants.length > 0
            ? `${ex.variants.length} alternativa${ex.variants.length !== 1 ? 's' : ''}`
            : null
        }
      />
    </div>
  )
}

function ExerciseItem({ exercise }: { exercise: Exercise }) {
  const { active: menuOpen, close: closeMenu, didFire: didLongPress, onPointerDown, cancel } = useLongPress()

  function handleClick() {
    if (didLongPress.current) return
  }

  return (
    <>
      <button
        onClick={handleClick}
        onPointerDown={onPointerDown}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onContextMenu={e => e.preventDefault()}
        className="w-full flex items-center gap-3 py-3 border-b border-[#2A2A2A] last:border-0 text-left select-none active:opacity-70"
      >
        <VideoThumbnail thumbnail={exercise.video?.thumbnail} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#F0F0F0] truncate">{exercise.name}</p>
          {exercise.variants.length > 0 && (
            <p className="text-xs text-[#888888]">
              {exercise.variants.length} alternativa{exercise.variants.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </button>

      <ExerciseContextMenu exercise={exercise} open={menuOpen} onClose={closeMenu} />
    </>
  )
}
