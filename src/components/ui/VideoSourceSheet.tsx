import { useState, useRef } from 'react'
import { Camera, FolderOpen, Link } from 'lucide-react'
import { detectVideoUrl, youTubeId, youTubeEmbedUrl, youTubeThumbnail } from '../../utils/videoUrl'
import BottomSheet from './BottomSheet'
import Button from './Button'
import MenuButton from './MenuButton'

interface Props {
  open: boolean
  onClose: () => void
  onFile: (file: File) => void
  onUrl: (originalUrl: string, thumbnail: string) => void
}

export default function VideoSourceSheet({ open, onClose, onFile, onUrl }: Props) {
  const [mode, setMode] = useState<'menu' | 'url'>('menu')
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    onFile(file)
    handleClose()
  }

  function handleConfirmUrl() {
    const url = urlInput.trim()
    const type = detectVideoUrl(url)
    if (!type) {
      setUrlError('URL de vídeo não reconhecida')
      return
    }
    if (type === 'youtube') {
      const id = youTubeId(url)
      if (!id) {
        setUrlError('Não foi possível extrair o ID do YouTube')
        return
      }
      onUrl(youTubeEmbedUrl(id), youTubeThumbnail(id))
    } else {
      onUrl(url, 'icon')
    }
    handleClose()
  }

  function handleClose() {
    setMode('menu')
    setUrlInput('')
    setUrlError('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title="Adicionar vídeo">
      {mode === 'menu' ? (
        <div className="flex flex-col py-2">
          <MenuButton
            onClick={() => cameraRef.current?.click()}
            icon={<Camera size={16} className="text-[#888888]" />}
          >
            Câmera
          </MenuButton>
          <MenuButton
            onClick={() => fileRef.current?.click()}
            icon={<FolderOpen size={16} className="text-[#888888]" />}
          >
            Arquivo
          </MenuButton>
          <MenuButton
            onClick={() => setMode('url')}
            icon={<Link size={16} className="text-[#888888]" />}
          >
            URL (YouTube, Instagram...)
          </MenuButton>
        </div>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3 pb-8">
          <input
            autoFocus
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); setUrlError('') }}
            onKeyDown={e => e.key === 'Enter' && handleConfirmUrl()}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full bg-[#252525] text-[#F0F0F0] rounded-xl px-4 py-3 text-sm border border-[#2A2A2A] focus:outline-none focus:border-[#4BDF93] placeholder-[#888888]"
          />
          {urlError && <p className="text-xs text-[#FF0D5F]">{urlError}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" fullWidth onClick={() => setMode('menu')}>Voltar</Button>
            <Button fullWidth onClick={handleConfirmUrl} disabled={!urlInput.trim()}>Confirmar</Button>
          </div>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </BottomSheet>
  )
}
