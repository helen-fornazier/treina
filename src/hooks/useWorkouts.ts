import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'

export function useWorkouts() {
  return useLiveQuery(() => db.workouts.orderBy('order').toArray(), [])
}

export function useWorkout(id: string) {
  return useLiveQuery(() => db.workouts.get(id), [id])
}

export function useExercises() {
  return useLiveQuery(() => db.exercises.orderBy('name').toArray(), [])
}

export function useExercise(id: string) {
  return useLiveQuery(() => db.exercises.get(id), [id])
}

export function useSessions() {
  return useLiveQuery(() => db.sessions.orderBy('startedAt').reverse().toArray(), [])
}

export function useSettings() {
  return useLiveQuery(() => db.settings.get('settings'), [])
}
