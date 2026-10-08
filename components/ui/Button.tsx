import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  buttonInButton?: boolean;
  pill?: boolean;
  children?: React.ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  trailingIcon,
  buttonInButton = false,
  pill = true,
  children,
  fullWidth = false,
  loading = false,
  className = "",
  disabled = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    "group relative inline-flex items-center justify-center font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] select-none whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950";

  const radiusStyle = pill ? "rounded-full" : "rounded-xl";

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5 h-8",
    md: "text-sm px-5 py-2.5 gap-2 h-10",
    lg: "text-base px-6 py-3.5 gap-2.5 h-12",
  };

  const iconCircleSizes = {
    sm: "w-5 h-5 text-[10px]",
    md: "w-6 h-6 text-xs",
    lg: "w-7 h-7 text-sm",
  };

  const variantStyles = {
    primary:
      "bg-[#0F5132] hover:bg-[#0A3622] text-white shadow-sm hover:shadow-lg border border-[#0F5132]/30 focus-visible:ring-[#0F5132] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]",
    secondary:
      "bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200/90 shadow-xs hover:border-zinc-300 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-800 focus-visible:ring-zinc-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.85)]",
    outline:
      "bg-transparent hover:bg-emerald-50/50 text-[#0F5132] border border-[#0F5132]/40 hover:border-[#0F5132] dark:text-emerald-400 dark:border-emerald-600/40 focus-visible:ring-[#0F5132]",
    ghost:
      "bg-transparent hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 focus-visible:ring-zinc-400",
    danger:
      "bg-rose-700 hover:bg-rose-800 text-white shadow-sm border border-rose-800 focus-visible:ring-rose-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]",
    success:
      "bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm border border-emerald-800 focus-visible:ring-emerald-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]",
  };

  const hasNestedIcon = Boolean(trailingIcon || (icon && buttonInButton));
  const activeTrailingIcon = trailingIcon || (buttonInButton ? icon : null);
  const activeLeadingIcon = !buttonInButton ? icon : null;

  return (
    <button
      className={`${baseStyles} ${radiusStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0 mr-1.5" />
      ) : activeLeadingIcon ? (
        <span className="inline-flex shrink-0 items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
          {activeLeadingIcon}
        </span>
      ) : null}
      {children}
      {!loading && hasNestedIcon && (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full ml-1 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[0.5px] group-hover:scale-105 ${
            iconCircleSizes[size]
          } ${
            variant === "primary" || variant === "danger" || variant === "success"
              ? "bg-white/20 text-white"
              : "bg-black/5 dark:bg-white/10 text-current"
          }`}
        >
          {activeTrailingIcon}
        </span>
      )}
    </button>
  );
}

