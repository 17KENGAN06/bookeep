import { cn } from '@/utils/cn';

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-surface-2', className)}
      aria-hidden
    />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="lux-card overflow-hidden rounded-[1.25rem] sm:rounded-[1.5rem]">
      <div className="book-stage flex aspect-[4/5] items-center justify-center px-[18%] pt-[12%] pb-[14%]">
        <Skeleton className="aspect-[2/3] h-full rounded-[3px_8px_8px_3px] bg-elevated" />
      </div>
      <div className="space-y-2 p-3.5 sm:p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
