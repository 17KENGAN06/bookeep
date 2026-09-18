import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-50',
  secondary:
    'bg-surface text-ink ring-1 ring-line hover:ring-accent/50 disabled:opacity-50',
  ghost: 'bg-transparent text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50',
};

export function buttonClassName(variant: ButtonVariant = 'primary', className = '') {
  return cn(
        'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition motion-safe:active:scale-[0.98] disabled:cursor-not-allowed',
    variants[variant],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  loadingText?: ReactNode;
};

export function Button({
  variant = 'primary',
  isLoading = false,
  loadingText,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

type ButtonLinkProps = {
  to: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ to, variant = 'primary', className, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={buttonClassName(variant, className)}>
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  href,
  variant = 'secondary',
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={buttonClassName(variant, className)}>
      {children}
    </a>
  );
}
