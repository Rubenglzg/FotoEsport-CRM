// src/components/ui/Button.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

export const Button = ({ children, variant = 'primary', size = 'md', className, onClick, disabled, title, isLoading }) => {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-white border-transparent shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]",
    ghost: "bg-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800",
    outline: "bg-transparent border border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900",
    neon: "bg-emerald-500 text-white dark:text-black hover:bg-emerald-600 dark:hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] dark:shadow-[0_0_15px_rgba(16,185,129,0.4)]",
    whatsapp: "bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 hover:bg-[#25D366]/20",
    danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20"
  };
  const sizes = { xs: "h-6 px-2 text-[10px]", sm: "h-7 px-2 text-xs", md: "h-9 px-4 text-sm", icon: "h-9 w-9 p-0 grid place-items-center" };
  
  return (
    <button onClick={onClick} disabled={disabled || isLoading} title={title} className={cn("rounded-lg font-medium transition-all duration-200 flex items-center justify-center border", (disabled || isLoading) ? "opacity-50 cursor-not-allowed" : "active:scale-95", variants[variant], sizes[size], className)}>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
      {children}
    </button>
  );
};