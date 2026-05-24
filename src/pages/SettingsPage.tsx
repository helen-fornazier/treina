import { useState, useEffect } from 'react'
import { getSettings, saveSettings } from '../db'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'

export default function SettingsPage() {
  const [userName, setUserName] = useState('')
  const [metricsFrom, setMetricsFrom] = useState<'allTime' | 'month' | 'year'>('allTime')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(s => {
      setUserName(s.userName)
      setMetricsFrom(s.metricsFrom)
    })
  }, [])

  async function handleSave() {
    await saveSettings({ userName, metricsFrom })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-svh bg-[#111111] pb-24">
      <PageHeader title="Configurações" />

      <div className="flex flex-col gap-4 px-4 pt-2">
        <div>
          <label className="text-xs text-[#888888] mb-1 block">Seu nome</label>
          <input
            value={userName}
            onChange={e => setUserName(e.target.value)}
            placeholder="Usado como autor nos treinos que você criar"
            className="w-full bg-[#1C1C1C] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
        </div>

        <div>
          <label className="text-xs text-[#888888] mb-2 block">Período das métricas</label>
          <div className="flex flex-col gap-2">
            {([
              { value: 'allTime', label: 'Desde sempre' },
              { value: 'month', label: 'Este mês' },
              { value: 'year', label: 'Este ano' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setMetricsFrom(opt.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-colors ${
                  metricsFrom === opt.value
                    ? 'border-[#4BDF93] bg-[#4BDF93]/10 text-[#4BDF93]'
                    : 'border-[#2A2A2A] bg-[#1C1C1C] text-[#888888]'
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  metricsFrom === opt.value ? 'border-[#4BDF93]' : 'border-[#888888]'
                }`}>
                  {metricsFrom === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-[#4BDF93]" />
                  )}
                </div>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button fullWidth size="lg" onClick={handleSave}>
            {saved ? 'Salvo ✓' : 'Salvar configurações'}
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-[#2A2A2A]">
          <p className="text-xs text-[#888888] text-center">Treina v0.1.0</p>
        </div>
      </div>
    </div>
  )
}
