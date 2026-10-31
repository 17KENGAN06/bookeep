import { cn } from '@/utils/cn';

type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ProgressBar({ value, label, className }: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted">
          <span>{label}</span>
          <span className="font-semibold tabular-nums text-ink">{Math.round(width)}%</span>
        </div>
      ) : null}
      <div
        className="meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
      >
        <div className="meter-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
