import { cn } from '@/utils/cn';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-xl bg-surface-2/80', className)} aria-hidden />;
}

export function BookCardSkeleton() {
  return (
    <div className="lux-card flex gap-4 rounded-[1.5rem] p-3.5 sm:rounded-[1.75rem] sm:p-4" aria-hidden>
      <Skeleton className="aspect-[2/3] w-[34%] max-w-[9.5rem] shrink-0 rounded-[3px_6px_6px_3px] bg-elevated" />
      <div className="flex flex-1 flex-col gap-2.5 pt-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-3 h-1 w-full" />
        <Skeleton className="mt-auto h-10 w-full rounded-full" />
        <Skeleton className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}
