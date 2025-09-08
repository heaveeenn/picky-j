import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import { twMerge } from 'tailwind-merge'

const Button = ({ children, variant = 'primary', size = 'md', className, onClick, ...props }) => {
  const buttonRef = useRef(null)

  const baseClasses =
    'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 border border-gray-300 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-sm hover:shadow-md',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md',
    outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100 rounded-md',
  }

  const sizes = {
    xs: 'p-2.5 text-sm',
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-sm h-10',
    lg: 'px-6 py-3 text-base h-12',
    xl: 'px-4 py-2.5 text-sm',
  }

  const classes = twMerge(clsx(baseClasses, variants[variant], sizes[size]), className)

  useEffect(() => {
    const handleMouseUp = () => {
      buttonRef.current?.blur()
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  return (
    <button ref={buttonRef} className={classes} {...props} onClick={onClick}>
      {children}
    </button>
  )
}

export default Button