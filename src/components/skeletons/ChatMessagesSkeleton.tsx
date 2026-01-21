import { Skeleton } from '@/components/ui/skeleton'

interface ChatMessagesSkeletonProps {
  messages?: number
}

export function ChatMessagesSkeleton({ messages = 6 }: ChatMessagesSkeletonProps) {
  const messagePatterns = [
    { role: 'user', width: 'w-48' },
    { role: 'assistant', width: 'w-64' },
    { role: 'user', width: 'w-32' },
    { role: 'assistant', width: 'w-72' },
    { role: 'user', width: 'w-56' },
    { role: 'assistant', width: 'w-48' },
  ]

  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: messages }).map((_, i) => {
        const pattern = messagePatterns[i % messagePatterns.length]
        const isUser = pattern.role === 'user'

        return (
          <div
            key={i}
            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex gap-3 max-w-[85%] min-w-0 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <Skeleton
                className={`w-8 h-8 rounded-full flex-shrink-0 ${
                  isUser ? 'bg-[#d97757]/30' : 'bg-[#3a3a37]'
                }`}
              />
              {/* Message bubble */}
              <div className="space-y-2 min-w-0">
                <Skeleton
                  className={`h-12 ${pattern.width} rounded-lg ${
                    isUser ? 'bg-[#d97757]/20' : 'bg-[#3a3a37]'
                  }`}
                />
                <Skeleton className="h-2 w-16 bg-[#3a3a37]/50" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
