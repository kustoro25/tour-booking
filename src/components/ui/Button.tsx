'use client';

import { ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react';
import Link from 'next/link';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'danger';
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
  primary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30',
  secondary: 'bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 shadow-md shadow-slate-500/20 hover:shadow-lg hover:shadow-slate-500/30',
  accent: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30',
  outline: 'border-2 border-amber-600 text-amber-600 hover:bg-amber-50 hover:border-amber-700 hover:text-amber-700',
  danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3 text-lg',
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
    inline-flex items-center justify-center gap-2 rounded-xl font-semibold 
    transition-all duration-200 active:scale-[0.97]
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
