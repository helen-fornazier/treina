export interface ExerciseVideo {
  blob?: Blob       // undefined for URL-based videos
  url?: string      // original external URL (YouTube, Instagram, direct)
  thumbnail: string // base64 data URL, YouTube thumb URL, or 'icon' sentinel
  duration: number  // seconds (0 if unknown)
  isHD: boolean
}

export interface ExerciseAudio {
  blob: Blob
  duration: number
}

export interface ExerciseVariant {
  id: string
  name: string
  video?: ExerciseVideo
  comment?: string
}

// Global exercise library entry
export interface Exercise {
  id: string
  name: string
  video?: ExerciseVideo
  audio?: ExerciseAudio
  comment?: string
  variants: ExerciseVariant[]
  createdAt: number
  importedFrom?: string // workout id if imported
  readonly?: boolean
}

// Exercise instance inside a workout
export interface WorkoutExercise {
  id: string
  exerciseId: string       // ref to Exercise
  selectedVariantId?: string
  reps?: string            // e.g. "3x12", "4x10-12"
  restSeconds?: number
  comment?: string         // professor note for this workout context
  order: number
  userNotes?: string       // user personal notes
}

export interface WorkoutSession {
  id: string
  workoutId: string
  startedAt: number
  finishedAt: number
  duration: number         // minutes
  completedExerciseIds: string[]
  isComplete: boolean
}

export interface Workout {
  id: string
  name: string
  author: string
  comment?: string
  exercises: WorkoutExercise[]
  isActive: boolean
  order: number            // for drag & drop ordering within active/inactive
  createdAt: number
  importedAt?: number
  readonly?: boolean
  originalId?: string      // if cloned, ref to source
}

export interface AppSettings {
  id: 'settings'
  userName: string
  metricsFrom: 'allTime' | 'month' | 'year'
}

export interface DayLog {
  id: string               // YYYY-MM-DD
  sessionIds: string[]
}
