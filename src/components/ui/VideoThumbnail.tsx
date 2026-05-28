import { Play, Video } from 'lucide-react'

interface Props {
  thumbnail?: string
  className?: string
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function VideoThumbnail({ thumbnail, className = '', onClick, size = 'md' }: Props) {
  const sizes = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-full aspect-video' }

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#252525] flex items-center justify-center flex-shrink-0 ${sizes[size]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {thumbnail === 'icon' ? (
        <div className="flex flex-col items-center gap-1">
          <Video size={20} className="text-[#4BDF93]" />
        </div>
      ) : thumbnail ? (
        <>
          <img src={thumbnail} alt="" className="w-full h-full object-cover" />
          {onClick && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play size={14} className="text-white ml-0.5" />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Play size={20} className="text-[#888888]" />
          <span className="text-[10px] text-[#888888]">Sem vídeo</span>
        </div>
      )}
    </div>
  )
}
