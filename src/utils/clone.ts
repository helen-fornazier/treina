import { uuid } from './uuid'
import type { Workout } from '../types'

export function cloneWorkout(workout: Workout): Workout {
  return {
    ...workout,
    id: uuid(),
    name: `${workout.name} (cópia)`,
    importedAt: undefined,
    originalId: workout.id,
    createdAt: Date.now(),
    isActive: false,
  }
}
