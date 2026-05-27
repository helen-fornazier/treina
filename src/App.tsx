import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useSettings } from './hooks/useWorkouts'
import { saveSettings } from './db'
import Button from './components/ui/Button'
import HomePage from './pages/HomePage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ExercisePage from './pages/ExercisePage'
import CreateWorkoutPage from './pages/CreateWorkoutPage'
import CreateExercisePage from './pages/CreateExercisePage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import ImportPage from './pages/ImportPage'
import ExerciseLibraryPage from './pages/ExerciseLibraryPage'

function NamePrompt() {
  const settings = useSettings()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  // undefined = loading, wait; empty string = needs name
  if (settings === undefined) return null
  if (settings.userName) return null

  async function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    await saveSettings({ userName: trimmed })
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#111111] flex flex-col items-center justify-center px-6 gap-8">
      <div className="text-center">
        <p className="text-4xl mb-4">💪</p>
        <h1 className="text-2xl font-bold text-[#F0F0F0] mb-2">Bem-vindo ao Treina</h1>
        <p className="text-sm text-[#888888]">Como podemos te chamar?</p>
      </div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Seu nome"
        autoFocus
        className="w-full max-w-xs bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-base border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888] text-center"
      />
      <Button
        fullWidth
        size="lg"
        onClick={handleSubmit}
        disabled={!name.trim() || saving}
      >
        {saving ? 'Salvando…' : 'Começar'}
      </Button>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex flex-col min-h-svh relative">
      <NamePrompt />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workout/:id" element={<WorkoutDetailPage />} />
        <Route path="/workout/:id/exercise/:exerciseId" element={<ExercisePage />} />
        <Route path="/workout/new" element={<CreateWorkoutPage />} />
        <Route path="/workout/:id/edit" element={<CreateWorkoutPage />} />
        <Route path="/exercise/new" element={<CreateExercisePage />} />
        <Route path="/exercise/:id/edit" element={<CreateExercisePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/exercises" element={<ExerciseLibraryPage />} />
      </Routes>
    </div>
  )
}
