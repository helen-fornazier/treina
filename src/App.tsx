import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import WorkoutDetailPage from './pages/WorkoutDetailPage'
import ExercisePage from './pages/ExercisePage'
import CreateWorkoutPage from './pages/CreateWorkoutPage'
import CreateExercisePage from './pages/CreateExercisePage'
import CalendarPage from './pages/CalendarPage'
import SettingsPage from './pages/SettingsPage'
import ImportPage from './pages/ImportPage'

export default function App() {
  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto relative">
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
      </Routes>
    </div>
  )
}
