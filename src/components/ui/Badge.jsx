// src/components/ui/Badge.jsx
import React from 'react';
import { cn } from '../../utils/helpers';

export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    danger: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    outline: "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 bg-transparent",
    renewal: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 animate-pulse",
  };
  return <span className={cn("px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider border", variants[variant], className)}>{children}</span>;
};