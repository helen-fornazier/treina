import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Settings, Calendar, ChevronDown, Upload, Download, MoreVertical, Dumbbell } from 'lucide-react'
import { useWorkouts, useSessions, useSettings } from '../hooks/useWorkouts'
import { exportWorkouts } from '../utils/export'
import type { Workout } from '../types'
import StatsBanner from '../components/workout/StatsBanner'
import SuggestedWorkout from '../components/workout/SuggestedWorkout'
import WorkoutListItem from '../components/workout/WorkoutListItem'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const workouts = useWorkouts() ?? []
  const sessions = useSessions() ?? []
  const settings = useSettings()

  const [activeCollapsed, setActiveCollapsed] = useState(false)
  const [inactiveCollapsed, setInactiveCollapsed] = useState(true)
  const [moreOpen, setMoreOpen] = useState(false)
  const [exportSheet, setExportSheet] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  const active = workouts.filter(w => w.isActive).sort((a, b) => a.order - b.order)
  const inactive = workouts.filter(w => !w.isActive).sort((a, b) => a.order - b.order)

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

  function openExportSheet() {
    setSelected(new Set())
    setExportSheet(true)
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === workouts.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(workouts.map(w => w.id)))
    }
  }

  async function handleExport() {
    const toExport = workouts.filter(w => selected.has(w.id)) as Workout[]
    if (toExport.length === 0) return
    setExporting(true)
    try {
      await exportWorkouts(toExport)
      setExportSheet(false)
    } finally {
      setExporting(false)
    }
  }

  const allSelected = workouts.length > 0 && selected.size === workouts.length

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
          <button type="button" onClick={() => navigate('/calendar')} className="p-2 text-[#888888]">
            <Calendar size={22} />
          </button>
          <button type="button" onClick={() => setMoreOpen(true)} className="p-2 text-[#888888]">
            <MoreVertical size={22} />
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
            type="button"
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
              type="button"
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

        {/* Import / Export */}
        <div className="flex items-center gap-4">
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
          {workouts.length > 0 && (
            <button
              type="button"
              onClick={openExportSheet}
              className="flex items-center gap-2 text-sm text-[#888888]"
            >
              <Download size={16} />
              <span>Exportar</span>
            </button>
          )}
        </div>
      </div>

      {/* FAB — New Workout */}
      <button
        type="button"
        onClick={() => navigate('/workout/new')}
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full bg-[#FF0D5F] shadow-lg flex items-center justify-center active:opacity-80 transition-opacity z-20"
      >
        <Plus size={28} className="text-white" />
      </button>

      {/* More menu sheet */}
      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)}>
        <div className="flex flex-col py-2">
          <button
            onClick={() => { setMoreOpen(false); navigate('/settings') }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
          >
            <Settings size={16} className="text-[#888888]" />
            Configurações
          </button>
          <button
            onClick={() => { setMoreOpen(false); navigate('/exercises') }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-[#F0F0F0]"
          >
            <Dumbbell size={16} className="text-[#888888]" />
            Biblioteca de exercícios
          </button>
        </div>
      </BottomSheet>

      {/* Export sheet */}
      <BottomSheet open={exportSheet} onClose={() => setExportSheet(false)} title="Exportar treinos">
        <div className="flex flex-col">
          {/* Select all toggle */}
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] w-full"
          >
            <span className="text-sm text-[#888888]">Selecionar todos</span>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${allSelected ? 'bg-[#4BDF93] border-[#4BDF93]' : 'border-[#444444]'}`}>
              {allSelected && <span className="text-[#111111] text-xs font-bold">✓</span>}
            </div>
          </button>

          {/* Workout list */}
          <div className="overflow-y-auto" style={{ maxHeight: '40svh' }}>
            {workouts.map(w => {
              const isSelected = selected.has(w.id)
              return (
                <button
                  type="button"
                  key={w.id}
                  onClick={() => toggleSelect(w.id)}
                  className="flex items-center gap-3 px-4 py-3 w-full border-b border-[#2A2A2A] last:border-0"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-[#F0F0F0] truncate">{w.name}</p>
                    <p className="text-xs text-[#888888]">{w.exercises.length} exercício(s)</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-[#4BDF93] border-[#4BDF93]' : 'border-[#444444]'}`}>
                    {isSelected && <span className="text-[#111111] text-xs font-bold">✓</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Export button */}
          <div className="px-4 pt-3 pb-4">
            <Button
              fullWidth
              size="lg"
              onClick={handleExport}
              disabled={selected.size === 0 || exporting}
            >
              {exporting
                ? 'Exportando...'
                : selected.size === 0
                  ? 'Selecione treinos'
                  : `Exportar ${selected.size} treino${selected.size > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
