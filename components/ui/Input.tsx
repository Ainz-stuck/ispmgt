import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  icon,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {props.required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-zinc-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`w-full min-h-[44px] h-11 sm:h-10 px-3.5 ${
            icon ? "pl-9" : ""
          } text-sm rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] dark:focus:ring-emerald-500/30 dark:focus:border-emerald-500 transition-all duration-200 shadow-2xs ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/60"
              : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <span id={errorId} className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {helperText}
        </span>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  helperText?: string;
  error?: string;
}

export function Select({
  label,
  options,
  helperText,
  error,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={selectId}
        className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {props.required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      <select
        id={selectId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full min-h-[44px] h-11 sm:h-10 px-3 text-sm rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] dark:focus:ring-emerald-500/30 dark:focus:border-emerald-500 transition-all duration-200 shadow-2xs ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/60"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={errorId} className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {helperText}
        </span>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export function Textarea({
  label,
  helperText,
  error,
  id,
  className = "",
  ...props
}: TextareaProps) {
  const areaId = id || `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const errorId = `${areaId}-error`;
  const helperId = `${areaId}-helper`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={areaId}
        className="text-xs font-semibold tracking-wide text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {props.required && <span className="text-rose-600 ml-0.5">*</span>}
      </label>
      <textarea
        id={areaId}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        className={`w-full p-3 text-sm rounded-xl border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0F5132]/30 focus:border-[#0F5132] dark:focus:ring-emerald-500/30 dark:focus:border-emerald-500 transition-all duration-200 resize-y shadow-2xs ${
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-200 dark:border-rose-500/60"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
        } ${className}`}
        {...props}
      />
      {error && (
        <span id={errorId} className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} className="text-xs text-zinc-500 dark:text-zinc-400">
          {helperText}
        </span>
      )}
    </div>
  );
}
