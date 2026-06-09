import { useState } from 'react'
import type { ReactNode } from 'react'
import { Share2 } from 'lucide-react'
import BottomSheet from './BottomSheet'
import Button from './Button'
import { shareOrDownload } from '../../utils/export'

interface Props<T extends { id: string; name: string }> {
  open: boolean
  onClose: () => void
  title: string
  noun: string
  items: T[] | undefined
  onBuild: (items: T[]) => Promise<File>
  renderSub?: (item: T) => ReactNode
}

export default function ExportSheet<T extends { id: string; name: string }>({
  open, onClose, title, noun, items, onBuild, renderSub,
}: Props<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [building, setBuilding] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (!items) return
    setSelected(prev =>
      prev.size === items.length ? new Set() : new Set(items.map(i => i.id))
    )
  }

  async function handleBuild() {
    if (!items) return
    const toExport = items.filter(i => selected.has(i.id))
    if (toExport.length === 0) return
    setBuilding(true)
    try {
      const file = await onBuild(toExport)
      setPendingFile(file)
    } finally {
      setBuilding(false)
    }
  }

  // Called directly from a button click — user gesture context is fresh, navigator.share works on iOS
  async function handleShare() {
    if (!pendingFile) return
    await shareOrDownload(pendingFile)
    handleClose()
  }

  function handleClose() {
    setPendingFile(null)
    setSelected(new Set())
    onClose()
  }

  const allSelected = !!items && items.length > 0 && selected.size === items.length
  const count = selected.size

  return (
    <BottomSheet open={open} onClose={handleClose} title={title}>
      {pendingFile ? (
        <div className="flex flex-col items-center gap-4 px-4 py-6">
          <div className="w-12 h-12 rounded-full bg-[#4BDF93]/10 flex items-center justify-center">
            <Share2 size={22} className="text-[#4BDF93]" />
          </div>
          <div className="text-center">
            <p className="text-sm text-[#F0F0F0] font-medium">{pendingFile.name}</p>
            <p className="text-xs text-[#888888] mt-1">Arquivo pronto para compartilhar</p>
          </div>
          <div className="flex gap-2 w-full pb-2">
            <Button variant="ghost" fullWidth onClick={handleClose}>Cancelar</Button>
            <Button fullWidth size="lg" onClick={handleShare}>Compartilhar</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A2A] w-full"
          >
            <span className="text-sm text-[#888888]">Selecionar todos</span>
            <CheckMark checked={allSelected} />
          </button>

          <div className="overflow-y-auto" style={{ maxHeight: '40svh' }}>
            {items?.map(item => {
              const isSelected = selected.has(item.id)
              const sub = renderSub?.(item)
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className="flex items-center gap-3 px-4 py-3 w-full border-b border-[#2A2A2A] last:border-0"
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-[#F0F0F0] truncate">{item.name}</p>
                    {sub && <p className="text-xs text-[#888888]">{sub}</p>}
                  </div>
                  <CheckMark checked={isSelected} />
                </button>
              )
            })}
          </div>

          <div className="px-4 pt-3 pb-4">
            <Button fullWidth size="lg" onClick={handleBuild} disabled={count === 0 || building}>
              {building
                ? 'Preparando...'
                : count === 0
                  ? `Selecione ${noun}s`
                  : `Exportar ${count} ${noun}${count > 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
      checked ? 'bg-[#4BDF93] border-[#4BDF93]' : 'border-[#444444]'
    }`}>
      {checked && <span className="text-[#111111] text-xs font-bold leading-none">✓</span>}
    </div>
  )
}
