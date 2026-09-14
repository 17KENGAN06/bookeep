type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className = 'h-8 w-8', title = 'BookKeep' }: BrandMarkProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <rect width="64" height="64" rx="16" className="fill-surface" />
      <path
        d="M14 18.5c6.6-3.4 13.2-2.3 18 1.8 4.8-4.1 11.4-5.2 18-1.8V47c-6.5-3.1-13-2.2-18 1.6-5-3.8-11.5-4.7-18-1.6V18.5Z"
        className="fill-accent"
      />
      <path
        d="M32 20.4v28.2"
        className="stroke-bg"
        strokeWidth="2.1"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path d="M41 15.5v13.2l3.4-1.9 3.4 1.9V15.5" className="fill-mint" />
    </svg>
  );
}
