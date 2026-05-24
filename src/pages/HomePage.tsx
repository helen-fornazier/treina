import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Settings, Calendar, ChevronDown, ChevronRight, Upload, Download, Dumbbell } from 'lucide-react'
import { useWorkouts, useSessions, useSettings } from '../hooks/useWorkouts'
import { db } from '../db'
import VideoThumbnail from '../components/ui/VideoThumbnail'
import StatsBanner from '../components/workout/StatsBanner'
import SuggestedWorkout from '../components/workout/SuggestedWorkout'
import WorkoutListItem from '../components/workout/WorkoutListItem'
import type { Workout } from '../types'

export default function HomePage() {
  const navigate = useNavigate()
  const workouts = useWorkouts() ?? []
  const sessions = useSessions() ?? []
  const settings = useSettings()

  const [activeCollapsed, setActiveCollapsed] = useState(false)
  const [inactiveCollapsed, setInactiveCollapsed] = useState(true)

  const active = workouts.filter(w => w.isActive).sort((a, b) => a.order - b.order)
  const inactive = workouts.filter(w => !w.isActive).sort((a, b) => a.order - b.order)

  // Suggested workout: next in active list after last session's workout
  const suggestedWorkout = (() => {
    if (active.length === 0) return null
    if (sessions.length === 0) return active[0]
    const lastSession = sessions[0]
    const lastIdx = active.findIndex(w => w.id === lastSession.workoutId)
    if (lastIdx === -1) return active[0]
    return active[(lastIdx + 1) % active.length]
  })()

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    navigate('/import', { state: { file } })
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F0]">Treina</h1>
          {settings?.userName && (
            <p className="text-sm text-[#888888]">Olá, {settings.userName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/calendar')} className="p-2 text-[#888888]">
            <Calendar size={22} />
          </button>
          <button onClick={() => navigate('/settings')} className="p-2 text-[#888888]">
            <Settings size={22} />
          </button>
        </div>
      </div>

      {/* Stats Banner */}
      <StatsBanner sessions={sessions} metricsFrom={settings?.metricsFrom ?? 'allTime'} />

      <div className="flex flex-col gap-6 px-4 mt-6">
        {/* Suggested Workout */}
        {suggestedWorkout && (
          <SuggestedWorkout workout={suggestedWorkout} />
        )}

        {/* Active Workouts */}
        <section>
          <button
            className="flex items-center justify-between w-full mb-3"
            onClick={() => setActiveCollapsed(v => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#F0F0F0] uppercase tracking-wider">
                Treinos Ativos
              </span>
              <span className="text-xs text-[#888888] bg-[#1C1C1C] px-2 py-0.5 rounded-full">
                {active.length}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-[#888888] transition-transform ${activeCollapsed ? '-rotate-90' : ''}`}
            />
          </button>
          {!activeCollapsed && (
            <div className="flex flex-col gap-2">
              {active.length === 0 ? (
                <p className="text-sm text-[#888888] text-center py-4">
                  Nenhum treino ativo. Crie um treino e marque como ativo.
                </p>
              ) : (
                active.map(w => (
                  <WorkoutListItem key={w.id} workout={w} sessions={sessions} />
                ))
              )}
            </div>
          )}
        </section>

        {/* Inactive Workouts */}
        {inactive.length > 0 && (
          <section>
            <button
              className="flex items-center justify-between w-full mb-3"
              onClick={() => setInactiveCollapsed(v => !v)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
                  Treinos Inativos
                </span>
                <span className="text-xs text-[#888888] bg-[#1C1C1C] px-2 py-0.5 rounded-full">
                  {inactive.length}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-[#888888] transition-transform ${inactiveCollapsed ? '-rotate-90' : ''}`}
              />
            </button>
            {!inactiveCollapsed && (
              <div className="flex flex-col gap-2">
                {inactive.map(w => (
                  <WorkoutListItem key={w.id} workout={w} sessions={sessions} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Import */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#888888] cursor-pointer">
            <Upload size={16} />
            <span>Importar treinos</span>
            <input
              type="file"
              accept=".treino,application/x-treino"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {/* FAB — New Workout */}
      <button
        onClick={() => navigate('/workout/new')}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-[#FF0D5F] shadow-lg flex items-center justify-center active:opacity-80 transition-opacity z-20"
      >
        <Plus size={28} className="text-white" />
      </button>
    </div>
  )
}
