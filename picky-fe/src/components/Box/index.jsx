import { twMerge } from 'tailwind-merge'

const Box = ({ 
  children, 
  hover = false, 
  className, 
  onClick, 
  ...props 
}) => {
  const base = 'bg-white border border-gray-200 p-4 rounded-lg transition-colors duration-200'
  const hoverClass = hover ? 'hover:-translate-y-0.5 transition-all duration-200' : ''
  const cursorClass = onClick ? 'cursor-pointer' : ''
  
  return (
    <div 
      className={twMerge(base, hoverClass, cursorClass, className)} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default Box