'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: '#262624',
          color: '#fafafa',
          border: '1px solid #3a3a38',
          padding: '16px',
          fontSize: '14px',
          fontWeight: '500',
        },
        // Success
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#86efac',
            secondary: '#262624',
          },
          style: {
            background: '#14532d',
            color: '#86efac',
            border: '1px solid #86efac',
          },
        },
        // Error
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#fca5a5',
            secondary: '#262624',
          },
          style: {
            background: '#7f1d1d',
            color: '#fca5a5',
            border: '1px solid #fca5a5',
          },
        },
        // Loading
        loading: {
          style: {
            background: '#78350f',
            color: '#fcd34d',
            border: '1px solid #fcd34d',
          },
        },
      }}
    />
  )
}
