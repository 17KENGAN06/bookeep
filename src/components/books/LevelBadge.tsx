import { cn } from '@/utils/cn';

type LevelBadgeProps = {
  level: string;
  className?: string;
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-lg bg-elevated px-2 text-xs font-semibold tracking-wide text-ink',
        className,
      )}
    >
      {level}
    </span>
  );
}
