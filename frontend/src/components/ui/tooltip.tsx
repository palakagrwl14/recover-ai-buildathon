import * as React from "react"
import { cn } from "@/lib/utils"

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}
      {isOpen && (
        <div 
          role="tooltip"
          className={cn(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 text-xs font-medium text-white bg-slate-900/90 backdrop-blur-md rounded-lg shadow-lg whitespace-normal max-w-xs transition-opacity duration-150 animate-in fade-in-0 zoom-in-95 pointer-events-none border border-slate-800",
            className
          )}
        >
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/90" />
        </div>
      )}
    </div>
  )
}
