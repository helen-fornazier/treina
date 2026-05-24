import Dexie, { Table } from 'dexie'
import type { Exercise, Workout, WorkoutSession, AppSettings, DayLog } from '../types'

class TreinaDB extends Dexie {
  exercises!: Table<Exercise, string>
  workouts!: Table<Workout, string>
  sessions!: Table<WorkoutSession, string>
  settings!: Table<AppSettings, string>
  dayLogs!: Table<DayLog, string>

  constructor() {
    super('treina')
    this.version(1).stores({
      exercises: 'id, name, createdAt, readonly',
      workouts: 'id, name, author, isActive, order, createdAt, readonly',
      sessions: 'id, workoutId, startedAt, finishedAt, isComplete',
      settings: 'id',
      dayLogs: 'id',
    })
  }
}

export const db = new TreinaDB()

export async function getSettings(): Promise<AppSettings> {
  const s = await db.settings.get('settings')
  if (s) return s
  const defaults: AppSettings = { id: 'settings', userName: '', metricsFrom: 'allTime' }
  await db.settings.put(defaults)
  return defaults
}

export async function saveSettings(partial: Partial<Omit<AppSettings, 'id'>>) {
  const current = await getSettings()
  await db.settings.put({ ...current, ...partial })
}
