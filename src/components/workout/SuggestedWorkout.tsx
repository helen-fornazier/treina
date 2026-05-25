import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Zap } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import type { Workout } from '../../types'
import VideoThumbnail from '../ui/VideoThumbnail'
import WorkoutContextMenu from './WorkoutContextMenu'

interface Props {
  workout: Workout
}

export default function SuggestedWorkout({ workout }: Props) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didLongPress = useRef(false)

  const firstExerciseId = workout.exercises[0]?.exerciseId
  const exercise = useLiveQuery(async () => {
    if (!firstExerciseId) return undefined
    return db.exercises.get(firstExerciseId)
  }, [firstExerciseId])

  const thumbnail = exercise?.video?.thumbnail

  function handlePointerDown() {
    didLongPress.current = false
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true
      if ('vibrate' in navigator) navigator.vibrate(30)
      setMenuOpen(true)
    }, 500)
  }

  function cancelLongPress() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  function handleClick() {
    if (didLongPress.current) return
    navigate(`/workout/${workout.id}`)
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Zap size={14} className="text-[#FF0D5F]" />
        <span className="text-sm font-semibold text-[#F0F0F0] uppercase tracking-wider">
          Treino Sugerido
        </span>
      </div>
      <button
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={e => e.preventDefault()}
        className="w-full bg-[#1C1C1C] rounded-2xl p-4 border border-[#2A2A2A] flex items-center gap-4 active:opacity-80 transition-opacity text-left select-none"
      >
        <VideoThumbnail thumbnail={thumbnail} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-[#F0F0F0] truncate">{workout.name}</p>
          <p className="text-sm text-[#888888]">{workout.author}</p>
          <p className="text-xs text-[#888888] mt-1">
            {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight size={18} className="text-[#888888] flex-shrink-0" />
      </button>

      <WorkoutContextMenu workout={workout} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </section>
  )
}
