'use client';

import { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
}

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = ButtonBaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-gold-200 via-gold-400 to-gold-600 text-ink-950 hover:from-gold-100 hover:via-gold-300 hover:to-gold-500 shadow-md shadow-gold-500/25 hover:shadow-lg hover:shadow-gold-400/40',
  secondary: 'bg-gradient-to-r from-ink-700 to-ink-800 text-ivory border border-ink-600 hover:from-ink-600 hover:to-ink-700 hover:border-gold-500/40 shadow-md shadow-ink-950/40 hover:shadow-lg hover:shadow-ink-950/50',
  accent: 'bg-gradient-to-r from-gold-200 via-gold-400 to-gold-600 text-ink-950 hover:from-gold-100 hover:via-gold-300 hover:to-gold-500 shadow-md shadow-gold-500/25 hover:shadow-lg hover:shadow-gold-400/40',
  outline: 'border-2 border-gold-500/70 text-gold-300 hover:bg-gold-400/10 hover:border-gold-400 hover:text-gold-200',
  danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30',
  success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 sm:px-4 text-sm',
  md: 'h-11 px-5 sm:px-6 text-sm sm:text-base',
  lg: 'h-12 px-6 sm:px-8 text-base sm:text-lg',
};

export default function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    isLoading = false,
    className = '',
    children,
    ...rest
  } = props;

  const classes = `
    inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap
    transition-all duration-200 active:scale-[0.97]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  if (props.href) {
    const { href: linkHref, ...linkRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link href={linkHref || '#'} className={classes} {...linkRest}>
        {isLoading && <Spinner />}
        {children}
      </Link>
    );
  }

  const { ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button className={classes} disabled={isLoading || buttonRest.disabled} {...buttonRest}>
      {isLoading && <Spinner />}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
