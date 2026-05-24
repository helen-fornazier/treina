interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

const variants = {
  primary: 'bg-[#FF0D5F] text-white font-semibold active:opacity-80',
  secondary: 'bg-[#1C1C1C] text-[#4BDF93] border border-[#4BDF93] font-semibold active:opacity-80',
  ghost: 'text-[#888888] active:text-[#F0F0F0]',
  danger: 'bg-[#1C1C1C] text-[#FF0D5F] border border-[#FF0D5F] font-semibold active:opacity-80',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  ...props
}: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 transition-opacity
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    />
  )
}
