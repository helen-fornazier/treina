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

export default function StatsBanner({ sessions, metricsFrom }: Props) {
  const filtered = filterSessions(sessions.filter(s => s.isComplete), metricsFrom)

  const checkins = filtered.length
  const activeDays = new Set(filtered.map(s => new Date(s.startedAt).toDateString())).size
  const totalMinutes = filtered.reduce((acc, s) => acc + s.duration, 0)
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  const label = metricsFrom === 'allTime' ? 'no total' : metricsFrom === 'month' ? 'este mês' : 'este ano'

  return (
    <div className="mx-4 bg-[#1C1C1C] rounded-2xl p-4 border border-[#2A2A2A]">
      <p className="text-xs text-[#888888] mb-3 uppercase tracking-wider">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-[#4BDF93]">{checkins}</span>
          <span className="text-xs text-[#888888] mt-0.5">check-ins</span>
        </div>
        <div className="flex flex-col items-center border-x border-[#2A2A2A]">
          <span className="text-2xl font-bold text-[#4BDF93]">{activeDays}</span>
          <span className="text-xs text-[#888888] mt-0.5">dias ativos</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-[#4BDF93]">
            {hours > 0 ? `${hours}h${mins > 0 ? mins + 'm' : ''}` : `${mins}m`}
          </span>
          <span className="text-xs text-[#888888] mt-0.5">tempo ativo</span>
        </div>
      </div>
    </div>
  )
}
