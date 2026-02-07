"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        style: {
          background: '#262624',
          color: '#fafafa',
          border: '1px solid #3a3a38',
        },
        classNames: {
          toast: 'bg-[#262624] text-[#fafafa] border-[#3a3a38]',
          title: 'text-[#fafafa]',
          description: 'text-[#a1a1aa]',
          success: 'bg-[#262624] text-[#22c55e] border-[#22c55e]/30',
          error: 'bg-[#262624] text-[#ef4444] border-[#ef4444]/30',
          warning: 'bg-[#262624] text-[#f59e0b] border-[#f59e0b]/30',
          info: 'bg-[#262624] text-[#3b82f6] border-[#3b82f6]/30',
        },
      }}
      style={
        {
          "--normal-bg": "#262624",
          "--normal-text": "#fafafa",
          "--normal-border": "#3a3a38",
          "--success-bg": "#262624",
          "--success-text": "#22c55e",
          "--success-border": "rgba(34, 197, 94, 0.3)",
          "--error-bg": "#262624",
          "--error-text": "#ef4444",
          "--error-border": "rgba(239, 68, 68, 0.3)",
          "--border-radius": "0.5rem",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
