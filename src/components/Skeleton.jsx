export default function Skeleton({ className = '', variant = 'rect' }) {
  const base = 'animate-pulse bg-gray-200 dark:bg-gray-700'

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} />
  }

  if (variant === 'text') {
    return <div className={`${base} rounded ${className}`} />
  }

  return <div className={`${base} rounded-xl ${className}`} />
}

export function StatCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" variant="text" />
          <Skeleton className="h-8 w-16" variant="text" />
          <Skeleton className="h-3 w-12" variant="text" />
        </div>
        <Skeleton className="h-12 w-12" variant="circle" />
      </div>
    </div>
  )
}

export function RestaurantCardSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-14 w-14" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" variant="text" />
          <Skeleton className="h-4 w-20" variant="text" />
          <Skeleton className="h-4 w-24" variant="text" />
        </div>
      </div>
      <div className="flex gap-2 pt-4">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-2/3" variant="text" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  )
}
