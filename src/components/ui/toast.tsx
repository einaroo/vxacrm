'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'info'
  duration?: number
}

interface ToastProps extends Toast {
  onClose: (id: string) => void
}

function ToastItem({ id, title, description, variant = 'default', onClose }: ToastProps) {
  const Icon = variant === 'success' ? CheckCircle : variant === 'error' ? AlertCircle : Info
  
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg shadow-lg border bg-white animate-in slide-in-from-right-full duration-300',
        variant === 'error' && 'border-red-200 bg-red-50',
        variant === 'success' && 'border-green-200 bg-green-50',
        variant === 'info' && 'border-blue-200 bg-blue-50'
      )}
    >
      <Icon
        className={cn(
          'w-5 h-5 flex-shrink-0',
          variant === 'error' && 'text-red-500',
          variant === 'success' && 'text-green-500',
          variant === 'info' && 'text-blue-500',
          variant === 'default' && 'text-gray-500'
        )}
      />
      <div className="flex-1">
        <p className="font-medium text-sm text-gray-900">{title}</p>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Toast state management
let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []
let toastId = 0

function notifyListeners() {
  toastListeners.forEach((listener) => listener([...toasts]))
}

export function toast(options: Omit<Toast, 'id'>) {
  const id = String(++toastId)
  const newToast: Toast = { ...options, id }
  toasts = [...toasts, newToast]
  notifyListeners()

  // Auto dismiss
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  }, options.duration || 4000)
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts)
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  const handleClose = (id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    notifyListeners()
  }

  if (currentToasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {currentToasts.map((t) => (
        <ToastItem key={t.id} {...t} onClose={handleClose} />
      ))}
    </div>
  )
}
