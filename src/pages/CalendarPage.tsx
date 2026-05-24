import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db'
import { uuid } from '../utils/uuid'
import PageHeader from '../components/ui/PageHeader'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'

const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function CalendarPage() {
  const navigate = useNavigate()
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth())
  const [year, setYear] = useState(today.getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [logSheet, setLogSheet] = useState(false)

  const sessions = useLiveQuery(() => db.sessions.toArray(), [])
  const workouts = useLiveQuery(() => db.workouts.toArray(), [])

  const trainedDays = new Set(
    (sessions ?? []).filter(s => s.isComplete).map(s => {
      const d = new Date(s.startedAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
  )

  function daysInMonth(m: number, y: number) { return new Date(y, m + 1, 0).getDate() }
  function firstDayOfMonth(m: number, y: number) { return new Date(y, m, 1).getDay() }

  const totalDays = daysInMonth(month, year)
  const firstDay = firstDayOfMonth(month, year)
  const cells = Array.from({ length: firstDay + totalDays }, (_, i) => i < firstDay ? null : i - firstDay + 1)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function dayKey(d: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  async function logWorkout(workoutId: string) {
    if (!selectedDay) return
    const [y, m, d] = selectedDay.split('-').map(Number)
    const start = new Date(y, m - 1, d, 10, 0)
    const end = new Date(y, m - 1, d, 11, 0)
    await db.sessions.add({
      id: uuid(),
      workoutId,
      startedAt: start.getTime(),
      finishedAt: end.getTime(),
      duration: 60,
      completedExerciseIds: [],
      isComplete: true,
    })
    setLogSheet(false)
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      <PageHeader title="Calendário" />

      {/* Month nav */}
      <div className="flex items-center justify-between px-4 mb-4">
        <button onClick={prevMonth} className="p-2 text-[#888888]">
          <ChevronLeft size={20} />
        </button>
        <span className="text-sm font-semibold text-[#F0F0F0]">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-2 text-[#888888]">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-4 mb-2">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-xs text-[#888888] font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-4 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const key = dayKey(day)
          const trained = trainedDays.has(key)
          const isToday = key === dayKey(today.getDate()) && month === today.getMonth() && year === today.getFullYear()
          const isSelected = selectedDay === key

          return (
            <button
              key={i}
              onClick={() => { setSelectedDay(key); setLogSheet(true) }}
              className={`
                aspect-square rounded-full flex items-center justify-center text-sm transition-all
                ${trained ? 'bg-[#4BDF93] text-[#111111] font-bold' : ''}
                ${isToday && !trained ? 'border border-[#4BDF93] text-[#4BDF93]' : ''}
                ${!trained && !isToday ? 'text-[#888888]' : ''}
                ${isSelected ? 'ring-2 ring-[#FF0D5F]' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Log workout sheet */}
      <BottomSheet open={logSheet} onClose={() => setLogSheet(false)} title={`Registrar treino — ${selectedDay}`}>
        <div className="pb-4">
          {workouts?.map(w => (
            <button
              key={w.id}
              onClick={() => logWorkout(w.id)}
              className="flex items-center gap-3 px-4 py-3 w-full border-b border-[#2A2A2A] last:border-0"
            >
              <span className="text-sm text-[#F0F0F0]">{w.name}</span>
              <span className="ml-auto text-xs text-[#888888]">{w.author}</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
