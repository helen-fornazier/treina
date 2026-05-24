import { useNavigate } from 'react-router-dom'
import { ChevronRight, Lock } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'
import type { Workout, WorkoutSession } from '../../types'
import VideoThumbnail from '../ui/VideoThumbnail'

interface Props {
  workout: Workout
  sessions: WorkoutSession[]
}

export default function WorkoutListItem({ workout, sessions }: Props) {
  const navigate = useNavigate()

  const firstExerciseId = workout.exercises[0]?.exerciseId
  const exercise = useLiveQuery(async () => {
    if (!firstExerciseId) return undefined
    return db.exercises.get(firstExerciseId)
  }, [firstExerciseId])

  const workoutSessions = sessions.filter(s => s.workoutId === workout.id && s.isComplete)
  const firstSession = workoutSessions[workoutSessions.length - 1]
  const activeDays = new Set(workoutSessions.map(s => new Date(s.startedAt).toDateString())).size

  const thumbnail = exercise?.video?.thumbnail
  const createdDate = new Date(workout.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const firstExecuted = firstSession
    ? new Date(firstSession.startedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  return (
    <button
      onClick={() => navigate(`/workout/${workout.id}`)}
      className="w-full bg-[#1C1C1C] rounded-2xl p-3 border border-[#2A2A2A] flex items-center gap-3 active:opacity-80 transition-opacity text-left"
    >
      <VideoThumbnail thumbnail={thumbnail} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-[#F0F0F0] truncate">{workout.name}</p>
          {workout.readonly && <Lock size={11} className="text-[#888888] flex-shrink-0" />}
        </div>
        <p className="text-xs text-[#888888]">{workout.author} · {createdDate}</p>
        <div className="flex items-center gap-3 mt-1">
          {firstExecuted && (
            <span className="text-xs text-[#888888]">1ª vez: {firstExecuted}</span>
          )}
          {activeDays > 0 && (
            <span className="text-xs text-[#4BDF93]">{activeDays} dia{activeDays !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-[#888888] flex-shrink-0" />
    </button>
  )
}
