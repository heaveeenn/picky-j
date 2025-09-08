import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}) => {
  const base = 'inline-flex items-center rounded-full font-medium'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-blue-100 text-blue-700 border border-blue-200',
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    danger: 'bg-red-100 text-red-700 border border-red-200',
    info: 'bg-sky-100 text-sky-700 border border-sky-200',
  }

  const sizeClasses = {
    xs: 'px-1.5 py-1 text-xs',
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1 text-sm',
  }

  const classes = twMerge(clsx(base, variantClasses[variant], sizeClasses[size]), className)

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}

export default Badge