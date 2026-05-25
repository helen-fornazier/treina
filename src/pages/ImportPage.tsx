import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { db } from '../db'
import type { Workout, Exercise, ExerciseVariant } from '../types'
import Button from '../components/ui/Button'
import { Download, AlertCircle } from 'lucide-react'

interface SerializedVideo {
  data?: string
  thumbnail: string
  duration: number
  isHD: boolean
}

interface SerializedVariant extends Omit<ExerciseVariant, 'video'> {
  video?: SerializedVideo
}

interface SerializedExercise extends Omit<Exercise, 'video' | 'audio' | 'variants'> {
  video?: SerializedVideo
  audio?: { data?: string; duration: number }
  variants: SerializedVariant[]
}

interface TreinoFile {
  version: number
  exported_at: string
  workouts: Workout[]
  exercise_library: SerializedExercise[]
}

export default function ImportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<TreinoFile | null>(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const file: File | undefined = location.state?.file
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as TreinoFile
        setData(parsed)
      } catch {
        setError('Arquivo inválido. Certifique-se de que é um arquivo .treino.')
      }
    }
    reader.readAsText(file)
  }, [])

  async function deserializeExercise(ex: SerializedExercise): Promise<Exercise> {
    const result: Exercise = { ...ex, video: undefined, audio: undefined, variants: [] }
    if (ex.video?.data) {
      const blob = await fetch(ex.video.data).then(r => r.blob())
      result.video = { blob, thumbnail: ex.video.thumbnail, duration: ex.video.duration, isHD: ex.video.isHD }
    } else {
      result.video = undefined
    }
    if (ex.audio?.data) {
      const blob = await fetch(ex.audio.data).then(r => r.blob())
      result.audio = { blob, duration: ex.audio.duration }
    } else {
      result.audio = undefined
    }
    result.variants = await Promise.all(ex.variants.map(async v => {
      if (!v.video?.data) return { ...v, video: undefined } as ExerciseVariant
      const blob = await fetch(v.video.data).then(r => r.blob())
      return { ...v, video: { blob, thumbnail: v.video.thumbnail, duration: v.video.duration, isHD: v.video.isHD } } as ExerciseVariant
    }))
    return result
  }

  async function handleImport() {
    if (!data) return
    setImporting(true)

    // Import exercises
    for (const ex of data.exercise_library ?? []) {
      const exists = await db.exercises.get(ex.id)
      if (!exists) {
        const deserialized = await deserializeExercise(ex)
        await db.exercises.add({ ...deserialized, readonly: true, importedFrom: data.workouts[0]?.id })
      }
    }

    // Import workouts
    const workoutCount = await db.workouts.count()
    for (let i = 0; i < data.workouts.length; i++) {
      const w = data.workouts[i]
      const exists = await db.workouts.get(w.id)
      if (!exists) {
        await db.workouts.add({
          ...w,
          readonly: true,
          importedAt: Date.now(),
          isActive: true,
          order: workoutCount + i,
        })
      }
    }

    setDone(true)
    setImporting(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-[#111111] px-6 gap-6">
        <div className="w-16 h-16 rounded-full bg-[#4BDF93]/10 flex items-center justify-center">
          <Download size={32} className="text-[#4BDF93]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-[#F0F0F0]">Treinos importados!</p>
          <p className="text-sm text-[#888888] mt-1">
            {data?.workouts.length} treino(s) adicionado(s) como ativos.
          </p>
        </div>
        <Button fullWidth size="lg" onClick={() => navigate('/')}>Ver meus treinos</Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-[#111111] px-6 gap-6">
        <AlertCircle size={48} className="text-[#FF0D5F]" />
        <p className="text-sm text-[#888888] text-center">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Voltar</Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-[#111111]">
        <div className="w-8 h-8 border-2 border-[#4BDF93] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] px-4 pt-16 pb-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-[#FF0D5F]/10 flex items-center justify-center">
            <Download size={28} className="text-[#FF0D5F]" />
          </div>
          <h1 className="text-xl font-bold text-[#F0F0F0]">Importar treinos</h1>
          <p className="text-sm text-[#888888]">
            {data.workouts.length} treino(s) encontrado(s) neste arquivo
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {data.workouts.map(w => (
            <div key={w.id} className="bg-[#1C1C1C] rounded-2xl p-4 border border-[#2A2A2A]">
              <p className="text-sm font-semibold text-[#F0F0F0]">{w.name}</p>
              <p className="text-xs text-[#888888] mt-1">
                por {w.author} · {w.exercises.length} exercício(s)
              </p>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#888888] text-center">
          Treinos importados não podem ser editados, mas podem ser clonados.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-[#111111] border-t border-[#2A2A2A] flex flex-col gap-2">
        <Button fullWidth size="lg" onClick={handleImport} disabled={importing}>
          {importing ? 'Importando...' : 'Importar treinos'}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => navigate('/')}>Cancelar</Button>
      </div>
    </div>
  )
}
