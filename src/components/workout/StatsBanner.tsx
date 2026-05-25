import { useNavigate } from 'react-router-dom'
import type { WorkoutSession } from '../../types'

interface Props {
  sessions: WorkoutSession[]
  metricsFrom: 'allTime' | 'month' | 'year'
}

function filterSessions(sessions: WorkoutSession[], from: string) {
  const now = new Date()
  return sessions.filter(s => {
    if (from === 'allTime') return true
    const d = new Date(s.startedAt)
    if (from === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (from === 'year') return d.getFullYear() === now.getFullYear()
    return true
  })
}

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function StatsBanner({ sessions, metricsFrom }: Props) {
  const navigate = useNavigate()

  const completed = sessions.filter(s => s.isComplete)
  const filtered = filterSessions(completed, metricsFrom)

  const checkins = filtered.length
  const activeDays = new Set(filtered.map(s => new Date(s.startedAt).toDateString())).size

  // Current week: Sunday → Saturday
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  const sessionDates = new Set(completed.map(s => new Date(s.startedAt).toDateString()))
  const todayStr = today.toDateString()

  return (
    <button
      onClick={() => navigate('/calendar')}
      className="mx-4 bg-[#1C1C1C] rounded-2xl px-4 pt-3 pb-4 border border-[#2A2A2A] w-[calc(100%-2rem)] text-left active:opacity-80 transition-opacity"
    >
      {/* Week strip */}
      <div className="flex justify-between mb-3">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === todayStr
          const hasSession = sessionDates.has(day.toDateString())
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`text-xs font-semibold ${isToday ? 'text-[#F0F0F0]' : 'text-[#555555]'}`}>
                {DAY_LABELS[i]}
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${hasSession ? 'bg-[#4BDF93]' : 'invisible'}`} />
            </div>
          )
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-[#4BDF93]">{checkins}</span>
          <span className="text-xs text-[#888888]">check-ins</span>
        </div>
        <div className="w-px h-4 bg-[#2A2A2A]" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold text-[#4BDF93]">{activeDays}</span>
          <span className="text-xs text-[#888888]">dias ativos</span>
        </div>
      </div>
    </button>
  )
}
