import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import type { Workout, WorkoutSession } from '../../types'
import VideoThumbnail from '../ui/VideoThumbnail'
import WorkoutContextMenu from './WorkoutContextMenu'
import { useLongPress } from '../../hooks/useLongPress'

interface Props {
  workout: Workout
  sessions: WorkoutSession[]
}

export default function WorkoutListItem({ workout, sessions }: Props) {
  const navigate = useNavigate()
  const { active: menuOpen, close: closeMenu, didFire: didLongPress, onPointerDown: handlePointerDown, cancel: cancelLongPress } = useLongPress()

  const firstExerciseId = workout.exercises[0]?.exerciseId
  const exercise = useLiveQuery(async () => {
    if (!firstExerciseId) return undefined
    return db.exercises.get(firstExerciseId)
  }, [firstExerciseId])

  const workoutSessions = sessions.filter(s => s.workoutId === workout.id && s.isComplete)
  const lastSession = workoutSessions[0] // sessions are sorted desc by startedAt
  const activeDays = new Set(workoutSessions.map(s => new Date(s.startedAt).toDateString())).size

  const thumbnail = exercise?.video?.thumbnail
  const lastDate = lastSession
    ? new Date(lastSession.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : new Date(workout.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  function handleClick() {
    if (didLongPress.current) return
    navigate(`/workout/${workout.id}`)
  }

  return (
    <>
      <button
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
        onContextMenu={e => e.preventDefault()}
        className="w-full bg-[#1C1C1C] rounded-2xl p-3 border border-[#2A2A2A] flex items-center gap-3 active:opacity-80 transition-opacity text-left select-none"
      >
        <VideoThumbnail thumbnail={thumbnail} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-[#F0F0F0] truncate">{workout.name}</p>
          </div>
          <p className="text-xs text-[#888888]">{workout.author} · {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-[#888888]">
              {lastSession ? 'última vez:' : 'criado em:'} {lastDate}
            </span>
            {activeDays > 0 && (
              <span className="text-xs text-[#4BDF93]">{activeDays} dia{activeDays !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-[#888888] flex-shrink-0" />
      </button>

      <WorkoutContextMenu workout={workout} open={menuOpen} onClose={closeMenu} />
    </>
  )
}
