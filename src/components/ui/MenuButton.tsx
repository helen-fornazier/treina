interface Props {
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
  variant?: 'default' | 'danger'
}

export default function MenuButton({ onClick, icon, children, variant = 'default' }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 text-sm w-full ${
        variant === 'danger' ? 'text-[#FF0D5F]' : 'text-[#F0F0F0]'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}
