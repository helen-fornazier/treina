interface Props {
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
  variant?: 'default' | 'danger'
  disabled?: boolean
}

export default function MenuButton({ onClick, icon, children, variant = 'default', disabled = false }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-4 py-3 text-sm w-full disabled:opacity-50 ${
        variant === 'danger' ? 'text-[#FF0D5F]' : 'text-[#F0F0F0]'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
