import { useState } from 'react'
import { shareOrDownload } from '../utils/export'

export function usePendingExport<T>(builder: (items: T[]) => Promise<File>) {
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [building, setBuilding] = useState(false)

  async function build(items: T[]) {
    setBuilding(true)
    try {
      const file = await builder(items)
      setPendingFile(file)
    } finally {
      setBuilding(false)
    }
  }

  async function share() {
    if (!pendingFile) return
    await shareOrDownload(pendingFile)
    setPendingFile(null)
  }

  function clear() {
    setPendingFile(null)
    setBuilding(false)
  }

  return { pendingFile, building, build, share, clear }
}
