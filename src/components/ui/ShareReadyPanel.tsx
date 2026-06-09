import { Share2 } from 'lucide-react'
import Button from './Button'

interface Props {
  filename?: string
  onShare: () => void
  onCancel: () => void
}

export default function ShareReadyPanel({ filename, onShare, onCancel }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-6">
      <div className="w-12 h-12 rounded-full bg-[#4BDF93]/10 flex items-center justify-center">
        <Share2 size={22} className="text-[#4BDF93]" />
      </div>
      {filename && <p className="text-sm text-[#F0F0F0] font-medium text-center">{filename}</p>}
      <p className="text-xs text-[#888888]">Arquivo pronto para compartilhar</p>
      <div className="flex gap-2 w-full pb-2">
        <Button variant="ghost" fullWidth onClick={onCancel}>Cancelar</Button>
        <Button fullWidth onClick={onShare}>Compartilhar</Button>
      </div>
    </div>
  )
}
