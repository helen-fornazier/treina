import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title: string
  back?: boolean
  right?: React.ReactNode
}

export default function PageHeader({ title, back = true, right }: Props) {
  const navigate = useNavigate()
  return (
    <header className="flex items-center gap-3 px-4 py-4 sticky top-0 z-10 bg-[#111111]">
      {back && (
        <button onClick={() => navigate(-1)} className="text-[#4BDF93] p-1 -ml-1">
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className="flex-1 text-lg font-semibold text-[#F0F0F0]">{title}</h1>
      {right && <div>{right}</div>}
    </header>
  )
}
