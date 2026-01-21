import { Skeleton } from '@/components/ui/skeleton'

interface ChatListSkeletonProps {
  items?: number
}

export function ChatListSkeleton({ items = 5 }: ChatListSkeletonProps) {
  return (
    <div className="divide-y divide-[#3a3a37]">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex items-start justify-between gap-2">
            {/* Left content */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <Skeleton className="h-4 w-32 bg-[#3a3a37] mb-1" />
              {/* Phone */}
              <div className="flex items-center gap-2 mb-2">
                <Skeleton className="h-3 w-3 rounded-full bg-[#3a3a37]" />
                <Skeleton className="h-3 w-24 bg-[#3a3a37]" />
              </div>
              {/* Message count */}
              <Skeleton className="h-3 w-20 bg-[#3a3a37]" />
            </div>
            {/* Right side */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Skeleton className="h-3 w-8 bg-[#3a3a37]" />
              <Skeleton className="h-5 w-16 rounded-full bg-[#3a3a37]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
