import { cn } from '@/utils/cn';

type LevelBadgeProps = {
  level: string;
  className?: string;
};

export function LevelBadge({ level, className }: LevelBadgeProps) {
  return (
    <span
      className={cn(
        'pill-gold shrink-0',
        className,
      )}
    >
      {level}
    </span>
  );
}
