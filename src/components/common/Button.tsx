import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'quiet';

const variants: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  quiet: 'btn-quiet',
};

export function buttonClassName(variant: ButtonVariant = 'primary', className = '') {
  return cn('btn', variants[variant], className);
}

/** Arrow in a small round knob that slides on hover; pairs with the primary button. */
export function ButtonArrow() {
  return (
    <span className="btn-knob" aria-hidden>
      <ArrowRight className="h-4 w-4" />
    </span>
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
