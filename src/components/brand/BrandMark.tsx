type BrandMarkProps = {
  className?: string;
  title?: string;
};

/** Open book in two mint tones. */
export function BrandMark({ className = 'h-8 w-8', title = 'Bookeep' }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={title}>
      <path
        d="M8 16.5c8-3.6 16-2.6 22.5 2.6v32.4C24 46.6 16 45.6 8 49.2V16.5Z"
        className="fill-accent"
        opacity="0.92"
      />
      <path d="M56 16.5c-8-3.6-16-2.6-22.5 2.6v32.4C40 46.6 48 45.6 56 49.2V16.5Z" className="fill-accent-strong" />
      <path d="M40.5 13.5v13l3.5-2 3.5 2v-13" className="fill-ink" opacity="0.9" />
    </svg>
  );
}
