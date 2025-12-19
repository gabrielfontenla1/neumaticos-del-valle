'use client'

import { ReactNode, createContext, useContext, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const fullNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 4000
    }

    setNotifications(prev => [...prev, fullNotification])

    if (fullNotification.duration && fullNotification.duration > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, fullNotification.duration)

      return () => clearTimeout(timer)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 min-w-[350px] max-w-md">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onRemove: (id: string) => void
}

function NotificationItem({ notification, onRemove }: NotificationItemProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-7 w-7 text-green-600" />
      case 'error':
        return <XCircle className="h-7 w-7 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-7 w-7 text-amber-600" />
      case 'info':
        return <Info className="h-7 w-7 text-blue-600" />
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-green-100 border-green-400'
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-red-100 border-red-400'
      case 'warning':
        return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-400'
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400'
    }
  }

  const getTitleColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-900'
      case 'error':
        return 'text-red-900'
      case 'warning':
        return 'text-amber-900'
      case 'info':
        return 'text-blue-900'
    }
  }

  const getMessageColor = () => {
    switch (notification.type) {
      case 'success':
        return 'text-green-700'
      case 'error':
        return 'text-red-700'
      case 'warning':
        return 'text-amber-700'
      case 'info':
        return 'text-blue-700'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`${getColors()} border-2 rounded-xl p-5 shadow-2xl flex gap-4 items-start backdrop-blur-sm`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-base ${getTitleColor()}`}>
          {notification.title}
        </h3>
        {notification.message && (
          <p className={`text-sm mt-1 font-medium ${getMessageColor()}`}>
            {notification.message}
          </p>
        )}
        {notification.action && (
          <button
            onClick={() => {
              notification.action!.onClick()
              onRemove(notification.id)
            }}
            className={`text-sm font-medium mt-2 underline hover:no-underline ${
              notification.type === 'success' ? 'text-green-700 hover:text-green-800' :
              notification.type === 'error' ? 'text-red-700 hover:text-red-800' :
              notification.type === 'warning' ? 'text-amber-700 hover:text-amber-800' :
              'text-blue-700 hover:text-blue-800'
            }`}
          >
            {notification.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onRemove(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}
